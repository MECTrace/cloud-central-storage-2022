import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import { EventService } from 'src/modules/event/service/event.service';
import { NodeService } from 'src/modules/node/service/node.service';
import { ICertificateRes } from '../interfaces';
import { CertificateService } from '../service/certificate.service';
@ApiTags('certificate')
@Controller('certificate')
export class CertificateController {
  constructor(
    private certificateService: CertificateService,
    private eventService: EventService,
    private nodeServices: NodeService,
  ) {}

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

  @Get('forceUploadCertificate')
  @ApiOkResponse({
    status: 200,
    description: 'Push Certificate to Cloud Storage for Monitoring',
  })
  async forceUploadCertificates() {
    try {
      await this.certificateService.insertCertificateData(
        fs.readFileSync(`cert/${process.env.CLOUD_CERT}`),
      );

      const cert = fs.readFileSync(`cert/${process.env.CLOUD_CERT}`);

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
}
