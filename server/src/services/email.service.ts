import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/**
 * Thin wrapper around Nodemailer. Works with any standard SMTP provider
 * (SendGrid, Postmark, Amazon SES, Mailgun, your university's SMTP relay,
 * ...) - just point the SMTP_* env vars at it. When SMTP isn't configured
 * (local development) it logs the message instead of throwing, so the rest
 * of the auth flow can still be exercised end to end.
 */
export class EmailService {
  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter | null {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return null;
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 587,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      });
    }
    return this.transporter;
  }

  static async sendOtpEmail(to: string, otp: string): Promise<void> {
    const subject = 'رمز التحقق الخاص بك - Compux';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#6d5ef5">Compux</h2>
        <p>رمز التحقق الخاص بك هو:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center">${otp}</p>
        <p style="color:#888;font-size:13px">صالح لمدة 5 دقائق. إذا لم تطلب هذا الرمز يمكنك تجاهل هذه الرسالة بأمان.</p>
      </div>`;

    await this.send(to, subject, html);
  }

  static async sendPasswordChangedNotice(to: string): Promise<void> {
    await this.send(
      to,
      'تم تغيير كلمة المرور - Compux',
      '<p>تم تغيير كلمة المرور لحسابك للتو. إذا لم تكن أنت من قام بذلك تواصل معنا فوراً.</p>'
    );
  }

  static async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const subject = 'إعادة تعيين كلمة المرور - Compux';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#6d5ef5">Compux</h2>
        <p>وصلنا طلب لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${resetUrl}" style="background:#6d5ef5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">إعادة تعيين كلمة المرور</a>
        </p>
        <p style="color:#888;font-size:13px">هذا الرابط صالح لمدة 30 دقيقة. إذا لم تطلب هذا فتجاهل الرسالة بأمان - لن يتغير شيء في حسابك.</p>
      </div>`;
    await this.send(to, subject, html);
  }

  private static async send(to: string, subject: string, html: string): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) {
      logger.warn({ to, subject }, '[EmailService] SMTP not configured - logging email instead of sending');
      return;
    }
    await transporter.sendMail({ from: env.SMTP_FROM ?? 'Compux <no-reply@compux.app>', to, subject, html });
  }
}
