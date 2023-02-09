import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Policy } from 'src/modules/policy/entity/policy.entity';
import { PolicyService } from 'src/modules/policy/service/policy.service';
import { UpdatePolicyNodeDto } from '../dto/update-policy-node.dto';
import { ResAllPolices, ResPolices, ResSinglePolicy } from '../interfaces';
import { PolicyManagerService } from '../service/policy-manager.service';

@ApiTags('Policy')
@Controller('policyManager')
export class PolicyManagerController {
  constructor(
    private policyManagerService: PolicyManagerService,
    private policyService: PolicyService,
  ) {}

  @Get('list')
  @ApiOperation({
    description: `Get list Policy Manager`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get list succeeded',
  })
  async getPolicyManagerList() {
    const polices = await this.policyService.findAll();

    const data: Policy[] = await Promise.all(
      polices.map(async (policy: Policy) => {
        const nodeList = await this.policyManagerService.getNodeListByPolicyId(
          policy.id,
        );
        const policyData = await this.policyService.findOne(policy.id);
        return {
          ...policyData,
          nodeList,
        };
      }),
    );

    return data;
  }

  @Get('getPolicyByNodeId/:nodeId')
  @ApiOperation({
    description: `Get Policy By Node Id`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get succeeded',
  })
  getPolicyByNodeId(@Param('nodeId') nodeId: string) {
    return this.policyManagerService.getPolicyByNodeId(nodeId);
  }

  @Patch(':nodeId')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdatePolicyNodeDto,
  })
  @ApiOperation({
    description: `Update policy for node`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Update successfully',
  })
  updatePolicy(
    @Param('nodeId') id: string,
    @Body() policyData: UpdatePolicyNodeDto,
  ) {
    return this.policyManagerService.updatePolicyNode(id, policyData);
  }

  @Get('getListNode/:policyId')
  @ApiOperation({
    description: `Get list node of policy`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get succeeded',
  })
  getListNodeOfPolicy(@Param('policyId') id: string) {
    return this.policyManagerService.getNodeListByPolicyId(id);
  }
}
