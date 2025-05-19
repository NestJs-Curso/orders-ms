import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common';
import { OrderStatusList } from '../enum/order.enum';
import { order_status } from 'generated/prisma';

export class OrderPaginationDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: `Order status must be one of the following: ${OrderStatusList.join(', ')}`,
  })
  status: order_status;
}
