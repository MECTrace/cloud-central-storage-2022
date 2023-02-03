import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Policy {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  policyName: string;

  @ApiProperty()
  @Column()
  description: string;

  @ApiProperty()
  @Column()
  cpuOverPercent: number;

  @ApiProperty()
  @Column()
  cpuLessThanPercent: number;

  @ApiProperty()
  @Column()
  numberResendNode: number;

  @ApiProperty()
  @Column()
  activated: boolean;
}
