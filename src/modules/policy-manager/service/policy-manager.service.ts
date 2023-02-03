import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyManager } from '../entity/policy-manager.entity';
import { Node } from 'src/modules/node/entity/node.entity';
import { Policy } from 'src/modules/policy/entity/policy.entity';
import { UpdatePolicyNodeDto } from '../dto/update-policy-node.dto';
import { PolicyService } from 'src/modules/policy/service/policy.service';
import { ResSinglePolicy } from '../interfaces';

@Injectable()
export class PolicyManagerService {
  constructor(
    @InjectRepository(PolicyManager)
    private policyManagerRepository: Repository<PolicyManager>,
    private policyService: PolicyService,
  ) {}

  async findAll(): Promise<ResSinglePolicy[]> {
    return this.policyManagerRepository
      .createQueryBuilder('policy_manager')
      .select(['"policy_manager"."nodeId"', '"policy_manager"."policyId"'])
      .execute() as Promise<ResSinglePolicy[]>;
  }

  async findOne(nodeId: string): Promise<PolicyManager> {
    return this.policyManagerRepository.findOne(nodeId);
  }

  async updatePolicyNode(nodeId: string, data: UpdatePolicyNodeDto) {
    await this.policyManagerRepository.update(nodeId, data);
    return this.policyManagerRepository.findOne(nodeId);
  }

  async getNodeListByPolicyId(policyId: string) {
    return this.policyManagerRepository
      .createQueryBuilder('policy_manager')
      .innerJoin(Node, 'node', 'node.id = policy_manager.nodeId')
      .innerJoin(Policy, 'policy', 'policy.id = policy_manager.policyId')
      .select([
        '"node"."id" as "nodeId"',
        '"node"."name" as "nodeName"',
        '"policy"."id" as "policyId"',
        '"policy"."policyName" as "policyName"',
        '"policy"."activated" as "activated"',
      ])
      .where({
        policyId: policyId,
      })
      .getRawMany();
  }
}
