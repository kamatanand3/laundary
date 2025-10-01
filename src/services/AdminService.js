import { prisma } from '../config/prisma.js';
import { randomUUID } from 'crypto';

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
};
