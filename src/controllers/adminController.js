import Joi from 'joi';
import { AdminService } from '../services/AdminService.js';

export const adminController = {
  async dashboard(_req, res, next){
    try {
      const orders = await AdminService.listOrders();
      const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status==='pending').length,
        ongoing: orders.filter(o => ['picked','ironing','out-for-delivery'].includes(o.status)).length,
        completed: orders.filter(o => o.status==='delivered').length
      };
      res.json({ stats });
    } catch (e){ next(e); }
  },
  async listUsers(_req, res, next){
    try { res.json(await AdminService.listUsers()); } catch (e){ next(e); }
  },
  async upsertStaff(req, res, next){
    try {
      const schema = Joi.object({ staff_id: Joi.string().allow(null,''), name: Joi.string().allow(''), email: Joi.string().email().allow(null,''), phone_number: Joi.string().allow(null,''), status: Joi.string().valid('active','inactive','on-duty').default('inactive') });
      const { error, value } = schema.validate(req.body);
      if (error) return res.status(400).json({ error: error.message });
      const staff = await AdminService.upsertStaff(value);
      res.json(staff);
    } catch (e){ next(e); }
  },
  // create new admin user code start
  async createAdmin(req, res, next) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }

      const admin = await AdminService.createAdmin({ name, email, password });

      res.status(201).json({
        message: 'Admin created successfully',
        admin
      });
    } catch (err) {
      next(err);
    }
  }
  
  // create new admin user code start
};