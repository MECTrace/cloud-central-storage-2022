import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../event/entity/event.entity';
import { EventGateway } from '../event/event.gateway';
import { EventService } from '../event/service/event.service';
import { File } from '../file/entity/file.entity';
import { FileService } from '../file/service/file.service';
import { Node } from '../node/entity/node.entity';
import { NodeService } from '../node/service/node.service';
import { CertificateController } from './controller/certificate.controller';
import { Certificate } from './entity/certificate.entity';
import { CertificateService } from './service/certificate.service';
import { HistoricalEvent } from '../historical-event/entity/historical-event.entity';
import { HistoricalEventService } from '../historical-event/service/historical-event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Certificate]),
    TypeOrmModule.forFeature([Event]),
    TypeOrmModule.forFeature([Node]),
    TypeOrmModule.forFeature([File]),
    TypeOrmModule.forFeature([HistoricalEvent]),
    HttpModule,
  ],
  controllers: [CertificateController],
  providers: [
    CertificateService,
    HistoricalEventService,
    EventService,
    NodeService,
    FileService,
    EventGateway,
  ],
  exports: [CertificateService],
})
export class CertificateModule {}
