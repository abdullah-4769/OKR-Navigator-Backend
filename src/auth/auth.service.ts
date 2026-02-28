import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
        private mailService: MailService
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

  try {
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
  } catch (e) {
    if (e.code === 'P2002' && e.meta?.target.includes('email')) {
      throw new Error('already exist');
    }
    throw e;
  }
}

  // Login user and return token
async login(email: string, password: string) {
  const user = await this.prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  if (user.isBlocked) {
    throw new UnauthorizedException('Your account has been blocked. Please contact support');
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      lastActiveAt: new Date()
    }
  });

  const token = this.jwtService.sign({
    sub: user.id,
    email: user.email,
    role: user.role
  });

  return {
    access_token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      language: user.language,
      avatarPicId: user.avatarPicId,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastActiveAt: new Date()
    }
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
      id:true,
      name: true,
      avatarPicId: true,
    },
  });

  return users;
}

async updateUser(
  userId: string,
  data: { name?: string; email?: string; phone?: string; avatarPicId?: string }
) {
  const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new Error('User not found');
  }

  const updatedUser = await this.prisma.user.update({
    where: { id: userId },
    data,
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

  return updatedUser;
}


async sendOtp(email: string) {
  const user = await this.prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('User not found')

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiry = new Date(Date.now() + 1 * 60 * 1000)

  void (async () => {
    await this.prisma.user.update({
      where: { email },
      data: { otp, otpExpiry: expiry },
    })

    this.mailService.sendMail(email, 'Your OTP Code', user.name, otp)
      .catch(err => console.error('Error sending OTP email:', err))
  })()

  return { message: 'OTP sent successfully' }
}





  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');
    if (!user.otp || !user.otpExpiry) throw new Error('OTP not generated');

    if (user.otp !== otp) throw new Error('Invalid OTP');
    if (user.otpExpiry < new Date()) throw new Error('OTP expired');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword, otp: null, otpExpiry: null },
    });

    return { message: 'Password reset successfully' };
  }

}
