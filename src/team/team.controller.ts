// team.controller.ts
import { Controller, Post, Body, Get,Patch, Param, ParseIntPipe } from '@nestjs/common'
import { TeamService } from './team.service'

@Controller('team')
export class TeamController {
  constructor(private teamService: TeamService) {}
teamavatorid
  @Post('create')
  async createTeam(@Body() body: { title: string, mission: string, hostId: string ,teamavatorid: string}) {
    return this.teamService.createTeam(body.title, body.mission, body.hostId, body.teamavatorid)
  }

  @Post('join')
  async joinTeam(@Body() body: { token: string, userId: string }) {
    return this.teamService.joinTeam(body.token, body.userId)
  }

  @Get(':teamId/members')
  async getTeamMembers(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamService.getTeamMembers(teamId)
  }

  @Post(':teamId/add-member')
  async addMember(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() body: { hostId: string, userId: string, role?: string }
  ) {
    return this.teamService.addMember(teamId, body.hostId, body.userId, body.role)
  }

@Post(':teamId/auto-add-users')
async autoAddUsers(@Param('teamId', ParseIntPipe) teamId: number) {
  return this.teamService.autoAddUsersToTeam(teamId)
}


  @Post('end-session')
  async endSession(@Body('teamId') teamId: number, @Body('hostId') hostId: string) {
    return this.teamService.endTeamSession(teamId, hostId)
  }

  @Post(':teamId/update-role')
  async updateMemberRole(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() body: { hostId: string, userId: string, role: string }
  ) {
    return this.teamService.updateMemberRole(teamId, body.hostId, body.userId, body.role)
  }
  @Patch(':teamId')
  async updateTeam(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() body: { title?: string; mission?: string; teamavatorid?: string }
  ) {
    return this.teamService.updateTeam(teamId, body)
  }



    @Get(':teamId/details')
  async getTeamDetails(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamService.getTeamDetails(teamId)
  }


  @Get(':teamId/members/:userId')
async getUsersInTeam(
  @Param('teamId', ParseIntPipe) teamId: number,
  @Param('userId') userId: string
) {
  return this.teamService.getUsersInTeam(teamId, userId)
}



 @Get(':teamId/user/:userId')
  async getUserInTeam(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('userId') userId: string,
  ) {
    return this.teamService.getUserInTeamDetails(teamId, userId)
  }

}
