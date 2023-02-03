import { IsOptional } from 'class-validator';

export class UpdatePolicyNodeDto {
  @IsOptional()
  policyId: string;
}
