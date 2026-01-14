import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { SalesModule } from './sales/sales.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { CommitteesModule } from './committees/committees.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TransactionTypesModule } from './transaction-types/transaction-types.module';
import { ReturnsModule } from './returns/returns.module';
import { MinioModule } from './minio/minio.module';
import { UserStatusesModule } from './user-statuses/user-statuses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MinioModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    SalesModule,
    WarehousesModule,
    CommitteesModule,
    AuditLogModule,
    TransactionTypesModule,
    ReturnsModule,
    UserStatusesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
