import { prisma } from '../config/prisma.js';
import { randomUUID } from 'crypto';
import { hash as bcryptHash, compare as bcryptCompare } from '../utils/password.js';

export const AdminService = {
  // Same behavior as your original: newest first
  async listOrders(filters = {}) {
    return prisma.orders.findMany({
      orderBy: { created_at: 'desc' },
    });
  },

  async listUsers() {
    return prisma.users.findMany({
      orderBy: { created_at: 'desc' },
    });
  },

  async upsertStaff(payload) {
    const { staff_id, name, email, phone_number, status } = payload;

    if (staff_id) {
      // Update by primary key and return the row
      return prisma.delivery_staff.update({
        where: { staff_id },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email }),
          ...(phone_number !== undefined && { phone_number }),
          ...(status !== undefined && { status }), // enum delivery_staff_status
        },
      });
    }

    // If email provided (UNIQUE), do upsert-by-email for idempotency
    if (email) {
      return prisma.delivery_staff.upsert({
        where: { email },
        create: {
          staff_id: randomUUID(),
          name: name ?? '',
          email,
          phone_number: phone_number ?? null,
          status: status ?? 'inactive',
        },
        update: {
          ...(name !== undefined && { name }),
          ...(phone_number !== undefined && { phone_number }),
          ...(status !== undefined && { status }),
        },
      });
    }

    // Otherwise create a fresh staff row
    return prisma.delivery_staff.create({
      data: {
        staff_id: randomUUID(),
        name: name ?? '',
        phone_number: phone_number ?? null,
        status: status ?? 'inactive',
      },
    });
  },

  

  // create new admin user code start
  async createAdmin({ name, email, password }) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized || !password) {
      throw Object.assign(new Error('Name, email and password are required'), { status: 400 });
    }

    // check if admin already exists
    const existing = await prisma.admins.findUnique({ where: { email: normalized } });
    if (existing) {
      throw Object.assign(new Error('Admin already exists with this email'), { status: 400 });
    }

    // hash password
    const password_hash = await bcryptHash(password, 10);

    const admin = await prisma.admins.create({
      data: {
        admin_id: randomUUID(),
        name,
        email: normalized,
        password_hash,
      },
    });

    return {
      id: admin.admin_id,
      name: admin.name,
      email: admin.email,
    };
  },
  // create new admin user code end
};
