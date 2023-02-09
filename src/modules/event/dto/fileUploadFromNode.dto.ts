import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class FileUploadFromNodeDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  fileUpload: any;

  @ApiProperty({ type: 'string' })
  sendNode: any;
}
