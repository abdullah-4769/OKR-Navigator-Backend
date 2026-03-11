import { Injectable } from '@nestjs/common'
import { Socket } from 'socket.io'
import * as jwt from 'jsonwebtoken'

@Injectable()
export class WebsocketService {
  private invitations: Set<string> = new Set()
  private clients: Map<string, Socket> = new Map()

  registerClient(userId: string, client: Socket) {
    this.clients.set(userId, client)
  }

  getClientByUserId(userId: string): Socket | undefined {
    return this.clients.get(userId)
  }

  inviteTeam(teamToken: string) {
    this.invitations.add(teamToken)
    return `Team invitation sent with token: ${teamToken}`
  }

  isTokenValid(teamToken: string) {
    return this.invitations.has(teamToken)
  }

  removeToken(teamToken: string) {
    this.invitations.delete(teamToken)
  }

decodeToken(token: string): { teamId: number } | null {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set in environment')

  try {
    const decoded = jwt.verify(token, secret) as unknown
    if (typeof decoded === 'object' && decoded !== null && 'teamId' in decoded) {
      return { teamId: (decoded as any).teamId }
    }
    return null
  } catch {
    return null
  }
}
  async getUserById(userId: string): Promise<{ id: string; name: string } | null> {
    // replace this with your database call if needed
    return { id: userId, name: `User-${userId}` }
  }
}