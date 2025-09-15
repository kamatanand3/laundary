import { Router } from 'express';
import { addressController } from '../controllers/addressController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { Roles } from '../utils/enums.js';

const r = Router();
r.use(auth, requireRole(Roles.USER));

r.get('/', addressController.list);
r.post('/', addressController.create);
r.put('/:id', addressController.update);
r.delete('/:id', addressController.remove);

export default r;