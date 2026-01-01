import { Injectable, OnModuleInit } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class MailService implements OnModuleInit {
  private transporter
  private otpTemplate: string

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'mail.focusrhgames.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async onModuleInit() {
    const templatePath = path.join(process.cwd(), 'src', 'mail', 'templates', 'otp-template.html')
    this.otpTemplate = await fs.promises.readFile(templatePath, 'utf-8')
  }

  private getOtpHtml(name: string, otp: string) {
    let template = this.otpTemplate
    template = template.replace('{{name}}', name)
    otp.split('').forEach((d, index) => {
      template = template.replace(`{{otp${index + 1}}}`, d)
    })
    return template
  }

  async sendMail(to: string, subject: string, name: string, otp: string) {
    const html = this.getOtpHtml(name, otp)
    this.transporter.sendMail({
      from: '"Focus RH Games" <your-email@focusrhgames.com>',
      to,
      subject,
      html,
    }).catch(err => console.error('Email send error:', err))
  }
}
