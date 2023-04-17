import { HttpService } from '@nestjs/axios';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { Injectable, UploadedFile, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../../file/entity/file.entity';
import { Node } from '../../node/entity/node.entity';
import { getEventBySendNodeId } from '../dto/getBySendNode.dto';
import { Event } from '../entity/event.entity';
import { IEventResult, IInsertResult } from '../interfaces';
import { NodeService } from 'src/modules/node/service/node.service';
import { FileService } from 'src/modules/file/service/file.service';
import { EventGateway } from '../event.gateway';
import { SocketEvents, SocketStatus, STATUS, ROOT_CA } from 'src/constants';
import * as FormData from 'form-data';
import { lastValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as https from 'https';
import { HistoricalEventService } from 'src/modules/historical-event/service/historical-event.service';
import { GlobalSocketService } from 'src/app.gateway.global';
import { PolicyManagerService } from 'src/modules/policy-manager/service/policy-manager.service';
import { ResPoliceByNodeId } from 'src/modules/policy-manager/interfaces';
export interface IGetBySendNodeId {
  fileId: string;
  sendNode: string;
  sendNodeId: string;
  receiveNodeId: string;
  receiveNode: string;
  status: string;
  createdAt: string;
  fileType: string;
  policyName: string;
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
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private nodeService: NodeService,
    private fileService: FileService,
    private eventGateway: EventGateway,
    private httpService: HttpService,
    private historicalEventService: HistoricalEventService,
    private policyManagerService: PolicyManagerService,
  ) {}

  async upload(prefix: string, file: Express.Multer.File) {
    try {
      const blobClient = this.getBlobClient(
        prefix + file.originalname,
        process.env.AZURE_STORAGE_CONTAINER,
      );
      await blobClient.uploadData(file.buffer, {
        blockSize: 4 * 1024 * 1024, // 4MB block size
        concurrency: 20, // 20 concurrency
      });
    } catch (err) {
      // throw Error(err);
    }
  }

  async uploadFromNode(
    @UploadedFile() file: Express.Multer.File,
    @Body() post: { sendNode: string; cpu_limit: number; policyName: string },
  ) {
    const receiveNodeId = process.env.NODE_ID;
    const sendNode = post.sendNode;
    const cpu_limit = post.cpu_limit;
    const policyName = post.policyName;
    const nodeResult = await this.nodeService.findOne(sendNode);
    const sendNodeId = nodeResult.id;
    let fileId: string;
    let isSuccess = false;

    const optionEvent = <IGetBySendNodeId>{
      sendNodeId,
      receiveNodeId,
      policyName,
    };

    const path =
      `/${process.env.AZURE_STORAGE_CONTAINER}` +
      `/${process.env.VM_NAME}/${file.originalname}`;

    const findFileId: string = await this.fileService.findByPath(path);
    if (!findFileId) {
      const createdFile: IInsertResult = await this.fileService.create(
        `${process.env.VM_NAME}`,
        file,
      );
      fileId = createdFile.raw[0].id;
    } else {
      fileId = findFileId;
    }

    const createdEvent: IInsertResult = await this.create({
      ...optionEvent,
      status: STATUS.PENDING,
      fileId: fileId,
    });
    const totalEvents = (
      await this.getNumberOfFilesUpload(sendNodeId, receiveNodeId)
    ).total;
    const insertedEventId: string = createdEvent.raw[0].id;

    this.eventGateway.server.emit(SocketEvents.CENTRAL_INIT, {
      id: insertedEventId,
      receiveNodeId,
      sendNodeId,
      status: SocketStatus.PENDING,
    });

    try {
      const infoCurrentNode = await this.nodeService.getCPUCurrentNode();
      const cpu = infoCurrentNode.cpuUsage;

      if (cpu < cpu_limit) {
        // accept to send file
        const form = new FormData();
        form.append('fileUpload', file.buffer, {
          filename: file.originalname,
        });

        try {
          const url = process.env.NODE_URL + '/api/event/upload';
          await lastValueFrom(
            this.httpService.post(url, form, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              httpsAgent: new https.Agent({
                rejectUnauthorized: false,
              }),
            }),
          );
          console.log('[Success] Send file successfully');
        } catch {
          // throw error
          console.log('[Error] Cannot send file');
          throw Error();
        }

        // upload to backup
        await this.upload(`${process.env.VM_NAME}/`, file);

        // update event and file table
        await this.fileService.update(findFileId, path);
        await this.update(insertedEventId, STATUS.SUCCESS);
        isSuccess = true;
        await this.historicalEventService.updateOne(
          sendNodeId,
          receiveNodeId,
          insertedEventId,
          totalEvents + 1,
          SocketStatus.SUCCESS,
        );
        setTimeout(() => {
          this.eventGateway.server.emit(SocketEvents.CENTRAL_UPDATE, {
            id: insertedEventId,
            receiveNodeId,
            sendNodeId,
            status: SocketStatus.SUCCESS,
          });
        }, 2000);
      } else {
        // throw error
        throw Error(insertedEventId);
      }
    } catch {
      // Cant meet cpu condition
      // upload to backup
      await this.upload(`${process.env.VM_NAME}/`, file);

      // update event and file table
      await this.fileService.update(findFileId, path);
      await this.update(insertedEventId, STATUS.FAIL);

      await this.historicalEventService.updateOne(
        sendNodeId,
        receiveNodeId,
        insertedEventId,
        totalEvents + 1,
        SocketStatus.FAIL,
      );
      setTimeout(() => {
        this.eventGateway.server.emit(SocketEvents.CENTRAL_UPDATE, {
          id: insertedEventId,
          receiveNodeId,
          sendNodeId,
          status: SocketStatus.FAIL,
        });
      }, 2000);
    } finally {
      setTimeout(() => {
        this.eventGateway.server.emit(SocketEvents.CENTRAL_UPDATE, {
          id: insertedEventId,
          receiveNodeId,
          sendNodeId,
          status: SocketStatus.DONE,
        });
      }, 4000);
    }
    return {
      status: isSuccess,
      eventId: insertedEventId,
    };
  }

  async reSend(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    post: {
      sendNode: string;
      receiveNode: any;
      numberResendNode: number;
    },
  ) {
    let count = 0;

    for (const node of post.receiveNode) {
      if (count >= post.numberResendNode) {
        break;
      }

      // begin to send file
      const form = new FormData();
      form.append('fileUpload', file.buffer, {
        filename: file.originalname,
      });
      form.append('sendNode', post.sendNode);

      try {
        const url = node.nodeURL + '/api/event/resend';

        const httpsAgent = new https.Agent({
          ca: fs.readFileSync(ROOT_CA).toString(),
        });

        let isSuccess: any;
        try {
          const { data } = await lastValueFrom(
            this.httpService.post(url, form, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              httpsAgent: httpsAgent,
            }),
          );
          isSuccess = data;
        } catch (err) {
          const { data } = await lastValueFrom(
            this.httpService.post(url, form, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              httpsAgent: new https.Agent({
                rejectUnauthorized: false,
              }),
            }),
          );
          isSuccess = data;
        }

        if (!isSuccess.status) {
          throw Error();
        }
        count += 1;
      } catch {
        // throw error
        console.log('[Error] Cannot resend file');
      }
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
        '"event"."policyName"',
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
    policyName,
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
          policyName,
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

  async getNumberOfFilesUpload(sendNodeId: string, receiveNodeId: string) {
    const repo = this.eventRepository;
    let numberOfFailed = 0;
    let numberOfSucceed = 0;
    try {
      numberOfFailed = await repo
        .createQueryBuilder()
        .select()
        .where({
          status: 'Failed',
          sendNodeId: sendNodeId,
          receiveNodeId: receiveNodeId,
        })
        .getCount();
    } catch (err) {
      numberOfFailed = 0;
    }

    try {
      numberOfSucceed = await repo
        .createQueryBuilder()
        .select()
        .where({
          status: 'Succeeded',
          sendNodeId: sendNodeId,
          receiveNodeId: receiveNodeId,
        })
        .getCount();
    } catch (err) {
      numberOfSucceed = 0;
    }

    const total = numberOfFailed + numberOfSucceed;
    return { total, numberOfFailed, numberOfSucceed };
  }

  async sendData(
    @UploadedFile() file: Express.Multer.File,
    @Body() post: { receiveNode: string; cpuLimit: number; policyName: string },
  ) {
    let isSuccess = false;
    const sendNodeId = process.env.NODE_ID;
    const receiveNodeId = post.receiveNode;

    // find limit to accept send file
    const policy: Array<ResPoliceByNodeId> =
      await this.policyManagerService.getPolicyByNodeId(post.receiveNode);

    const policyName = policy[0].policyName;
    // const nodeName = policy[0].nodeName;
    const cpuLimit = policy[0].cpuOverPercent;
    // const cpuLessThanPercent = policy[0].cpuLessThanPercent;
    // const numberResendNode = policy[0].numberResendNode;

    let fileId: string;
    const path =
      `/${process.env.AZURE_STORAGE_CONTAINER}` +
      `/${process.env.VM_NAME}/${file.originalname}`;

    const findFileId: string = await this.fileService.findByPath(path);
    if (!findFileId) {
      const createdFile: IInsertResult = await this.fileService.create(
        `${process.env.VM_NAME}`,
        file,
      );
      fileId = createdFile.raw[0].id;
    } else {
      fileId = findFileId;
    }

    const optionEvent = <IGetBySendNodeId>{
      sendNodeId,
      receiveNodeId,
      policyName,
    };
    const createdEvent: IInsertResult = await this.create({
      ...optionEvent,
      status: STATUS.PENDING,
      fileId: fileId,
    });

    const totalEvents = (
      await this.getNumberOfFilesUpload(sendNodeId, receiveNodeId)
    ).total;
    const insertedEventId: string = createdEvent.raw[0].id;

    this.eventGateway.server.emit(SocketEvents.CENTRAL_INIT, {
      id: insertedEventId,
      receiveNodeId,
      sendNodeId,
      status: SocketStatus.PENDING,
    });

    try {
      // doi thanh cpu cua thang nhan
      // const infoCurrentNode = await this.nodeService.getCPUCurrentNode();
      // const cpu = infoCurrentNode.cpuUsage;
      const cpu = 0.1;

      if (cpu < cpuLimit) {
        // accept to send file
        const socketId = GlobalSocketService.socketList[post.receiveNode];
        this.eventGateway.server.sockets.sockets
          .get(socketId)
          .emit('sendData', { data: file });

        // upload to backup
        await this.upload(`${process.env.VM_NAME}/`, file);

        // update event and file table
        await this.fileService.update(findFileId, path);
        await this.update(insertedEventId, STATUS.SUCCESS);
        isSuccess = true;
        await this.historicalEventService.updateOne(
          sendNodeId,
          receiveNodeId,
          insertedEventId,
          totalEvents + 1,
          SocketStatus.SUCCESS,
        );
        setTimeout(() => {
          this.eventGateway.server.emit(SocketEvents.CENTRAL_UPDATE, {
            id: insertedEventId,
            receiveNodeId,
            sendNodeId,
            status: SocketStatus.SUCCESS,
          });
        }, 2000);
      } else {
        // throw error
        throw Error(insertedEventId);
      }
    } catch {
      // Cant meet cpu condition
      // upload to backup
      await this.upload(`${process.env.VM_NAME}/`, file);

      // update event and file table
      await this.fileService.update(findFileId, path);
      await this.update(insertedEventId, STATUS.FAIL);

      await this.historicalEventService.updateOne(
        sendNodeId,
        receiveNodeId,
        insertedEventId,
        totalEvents + 1,
        SocketStatus.FAIL,
      );
      setTimeout(() => {
        this.eventGateway.server.emit(SocketEvents.CENTRAL_UPDATE, {
          id: insertedEventId,
          receiveNodeId,
          sendNodeId,
          status: SocketStatus.FAIL,
        });
      }, 2000);
    } finally {
      setTimeout(() => {
        this.eventGateway.server.emit(SocketEvents.CENTRAL_UPDATE, {
          id: insertedEventId,
          receiveNodeId,
          sendNodeId,
          status: SocketStatus.DONE,
        });
      }, 4000);
    }
    return {
      status: isSuccess,
      eventId: insertedEventId,
    };
    // const socketId = GlobalSocketService.socketList[post.sendNode];
    // this.eventGateway.server.sockets.sockets.get(socketId).emit('sendData', {
    //   data: fileUpload,
    // });
  }

  async getNumberOfFilesByNodeId(NodeId: string, Period: string) {
    const repo = this.eventRepository;
    let numberOfFailed = 0;
    let numberOfSucceed = 0;
    let timeStamp: Date | undefined;

    const periodParam: number = Period != 'all' ? Number(Period) : 0;

    if (periodParam > 0) {
      timeStamp = new Date(Date.now() - periodParam * 60 * 60 * 1000);
    }

    try {
      const queryFailed = repo
        .createQueryBuilder()
        .select()
        .where([
          {
            status: 'Failed',
            sendNodeId: NodeId,
          },
          {
            status: 'Failed',
            receiveNodeId: NodeId,
          },
        ]);

      if (timeStamp) {
        queryFailed.andWhere('Event.createdAt >= :timeStamp', { timeStamp });
      }
      numberOfFailed = await queryFailed.getCount();
    } catch (err) {
      numberOfFailed = 0;
    }

    try {
      const querySucceeded = repo
        .createQueryBuilder()
        .select()
        .where([
          {
            status: 'Succeeded',
            sendNodeId: NodeId,
          },
          {
            status: 'Succeeded',
            receiveNodeId: NodeId,
          },
        ]);

      if (timeStamp) {
        querySucceeded.andWhere('Event.createdAt >= :timeStamp', { timeStamp });
      }
      numberOfSucceed = await querySucceeded.getCount();
    } catch (err) {
      numberOfSucceed = 0;
    }

    const total = numberOfFailed + numberOfSucceed;
    return { total, numberOfFailed, numberOfSucceed };
  }

  async getNumberOfFilesOfAllNode(Period: string) {
    const timeStamp = Period == 'all' ? '24' : Period;
    const nodeList: Node[] = await this.nodeService.findAll();
    const data: {
      id: string;
      name: string;
      status: string;
      nodeURL: string;
      total: number;
      lastHours: number;
    }[] = await Promise.all(
      nodeList.map(async (node: Node) => {
        const total = (await this.getNumberOfFilesByNodeId(node.id, 'all'))
          .total;
        const lastHours = (
          await this.getNumberOfFilesByNodeId(node.id, timeStamp)
        ).total;
        return {
          id: node.id,
          name: node.name,
          status: node.status,
          nodeURL: node.nodeURL,
          total: total,
          lastHours: lastHours,
        };
      }),
    );
    return data;
  }

  async getNumberOfFilesTimeSeries(NodeId: string, numberOfDays: string) {
    const query = this.eventRepository
      .createQueryBuilder('e')
      .select('DATE(e."createdAt")', 'date')
      .addSelect('COUNT(e.id)', 'total')
      .groupBy('date')
      .orderBy('date', 'DESC');

    if (NodeId != 'all') {
      query.where([
        {
          sendNodeId: NodeId,
        },
        {
          receiveNodeId: NodeId,
        },
      ]);
    }
    if (numberOfDays != 'all') {
      const numberOfDate = Number(numberOfDays);
      query.limit(numberOfDate);
    }

    return query.getRawMany<{ date: Date; total: number }>();
  }

  async getNumberOfEachKindOfFile(nodeId: string) {
    return this.fileService.getNumberOfEachKindOfFile();
  }
}
