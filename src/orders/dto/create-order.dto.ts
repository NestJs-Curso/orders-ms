import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { order_status } from 'generated/prisma';
import { OrderStatusList } from '../enum/order.enum';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  total_amaunt: number;
  @IsNumber()
  @IsPositive()
  total_items: number;
  @IsEnum(OrderStatusList, {
    message: `Order status must be one of the following: ${OrderStatusList.join(', ')}`,
  })
  @IsOptional()
  status: order_status = order_status.PENDING;
  @IsBoolean()
  @IsOptional()
  paid: boolean = false;
}
