import { ApiProperty } from '@nestjs/swagger';
import { Column, PrimaryColumn, Entity } from 'typeorm';

@Entity()
export class HistoricalEvent {
  @ApiProperty()
  @PrimaryColumn('uuid')
  sendNodeId: string;

  @ApiProperty()
  @PrimaryColumn('uuid')
  receiveNodeId: string;

  @ApiProperty()
  @Column('uuid')
  id: string;

  @ApiProperty()
  @Column()
  label: number;

  @ApiProperty()
  @Column()
  status: number;
}
