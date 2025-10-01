// src/docs/openapi.js
import swaggerJsdoc from 'swagger-jsdoc';

const definition = {
  openapi: '3.1.0',
  info: {
    title: 'Laundry Service API Test new1',
    version: '1.0.0',
    description: 'Express.js MVC + MySQL + Email OTP — Customer, Staff, Admin APIs',
  },
  servers: [
    { url: `https://dailyuseservice.xyz/:${process.env.PORT || 4000}/api`, description: 'Local' }
  ],
  tags: [
    { name: 'Auth' }, { name: 'Addresses' }, { name: 'Orders' }, { name: 'Staff' }, { name: 'Admin' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      Address: {
        type: 'object',
        properties: {
          address_id: { type: 'string', format: 'uuid' },
          label: { type: 'string' },
          line1: { type: 'string' },
          line2: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          pincode: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
          is_default: { type: 'boolean' }
        },
        required: ['line1']
      },
      OrderItem: {
        type: 'object',
        properties: {
          type: { type: 'string', example: 'shirt' },
          qty: { type: 'integer', minimum: 1, example: 3 },
          price: { type: 'number', example: 25.0 }
        },
        required: ['type','qty','price']
      },
      Order: {
        type: 'object',
        properties: {
          order_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          staff_id: { type: 'string', nullable: true },
          pickup_address_id: { type: 'string' },
          delivery_address_id: { type: 'string' },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          pickup_time: { type: 'string', format: 'date-time' },
          delivery_time: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', enum: ['pending','picked','ironing','out-for-delivery','delivered','cancelled'] },
          price_total: { type: 'number' },
          payment_option: { type: 'string', enum: ['cod','online'] },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      OTPRequestBody: {
        type: 'object',
        properties: { role: { type: 'string', enum: ['user','staff'] }, email: { type: 'string', format: 'email' } },
        required: ['email']
      },
      OTPVerifyBody: {
        type: 'object',
        properties: { role: { type: 'string', enum: ['user','staff'] }, email: { type: 'string', format: 'email' }, code: { type: 'string', minLength: 6, maxLength: 6 } },
        required: ['email','code']
      },
      AssignOrderBody: {
        type: 'object', properties: { staff_id: { type: 'string', format: 'uuid' } }, required: ['staff_id']
      },
      UpdateStatusBody: {
        type: 'object', properties: { status: { type: 'string', enum: ['pending','picked','ironing','out-for-delivery','delivered','cancelled'] } }, required: ['status']
      },
      CreateOrderBody: {
        type: 'object',
        properties: {
          pickup_address_id: { type: 'string' },
          delivery_address_id: { type: 'string' },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          pickup_time: { type: 'string', example: '2025-09-15 17:30:00' },
          payment_option: { type: 'string', enum: ['cod','online'] },
          price_total: { type: 'number' }
        },
        required: ['pickup_address_id','delivery_address_id','items','pickup_time','price_total']
      }
    }
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/auth/otp/request': {
      post: {
        tags: ['Auth'],
        summary: 'Request login OTP via email',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OTPRequestBody' } } } },
        responses: { '200': { description: 'OTP sent' }, '429': { description: 'Rate limited' } }
      }
    },
    '/auth/otp/verify': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email OTP and issue JWTs',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OTPVerifyBody' } } } },
        responses: { '200': { description: 'Access/Refresh tokens' }, '400': { description: 'Invalid/expired OTP' } }
      }
    },

    '/addresses': {
      get: {
        tags: ['Addresses'], summary: 'List my addresses', security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Array of addresses', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Address' } } } } } }
      },
      post: {
        tags: ['Addresses'], summary: 'Create address', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Address' } } } },
        responses: { '201': { description: 'Created' } }
      }
    },
    '/addresses/{id}': {
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      put: {
        tags: ['Addresses'], summary: 'Update address', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Address' } } } },
        responses: { '200': { description: 'Updated' } }
      },
      delete: {
        tags: ['Addresses'], summary: 'Delete address', security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Deleted' } }
      }
    },

    '/orders': {
      post: {
        tags: ['Orders'], summary: 'Create order', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrderBody' } } } },
        responses: { '201': { description: 'Order created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } } }
      }
    },
    '/orders/mine': {
      get: { tags: ['Orders'], summary: 'My orders', security: [{ BearerAuth: [] }], responses: { '200': { description: 'Orders list' } } }
    },
    '/orders/{id}': {
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      get: { tags: ['Orders'], summary: 'Order detail', security: [{ BearerAuth: [] }], responses: { '200': { description: 'Order' }, '404': { description: 'Not found' } } }
    },
    '/orders/{id}/track': {
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      get: { tags: ['Orders'], summary: 'Order status timeline', security: [{ BearerAuth: [] }], responses: { '200': { description: 'Events' } } }
    },
    '/orders/{id}/reorder': {
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      post: { tags: ['Orders'], summary: 'Re-order previous order', security: [{ BearerAuth: [] }], responses: { '201': { description: 'New order created' } } }
    },
    '/orders/{id}/assign': {
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      post: {
        tags: ['Admin'], summary: 'Assign order to staff', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignOrderBody' } } } },
        responses: { '200': { description: 'Assigned' }, '403': { description: 'Requires admin' } }
      }
    },
    '/orders/{id}/status': {
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      put: {
        tags: ['Staff'], summary: 'Update order status', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateStatusBody' } } } },
        responses: { '200': { description: 'Status updated' }, '403': { description: 'Requires staff' } }
      }
    },

    '/admin/dashboard': {
      get: { tags: ['Admin'], summary: 'Overview stats', security: [{ BearerAuth: [] }], responses: { '200': { description: 'Stats' } } }
    },
    '/admin/users': {
      get: { tags: ['Admin'], summary: 'List users', security: [{ BearerAuth: [] }], responses: { '200': { description: 'Users list' } } }
    },
    '/auth/admin/login': {
      post: {
        tags: ['Auth'], summary: 'Admin password login',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } }, required: ['email','password'] } } } },
        responses: { '200': { description: 'Admin tokens' }, '401': { description: 'Invalid credentials' } }
      }
    }
  }
};

export const specs = swaggerJsdoc({ definition, apis: [] });
// To auto-generate from route JSDoc annotations later, change to:
// export const specs = swaggerJsdoc({ definition, apis: ['src/routes/*.js'] });
