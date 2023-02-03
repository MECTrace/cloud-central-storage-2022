import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePolicyDto {
  @IsOptional()
  policyName: string;

  @IsOptional()
  description: string;

  @IsOptional()
  cpuOverPercent: number;

  @IsOptional()
  cpuLessThanPercent: number;

  @IsOptional()
  numberResendNode: number;

  @IsOptional()
  @IsBoolean()
  activated: boolean;
}
