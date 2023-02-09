import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from './controller/event.controller';
import { Event } from './entity/event.entity';
import { EventGateway } from './event.gateway';
import { EventService } from './service/event.service';
import { FileService } from '../file/service/file.service';
import { File } from '../file/entity/file.entity';
import { NodeService } from '../node/service/node.service';
import { Node } from '../node/entity/node.entity';
import { HttpModule } from '@nestjs/axios';
import { Policy } from '../policy/entity/policy.entity';
import { PolicyService } from '../policy/service/policy.service';
import { PolicyManager } from '../policy-manager/entity/policy-manager.entity';
import { PolicyManagerService} from '../policy-manager/service/policy-manager.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    TypeOrmModule.forFeature([File]),
    TypeOrmModule.forFeature([Node]),
    TypeOrmModule.forFeature([PolicyManager]),
    TypeOrmModule.forFeature([Policy]),
    HttpModule,
  ],
  controllers: [EventController],
  providers: [
    EventService,
    FileService, 
    NodeService, 
    EventGateway, 
    PolicyManagerService,
    PolicyService,
  ],
  exports: [EventService],
})
export class EventModule {}
