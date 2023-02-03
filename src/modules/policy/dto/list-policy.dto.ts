import { ApiProperty } from '@nestjs/swagger';
import { Policy } from '../entity/policy.entity';

export class ListPolicyDto {
  @ApiProperty({ type: Policy, isArray: true })
  listPolicy: Policy[];
}
