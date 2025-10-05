import { Injectable, BadRequestException, NotFoundException,ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../lib/prisma/prisma.service'
import { TeamMember } from '@prisma/client'
const { signTeamToken, verifyTeamToken } = require('../lib/jwt/jwt')

type UserJoinedCallback = (teamId: number, userId: string) => void

@Injectable()
export class TeamService {
  private userJoinedCallbacks: UserJoinedCallback[] = []
  private readonly MAX_MEMBERS = 5

  constructor(private prisma: PrismaService) {}

  onUserJoinedTeam(callback: UserJoinedCallback) {
    this.userJoinedCallbacks.push(callback)
  }

  private notifyUserJoined(teamId: number, userId: string) {
    this.userJoinedCallbacks.forEach(cb => cb(teamId, userId))
  }

  async createTeam(title: string, mission: string, hostId: string, teamavatorid?: string) {
    const team = await this.prisma.team.create({ data: { title, mission, hostId, teamavatorid } })
    await this.prisma.teamMember.create({ data: { teamId: team.id, userId: hostId, role: 'HOST' } })
    this.notifyUserJoined(team.id, hostId)
    const token = signTeamToken(team.id)
    return { team, token }
  }

  async joinTeam(token: string, userId: string) {
    const decoded = verifyTeamToken(token)
    const teamId = decoded.teamId
    const currentMembers = await this.prisma.teamMember.count({ where: { teamId } })
    if (currentMembers >= this.MAX_MEMBERS) throw new BadRequestException(`Team member limit reached. Maximum allowed is ${this.MAX_MEMBERS}`)
    const existing = await this.prisma.teamMember.findFirst({ where: { teamId, userId } })
    if (existing) throw new BadRequestException('User is already a member of this team')
    const member = await this.prisma.teamMember.create({ data: { teamId, userId, role: 'PLAYER' } })
    this.notifyUserJoined(teamId, userId)
    return member
  }

async getTeamMembers(teamId: number) {
  const members = await this.prisma.teamMember.findMany({
    where: { teamId },
    select: { id: true, teamId: true, userId: true, role: true, joinedAt: true },
  })

  const userIds = members.map(m => m.userId)
  const users = await this.prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatarPicId: true },
  })

  return members.map(member => ({
    ...member,
    user: users.find(u => u.id === member.userId) || null,
  }))
}


  async addMember(teamId: number, hostId: string, userId: string, role: string = 'PLAYER') {
    const isHost = await this.prisma.teamMember.findFirst({ where: { teamId, userId: hostId, role: 'HOST' } })
    if (!isHost) throw new ForbiddenException('Only the Host can add members')
    const currentMembers = await this.prisma.teamMember.count({ where: { teamId } })
    if (currentMembers >= this.MAX_MEMBERS) throw new BadRequestException(`Team member limit reached. Maximum allowed is ${this.MAX_MEMBERS}`)
    const existing = await this.prisma.teamMember.findFirst({ where: { teamId, userId } })
    if (existing) throw new BadRequestException('User is already a member of this team')
    const member = await this.prisma.teamMember.create({ data: { teamId, userId, role } })
    this.notifyUserJoined(teamId, userId)
    return member
  }

async autoAddUsersToTeam(teamId: number) {
  const host = await this.prisma.teamMember.findFirst({ where: { teamId, role: 'HOST' } })
  if (!host) throw new ForbiddenException('Team has no host or host not found')

  const currentMembers = await this.prisma.teamMember.findMany({
    where: { teamId, NOT: { role: 'HOST' } },
    select: { userId: true },
  })

  const currentCount = currentMembers.length
  const availableSlots = this.MAX_MEMBERS - 1 - currentCount
  if (availableSlots <= 0) return []

  const usersToAdd = await this.prisma.userAutoJoin.findMany({
    where: {
      allowed: true,
      NOT: { userId: { in: currentMembers.map(m => m.userId).concat([host.userId]) } }
    },
    take: availableSlots,
    select: { userId: true },
  })

  if (!usersToAdd.length) return [] // no allowed users to add

  const addedMembers: TeamMember[] = []
  for (const user of usersToAdd) {
    const member = await this.prisma.teamMember.create({
      data: { teamId, userId: user.userId, role: 'PLAYER' },
    })
    this.notifyUserJoined(teamId, user.userId)
    addedMembers.push(member)
  }

  return addedMembers
}



  async endTeamSession(teamId: number, hostId: string) {
    const isHost = await this.prisma.teamMember.findFirst({ where: { teamId, userId: hostId, role: 'HOST' } })
    if (!isHost) throw new ForbiddenException('Only Host can end the session')
    await this.prisma.session.deleteMany({ where: { teamId } })
    return { message: 'Team session ended successfully' }
  }


 async updateMemberRole(teamId: number, hostId: string, userId: string, role: string) {
    const host = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: hostId, role: 'HOST' },
    })
    if (!host) throw new ForbiddenException('Only Host can update member roles')

    const member = await this.prisma.teamMember.findFirst({
      where: { teamId, userId },
    })
    if (!member) throw new BadRequestException('User is not a member of this team')

    if (member.role === 'HOST') throw new BadRequestException('Cannot change the role of the Host')

    const updated = await this.prisma.teamMember.update({
      where: { id: member.id },
      data: { role },
    })

    return updated
  }

async updateTeam(teamId: number, data: { title?: string; mission?: string; teamavatorid?: string }) {
  const team = await this.prisma.team.findUnique({ where: { id: teamId } })
  if (!team) throw new NotFoundException('Team not found')

  const updated = await this.prisma.team.update({
    where: { id: teamId },
    data: {
      title: data.title ?? team.title,
      mission: data.mission ?? team.mission,
      teamavatorid: data.teamavatorid ?? team.teamavatorid,
    },
  })

  return updated
}

async getTeamDetails(teamId: number) {
  const team = await this.prisma.team.findUnique({ where: { id: teamId } })
  if (!team) throw new NotFoundException('Team not found')

  const token = signTeamToken(team.id)

  const members = await this.prisma.teamMember.findMany({
    where: { teamId },
    select: { id: true, teamId: true, userId: true, role: true, joinedAt: true },
    orderBy: { role: 'desc' } // HOST first
  })

  const userIds = members.map(m => m.userId)
  const users = await this.prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatarPicId: true },
  })

  const membersWithUser = members.map(member => ({
    ...member,
    user: users.find(u => u.id === member.userId) || null,
  }))

  return {
    id: team.id,
    title: team.title,
    mission: team.mission,
    teamavatorid: team.teamavatorid,
    token,
    totalMembers: members.length,
    members: membersWithUser,
  }
}

async getUsersInTeam(teamId: number, userId: string) {
  const members = await this.prisma.teamMember.findMany({
    where: { teamId, NOT: { userId } },
    select: {
      id: true,
      teamId: true,
      userId: true,
      role: true,
      joinedAt: true,
    },
  })

  if (!members.length) throw new NotFoundException('No other members found in this team')

  const users = await this.prisma.user.findMany({
    where: { id: { in: members.map(m => m.userId) } },
    select: { id: true, name: true, avatarPicId: true },
  })

  return members.map(m => ({
    ...m,
    user: users.find(u => u.id === m.userId) || null,
  }))
}


 async getUserInTeamDetails(teamId: number, userId: string) {
    const member = await this.prisma.teamMember.findFirst({
      where: { teamId, userId },
      select: {
        id: true,
        teamId: true,
        userId: true,
        role: true,
        joinedAt: true,
      },
    })

    if (!member) throw new NotFoundException('User not found in this team')

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatarPicId: true },
    })

    return { ...member, user }
  }



}
