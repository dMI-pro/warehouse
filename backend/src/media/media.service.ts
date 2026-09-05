import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { parseQueryDateBound } from '../common/utils/date-range.util';
import {
  isThumbObjectKey,
  thumbKeyFromImageKey,
} from '../common/utils/image-compression.util';
import {
  removeThumbnailForImage,
  syncMainImageThumbnail,
} from '../common/utils/product-image-thumb.util';

export interface MediaQuery {
  search?: string;
  unusedOnly?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'name' | 'size' | 'type' | 'used';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MediaItem {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  type: 'image' | 'video';
  used: boolean;
  usedCount: number;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  private inferType(key: string): 'image' | 'video' | 'other' {
    const lower = key.toLowerCase();
    const imageExts = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.bmp',
      '.tiff',
      '.svg',
    ];
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    if (imageExts.some((e) => lower.endsWith(e))) return 'image';
    if (videoExts.some((e) => lower.endsWith(e))) return 'video';
    return 'other';
  }

  async list(query: MediaQuery) {
    const {
      search,
      unusedOnly,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = query || {};

    const objects = await this.minio.listObjects('', true);
    const typeFiltered = objects.filter((o) => {
      const t = this.inferType(o.name);
      return t === 'image' || t === 'video';
    });

    const usedMap = new Map<string, number>();
    const products = await this.prisma.product.findMany({
      select: { images: true },
    });
    for (const p of products) {
      const imgs = (p.images || []).filter(Boolean);
      for (const img of imgs) {
        const key = this.minio.getKeyFromUrl(img) || img;
        usedMap.set(key, (usedMap.get(key) || 0) + 1);
      }
      // Only the main image has a generated thumbnail object.
      if (imgs[0]) {
        const mainKey = this.minio.getKeyFromUrl(imgs[0]) || imgs[0];
        if (!isThumbObjectKey(mainKey)) {
          const thumbKey = thumbKeyFromImageKey(mainKey);
          usedMap.set(thumbKey, (usedMap.get(thumbKey) || 0) + 1);
        }
      }
    }

    let items = await Promise.all(
      typeFiltered.map(async (o) => {
        const type = this.inferType(o.name) as 'image' | 'video';
        const usedCount = usedMap.get(o.name) || 0;
        const url = await this.minio.getFileUrl(o.name);
        const item: MediaItem = {
          key: o.name,
          url,
          size: o.size,
          lastModified: o.lastModified.toISOString(),
          type,
          used: usedCount > 0,
          usedCount,
        };
        return item;
      }),
    );

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      items = items.filter((i) => i.key.toLowerCase().includes(s));
    }

    if (unusedOnly) {
      items = items.filter((i) => !i.used);
    }

    if (startDate || endDate) {
      const start = startDate ? parseQueryDateBound(startDate, 'start') : undefined;
      const end = endDate ? parseQueryDateBound(endDate, 'end') : undefined;
      items = items.filter((i) => {
        const d = new Date(i.lastModified);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });
    }

    items.sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'name') {
        return a.key.localeCompare(b.key) * order;
      }
      if (sortBy === 'type') {
        return a.type.localeCompare(b.type) * order;
      }
      if (sortBy === 'size') {
        return (a.size - b.size) * order;
      }
      if (sortBy === 'used') {
        return (a.usedCount - b.usedCount) * order;
      }
      return (
        (new Date(a.lastModified).getTime() -
          new Date(b.lastModified).getTime()) *
        order
      );
    });

    const total = items.length;
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const paged = items.slice(startIdx, endIdx);

    return {
      data: paged,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async delete(keys: string[]) {
    const unique = Array.from(new Set(keys)).filter(Boolean);
    const deleted: string[] = [];
    const errors: Array<{ key: string; error: string }> = [];

    for (const key of unique) {
      try {
        await this.minio.deleteFile(key);
        if (!isThumbObjectKey(key)) {
          await removeThumbnailForImage(this.minio, key);
        }
        const products = await this.prisma.product.findMany({
          where: { images: { has: key } },
          select: { id: true, images: true },
        });
        for (const p of products) {
          const previousMain = (p.images || [])[0] || null;
          const nextImages = (p.images || []).filter((img) => img !== key);
          if (nextImages.length !== (p.images || []).length) {
            await this.prisma.product.update({
              where: { id: p.id },
              data: { images: nextImages },
            });
            await syncMainImageThumbnail(
              this.minio,
              previousMain,
              nextImages[0] || null,
            );
          }
        }
        deleted.push(key);
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === 'string'
              ? e
              : 'delete_failed';
        errors.push({ key, error: msg });
      }
    }

    return { deleted, errors };
  }
}
