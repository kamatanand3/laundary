import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { sendOtpEmail } from '../config/mailer.js';
import { hash as bcryptHash, compare as bcryptCompare } from '../utils/password.js';
import dayjs from 'dayjs';

function randomDigits(n) {
  let s = '';
  while (s.length < n) s += Math.floor(Math.random() * 10);
  return s.slice(0, n);
}

export const OtpService = {
  /**
   * subjectType: 'user' | 'staff'  (matches enum otp_codes_subject_type)
   */
  async requestEmailOtp(subjectType, email, ip) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) throw Object.assign(new Error('Email required'), { status: 400 });

    // Rate limit: last 1 hour for this email
    const since = dayjs().subtract(1, 'hour').toDate();
    const recentCount = await prisma.otp_codes.count({
      where: { email: normalized, created_at: { gte: since } },
    });
    if (recentCount >= Number(env.otp.reqPerHour)) {
      throw Object.assign(new Error('OTP request limit reached'), { status: 429 });
    }

    const code = randomDigits(Number(env.otp.digits));
    const codeHash = await bcryptHash(code);
    const expiresAt = dayjs().add(Number(env.otp.ttlMinutes), 'minute').toDate();

    await prisma.otp_codes.create({
      data: {
        subject_type: subjectType,   // enum: 'user' | 'staff'
        email: normalized,
        code_hash: codeHash,
        expires_at: expiresAt,
        attempts: 0,
        sent_count: 1,
        ip: ip ?? null,
      },
    });

    await sendOtpEmail(normalized, code);
    return { sent: true, expiresAt };
  },

  async verifyEmailOtp(subjectType, email, code) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) throw Object.assign(new Error('Email required'), { status: 400 });

    // Latest unconsumed OTP
    const rec = await prisma.otp_codes.findFirst({
      where: { email: normalized, subject_type: subjectType, consumed_at: null },
      orderBy: { id: 'desc' },
    });

    if (!rec) {
      throw Object.assign(new Error('No active OTP. Request a new one.'), { status: 400 });
    }

    if (dayjs().isAfter(dayjs(rec.expires_at))) {
      throw Object.assign(new Error('OTP expired'), { status: 400 });
    }

    const maxAttempts = Number(env.otp.maxAttempts ?? 5);
    const attempts = rec.attempts ?? 0;
    if (attempts >= maxAttempts) {
      throw Object.assign(new Error('Too many attempts. Request a new OTP.'), { status: 429 });
    }

    const ok = await bcryptCompare(String(code || ''), rec.code_hash);
    if (!ok) {
      await prisma.otp_codes.update({
        where: { id: rec.id },
        data: { attempts: (attempts + 1) },
      });
      throw Object.assign(new Error('Invalid OTP'), { status: 400 });
    }

    await prisma.otp_codes.update({
      where: { id: rec.id },
      data: { consumed_at: new Date() },
    });

    return { verified: true };
  },
};
