import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { WebsocketService } from './websocket.service'
import { TeamService } from '../team/team.service'

@WebSocketGateway({ cors: true })
export class WebsocketGateway {
  @WebSocketServer()
  server: Server

  constructor(
    private wsService: WebsocketService,
    private teamService: TeamService,
  ) {
    this.teamService.onUserJoinedTeam((teamId: number, userId: string) => {
      this.addUserToRoom(teamId, userId)
    })
  }

  addUserToRoom(teamId: number, userId: string) {
    const client = this.wsService.getClientByUserId(userId)
    if (client) {
      client.join(`team-${teamId}`)
    }
  }

  @SubscribeMessage('invite')
  handleInvite(@MessageBody() data: { teamToken: string }) {
    return this.wsService.inviteTeam(data.teamToken)
  }

  @SubscribeMessage('joinTeam')
  async handleJoinTeam(
    @MessageBody() data: { teamToken: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const valid = this.wsService.isTokenValid(data.teamToken)
    if (!valid) return { error: 'Invalid or expired team token' }

    const member = await this.teamService.joinTeam(
      data.teamToken,
      data.userId,
    )

    client.join(`team-${member.teamId}`)
    client.data.userId = data.userId

    this.wsService.registerClient(data.userId, client)

    return { success: true, member }
  }

@SubscribeMessage('message')
async handleMessage(
  @MessageBody() data: { teamToken: string; message: string },
  @ConnectedSocket() client: Socket,
) {
  const userId: string = client.data.userId || 'Unknown'
  const decoded = this.wsService.decodeToken(data.teamToken)
  if (!decoded?.teamId) return { error: 'Invalid token' }

  const user = await this.wsService.getUserById(userId)
  if (!user) return { error: 'User not found' }

  this.server
    .to(`team-${decoded.teamId}`)
    .emit('message', {
      userId: user.id,
      name: user.name,
      message: data.message,
    })
}
}
