import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  // Register new user
  async register(
    name: string,
    email: string,
    password: string,
    phone?: string,
    language?: string
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        language,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      language: user.language,
      avatarPicId: user.avatarPicId,
    };
  }

  // Login user and return token
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        language: user.language,
        avatarPicId: user.avatarPicId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  // Get user by id
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        language: true,
        avatarPicId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Update avatarPicId after registration
  async setAvatar(userId: string, avatarPicId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarPicId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        language: true,
        avatarPicId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }



async getUsersExcept(userId: string) {
  const users = await this.prisma.user.findMany({
    where: {
      NOT: { id: userId }
    },
    select: {
      name: true,
      avatarPicId: true,
    },
  });

  return users;
}


}
