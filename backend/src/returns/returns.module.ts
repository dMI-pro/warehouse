import { Module, forwardRef } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuditLogModule)],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
