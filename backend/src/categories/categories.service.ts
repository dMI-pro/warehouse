import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Проверка существования родительской категории, если указана
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${createCategoryDto.parentId} not found`,
        );
      }
    }

    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        parentId: createCategoryDto.parentId,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Формируем древовидную структуру
    return this.buildTree(categories);
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            salePrice: true,
            quantity: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    // Проверка существования категории
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Проверка, что категория не становится своим собственным родителем
    if (updateCategoryDto.parentId === id) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    // Проверка существования родительской категории, если она изменяется
    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId !== null) {
        const parent = await this.prisma.category.findUnique({
          where: { id: updateCategoryDto.parentId },
        });

        if (!parent) {
          throw new NotFoundException(
            `Parent category with ID ${updateCategoryDto.parentId} not found`,
          );
        }

        // Проверка на циклические зависимости
        const isDescendant = await this.isDescendant(
          id,
          updateCategoryDto.parentId,
        );
        if (isDescendant) {
          throw new BadRequestException(
            'Cannot set category as parent: would create circular dependency',
          );
        }
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Проверка наличия дочерних категорий
    if (category.children.length > 0) {
      throw new ConflictException(
        'Cannot delete category with child categories',
      );
    }

    // Проверка наличия товаров в категории
    if (category.products.length > 0) {
      throw new ConflictException(
        'Cannot delete category with associated products',
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  // Вспомогательный метод для построения древовидной структуры
  private buildTree(categories: any[]): any[] {
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    // Создаем карту всех категорий
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Строим дерево
    categories.forEach((category) => {
      const categoryNode = categoryMap.get(category.id);
      if (category.parentId === null || category.parentId === undefined) {
        rootCategories.push(categoryNode);
      } else {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryNode);
        }
      }
    });

    return rootCategories;
  }

  // Проверка, является ли одна категория потомком другой
  private async isDescendant(
    categoryId: number,
    potentialAncestorId: number,
  ): Promise<boolean> {
    if (categoryId === potentialAncestorId) {
      return false;
    }

    let currentId = categoryId;
    const visited = new Set<number>();

    while (currentId) {
      if (visited.has(currentId)) {
        break; // Предотвращаем бесконечный цикл
      }
      visited.add(currentId);

      const category = await this.prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      if (!category || !category.parentId) {
        break;
      }

      if (category.parentId === potentialAncestorId) {
        return true;
      }

      currentId = category.parentId;
    }

    return false;
  }
}
