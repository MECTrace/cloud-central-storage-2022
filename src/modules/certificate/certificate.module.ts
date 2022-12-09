import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from '../event/service/event.service';
import { CertificateController } from './controller/certificate.controller';
import { Certificate } from './entity/certificate.entity';
import { Event } from '../event/entity/event.entity';
import { Node } from '../node/entity/node.entity';
import { CertificateService } from './service/certificate.service';
import { NodeService } from '../node/service/node.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Certificate]),
    TypeOrmModule.forFeature([Event]),
    TypeOrmModule.forFeature([Node]),
  ],
  controllers: [CertificateController],
  providers: [CertificateService, EventService, NodeService],
  exports: [CertificateService],
})
export class CertificateModule {}
