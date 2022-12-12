import { ApiProperty } from '@nestjs/swagger';

export class summaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  numberOfFailed: number;

  @ApiProperty()
  numberOfSucceed: number;
}
