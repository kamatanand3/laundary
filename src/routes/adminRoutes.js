import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { Roles } from '../utils/enums.js';

const r = Router();
r.use(auth, requireRole(Roles.ADMIN));

r.get('/dashboard', adminController.dashboard);
r.get('/users', adminController.listUsers);
r.post('/staff', adminController.upsertStaff);

// Admin creation endpoint
r.post('/create-admin', adminController.createAdmin);

export default r;