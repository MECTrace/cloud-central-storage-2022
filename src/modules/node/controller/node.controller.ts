import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { ListNodeDto } from '../dto/list-node.dto';
import { UpdateNodeDto } from '../dto/update-node-dto';
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

  @Get('getCPUCurrentNode')
  @ApiOperation({
    description: `Get CPU of Current Node`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get CPU successfully',
  })
  getCPUCurrentNode() {
    return this.nodeService.getCPUCurrentNode();
  }

  @Get('getAvailableNode/:currentNode/:cpuLimit')
  @ApiOperation({
    description: `Get Available Node`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get Available Node successfully',
  })
  getAvailableNode(
    @Param('currentNode') currentNode: string,
    @Param('cpuLimit') cpuLimit: number,
  ) {
    return this.nodeService.getAvailableNode(currentNode, cpuLimit);
  }

  @Get('status')
  @ApiOperation({
    description: `Get All Status of Server information, include: Cloud Central &  Edge Node`,
  })
  getStatus() {
    return this.nodeService.updateStatusAllNodes();
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateNodeDto,
  })
  @ApiOperation({
    description: `Update node`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Update successfully',
  })
  updateNode(@Param('id') id: string, @Body() nodeData: UpdateNodeDto) {
    return this.nodeService.updateNode(id, nodeData);
  }
}
