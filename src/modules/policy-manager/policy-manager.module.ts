import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyManager } from './entity/policy-manager.entity';
import { PolicyManagerController } from './controller/policy-manager.controller';
import { PolicyManagerService } from './service/policy-manager.service';
import { PolicyService } from '../policy/service/policy.service';
import { Policy } from '../policy/entity/policy.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PolicyManager]),
    TypeOrmModule.forFeature([Policy]),
  ],
  controllers: [PolicyManagerController],
  providers: [PolicyManagerService, PolicyService],
  exports: [PolicyManagerService],
})
export class PolicyManagerModule {}
