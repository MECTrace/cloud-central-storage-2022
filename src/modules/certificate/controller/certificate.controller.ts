import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import { CLOUD_CERT } from 'src/constants';
import { EventService } from 'src/modules/event/service/event.service';
import { NodeService } from 'src/modules/node/service/node.service';
import { ICertificateRes } from '../interfaces';
import { CertificateService } from '../service/certificate.service';
@ApiTags('Certificate API')
@Controller('certificate')
export class CertificateController {
  constructor(
    private certificateService: CertificateService,
    private eventService: EventService,
    private nodeServices: NodeService,
  ) {}

  @Get('list')
  @ApiOkResponse({
    status: 200,
    description: 'List Certificate',
  })
  async getCertificateViaStatus() {
    const certificates: ICertificateRes =
      await this.certificateService.getAllCertificates();
    const expiredCertificates =
      await this.certificateService.getExpiredCertificate();
    const issuedCertificates =
      await this.certificateService.getIssuedCertificate();
    const serverStatus = await this.certificateService.getServerStatus();
    return {
      expiredCertificates: expiredCertificates.total,
      issuedCertificates: issuedCertificates.total,
      serverStatus,
      certificates,
    };
  }

  @Get('generateCertificateData')
  @ApiOkResponse({
    status: 200,
    description: 'Generate Certificate Data for Node',
  })
  async generateCertificateData() {
    try {
      const listNode = await this.nodeServices.getNode();
      await this.certificateService.generateCertificateData(listNode);

      return { status: 'succeeded' };
    } catch (err) {
      console.log(err);
      return { status: 'failed' };
    }
  }

  @Get('forceUploadCertificate')
  @ApiOkResponse({
    status: 200,
    description: 'Push Certificate to Cloud Storage for Monitoring',
  })
  async forceUploadCertificates() {
    try {
      await this.certificateService.insertCertificateData(
        fs.readFileSync(CLOUD_CERT),
      );

      const cert = fs.readFileSync(CLOUD_CERT);

      await this.eventService.forceUploadCertificates(
        cert,
        process.env.CLOUD_CERT,
      );

      return { status: 'succeeded' };
    } catch (err) {
      console.log(err);
      return { status: 'failed' };
    }
  }

  @Delete(':nodeId')
  @ApiOkResponse({
    status: 200,
    description: 'Delete Certificate to Cloud Storage for Monitoring',
  })
  @ApiParam({
    name: 'nodeId',
    type: String,
    description: 'e57f734f-a8ef-4c5b-b120-1856bdff6f85',
  })
  async deleteCertificate(@Param() params: { nodeId: string }) {
    await this.certificateService.deleteCertificate(params.nodeId);
    return { status: params.nodeId };
  }

  @Get('checkAndUpdate/:nodeId')
  @ApiOkResponse({
    status: 200,
    description: 'Force Update Certificate to Cloud Storage for Monitoring',
  })
  @ApiParam({
    name: 'nodeId',
    type: String,
    description: 'e57f734f-a8ef-4c5b-b120-1856bdff6f85',
  })
  async checkAndUpdateCertificate(@Param() params: { nodeId: string }) {
    await this.certificateService.checkAndUpdateCertificate(params.nodeId);
    return { status: params.nodeId };
  }
}
