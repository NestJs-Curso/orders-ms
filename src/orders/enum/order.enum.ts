import { order_status } from 'generated/prisma';

export const OrderStatusList = [
  order_status.PENDING,
  order_status.PROCESSING,
  order_status.CANCELLED,
  order_status.COMPLETED,
];
