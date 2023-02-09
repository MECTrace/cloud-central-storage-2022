import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Node {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column()
  typeNode: number;

  @ApiProperty()
  @Column()
  status: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  public createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
    onUpdate: 'now()',
  })
  public updatedAt: Date;

  @ApiProperty()
  @Column()
  vmName: string;

  @ApiProperty()
  @Column()
  nodeURL: string;
}
