import { Module, forwardRef } from '@nestjs/common';
import { UserStatusesService } from './user-statuses.service';
import { UserStatusesController } from './user-statuses.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuditLogModule)],
  controllers: [UserStatusesController],
  providers: [UserStatusesService],
  exports: [UserStatusesService],
})
export class UserStatusesModule {}
