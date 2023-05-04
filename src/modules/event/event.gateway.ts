// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { GlobalSocketService } from 'src/app.gateway.global';
// import { UploadedFile } from '@nestjs/common';
// @WebSocketGateway()
// export class EventGateway {
//   @WebSocketServer()
//   server: Server;

//   transferFile(
//     @UploadedFile() file: Express.Multer.File,
//     receiveNodeId: string,
//   ) {
//     const socketId = GlobalSocketService.socketList[receiveNodeId];
//     this.server.sockets.sockets.get(socketId).emit('sendData', { data: file });
//   }

//   @SubscribeMessage('send-message')
//   handleMessage(client: Socket, messagePayload: any) {
//     const receiveNodeId = messagePayload.receiveNodeId
//     const socketId = GlobalSocketService.socketList[receiveNodeId];
//     const sendNodeId = messagePayload.sendNodeId;
//     const message = messagePayload.message;

//     // if (!recipientSocketId) {
//     //   // Handle error: recipient is not connected
//     // }
//     console.log(socketId);
//     console.log(message);
//     this.server.sockets.sockets.get(socketId).emit('receive-message', {
//       sendNodeId,
//       receiveNodeId,
//       message,
//     });
//   }
// }
