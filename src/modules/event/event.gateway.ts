import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GlobalSocketService } from 'src/app.gateway.global';
import { UploadedFile } from '@nestjs/common';
@WebSocketGateway()
export class EventGateway {
  @WebSocketServer()
  server: Server;

  transferFile(
    @UploadedFile() file: Express.Multer.File,
    receiveNodeId: string,
  ) {
    const socketId = GlobalSocketService.socketList[receiveNodeId];
    this.server.sockets.sockets.get(socketId).emit('sendData', { data: file });
  }
}
