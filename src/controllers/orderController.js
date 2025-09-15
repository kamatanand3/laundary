import Joi from 'joi';
import { OrderService } from '../services/OrderService.js';
import { pool } from '../config/db.js';
import { OrderStatus } from '../utils/enums.js';

const createSchema = Joi.object({
  pickup_address_id: Joi.string().required(),
  delivery_address_id: Joi.string().required(),
  items: Joi.array().items(Joi.object({ type: Joi.string().required(), qty: Joi.number().integer().min(1).required(), price: Joi.number().min(0).required() })).min(1).required(),
  pickup_time: Joi.string().required(),
  payment_option: Joi.string().valid('cod','online').default('cod'),
  price_total: Joi.number().min(0).required()
});

export const orderController = {
  async create(req, res, next){
    try {
      const { error, value } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.message });
      const order = await OrderService.createOrder(req.user.id, value);
      res.status(201).json(order);
    } catch (e){ next(e); }
  },
  async detail(req, res, next){
    try {
      const order = await OrderService.getOrder(req.user.id, req.params.id);
      if (!order) return res.status(404).json({ error: 'Not found' });
      res.json(order);
    } catch (e){ next(e); }
  },
  async listMine(_req, res, next){
    try {
      const orders = await OrderService.listUserOrders(res.req.user.id);
      res.json(orders);
    } catch (e){ next(e); }
  },
  async track(req, res, next){
    try {
      const events = await OrderService.track(req.params.id);
      res.json(events);
    } catch (e){ next(e); }
  },
  async reorder(req, res, next){
    try {
      const [rows] = await pool.query(`SELECT * FROM orders WHERE order_id=:id AND user_id=:uid`, { id: req.params.id, uid: req.user.id });
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      const prev = rows[0];
      const order = await OrderService.createOrder(req.user.id, {
        pickup_address_id: prev.pickup_address_id,
        delivery_address_id: prev.delivery_address_id,
        items: JSON.parse(prev.items),
        pickup_time: new Date().toISOString().slice(0,19).replace('T',' '),
        payment_option: prev.payment_option,
        price_total: prev.price_total
      });
      res.status(201).json(order);
    } catch (e){ next(e); }
  },
  // ADMIN: assign
  async assign(req, res, next){
    try {
      const { staff_id } = req.body;
      await OrderService.assign(req.params.id, staff_id);
      res.json({ ok: true });
    } catch (e){ next(e); }
  },
  // STAFF: update status
  async updateStatus(req, res, next){
    try {
      const { status } = req.body;
      if (!Object.values(OrderStatus).includes(status)) return res.status(400).json({ error: 'Invalid status' });
      await OrderService.setStatus(req.params.id, status, req.user.id);
      res.json({ ok: true });
    } catch (e){ next(e); }
  }
};