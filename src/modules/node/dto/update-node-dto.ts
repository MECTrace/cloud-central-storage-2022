import { IsOptional } from 'class-validator';

export class UpdateNodeDto {
  @IsOptional()
  name: string;

  @IsOptional()
  typeNode: number;

  @IsOptional()
  status: string;

  @IsOptional()
  vmName: string;

  @IsOptional()
  nodeURL: string;
}
