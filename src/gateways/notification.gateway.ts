// src/gateways/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  handleConnection(socket: Socket) {
    console.log('Socket connected:', socket.id);

    socket.on('register', (userId: string) => {
      this.userSockets.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });
  }

  handleDisconnect(socket: Socket) {
    for (const [userId, id] of this.userSockets.entries()) {
      if (id === socket.id) this.userSockets.delete(userId);
    }
  }

  sendNotification(userId: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', data);
    }
  }
}
