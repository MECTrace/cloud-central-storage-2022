import { ApiProperty } from '@nestjs/swagger';
import { PolicyManager } from '../entity/policy-manager.entity';

export class ListPolicyManagerDto {
  @ApiProperty({ type: PolicyManager, isArray: true })
  listPolicy: PolicyManager[];
}
