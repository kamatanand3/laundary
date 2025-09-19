import Joi from 'joi';
import { OtpService } from '../services/OtpService.js';
import { AuthService } from '../services/AuthService.js';
import { Roles } from '../utils/enums.js';

const emailSchema = Joi.object({ email: Joi.string().email().required() });

export const authController = {
  // POST /api/auth/otp/request  { role: 'user'|'staff', email }
  async requestOtp(req, res, next){
    try {
      const role = (req.body.role||'user').toLowerCase();
      const { value, error } = emailSchema.validate({ email: req.body.email });
      if (error) return res.status(400).json({ error: error.message });
      const { email } = value;
      const ip = req.ip;
      if (![Roles.USER, Roles.STAFF].includes(role)) return res.status(400).json({ error: 'Invalid role' });
      const out = await OtpService.requestEmailOtp(role, email, ip);
      res.json({ ok: true, ...out });
    } catch (e){ next(e); }
  },

  // POST /api/auth/otp/verify  { role, email, code }
  async verifyOtp(req, res, next){
    try {
      const role = (req.body.role||'user').toLowerCase();
      const { value, error } = emailSchema.keys({ code: Joi.string().length(Number(process.env.OTP_DIGITS||6)).required() }).validate(req.body);
      console.log(value, error);
      if (error) return res.status(400).json({ error: error.message });
      const { email, code } = value;

      await OtpService.verifyEmailOtp(role, email, code);

      let subject; // { id, role }
      if (role === Roles.USER){
        const u = await AuthService.ensureUserByEmail(email);
        subject = { id: u.user_id, role: Roles.USER };
      } else {
        const s = await AuthService.ensureStaffByEmail(email);
        subject = { id: s.staff_id, role: Roles.STAFF };
      }

      const tokens = AuthService.issueTokens(subject);
      res.json({ ok: true, role, ...tokens });
    } catch (e){ next(e); }
  },

  // POST /api/admin/login { email, password }
  async adminLogin(req, res, next){
    try {
      const schema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().min(6).required() });
      const { error, value } = schema.validate(req.body);
      if (error) return res.status(400).json({ error: error.message });
      const tokens = await AuthService.adminLogin(value.email, value.password);
      res.json({ ok: true, role: 'admin', ...tokens });
    } catch (e){ next(e); }
  },

  // POST /api/auth/logout
  async logout(req, res, next){
    try {
      await AuthService.logout(req.user.id);
      res.json({ ok: true });
    } catch (e){ next(e); }
  }
};