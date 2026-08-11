import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { OrganizationAuthorizationContext } from '../../../common/authorization/authorization.service';
import { OrganizationContext } from '../../../common/decorators/organization-context.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpsertStockDto } from './dto/upsert-stock.dto';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('erp/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  @RequirePermissions('catalog.categories.read')
  listCategories(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
  ) {
    return this.catalogService.listCategories(organizationContext.organizationId);
  }

  @Post('categories')
  @RequirePermissions('catalog.categories.create')
  createCategory(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Body() input: CreateCategoryDto,
  ) {
    return this.catalogService.createCategory(
      organizationContext.organizationId,
      input,
    );
  }

  @Patch('categories/:id')
  @RequirePermissions('catalog.categories.update')
  updateCategory(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Param('id') id: string,
    @Body() input: UpdateCategoryDto,
  ) {
    return this.catalogService.updateCategory(
      organizationContext.organizationId,
      id,
      input,
    );
  }

  @Get('products')
  @RequirePermissions('catalog.products.read')
  listProducts(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.catalogService.listProducts({
      organizationId: organizationContext.organizationId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }

  @Post('products')
  @RequirePermissions('catalog.products.create')
  createProduct(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Body() input: CreateProductDto,
  ) {
    return this.catalogService.createProduct(
      organizationContext.organizationId,
      input,
    );
  }

  @Patch('products/:id')
  @RequirePermissions('catalog.products.update')
  updateProduct(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Param('id') id: string,
    @Body() input: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(
      organizationContext.organizationId,
      id,
      input,
    );
  }

  @Get('stock')
  @RequirePermissions('catalog.stock.read')
  listStock(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
  ) {
    return this.catalogService.listStock(organizationContext.organizationId);
  }

  @Post('stock')
  @RequirePermissions('catalog.adjustments.create')
  upsertStock(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Body() input: UpsertStockDto,
  ) {
    return this.catalogService.upsertStock(
      organizationContext.organizationId,
      input,
    );
  }
}
