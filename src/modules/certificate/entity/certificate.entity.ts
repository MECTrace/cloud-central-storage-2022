import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class Certificate {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  nodeId: string;

  @ApiProperty()
  @Column()
  expiredDay: Date;

  @ApiProperty()
  @Column()
  issuedDate: Date;

  @ApiProperty()
  @Column()
  certificateIssue: string;

  @ApiProperty()
  @Column()
  isIssued: boolean;

  @ApiProperty()
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
}
