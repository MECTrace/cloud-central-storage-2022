import { ApiProperty } from '@nestjs/swagger';
import { HistoricalEvent } from '../entity/historical-event.entity';

export class ListHistoricalEventDto {
  @ApiProperty({ type: HistoricalEvent, isArray: true })
  listHistoricalEvent: HistoricalEvent[];
}
