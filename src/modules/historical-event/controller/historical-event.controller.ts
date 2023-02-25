import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HistoricalEventService } from '../service/historical-event.service';
import { ListHistoricalEventDto } from '../dto/list-historical-event.dto';

@ApiTags('Upload file API')
@Controller('event')
export class HistoricalEventController {
  constructor(private historicalEventService: HistoricalEventService) {}

  @Get('historical-event/list')
  @ApiOperation({
    description: `Get list historical events`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get list succeeded',
    type: ListHistoricalEventDto,
  })
  async getHistoricalEventList() {
    return this.historicalEventService.findAll();
  }
}
