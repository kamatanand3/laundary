import { pool } from '../config/db.js';
import { signAccess, signRefresh } from '../utils/jwt.js';
import { Roles } from '../utils/enums.js';
import { hash as bcryptHash, compare as bcryptCompare } from '../utils/password.js';

export const AuthService = {
  async ensureUserByEmail(email){
    const [rows] = await pool.query(`SELECT * FROM users WHERE email=:email`, { email });
    if (rows.length) return rows[0];
    const [r] = await pool.query(
      `INSERT INTO users (user_id, name, email) VALUES (UUID(), '', :email)`, { email }
    );
    const [created] = await pool.query(`SELECT * FROM users WHERE email=:email`, { email });
    return created[0];
  },

  async ensureStaffByEmail(email){
    const [rows] = await pool.query(`SELECT * FROM delivery_staff WHERE email=:email`, { email });
    if (rows.length) return rows[0];
    const [r] = await pool.query(
      `INSERT INTO delivery_staff (staff_id, name, email, status) VALUES (UUID(), '', :email, 'inactive')`, { email }
    );
    const [created] = await pool.query(`SELECT * FROM delivery_staff WHERE email=:email`, { email });
    return created[0];
  },

  issueTokens(subject){
    const payload = { id: subject.id, role: subject.role };
    const access = signAccess(payload);
    const refresh = signRefresh(payload);
    return { access, refresh };
  },

  async adminLogin(email, password){
    const [rows] = await pool.query(`SELECT * FROM admins WHERE email=:email`, { email });
    if (!rows.length) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    const admin = rows[0];
    const ok = await bcryptCompare(password, admin.password_hash);
    if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    return this.issueTokens({ id: admin.admin_id, role: 'admin' });
  },

    async logout(userId){
        // For JWT, typically we don't store sessions server-side.
        // To "logout", the client simply discards the tokens.
        // Optionally, we could implement a token blacklist here.
        return true;
    }
};