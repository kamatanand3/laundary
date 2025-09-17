import { prisma } from '../config/prisma.js';
import { signAccess, signRefresh } from '../utils/jwt.js';
import { hash as bcryptHash, compare as bcryptCompare } from '../utils/password.js';
import { randomUUID } from 'crypto';

export const AuthService = {
  async ensureUserByEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) throw Object.assign(new Error('Email required'), { status: 400 });

    // users.email is UNIQUE (nullable in schema, but we require here)
    return prisma.users.upsert({
      where: { email: normalized },
      create: {
        user_id: randomUUID(),
        name: '',
        email: normalized,
      },
      update: {}, // nothing to change if already exists
    });
  },

  async ensureStaffByEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) throw Object.assign(new Error('Email required'), { status: 400 });

    return prisma.delivery_staff.upsert({
      where: { email: normalized },
      create: {
        staff_id: randomUUID(),
        name: '',
        email: normalized,
        status: 'inactive',
      },
      update: {},
    });
  },

  issueTokens(subject) {
    // subject = { id: <uuid>, role: 'user'|'staff'|'admin' }
    const payload = { id: subject.id, role: subject.role };
    const access = signAccess(payload);
    const refresh = signRefresh(payload);
    return { access, refresh };
  },

  async adminLogin(email, password) {
    const normalized = String(email || '').trim().toLowerCase();
    const admin = await prisma.admins.findUnique({ where: { email: normalized } });
    if (!admin) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const ok = await bcryptCompare(password, admin.password_hash);
    if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    // Tokens with role=admin; id = admins.admin_id
    return this.issueTokens({ id: admin.admin_id, role: 'admin' });
  },

  async logout(_userId) {
    // Stateless JWT logout
    return true;
  },
};
