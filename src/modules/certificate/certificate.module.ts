import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../event/entity/event.entity';
import { EventService } from '../event/service/event.service';
import { Node } from '../node/entity/node.entity';
import { NodeService } from '../node/service/node.service';
import { CertificateController } from './controller/certificate.controller';
import { Certificate } from './entity/certificate.entity';
import { CertificateService } from './service/certificate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Certificate]),
    TypeOrmModule.forFeature([Event]),
    TypeOrmModule.forFeature([Node]),
    HttpModule,
  ],
  controllers: [CertificateController],
  providers: [CertificateService, EventService, NodeService],
  exports: [CertificateService],
})
export class CertificateModule {}
