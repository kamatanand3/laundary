import nodemailer from 'nodemailer';
import { env } from './env.js';

export const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: env.mail.secure,
  auth: env.mail.auth,
});

export async function sendOtpEmail(to, code) {
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto;max-width:520px;margin:auto">
      <h2>Login OTP</h2>
      <p>Your OTP is <strong style="font-size:20px">${code}</strong>.</p>
      <p>This code will expire in ${process.env.OTP_TTL_MINUTES || 5} minutes. Do not share it with anyone.</p>
      <p>— Laundry App</p>
    </div>`;
  return transporter.sendMail({ from: env.mail.from, to, subject: 'Your Login OTP', html });
}