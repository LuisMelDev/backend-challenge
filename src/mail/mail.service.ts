import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMailDto } from './dto/send-mail.dto';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendMail(sendMailDto: SendMailDto) {
    const { message, subject, to } = sendMailDto;
    return await this.mailerService.sendMail({
      from: this.configService.get('MAIL_COM'),
      to,
      subject,
      text: subject,
      html: message,
    });
  }
}
