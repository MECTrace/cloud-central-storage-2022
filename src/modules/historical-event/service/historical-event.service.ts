import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoricalEvent } from '../entity/historical-event.entity';
import { ResSingleEvent } from '../interfaces';

@Injectable()
export class HistoricalEventService {
  constructor(
    @InjectRepository(HistoricalEvent)
    private historicalEventRepository: Repository<HistoricalEvent>,
  ) {}

  async findAll(): Promise<ResSingleEvent[]> {
    return this.historicalEventRepository
      .createQueryBuilder('historical_event')
      .select([
        '"historical_event"."id"',
        '"historical_event"."sendNodeId"',
        '"historical_event"."receiveNodeId"',
        '"historical_event"."label"',
        '"historical_event"."status"',
      ])
      .execute() as Promise<ResSingleEvent[]>;
  }

  async updateOne(
    sendNodeId: string,
    receiveNodeId: string,
    id: string,
    label: number,
    status: number,
  ): Promise<HistoricalEvent> {
    return this.historicalEventRepository.save({
      sendNodeId,
      receiveNodeId,
      id,
      label,
      status,
    });
  }
}
