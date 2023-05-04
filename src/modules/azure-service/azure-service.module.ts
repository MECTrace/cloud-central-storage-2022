import { Module } from '@nestjs/common';
import { AzureService } from './service/azure-service.service';

@Module({
  providers: [AzureService],
  exports: [AzureService],
})
export class AzureServiceModule {}
