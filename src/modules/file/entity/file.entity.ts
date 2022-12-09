import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class File {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  fileName: string;

  @ApiProperty()
  @Column()
  fileType: string;

  @ApiProperty()
  @Column()
  path: string;

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
