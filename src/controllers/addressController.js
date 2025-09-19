import Joi from 'joi';
import { pool } from '../config/db.js';

const addrSchema = Joi.object({
  label: Joi.string().max(50).allow(''),
  line1: Joi.string().max(255).required(),
  line2: Joi.string().max(255).allow(''),
  city: Joi.string().max(100).allow(''),
  state: Joi.string().max(100).allow(''),
  pincode: Joi.string().max(20).allow(''),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  is_default: Joi.boolean().default(false)
});

export const addressController = {
  async list(req, res, next){
    try {
      const [rows] = await pool.query(`SELECT * FROM addresses WHERE user_id=:uid ORDER BY created_at DESC`, { uid: req.user.id });
      res.json(rows);
    } catch (e){ next(e); }
  },
  async create(req, res, next){
    try {
      const { error, value } = addrSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.message });
      const [r] = await pool.query(
        `INSERT INTO addresses (address_id, user_id, label, line1, line2, city, state, pincode, lat, lng, is_default)
         VALUES (UUID(), :uid, :label, :line1, :line2, :city, :state, :pincode, :lat, :lng, :is_default)`,
        { uid: req.user.id, ...value }
      );
      const [rows] = await pool.query(`SELECT * FROM addresses WHERE user_id=:uid ORDER BY created_at DESC LIMIT 1`, { uid: req.user.id });
      res.status(201).json(rows[0]);
    } catch (e){ next(e); }
  },
  async update(req, res, next){
    try {
      const { error, value } = addrSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.message });
      await pool.query(
        `UPDATE addresses SET label=:label, line1=:line1, line2=:line2, city=:city, state=:state, pincode=:pincode, lat=:lat, lng=:lng, is_default=:is_default
         WHERE address_id=:aid AND user_id=:uid`, { aid: req.params.id, uid: req.user.id, ...value }
      );
      const [rows] = await pool.query(`SELECT * FROM addresses WHERE address_id=:aid AND user_id=:uid`, { aid: req.params.id, uid: req.user.id });
      res.json(rows[0]);
    } catch (e){ next(e); }
  },
  async remove(req, res, next){
    try {
      await pool.query(`DELETE FROM addresses WHERE address_id=:aid AND user_id=:uid`, { aid: req.params.id, uid: req.user.id });
      res.json({ ok: true });
    } catch (e){ next(e); }
  }
};