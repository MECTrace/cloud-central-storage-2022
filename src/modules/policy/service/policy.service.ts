import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Node } from 'src/modules/node/entity/node.entity';
import { getRepository, Repository } from 'typeorm';
import { UpdatePolicyDto } from '../dto/policy.dto';
import { Policy } from '../entity/policy.entity';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(Policy) private policyRepository: Repository<Policy>,
  ) {}

  async findAll(): Promise<Policy[]> {
    return this.policyRepository
      .createQueryBuilder('policy')
      .select([
        '"policy"."id"',
        '"policy"."policyName"',
        '"policy"."description"',
        '"policy"."cpuLessThanPercent"',
        '"policy"."cpuOverPercent"',
        '"policy"."numberResendNode"',
        '"policy"."activated"',
      ])
      .orderBy('"policy"."policyName"', 'ASC')
      .execute() as Promise<Policy[]>;
  }

  async findOne(id: string): Promise<Policy> {
    return this.policyRepository.findOne({
      id,
    });
  }

  async updatePolicy(id: string, data: UpdatePolicyDto) {
    await this.policyRepository.update(id, data);
    return this.findOne(id);
  }

  async getNodeListByPolicyId(policyId: string) {
    await getRepository(Node)
      .createQueryBuilder('node')
      .innerJoin(Policy, 'policy', 'node.policyId = policy.id')
      .select([
        '"node"."id" as "nodeId"',
        '"node"."name" as "nodeName"',
        '"policy"."id" as "policyId"',
        '"policy"."policyName" as "policyName"',
      ])
      .where({
        policyId,
      })
      .getRawMany();
  }
}
