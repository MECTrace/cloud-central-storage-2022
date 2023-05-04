import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Node } from '../node/entity/node.entity';
import { NodeService } from '../node/service/node.service';
import { CertificateController } from './controller/certificate.controller';
import { Certificate } from './entity/certificate.entity';
import { CertificateService } from './service/certificate.service';
import { AzureService } from '../azure-service/service/azure-service.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Certificate]),
    TypeOrmModule.forFeature([Node]),
    HttpModule,
  ],
  controllers: [CertificateController],
  providers: [CertificateService, NodeService, AzureService],
  exports: [CertificateService],
})
export class CertificateModule {}
