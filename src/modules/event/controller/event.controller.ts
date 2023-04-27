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
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { SocketEvents, SocketStatus, STATUS, SWAGGER_API } from 'src/constants';
import { NodeService } from 'src/modules/node/service/node.service';
import { FileService } from '../../file/service/file.service';
import { FileUploadDto } from '../dto/fileUpload.dto';
import { FileUploadFromNodeDto } from '../dto/fileUploadFromNode.dto';
import { EventGateway } from '../event.gateway';
import { IEventResult, IGetBySendNodeId, IInsertResult } from '../interfaces';
import { ResPoliceByNodeId } from 'src/modules/policy-manager/interfaces';
import { EventService } from '../service/event.service';
import { PaginationParams } from '../../../util/paginationParams';
import { summaryDto } from '../dto/summary.dto';
import { PolicyManagerService } from 'src/modules/policy-manager/service/policy-manager.service';
import * as FormData from 'form-data';
import { lastValueFrom } from 'rxjs';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { MessageEvent } from '../dto/messageEvent.dto';
@ApiTags('Upload file API')
@Controller('event')
export class EventController {
  constructor(
    private eventService: EventService,
    private fileService: FileService,
    private nodeService: NodeService,
    private eventGateway: EventGateway,
    private policyManagerService: PolicyManagerService,
    private httpService: HttpService,
  ) {}

  @Get('summary')
  @ApiOkResponse({
    status: 200,
    description: 'Summary all of events on server',
    type: summaryDto,
  })
  GetByStatus() {
    return this.eventService.getByStatus();
  }

  @Get(':sendNodeId')
  @ApiParam({ name: SWAGGER_API.params.sendNodeId, type: String })
  @ApiQuery({ name: SWAGGER_API.query.page, required: false })
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

  @Get('getNumberOfFilesUpload/:sendNodeId/:receiveNodeId')
  @ApiOkResponse({
    status: 200,
    description:
      'Get number of file between sendNode and receiveNode succeeded',
  })
  getNumberOfFilesUpload(
    @Param('sendNodeId') sendNodeId: string,
    @Param('receiveNodeId') receiveNodeId: string,
  ) {
    return this.eventService.getNumberOfFilesUpload(sendNodeId, receiveNodeId);
  }

  @Post('sendData')
  @UseInterceptors(FileInterceptor('fileUpload'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: MessageEvent,
  })
  async sendData(
    @UploadedFile() fileUpload: Express.Multer.File,
    @Body() post: { receiveNode: string },
  ) {
    // send data
    return this.eventService.sendData(fileUpload, {
      receiveNode: post.receiveNode,
    });
  }

  @Get('getNumberOfFilesByNodeId/:nodeId/:period')
  @ApiOkResponse({
    status: 200,
    description: 'Get succeeded',
  })
  getNumberOfFilesByNodeId(
    @Param('nodeId') nodeId: string,
    @Param('period') period: string,
  ) {
    return this.eventService.getNumberOfFilesByNodeId(nodeId, period);
  }

  @Get('getNumberOfFilesOfAllNode/:period')
  @ApiOkResponse({
    status: 200,
    description: 'Get succeeded',
  })
  getNumberOfFilesOfAllNode(@Param('period') period: string) {
    return this.eventService.getNumberOfFilesOfAllNode(period);
  }

  @Get('getNumberOfFilesTimeSeries/:nodeId/:numberOfDays')
  @ApiOkResponse({
    status: 200,
    description: 'Number of events by day',
  })
  getNumberOfFilesTimeSeries(
    @Param('nodeId') nodeId: string,
    @Param('numberOfDays') numberOfDays: string,
  ) {
    return this.eventService.getNumberOfFilesTimeSeries(nodeId, numberOfDays);
  }

  @Get('getNumberOfEachKindOfFile/:nodeId')
  @ApiOkResponse({
    status: 200,
    description: 'Number of each kind of file',
  })
  getNumberOfEachKind(@Param('nodeId') nodeId: string) {
    return this.eventService.getNumberOfEachKindOfFile(nodeId);
  }
}
