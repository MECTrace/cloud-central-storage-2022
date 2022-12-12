import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ListNodeDto } from '../dto/list-node.dto';
import { NodeService } from '../service/node.service';

@ApiTags('Cloud Server API')
@Controller('node')
export class NodeController {
  constructor(private nodeService: NodeService) {}

  @Get('list')
  @ApiOperation({
    description: `Get All of Server information, include: Cloud Central &  Edge Node`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get list succeeded',
    type: ListNodeDto,
  })
  getAllNodes() {
    return this.nodeService.findAll();
  }
}
