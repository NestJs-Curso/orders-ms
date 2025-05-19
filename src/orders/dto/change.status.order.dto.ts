import { order_status } from 'generated/prisma';
import { OrderStatusList } from '../enum/order.enum';
import { IsEnum, IsUUID } from 'class-validator';

export class ChangeStatusOrderDto {
  @IsUUID()
  id: string;
  @IsEnum(OrderStatusList, {
    message: `Order status must be one of the following: ${OrderStatusList.join(', ')}`,
  })
  status: order_status;
}
