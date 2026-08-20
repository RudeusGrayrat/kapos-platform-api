import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Prisma,
  ProductStatus,
  ProductType,
  StockStatus,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpsertStockDto } from './dto/upsert-stock.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prismaService: PrismaService) {}

  listCategories(organizationId: string) {
    return this.prismaService.productCategory.findMany({
      where: { organizationId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true, children: true } },
      },
    });
  }

  async createCategory(organizationId: string, input: CreateCategoryDto) {
    if (input.parentId) {
      await this.ensureCategoryBelongsToOrganization(
        organizationId,
        input.parentId,
      );
    }

    return this.prismaService.productCategory.create({
      data: {
        organizationId,
        parentId: input.parentId,
        name: input.name,
        slug: await this.createUniqueCategorySlug(
          organizationId,
          input.slug ?? input.name,
        ),
        description: input.description,
        color: input.color,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateCategory(
    organizationId: string,
    categoryId: string,
    input: UpdateCategoryDto,
  ) {
    await this.ensureCategoryBelongsToOrganization(organizationId, categoryId);

    if (input.parentId) {
      if (input.parentId === categoryId) {
        throw new BadRequestException(
          'Una categoria no puede ser padre de si misma.',
        );
      }

      await this.ensureCategoryBelongsToOrganization(
        organizationId,
        input.parentId,
      );
    }

    const nextSlug =
      input.slug || input.name
        ? await this.createUniqueCategorySlug(
            organizationId,
            input.slug ?? input.name ?? '',
            categoryId,
          )
        : undefined;

    return this.prismaService.productCategory.update({
      where: { id: categoryId, organizationId },
      data: {
        parentId: input.parentId,
        name: input.name,
        slug: nextSlug,
        description: input.description,
        color: input.color,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    });
  }

  async listProducts(input: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(5, input.limit ?? 10));
    const search = input.search?.trim();
    const where: Prisma.ProductWhereInput = {
      organizationId: input.organizationId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              {
                category: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      this.prismaService.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true, slug: true } },
          stockItems: {
            include: {
              branch: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
      this.prismaService.product.count({ where }),
    ]);

    return {
      data: products.map((product) => this.serializeProduct(product)),
      total,
      page,
      limit,
    };
  }

  async createProduct(organizationId: string, input: CreateProductDto) {
    const sku = this.normalizeSku(input.sku);

    if (input.categoryId) {
      await this.ensureCategoryBelongsToOrganization(
        organizationId,
        input.categoryId,
      );
    }

    await this.ensureProductSkuIsAvailable(organizationId, sku);

    return this.prismaService.product
      .create({
        data: {
          organizationId,
          categoryId: input.categoryId,
          sku,
          name: input.name,
          description: input.description,
          type: input.type ?? 'PRODUCT',
          price: new Prisma.Decimal(input.price ?? 0),
          cost:
            input.cost === undefined
              ? undefined
              : new Prisma.Decimal(input.cost),
          taxRate:
            input.taxRate === undefined
              ? undefined
              : new Prisma.Decimal(input.taxRate),
          trackStock: input.trackStock ?? true,
          availableForPos: input.availableForPos ?? true,
          imageUrl: input.imageUrl,
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          stockItems: {
            include: {
              branch: { select: { id: true, name: true, code: true } },
            },
          },
        },
      })
      .then((product) => this.serializeProduct(product));
  }

  async updateProduct(
    organizationId: string,
    productId: string,
    input: UpdateProductDto,
  ) {
    await this.ensureProductBelongsToOrganization(organizationId, productId);
    const sku = this.normalizeSku(input.sku);

    if (input.categoryId) {
      await this.ensureCategoryBelongsToOrganization(
        organizationId,
        input.categoryId,
      );
    }

    await this.ensureProductSkuIsAvailable(organizationId, sku, productId);

    return this.prismaService.product
      .update({
        where: { id: productId, organizationId },
        data: {
          categoryId: input.categoryId,
          sku,
          name: input.name,
          description: input.description,
          type: input.type,
          status: input.status,
          price:
            input.price === undefined
              ? undefined
              : new Prisma.Decimal(input.price),
          cost:
            input.cost === undefined
              ? undefined
              : new Prisma.Decimal(input.cost),
          taxRate:
            input.taxRate === undefined
              ? undefined
              : new Prisma.Decimal(input.taxRate),
          trackStock: input.trackStock,
          availableForPos: input.availableForPos,
          imageUrl: input.imageUrl,
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          stockItems: {
            include: {
              branch: { select: { id: true, name: true, code: true } },
            },
          },
        },
      })
      .then((product) => this.serializeProduct(product));
  }

  async listStock(organizationId: string) {
    const stockItems = await this.prismaService.productStock.findMany({
      where: {
        product: { organizationId },
      },
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        product: { select: { id: true, name: true, sku: true, status: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    return stockItems.map((stockItem) => this.serializeStock(stockItem));
  }

  async upsertStock(organizationId: string, input: UpsertStockDto) {
    const [product, branch] = await Promise.all([
      this.prismaService.product.findFirst({
        where: { id: input.productId, organizationId },
        select: { id: true },
      }),
      this.prismaService.branch.findFirst({
        where: { id: input.branchId, organizationId },
        select: { id: true },
      }),
    ]);

    if (!product || !branch) {
      throw new BadRequestException(
        'El producto o la sucursal no pertenecen a la organizacion activa.',
      );
    }

    const quantity = new Prisma.Decimal(input.quantity);
    const minQuantity = new Prisma.Decimal(input.minQuantity ?? 0);
    const currentStock = await this.prismaService.productStock.findUnique({
      where: {
        productId_branchId: {
          productId: product.id,
          branchId: branch.id,
        },
      },
      select: { reservedQuantity: true },
    });
    if (currentStock?.reservedQuantity.greaterThan(quantity)) {
      throw new BadRequestException(
        `No puedes reducir el stock por debajo de ${currentStock.reservedQuantity.toString()} unidades reservadas en cuentas abiertas.`,
      );
    }

    const stockItem = await this.prismaService.productStock.upsert({
      where: {
        productId_branchId: {
          productId: product.id,
          branchId: branch.id,
        },
      },
      update: {
        quantity,
        minQuantity,
        status: this.resolveStockStatus(quantity, minQuantity),
      },
      create: {
        productId: product.id,
        branchId: branch.id,
        quantity,
        minQuantity,
        status: this.resolveStockStatus(quantity, minQuantity),
      },
      include: {
        product: { select: { id: true, name: true, sku: true, status: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    return this.serializeStock(stockItem);
  }

  private resolveStockStatus(
    quantity: Prisma.Decimal,
    minQuantity: Prisma.Decimal,
  ) {
    if (quantity.lessThanOrEqualTo(0)) {
      return StockStatus.OUT;
    }

    if (quantity.lessThanOrEqualTo(minQuantity)) {
      return StockStatus.LOW;
    }

    return StockStatus.OK;
  }

  private async ensureCategoryBelongsToOrganization(
    organizationId: string,
    categoryId: string,
  ) {
    const category = await this.prismaService.productCategory.findFirst({
      where: { id: categoryId, organizationId },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException(
        'La categoria no pertenece a la organizacion activa.',
      );
    }
  }

  private async ensureProductBelongsToOrganization(
    organizationId: string,
    productId: string,
  ) {
    const product = await this.prismaService.product.findFirst({
      where: { id: productId, organizationId },
      select: { id: true },
    });

    if (!product) {
      throw new BadRequestException(
        'El producto no pertenece a la organizacion activa.',
      );
    }
  }

  private normalizeSku(sku?: string) {
    const normalized = sku?.trim();
    return normalized && normalized.length > 0 ? normalized : undefined;
  }

  private async ensureProductSkuIsAvailable(
    organizationId: string,
    sku?: string,
    ignoreProductId?: string,
  ) {
    if (!sku) return;

    const existingProduct = await this.prismaService.product.findFirst({
      where: {
        organizationId,
        sku,
        ...(ignoreProductId ? { id: { not: ignoreProductId } } : {}),
      },
      select: { id: true, name: true },
    });

    if (existingProduct) {
      throw new BadRequestException(
        `Ya existe un producto con el SKU "${sku}" en esta organizacion.`,
      );
    }
  }

  private async createUniqueCategorySlug(
    organizationId: string,
    value: string,
    ignoreCategoryId?: string,
  ) {
    const baseSlug = this.slugify(value);
    let nextSlug = baseSlug;
    let suffix = 2;

    while (
      await this.prismaService.productCategory.findFirst({
        where: {
          organizationId,
          slug: nextSlug,
          ...(ignoreCategoryId ? { id: { not: ignoreCategoryId } } : {}),
        },
        select: { id: true },
      })
    ) {
      nextSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return nextSlug;
  }

  private slugify(value: string) {
    const normalized = value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return normalized || 'categoria';
  }

  private serializeProduct(product: {
    price: Prisma.Decimal;
    cost: Prisma.Decimal | null;
    taxRate: Prisma.Decimal | null;
    stockItems: Array<{
      quantity: Prisma.Decimal;
      reservedQuantity: Prisma.Decimal;
      minQuantity: Prisma.Decimal;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }) {
    return {
      ...product,
      price: Number(product.price),
      cost: product.cost === null ? null : Number(product.cost),
      taxRate: product.taxRate === null ? null : Number(product.taxRate),
      stockItems: product.stockItems.map((stockItem) =>
        this.serializeStock(stockItem),
      ),
    };
  }

  private serializeStock(stockItem: {
    quantity: Prisma.Decimal;
    reservedQuantity: Prisma.Decimal;
    minQuantity: Prisma.Decimal;
    [key: string]: unknown;
  }) {
    return {
      ...stockItem,
      quantity: Number(stockItem.quantity),
      reservedQuantity: Number(stockItem.reservedQuantity),
      availableQuantity: Number(
        stockItem.quantity.minus(stockItem.reservedQuantity),
      ),
      minQuantity: Number(stockItem.minQuantity),
    };
  }
}
