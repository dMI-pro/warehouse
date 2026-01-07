import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  create(@Body() createReturnDto: CreateReturnDto, @Request() req) {
    return this.returnsService.create(createReturnDto, req.user.userId);
  }

  @Get()
  findAll(@Query() query) {
    return this.returnsService.findAll(query);
  }
}
