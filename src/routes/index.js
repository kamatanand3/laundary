import { Router } from 'express';
import authRoutes from './authRoutes.js';
import addressRoutes from './addressRoutes.js';
import orderRoutes from './orderRoutes.js';
import staffRoutes from './staffRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/addresses', addressRoutes);
router.use('/orders', orderRoutes);
router.use('/staff', staffRoutes);
router.use('/admin', adminRoutes);

export default router;