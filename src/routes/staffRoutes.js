import { Router } from 'express';
import { staffController } from '../controllers/staffController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { Roles } from '../utils/enums.js';

const r = Router();
r.use(auth, requireRole(Roles.STAFF));

r.get('/me', staffController.me);
r.get('/orders/assigned', staffController.assignedOrders);

export default r;