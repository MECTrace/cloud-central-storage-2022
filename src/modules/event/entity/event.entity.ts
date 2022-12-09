import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { File } from '../../file/entity/file.entity';
@Entity()
@Unique(['sendNodeId', 'receiveNodeId', 'fileId', 'status', 'id'])
export class Event {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  sendNodeId: string;

  @ApiProperty()
  @Column()
  receiveNodeId: string;

  @OneToOne(() => File)
  @JoinColumn()
  file: File;

  @Column()
  fileId: string;

  @ApiProperty()
  @Column({ default: () => `''` })
  status: string;

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
