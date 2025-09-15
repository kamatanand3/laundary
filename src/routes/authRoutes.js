import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { otpLimiter } from '../middleware/rateLimiter.js';

const r = Router();

r.post('/otp/request', otpLimiter, authController.requestOtp);
r.post('/otp/verify', authController.verifyOtp);

// admin password login
r.post('/admin/login', authController.adminLogin);
r.post('/logout', authController.logout);

export default r;