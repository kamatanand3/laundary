import { pool } from '../config/db.js';
import { OrderStatus } from '../utils/enums.js';

export const OrderService = {
  async createOrder(userId, payload){
    const {
      pickup_address_id, delivery_address_id, items, pickup_time, payment_option, price_total
    } = payload;

    const [r] = await pool.query(
      `INSERT INTO orders (order_id, user_id, pickup_address_id, delivery_address_id, items, pickup_time, payment_option, price_total)
       VALUES (UUID(), :user_id, :pickup_address_id, :delivery_address_id, CAST(:items AS JSON), :pickup_time, :payment_option, :price_total)`,
      { user_id: userId, pickup_address_id, delivery_address_id, items: JSON.stringify(items||[]), pickup_time, payment_option, price_total: price_total||0 }
    );

    const [row] = await pool.query(`SELECT * FROM orders WHERE order_id = (SELECT order_id FROM orders ORDER BY created_at DESC LIMIT 1)`);
    const order = row[0];

    await pool.query(
      `INSERT INTO order_status_events (order_id, status, note) VALUES (:order_id, :status, 'Order created')`,
      { order_id: order.order_id, status: OrderStatus.PENDING }
    );

    return order;
  },

  async getOrder(userId, orderId){
    const [rows] = await pool.query(`SELECT * FROM orders WHERE order_id=:order_id AND user_id=:user_id`, { order_id: orderId, user_id: userId });
    return rows[0] || null;
  },

  async listUserOrders(userId){
    const [rows] = await pool.query(`SELECT * FROM orders WHERE user_id=:user_id ORDER BY created_at DESC`, { user_id: userId });
    return rows;
  },

  async track(orderId){
    const [events] = await pool.query(`SELECT status, note, created_at FROM order_status_events WHERE order_id=:order_id ORDER BY id ASC`, { order_id: orderId });
    return events;
  },

  async setStatus(orderId, status, staffId){
    await pool.query(`UPDATE orders SET status=:status WHERE order_id=:order_id`, { status, order_id: orderId });
    await pool.query(`INSERT INTO order_status_events (order_id, status, staff_id) VALUES (:order_id, :status, :staff_id)`, { order_id: orderId, status, staff_id: staffId || null });
  },

  async assign(orderId, staffId){
    await pool.query(`UPDATE orders SET staff_id=:staff_id WHERE order_id=:order_id`, { order_id: orderId, staff_id: staffId });
    await pool.query(`INSERT INTO order_status_events (order_id, status, staff_id, note) VALUES (:order_id, 'pending', :staff_id, 'Assigned to staff')`, { order_id: orderId, staff_id: staffId });
  }
};