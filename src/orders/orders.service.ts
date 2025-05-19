import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from 'generated/prisma';
import { RpcException } from '@nestjs/microservices';
import { ChangeStatusOrderDto, OrderPaginationDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
  create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto,
    });
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const { page, limit, status } = orderPaginationDto;
    const totalItems = await this.order.count({ where: { status: status } });
    const lastPage = Math.ceil(totalItems / (limit ?? 10));

    return {
      data: await this.order.findMany({
        where: { status: status },
        skip: ((page ?? 1) - 1) * (limit ?? 10),
        take: limit ?? 10,
      }),
      meta: {
        page: page ?? 1,
        perPage: limit ?? 10,
        totalItems,
        lastPage,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findUnique({
      where: { id },
    });
    if (!order)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    return order;
  }

  async changeOrderStatus(changeStatusOrderDto: ChangeStatusOrderDto) {
    const { id: _, ...data } = changeStatusOrderDto;

    const order = await this.findOne(_);
    if (order.status === data.status) return order;

    return await this.order.update({
      where: { id: _ },
      data,
    });
  }
}
