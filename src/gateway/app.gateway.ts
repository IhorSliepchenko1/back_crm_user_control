import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppGatewayDto } from './dto/app.gateway.dto';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly prismaService: PrismaService) {}

  @WebSocketServer() server: Server;

  private userSockets = new Map<string, Set<string>>();
  private disconnectTimers = new Map<string, NodeJS.Timeout>();

  handleConnection(socket: Socket) {
    socket.on('register', async (userId: string) => {
      const timeout = this.disconnectTimers.get(userId);

      if (timeout) {
        clearTimeout(timeout);
        this.disconnectTimers.delete(userId);
      }

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      if (this.userSockets.get(userId)!.size === 1) {
        await this.prismaService.user.update({
          where: { id: userId },
          data: { isOnline: true },
        });
      }
    });
  }

  async handleDisconnect(socket: Socket) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);

        if (sockets.size === 0) {
          const timeout = setTimeout(async () => {
            if (!this.userSockets.get(userId)?.size) {
              this.userSockets.delete(userId);
              this.disconnectTimers.delete(userId);

              await this.prismaService.user.update({
                where: { id: userId },
                data: { isOnline: false },
              });
            }
          }, 5000);
          this.disconnectTimers.set(userId, timeout);
        }
      }
    }
  }

  sendNotification(userId: string, dto: AppGatewayDto) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      for (const socketId of sockets) {
        this.server.to(socketId).emit('notification', dto);
      }
    }
  }
}
