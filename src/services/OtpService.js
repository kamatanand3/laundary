import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { sendOtpEmail } from '../config/mailer.js';
import { hash as bcryptHash, compare as bcryptCompare } from '../utils/password.js';
import dayjs from 'dayjs';

function randomDigits(n){
  let s = '';
  while (s.length < n) s += Math.floor(Math.random()*10);
  return s.slice(0, n);
}

export const OtpService = {
  async requestEmailOtp(subjectType, email, ip){
    // rate limit by DB counts as an extra safety
    const [rows] = await pool.query(
      `SELECT COUNT(*) cnt FROM otp_codes WHERE email=:email AND created_at > NOW() - INTERVAL 1 HOUR`,
      { email }
    );
    if (rows[0].cnt >= env.otp.reqPerHour) throw Object.assign(new Error('OTP request limit reached'), { status: 429 });

    const code = randomDigits(env.otp.digits);
    const codeHash = await bcryptHash(code);
    const expiresAt = dayjs().add(env.otp.ttlMinutes, 'minute').format('YYYY-MM-DD HH:mm:ss');

    await pool.query(
      `INSERT INTO otp_codes (subject_type, email, code_hash, expires_at, attempts, sent_count, ip)
       VALUES (:subject_type, :email, :code_hash, :expires_at, 0, 1, :ip)`,
      { subject_type: subjectType, email, code_hash: codeHash, expires_at: expiresAt, ip }
    );

    await sendOtpEmail(email, code);
    return { sent: true, expiresAt };
  },

  async verifyEmailOtp(subjectType, email, code){
    const [rows] = await pool.query(
      `SELECT * FROM otp_codes
       WHERE email=:email AND subject_type=:subject_type AND consumed_at IS NULL
       ORDER BY id DESC LIMIT 1`,
      { email, subject_type: subjectType }
    );
    const rec = rows[0];
    if (!rec) throw Object.assign(new Error('No active OTP. Request a new one.'), { status: 400 });

    if (dayjs().isAfter(dayjs(rec.expires_at)))
      throw Object.assign(new Error('OTP expired'), { status: 400 });

    if (rec.attempts >= 5)
      throw Object.assign(new Error('Too many attempts. Request a new OTP.'), { status: 429 });

    const ok = await bcryptCompare(code, rec.code_hash);
    if (!ok){
      await pool.query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id=:id`, { id: rec.id });
      throw Object.assign(new Error('Invalid OTP'), { status: 400 });
    }

    await pool.query(`UPDATE otp_codes SET consumed_at=NOW() WHERE id=:id`, { id: rec.id });
    return { verified: true };
  }
};