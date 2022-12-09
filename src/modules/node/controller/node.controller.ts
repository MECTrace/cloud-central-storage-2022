import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ListNodeDto } from '../dto/list-node.dto';
import { NodeService } from '../service/node.service';

@ApiTags('Node')
@Controller('Node')
export class NodeController {
  constructor(private nodeService: NodeService) {}

  @Get('list')
  @ApiOperation({
    description: `<b>Get All Nodes</b>`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'List Nodes',
    type: ListNodeDto,
  })
  getAllNodes() {
    return this.nodeService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  get(@Param() params: { id: string }) {
    return this.nodeService.findOne(params.id);
  }
}
