import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../../file/entity/file.entity';
import { Node } from '../../node/entity/node.entity';
import { getEventBySendNodeId } from '../dto/getBySendNode.dto';
import { Event } from '../entity/event.entity';
import { IEventResult } from '../interfaces';
export interface IGetBySendNodeId {
  fileId: string;
  sendNode: string;
  sendNodeId: string;
  receiveNodeId: string;
  receiveNode: string;
  status: string;
  createdAt: string;
  fileType: string;
}
@Injectable()
export class EventService {
  getBlobClient(fileName: string, containerName: string): BlockBlobClient {
    const blobClientService = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION,
    );
    const containerClient = blobClientService.getContainerClient(containerName);

    return containerClient.getBlockBlobClient(fileName);
  }

  constructor(
    @InjectRepository(Event) private eventRepository: Repository<Event>,
  ) {}

  async upload(file: Express.Multer.File) {
    try {
      const blobClient = this.getBlobClient(
        file.originalname,
        process.env.AZURE_STORAGE_CONTAINER,
      );
      await blobClient.uploadData(file.buffer, {
        blockSize: 1024, // 4MB block size
        concurrency: 20, // 20 concurrency
      });
    } catch (err) {
      // throw Error(err);
    }
  }

  async forceUploadCertificates(buffer: Buffer, blobName: string) {
    try {
      const blobClient = this.getBlobClient(
        blobName,
        process.env.AZURE_STORAGE_CERT,
      );
      await blobClient.uploadData(buffer, {
        blockSize: 1024,
        concurrency: 20,
      });
    } catch (err) {
      console.log(err);
    }
  }

  async deleteCertificate(filename: string) {
    const blobClient = this.getBlobClient(
      filename,
      process.env.AZURE_STORAGE_CERT,
    );
    await blobClient.deleteIfExists();
  }

  async pullCertificate(fileName: string) {
    const blobClient = this.getBlobClient(
      fileName,
      process.env.AZURE_STORAGE_CERT,
    );
    await blobClient.downloadToFile(`cert\\${fileName}`);
  }

  async update(id: string, status: string) {
    await this.eventRepository
      .createQueryBuilder()
      .update(Event)
      .set({ status })
      .where({
        id: id,
      })
      .execute();
  }

  async getBySendNodeId(sendNodeId: getEventBySendNodeId | string, page = 1) {
    const limit = 10;
    const rs = this.eventRepository
      .createQueryBuilder('event')
      .innerJoin(File, 'file', 'event.fileId = file.id ')
      .innerJoin(Node, 'sendNode', 'event.sendNodeId = sendNode.id')
      .innerJoin(Node, 'receiveNode', 'event.receiveNodeId = receiveNode.id')
      .select([
        '"event"."id"',
        '"event"."sendNodeId"',
        '"sendNode"."name" as "sendNode"',
        '"event"."receiveNodeId"',
        '"receiveNode"."name" as "receiveNode"',
        '"event"."status"',
        '"event"."createdAt"',
        '"file"."fileType"',
      ])
      .where({
        receiveNodeId: sendNodeId,
      })
      .orderBy('"event"."createdAt"', 'DESC');

    const events = await rs
      .limit(limit)
      .offset(page === 1 ? 0 : (page - 1) * limit)
      .getRawMany();

    const total = await rs.getCount();
    const totalPage = events.length ? Math.ceil(total / limit) : 0;
    const hasNextPage = page > 0 && page < totalPage;

    return { events, totalPage, currentPage: page, hasNextPage };
  }

  async create({
    sendNodeId,
    receiveNodeId,
    fileId,
    status,
  }: IGetBySendNodeId) {
    return this.eventRepository
      .createQueryBuilder()
      .insert()
      .into(Event)
      .values([
        {
          sendNodeId,
          receiveNodeId,
          status,
          fileId,
        },
      ])
      .execute();
  }

  async getByFileId(fileId: string) {
    const response: IEventResult[] = (await this.eventRepository
      .createQueryBuilder('event')
      .select()
      .where({
        fileId,
      })
      .execute()) as IEventResult[];
    return response;
  }

  async getByStatus() {
    const repo = this.eventRepository;
    const total = await repo.createQueryBuilder().select().getCount();
    const numberOfFailed = await repo
      .createQueryBuilder()
      .select()
      .where({
        status: 'Failed',
      })
      .getCount();
    const numberOfSucceed = await repo
      .createQueryBuilder()
      .select()
      .where({
        status: 'Succeeded',
      })
      .getCount();
    return { total, numberOfFailed, numberOfSucceed };
  }
}
