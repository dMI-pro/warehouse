import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser: any) {
    // Проверка существования пользователя
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Ограничение: админы не могут редактировать других админов
    if (user.role === 'ADMIN' && currentUser.id !== id && !currentUser.isSuperAdmin) {
      throw new ForbiddenException('Admins cannot edit other admins');
    }

    // Проверка уникальности email и username, если они изменяются
    if (updateUserDto.email || updateUserDto.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                updateUserDto.email ? { email: updateUserDto.email } : {},
                updateUserDto.username ? { username: updateUserDto.username } : {},
              ],
            },
          ],
        },
      });

      if (existingUser) {
        throw new ConflictException('User with this email or username already exists');
      }
    }

    // Обновление пользователя
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}

