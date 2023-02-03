import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ListPolicyDto } from '../dto/list-policy.dto';
import { UpdatePolicyDto } from '../dto/policy.dto';
import { PolicyService } from '../service/policy.service';

@ApiTags('Policy')
@Controller('policy')
export class PolicyController {
  constructor(private policyService: PolicyService) {}

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdatePolicyDto,
  })
  @ApiOperation({
    description: `Update policy information`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Update policy information successfully',
  })
  async updatePolicy(
    @Param('id') id: string,
    @Body() policyData: UpdatePolicyDto,
  ) {
    return this.policyService.updatePolicy(id, policyData);
  }
}
