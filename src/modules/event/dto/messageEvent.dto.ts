import { ApiProperty } from '@nestjs/swagger';

export class MessageEvent {
  @ApiProperty({ type: 'string', format: 'binary' })
  fileUpload: any;

  @ApiProperty({ type: 'string' })
  receiveNode: any;
}
