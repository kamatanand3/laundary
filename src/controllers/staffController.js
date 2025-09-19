import { pool } from '../config/db.js';

export const staffController = {
  async me(req, res, next){
    try {
      const [rows] = await pool.query(`SELECT * FROM delivery_staff WHERE staff_id=:id`, { id: req.user.id });
      res.json(rows[0] || {});
    } catch (e){ next(e); }
  },
  async assignedOrders(req, res, next){
    try {
      const [rows] = await pool.query(`SELECT * FROM orders WHERE staff_id=:sid ORDER BY created_at DESC`, { sid: req.user.id });
      res.json(rows);
    } catch (e){ next(e); }
  }
};