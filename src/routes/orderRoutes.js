import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { Roles } from '../utils/enums.js';

const r = Router();

// user
r.post('/', auth, requireRole(Roles.USER), orderController.create);
r.get('/mine', auth, requireRole(Roles.USER), orderController.listMine);
r.get('/:id', auth, requireRole(Roles.USER), orderController.detail);
r.post('/:id/reorder', auth, requireRole(Roles.USER), orderController.reorder);
r.get('/:id/track', auth, orderController.track);

// admin assign
r.post('/:id/assign', auth, requireRole(Roles.ADMIN), orderController.assign);

// staff status
r.put('/:id/status', auth, requireRole(Roles.STAFF), orderController.updateStatus);

export default r;