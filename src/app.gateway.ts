import { Logger } from '@nestjs/common';
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
import { SocketEvents, WEB_SOCKET_GATEWAY } from './constants';
import { GlobalSocketService } from './app.gateway.global';
@WebSocketGateway({
  cors: WEB_SOCKET_GATEWAY,
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private configService: ConfigService) {}

  private logger: Logger = new Logger('AppGateway');

  afterInit() {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    delete GlobalSocketService.socketList[
      String(client.handshake.headers.node_id)
    ];
    console.log('Connection List: ', GlobalSocketService.socketList);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.server.emit('connection', { server: process.env.NODE_ID });
    GlobalSocketService.socketList[String(client.handshake.headers.node_id)] = client.id;
    console.log('Connection List: ', GlobalSocketService.socketList);
  }

  @SubscribeMessage(SocketEvents.NODE_INIT)
  handleEvent(@MessageBody() data) {
    this.server.emit(SocketEvents.CENTRAL_INIT, data);
  }

  @SubscribeMessage(SocketEvents.NODE_UPDATE)
  handleUpdateEvent(@MessageBody() data) {
    this.server.emit(SocketEvents.CENTRAL_UPDATE, data);
  }
}
