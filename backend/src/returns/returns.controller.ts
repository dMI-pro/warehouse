import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  ParseIntPipe, 
  UseGuards, 
  Request, 
  Query 
} from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @Roles(Role.SELLER, Role.MANAGER, Role.ADMIN)
  create(@Body() createReturnDto: CreateReturnDto, @CurrentUser() user: any) {
    return this.returnsService.create(createReturnDto, user.id);
  }

  @Get()
  @Roles(Role.MANAGER, Role.ADMIN)
  findAll(@Query() query: any) {
    return this.returnsService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.returnsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReturnDto: UpdateReturnDto,
  ) {
    return this.returnsService.update(id, updateReturnDto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.returnsService.remove(id);
  }
}