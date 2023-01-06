import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Node } from '../entity/node.entity';

@Injectable()
export class NodeService {
  constructor(
    @InjectRepository(Node) private nodeRepository: Repository<Node>,
  ) {}

  /**
   * Find all Edges with corresponding RSUs, OBUs
   * @returns {Promise<ListNodeDto>}
   */
  async findAll(): Promise<Node[]> {
    return this.nodeRepository
      .createQueryBuilder('node')
      .select([
        '"node"."id"',
        '"node"."name"',
        '"node"."typeNode"',
        '"node"."status"',
        '"node"."createdAt"',
        '"node"."updatedAt"',
      ])
      .orderBy('name', 'ASC')
      .execute() as Promise<Node[]>;
  }

  async findOne(name: string): Promise<Node> {
    return this.nodeRepository.findOne({
      name,
    });
  }

  async getNode(): Promise<{ id: string; name: string }[]> {
    return this.nodeRepository
      .createQueryBuilder()
      .select(['id', 'name'])
      .execute() as Promise<{ id: string; name: string }[]>;
  }

  async getNodeById(nodeId: string): Promise<{ name: string }[]> {
    return this.nodeRepository
      .createQueryBuilder()
      .select(['name'])
      .where({
        id: nodeId,
      })
      .execute() as Promise<{ name: string }[]>;
  }
}
