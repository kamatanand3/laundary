import { pool } from '../config/db.js';

export const AdminService = {
  async listOrders(filters={}){
    const [rows] = await pool.query(`SELECT * FROM orders ORDER BY created_at DESC`);
    return rows;
  },
  async listUsers(){
    const [rows] = await pool.query(`SELECT * FROM users ORDER BY created_at DESC`);
    return rows;
  },
  async upsertStaff(payload){
    const { staff_id, name, email, phone_number, status } = payload;
    if (staff_id){
      await pool.query(`UPDATE delivery_staff SET name=:name, email=:email, phone_number=:phone_number, status=:status WHERE staff_id=:staff_id`,
        { staff_id, name, email, phone_number, status });
      const [rows] = await pool.query(`SELECT * FROM delivery_staff WHERE staff_id=:staff_id`, { staff_id });
      return rows[0];
    } else {
      await pool.query(`INSERT INTO delivery_staff (staff_id, name, email, phone_number, status) VALUES (UUID(), :name, :email, :phone_number, :status)`,
        { name, email, phone_number, status: status || 'inactive' });
      const [rows] = await pool.query(`SELECT * FROM delivery_staff WHERE email=:email`, { email });
      return rows[0];
    }
  },
};