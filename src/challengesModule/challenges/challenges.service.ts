import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common"
import { PrismaService } from "../../lib/prisma/prisma.service"
import { CreateChallengeDto } from "./dto/create-challenge.dto"
import { JoinChallengeDto } from "./dto/join-challenge.dto"
import { ChallengeStatus } from "@prisma/client"
import { randomBytes } from "crypto"
import { SendInviteDto } from "./dto/send-invite.dto"

@Injectable()
export class ChallengesService {
  constructor(private prisma: PrismaService) {}

  async createChallenge(dto: CreateChallengeDto) {
    try {
      const code = randomBytes(3).toString("hex").toUpperCase()
      return await this.prisma.challenge.create({
        data: {
          code,
          hostId: dto.hostId,
          status: ChallengeStatus.PENDING,
        },
      })
    } catch {
      throw new InternalServerErrorException("Failed to create challenge")
    }
  }

  async joinChallenge(code: string, dto: JoinChallengeDto) {
    try {
      const challenge = await this.prisma.challenge.findUnique({ where: { code } })
      if (!challenge) throw new NotFoundException("Challenge not found")
      if (challenge.playerId) throw new BadRequestException("This challenge already has a player")
      if (challenge.hostId === dto.userId) throw new BadRequestException("Host cannot join as player")
      if (challenge.status !== ChallengeStatus.PENDING) throw new BadRequestException("Challenge is not open to join")

      return await this.prisma.challenge.update({
        where: { code },
        data: { playerId: dto.userId, status: ChallengeStatus.READY },
      })
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err
      throw new InternalServerErrorException("Failed to join challenge")
    }
  }

  async startChallenge(id: number, userId: string) {
    try {
      const challenge = await this.prisma.challenge.findUnique({ where: { id } })
      if (!challenge) throw new NotFoundException("Challenge not found")
      if (challenge.hostId !== userId) throw new ForbiddenException("Only the host can start this challenge")
      if (challenge.status !== ChallengeStatus.READY) throw new BadRequestException("Challenge must be READY before starting")

      return await this.prisma.challenge.update({
        where: { id },
        data: { status: ChallengeStatus.ACTIVE },
      })
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException ||
        err instanceof BadRequestException
      ) throw err
      throw new InternalServerErrorException("Failed to start challenge")
    }
  }

  async sendInvitation(challengeId: number, dto: SendInviteDto) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } })
    if (!challenge) throw new NotFoundException("Challenge not found")
    if (challenge.playerId) throw new BadRequestException("Challenge already has a player")
    if (challenge.hostId === dto.playerId) throw new BadRequestException("Host cannot invite themselves")
    const player = await this.prisma.user.findUnique({ where: { id: dto.playerId } })
    if (!player) throw new NotFoundException("Player not found")

    return {
      message: `Invitation sent to player ${player.name}`,
      code: challenge.code,
    }
  }

  async sendMultipleInvites(challengeId: number, playerIds: string[]) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } })
    if (!challenge) throw new NotFoundException("Challenge not found")

    const invites: Promise<any>[] = []

    for (const playerId of playerIds) {
      if (playerId === challenge.hostId) continue
      const player = await this.prisma.user.findUnique({ where: { id: playerId } })
      if (!player) continue
      const existingInvite = await this.prisma.challengeInvitation.findFirst({ where: { challengeId, playerId } })
      if (existingInvite) continue
      invites.push(this.prisma.challengeInvitation.create({ data: { challengeId, playerId } }))
    }
    return Promise.all(invites)
  }

  async getPlayerInvitations(playerId: string) {
    return this.prisma.challengeInvitation.findMany({
      where: { playerId },
      include: { challenge: true },
    })
  }

  async respondToInvitation(invitationId: number, playerId: string, accept: boolean) {
    const invitation = await this.prisma.challengeInvitation.findUnique({ where: { id: invitationId } })
    if (!invitation) throw new NotFoundException("Invitation not found")
    if (invitation.playerId !== playerId) throw new ForbiddenException("Not your invitation")

    const status = accept ? "ACCEPTED" : "REJECTED"

    if (accept) {
      await this.prisma.challenge.update({ where: { id: invitation.challengeId }, data: { playerId } })
    }

    return this.prisma.challengeInvitation.update({ where: { id: invitationId }, data: { status } })
  }
}
