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

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('fileUpload', {
      storage: diskStorage({
        // Destination storage path details
        destination: (req: any, file: any, cb: any) => {
          const uploadPath = process.env.UPLOAD_LOCATION;
          // Create folder if doesn't exist
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath);
          }
          cb(null, uploadPath);
        },
        // File modification details
        filename: (req: any, file: any, cb: any) => {
          // Calling the callback passing the original name
          cb(null, file.originalname);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FileUploadDto,
  })
  upload(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
  }

  @Post('uploadFromNode')
  @UseInterceptors(FileInterceptor('fileUpload'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FileUploadFromNodeDto,
  })
  async uploadFromNode(
    @UploadedFile() file: Express.Multer.File,
    @Body() post: { sendNode: string },
  ) {
    // find limit to accept send file
    const policy: Array<ResPoliceByNodeId> =
      await this.policyManagerService.getPolicyByNodeId(process.env.NODE_ID);
    console.log(policy);
    await this.nodeService.updateStatusAllNodes();

    const nodeName = policy[0].nodeName;
    const cpuOverPercent = policy[0].cpuOverPercent;
    const cpuLessThanPercent = policy[0].cpuLessThanPercent;
    const numberResendNode = policy[0].numberResendNode;
    const policyName = policy[0].policyName;

    // send file
    const postBody = {
      sendNode: post.sendNode,
      cpu_limit: cpuOverPercent,
      policyName: policyName,
    };
    const { status, eventId } = await this.eventService.uploadFromNode(
      file,
      postBody,
    );

    // if send fail, we redirect to send others
    if (!status) {
      // await timeout(3000);
      const availableNode = await this.nodeService.getAvailableNode(
        process.env.NODE_ID,
        cpuLessThanPercent,
      );
      const receiveNode = availableNode.availableNode as string;

      await this.eventService.reSend(file, {
        sendNode: nodeName,
        receiveNode: receiveNode,
        numberResendNode: numberResendNode,
      });
    }
    return {
      status: status,
      eventId: eventId,
    };
  }

  @Post('resend')
  @UseInterceptors(FileInterceptor('fileUpload'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FileUploadFromNodeDto,
  })
  async reSend(
    @UploadedFile() file: Express.Multer.File,
    @Body() post: { sendNode: string },
  ) {
    // find limit to accept send file
    const policy: Array<ResPoliceByNodeId> =
      await this.policyManagerService.getPolicyByNodeId(process.env.NODE_ID);

    // send file
    const postBody = {
      sendNode: post.sendNode,
      cpu_limit: policy[0].cpuOverPercent,
      policyName: policy[0].policyName,
    };
    return this.eventService.uploadFromNode(file, postBody);
  }

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
    description: 'Get succeeded',
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
    // to simulate send message
    // find limit to accept send file
    const policy: Array<ResPoliceByNodeId> =
      await this.policyManagerService.getPolicyByNodeId(post.receiveNode);
    const policyName = policy[0].policyName;
    const cpuLimit = policy[0].cpuOverPercent;
    const postBody = {
      receiveNode: post.receiveNode,
      cpuLimit: cpuLimit,
      policyName: policyName,
    };

    // send data
    const { status, eventId } = await this.eventService.sendData(
      fileUpload,
      postBody,
    );

    // if send fail, we redirect to send others
    // if (!status) {
    //   const availableNode = await this.nodeService.getAvailableNode(
    //     post.receiveNode,
    //     cpuLessThanPercent,
    //   );
    //   const receiveNode = availableNode.availableNode as string;

    //   await this.eventService.reSend(file, {
    //     sendNode: nodeName,
    //     receiveNode: receiveNode,
    //     numberResendNode: numberResendNode,
    //   });
    // }
    return {
      status: status,
      eventId: eventId,
    };

    // find limit to accept send file

    // const nodeName = policy[0].nodeName;
    // const cpuOverPercent = policy[0].cpuOverPercent;
    // const cpuLessThanPercent = policy[0].cpuLessThanPercent;
    // const numberResendNode = policy[0].numberResendNode;
    // const policyName = policy[0].policyName;

    // // send file
    // const postBody = {
    //   sendNode: post.sendNode,
    //   cpu_limit: cpuOverPercent,
    //   policyName: policyName,
    // };
    // const { status, eventId } = await this.eventService.uploadFromNode(
    //   file,
    //   postBody,
    // );

    // // if send fail, we redirect to send others
    // if (!status) {
    //   // await timeout(3000);
    //   const availableNode = await this.nodeService.getAvailableNode(
    //     process.env.NODE_ID,
    //     cpuLessThanPercent,
    //   );
    //   const receiveNode = availableNode.availableNode as string;

    //   await this.eventService.reSend(file, {
    //     sendNode: nodeName,
    //     receiveNode: receiveNode,
    //     numberResendNode: numberResendNode,
    //   });
    // }
    // return {
    //   status: status,
    //   eventId: eventId,
    // };
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
