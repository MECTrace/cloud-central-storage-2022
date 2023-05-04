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

  @Get('getCPUByNodeId/:nodeId')
  @ApiOperation({
    description: `Get CPU By Node Id`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get CPU successfully',
  })
  getCPUByNodeId(@Param('nodeId') nodeId: string) {
    return this.nodeService.getCPUByNodeId(nodeId);
  }

  @Get('getRAMByNodeId/:nodeId')
  @ApiOperation({
    description: `Get RAM By Node Id`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get RAM successfully',
  })
  getRAMByNodeId(@Param('nodeId') nodeId: string) {
    return this.nodeService.getRAMByNodeId(nodeId);
  }

  @Get('getTotalNetwork/:nodeId')
  @ApiOperation({
    description: `Get RAM By Node Id`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get RAM successfully',
  })
  getTotalNetwork(@Param('nodeId') nodeId: string) {
    return this.nodeService.getTotalNetworkByNodeId(nodeId);
  }

  @Get('getDiskOperator/:nodeId')
  @ApiOperation({
    description: `Get Disk Operator By Node Id`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get disk operator successfully',
  })
  getDiskOperator(@Param('nodeId') nodeId: string) {
    return this.nodeService.getDiskOperatorByNodeId(nodeId);
  }

  @Get('getAvailableNode/:currentNode/:cpuLimit/:numberResendNode')
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
    @Param('numberResendNode') numberResendNode: number,
  ) {
    return this.nodeService.getAvailableNode(
      currentNode,
      cpuLimit,
      numberResendNode,
    );
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
