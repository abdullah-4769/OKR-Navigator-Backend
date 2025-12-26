import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class MailService {
  private transporter

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

  private getOtpTemplate(name: string, otp: string) {
    const templatePath = path.join(__dirname, 'templates', 'otp-template.html')
    let template = fs.readFileSync(templatePath, 'utf-8')
    const otpDigits = otp.split('').map(d => `<div class="otp-digit">${d}</div>`).join('')
    template = template.replace('{{name}}', name).replace('{{otpDigits}}', otpDigits)
    return template
  }

  async sendMail(to: string, subject: string, name: string, otp: string) {
    const html = this.getOtpTemplate(name, otp)
    const info = await this.transporter.sendMail({
      from: '"Focus RH Games" <your-email@focusrhgames.com>',
      to,
      subject,
      html,
    })
    return info
  }
}
