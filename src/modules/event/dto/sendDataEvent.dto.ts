import { ApiProperty } from '@nestjs/swagger';

export class sendDataEvent {
  @ApiProperty({ type: 'string', format: 'binary' })
  fileUpload: any;

  @ApiProperty({ type: 'string' })
  receiveNodeId: string;
}
