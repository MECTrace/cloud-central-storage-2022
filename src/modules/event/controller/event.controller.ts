import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { SocketEvents, SocketStatus, STATUS, SWAGGER_API } from 'src/constants';
import { NodeService } from 'src/modules/node/service/node.service';
import { FileService } from '../../file/service/file.service';
import { FileUploadDto } from '../dto/fileUpload.dto';
import { EventGateway } from '../event.gateway';
import { IEventResult, IGetBySendNodeId, IInsertResult } from '../interfaces';
import { EventService } from '../service/event.service';
import { PaginationParams } from '../../../util/paginationParams';

@ApiTags('event')
@Controller('event')
export class EventController {
  constructor(
    private eventService: EventService,
    private fileService: FileService,
    private nodeService: NodeService,
    private eventGateway: EventGateway,
  ) {}

  @Get('list')
  @ApiOkResponse({
    status: 200,
    description: 'List event monitoring by status',
  })
  GetByStatus() {
    return this.eventService.getByStatus();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('fileUpload'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FileUploadDto,
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() post: { sendNode: string },
    @Res() res: Response,
  ) {
    const receiveNodeId = process.env.NODE_ID;
    const sendNode = post.sendNode;
    const nodeResult = await this.nodeService.findOne(sendNode);
    const sendNodeId = nodeResult.id;

    let tempId: string;

    const name =
      file?.originalname.substring(0, file.originalname.lastIndexOf('.')) || '';

    const findFileId: string = await this.fileService.findByFileName(name);

    const optionEvent = <IGetBySendNodeId>{
      sendNodeId,
      receiveNodeId,
    };

    this.eventService
      .upload(file)
      .then(async () => {
        if (!findFileId) {
          const createdFile: IInsertResult = await this.fileService.create(
            file,
          );
          const insertedFileId: string = createdFile.raw[0].id;
          const createdEvent: IInsertResult = await this.eventService.create({
            ...optionEvent,
            status: STATUS.PENDING,
            fileId: insertedFileId,
          });

          const insertedEventId: string = createdEvent.raw[0].id;

          this.eventGateway.server.emit(SocketEvents.CENTRAL_INIT, {
            id: insertedEventId,
            receiveNodeId,
            sendNodeId,
            status: SocketStatus.PENDING,
          });

          return { id: insertedEventId, fileId: insertedFileId };
        } else {
          const createdEvent: IInsertResult = await this.eventService.create({
            ...optionEvent,
            status: STATUS.PENDING,
            fileId: findFileId,
          });
          const insertedEventId: string = createdEvent.raw[0].id;

          this.eventGateway.server.emit(SocketEvents.CENTRAL_INIT, {
            id: insertedEventId,
            receiveNodeId,
            sendNodeId,
            status: SocketStatus.PENDING,
          });
          return { id: insertedEventId, fileId: findFileId };
        }
      })
      .then(async ({ id, fileId }) => {
        const ds: IEventResult[] = await this.eventService.getByFileId(fileId);
        //update event first item
        if (ds.length === 1) {
          await this.eventService.update(ds[0].event_id, STATUS.SUCCESS);
          tempId = ds[0].event_id;
          setTimeout(() => {
            this.eventGateway.server.emit(SocketEvents.CENTRAL_UPDATE, {
              id,
              receiveNodeId,
              sendNodeId,
              status: SocketStatus.SUCCESS,
            });
          }, 2000);
        } else if (ds.length > 1) {
          //if multi event , only update new event
          const index = ds.length - 1;
          tempId = ds[index].event_id;
          await this.eventService.update(ds[index].event_id, STATUS.FAIL);
          throw Error(ds[index].event_id);
        } else {
          return;
        }
        res.send({ status: true, message: '' });
      })
      .catch(async (data: { message: string }) => {
        if (!findFileId) {
          const rs: IInsertResult = await this.fileService.create({
            ...file,
            originalname: 'undefined',
          });

          await this.eventService.create({
            ...optionEvent,
            status: STATUS.FAIL,
            fileId: rs.raw[0].id,
          });
        }
        setTimeout(() => {
          const id = data.message;

          this.eventGateway.server.emit(SocketEvents.CENTRAL_UPDATE, {
            id,
            receiveNodeId,
            sendNodeId,
            status: SocketStatus.FAIL,
          });
        }, 2000);
        res.send({ status: false, message: data.message });
      })
      .finally(() => {
        setTimeout(() => {
          this.eventGateway.server.emit(SocketEvents.CENTRAL_UPDATE, {
            id: tempId,
            receiveNodeId,
            sendNodeId,
            status: SocketStatus.DONE,
          });
        }, 4000);
      });
  }

  @Get(':sendNodeId')
  @ApiParam({ name: SWAGGER_API.params.sendNodeId, type: String })
  @ApiQuery({ name: SWAGGER_API.query.page, type: String })
  @ApiOkResponse({
    status: 200,
    description: 'List Event By Send Node Id',
  })
  getBySendNodeId(
    @Param() params: { sendNodeId: string },
    @Query() { page }: PaginationParams,
  ) {
    return this.eventService.getBySendNodeId(params.sendNodeId, page);
  }
}
