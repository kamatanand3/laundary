// src/services/OrderService.js
import { prisma } from '../config/prisma.js';
import { OrderStatus } from '../utils/enums.js'; // e.g., { PENDING: 'pending', ... }
import { randomUUID } from 'crypto';

export const OrderService = {
  async createOrder(userId, payload) {
    const {
      pickup_address_id,
      delivery_address_id,
      items,
      pickup_time,
      payment_option,
      price_total,
    } = payload;

    // Prisma handles JSON directly; Datetime expects JS Date
    const order_id = randomUUID();

    const [order] = await prisma.$transaction([
      prisma.orders.create({
        data: {
          order_id,
          user_id: userId,
          pickup_address_id,
          delivery_address_id,
          items: items ?? [],                                       // Json
          pickup_time: new Date(pickup_time),                       // DateTime(0)
          payment_option,                                           // enum orders_payment_option ('cod'|'online')
          price_total: `${price_total ?? 0}`,                       // Decimal -> pass as string
          // created_at is default(now())
        },
      }),
      prisma.order_status_events.create({
        data: {
          order_id,
          status: OrderStatus?.PENDING ?? 'pending',                // enum order_status_events_status
          note: 'Order created',
          // created_at default(now())
        },
      }),
    ]);

    // order is the first element (orders.create result)
    return order;
  },

  async getOrder(userId, orderId) {
    return prisma.orders.findFirst({
      where: { order_id: orderId, user_id: userId },
    });
  },

  async listUserOrders(userId) {
    return prisma.orders.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  },

  async track(orderId) {
    return prisma.order_status_events.findMany({
      where: { order_id: orderId },
      select: { status: true, note: true, created_at: true },
      orderBy: { id: 'asc' },
    });
  },

  async setStatus(orderId, status, staffId) {
    await prisma.$transaction([
      prisma.orders.update({
        where: { order_id: orderId },
        data: { status }, // enum orders_status
      }),
      prisma.order_status_events.create({
        data: {
          order_id: orderId,
          status,           // enum order_status_events_status (values overlap with orders_status)
          staff_id: staffId ?? null,
        },
      }),
    ]);
  },

  async assign(orderId, staffId) {
    await prisma.$transaction([
      prisma.orders.update({
        where: { order_id: orderId },
        data: { staff_id: staffId },
      }),
      prisma.order_status_events.create({
        data: {
          order_id: orderId,
          status: 'pending',        // per your original code
          staff_id: staffId,
          note: 'Assigned to staff',
        },
      }),
    ]);
  },
};
