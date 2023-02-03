import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class PolicyManager {
  @ApiProperty()
  @PrimaryColumn('uuid')
  nodeId: string;

  @ApiProperty()
  @Column()
  policyId: string;
}
