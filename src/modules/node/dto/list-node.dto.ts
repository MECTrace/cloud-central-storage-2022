import { ApiProperty } from '@nestjs/swagger';
import { Node } from '../entity/node.entity';

export class ListNodeDto {
  @ApiProperty({ type: Node, isArray: true })
  listNode: Node[];
}
