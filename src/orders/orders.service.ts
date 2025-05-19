import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from 'generated/prisma';

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

  findAll() {
    return this.order.findMany();
  }

  findOne(id: string) {
    return this.order.findUnique({
      where: { id },
    });
  }
}
