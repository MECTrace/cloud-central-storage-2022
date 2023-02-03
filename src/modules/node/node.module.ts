import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeController } from './controller/node.controller';
import { Node } from './entity/node.entity';
import { NodeService } from './service/node.service';

@Module({
  imports: [TypeOrmModule.forFeature([Node]), HttpModule],
  controllers: [NodeController],
  providers: [NodeService],
  exports: [NodeService],
})
export class NodeModule {}
