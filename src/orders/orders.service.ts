import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from 'generated/prisma';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeStatusOrderDto, OrderPaginationDto } from './dto';
import { ProductItem } from 'src/common/types';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(NATS_SERVICE) private readonly productsService: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      // * 1.- Validacion de los productos
      const ids = createOrderDto.items.map((item) => item.product_id);
      const products: ProductItem[] = await firstValueFrom(
        this.productsService.send({ cmd: 'validate_products' }, ids),
      );

      //* 2.- Calculo delos valores necesarios para la orden
      const totalAmount = createOrderDto.items.reduce(
        (acc: number, orderItem) => {
          const price: any = products.find(
            (product) => product.id === orderItem.product_id,
          )?.price;

          return price * orderItem.quantity + acc;
        },
        0,
      );

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      //* 3.- Transaccion de base de datos
      const order = await this.order.create({
        data: {
          total_amaunt: totalAmount,
          total_items: totalItems,
          //* Crea los hijos de la orden
          order_items: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price:
                  products.find(
                    (product) => product.id === orderItem.product_id,
                  )?.price ?? 0,
                product_id: orderItem.product_id,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        //* Inclutye los hijos de la orden pero solo los campos necesarios
        include: {
          order_items: {
            select: {
              price: true,
              product_id: true,
              quantity: true,
            },
          },
        },
      });

      //* 4.- Retorna la orden con los nombres de los productos
      return {
        ...order,
        order_items: order.order_items.map((orderItem) => ({
          product: products.find(
            (product) => product.id === orderItem.product_id,
          )?.name,
          ...orderItem,
        })),
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Error validating products',
      });
    }
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
    //* 1.- Busca la orden por id
    const order = await this.order.findUnique({
      where: { id },
      include: {
        order_items: {
          select: {
            price: true,
            product_id: true,
            quantity: true,
          },
        },
      },
    });

    //* 2.- Valida que la orden exista y obtiene los nombres de los productos
    const ids = order?.order_items.map((item) => item.product_id);
    const products: ProductItem[] = await firstValueFrom(
      this.productsService.send({ cmd: 'validate_products' }, ids),
    );
    if (!order)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    return {
      ...order,
      order_items: order.order_items.map((orderItem) => ({
        product: products.find((product) => product.id === orderItem.product_id)
          ?.name,
        ...orderItem,
      })),
    };
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
