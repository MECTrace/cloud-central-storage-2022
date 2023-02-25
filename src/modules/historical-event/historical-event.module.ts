import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoricalEventController } from './controller/historical-event.controller';
import { HistoricalEvent } from './entity/historical-event.entity';
import { HistoricalEventService } from './service/historical-event.service';

@Module({
  imports: [TypeOrmModule.forFeature([HistoricalEvent])],
  controllers: [HistoricalEventController],
  providers: [HistoricalEventService],
  exports: [HistoricalEventService],
})
export class HistoricalEventModule {}
