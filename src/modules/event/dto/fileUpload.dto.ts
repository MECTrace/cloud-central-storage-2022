import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  fileUpload: any;

  @ApiProperty({ type: 'string' })
  sendNode: any;
}
