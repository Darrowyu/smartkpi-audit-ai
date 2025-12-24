import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isEnabled: boolean;

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    const mailHost = this.configService.get('MAIL_HOST');
    this.isEnabled = !!mailHost;
    this.logger.log(`Mail config: HOST=${mailHost}, Enabled=${this.isEnabled}`); // 调试日志
  }

  /** 发送邮件 */
  async send(options: SendMailOptions): Promise<boolean> {
    if (!this.isEnabled) {
      this.logger.warn(
        `[DEV] Mail disabled. Would send to: ${options.to}, Subject: ${options.subject}`,
      );
      return false;
    }

    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      this.logger.log(`Mail sent to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send mail to ${options.to}:`, error);
      return false;
    }
  }

  /** 发送密码重置邮件 */
  async sendPasswordReset(
    email: string,
    resetUrl: string,
    username: string,
  ): Promise<boolean> {
    const subject = 'SmartKPI - 密码重置请求 / Password Reset Request';
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333;">密码重置 / Password Reset</h2>
    <p>您好 ${username},</p>
    <p>我们收到了您的密码重置请求。请点击下方按钮重置密码：</p>
    <p>We received a password reset request. Click the button below to reset:</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #1E4B8E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            重置密码 / Reset Password
        </a>
    </div>
    <p style="color: #666; font-size: 14px;">此链接24小时内有效。如非本人操作，请忽略此邮件。</p>
    <p style="color: #666; font-size: 14px;">This link is valid for 24 hours. If you didn't request this, please ignore.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">SmartKPI Audit AI System</p>
</body>
</html>`;
    return this.send({ to: email, subject, html });
  }

  /** 发送低绩效预警邮件 */
  async sendLowPerformanceAlert(
    email: string,
    employeeName: string,
    score: number,
    periodName: string,
  ): Promise<boolean> {
    const subject = `SmartKPI - 绩效预警 / Performance Alert: ${employeeName}`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #DC2626;">⚠️ 低绩效预警 / Low Performance Alert</h2>
    <p>考核周期 / Period: <strong>${periodName}</strong></p>
    <p>员工 / Employee: <strong>${employeeName}</strong></p>
    <p>绩效得分 / Score: <strong style="color: #DC2626;">${score}</strong></p>
    <p style="color: #666;">该员工绩效得分低于预警阈值，请及时关注。</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">SmartKPI Audit AI System</p>
</body>
</html>`;
    return this.send({ to: email, subject, html });
  }
}
