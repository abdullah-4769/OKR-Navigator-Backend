import { Controller, Post, Body, Param, Get, Patch } from "@nestjs/common"
import { ChallengesService } from "./challenges.service"
import { CreateChallengeDto } from "./dto/create-challenge.dto"
import { JoinChallengeDto } from "./dto/join-challenge.dto"
import { SendInviteDto } from "./dto/send-invite.dto"

@Controller("challenges")
export class ChallengesController {
  constructor(private readonly service: ChallengesService) {}

  @Post()
  create(@Body() dto: CreateChallengeDto) {
    return this.service.createChallenge(dto)
  }

  @Post("join/:code")
  join(@Param("code") code: string, @Body() dto: JoinChallengeDto) {
    return this.service.joinChallenge(code, dto)
  }

  @Patch(":id/start/:userId")
  start(@Param("id") id: string, @Param("userId") userId: string) {
    return this.service.startChallenge(Number(id), userId)
  }

  @Post(":id/send-invite")
  sendInvite(@Param("id") challengeId: string, @Body() dto: SendInviteDto) {
    return this.service.sendInvitation(Number(challengeId), dto)
  }

  @Post(":id/send-multiple-invites")
  sendMultipleInvites(@Param("id") challengeId: string, @Body() body: { playerIds: string[] }) {
    return this.service.sendMultipleInvites(Number(challengeId), body.playerIds)
  }

  @Get("invitations/:playerId")
  getPlayerInvites(@Param("playerId") playerId: string) {
    return this.service.getPlayerInvitations(playerId)
  }

  @Patch("invitation/:invitationId/respond")
  respondToInvite(
    @Param("invitationId") invitationId: string,
    @Body() body: { playerId: string; accept: boolean }
  ) {
    return this.service.respondToInvitation(Number(invitationId), body.playerId, body.accept)
  }
}
