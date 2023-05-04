import { Logger, UploadedFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import 'dotenv/config';
import { Server, Socket } from 'socket.io';
import { SocketEvents, WEB_SOCKET_GATEWAY } from 'src/constants';
import { ISendDataEvent } from '../event/interfaces';

@WebSocketGateway({
  cors: WEB_SOCKET_GATEWAY,
})
export class GatewayServer
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private configService: ConfigService) {}

  private users = [];

  private logger: Logger = new Logger('AppGateway');

  afterInit() {
    this.logger.log('Gateway Server Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.users = this.users.splice(
      this.users.indexOf(String(client.handshake.headers.nodeid)),
      1,
    );
    console.log('Connection List: ', this.users);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.server.emit('connection', { server: process.env.NODE_ID });
    this.users[String(client.handshake.headers.nodeid)] = client.id;
    console.log('Connection List: ', this.users);
  }

  @SubscribeMessage(SocketEvents.NODE_INIT)
  handleEvent(@MessageBody() data) {
    this.server.emit(SocketEvents.CENTRAL_INIT, data);
  }

  @SubscribeMessage(SocketEvents.NODE_UPDATE)
  handleUpdateEvent(@MessageBody() data) {
    this.server.emit(SocketEvents.CENTRAL_UPDATE, data);
  }

  @SubscribeMessage('send-data')
  handleEventSendData(@MessageBody() res: ISendDataEvent) {
    try {
      if (!res.receiveNodeId || !res.sendNodeId) {
        throw Error(
          "Cannot handle event 'Send Data', please check sendNode and receiveNode",
        );
      }
      if (res.receiveNodeId == process.env.NODE_ID) {
        console.log(res);
      } else {
        const socketId = this.users[res.receiveNodeId] as string;
        if (socketId) {
          this.server.to(socketId).emit('send-data', {
            sendNodeId: res.sendNodeId,
            receiveNodeId: res.receiveNodeId,
            data: res.data,
          });
        } else {
          throw Error(`Cannot connect to NodeID  ${res.receiveNodeId}`);
        }
      }
    } catch (err) {
      console.error(`[ERROR] ${err}`);
    }
  }

  sendData(@UploadedFile() file: Express.Multer.File, receiveNodeId: string) {
    const socketId = this.users[receiveNodeId] as string;
    this.server.to(socketId).emit('send-data', {
      sendNodeId: process.env.NODE_ID,
      receiveNodeId: receiveNodeId,
      data: file,
      timestamp: new Date().getTime(),
    });
  }
}
