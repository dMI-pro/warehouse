import sharp from 'sharp';
import { BadRequestException } from '@nestjs/common';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxFileSize?: number; // в байтах
}

/** Full-size product photo: readable detail, bounded weight. */
export const PRODUCT_FULL_IMAGE_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 78,
  format: 'webp',
  maxFileSize: 350 * 1024, // 350KB
};

/** Square crop for product table cells. */
export const PRODUCT_THUMB_SIZE = 240;
export const PRODUCT_THUMB_QUALITY = 70;

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  ...PRODUCT_FULL_IMAGE_OPTIONS,
};

/**
 * Derives MinIO object key for the main-image thumbnail.
 * `products/foo.webp` → `products/thumbs/foo.webp`
 * Old full-size URLs stay unchanged in `products.images`.
 */
export function thumbKeyFromImageKey(imageKey: string): string {
  const normalized = imageKey.replace(/^\/+/, '');
  const lastSlash = normalized.lastIndexOf('/');
  const dir = lastSlash >= 0 ? normalized.slice(0, lastSlash) : '';
  const file = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;

  if (dir === 'thumbs' || dir.endsWith('/thumbs')) {
    return normalized;
  }

  const base = file.replace(/\.[^.]+$/, '') || 'image';
  return dir ? `${dir}/thumbs/${base}.webp` : `thumbs/${base}.webp`;
}

export function isThumbObjectKey(key: string): boolean {
  return /(^|\/)thumbs\//.test(key.replace(/^\/+/, ''));
}

/**
 * Сжимает изображение. Для загрузки товаров передавайте `force: true`,
 * чтобы сжатие не зависело от ENABLE_IMAGE_COMPRESSION.
 */
export async function compressImage(
  buffer: Buffer,
  options: ImageCompressionOptions = {},
  force = false,
): Promise<Buffer> {
  if (!force && process.env.ENABLE_IMAGE_COMPRESSION !== 'true') {
    return buffer;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    let image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.format) {
      return buffer;
    }

    const outputFormat = opts.format;

    if (metadata.width && metadata.height) {
      const { width, height } = calculateDimensions(
        metadata.width,
        metadata.height,
        opts.maxWidth,
        opts.maxHeight,
      );

      if (width !== metadata.width || height !== metadata.height) {
        image = image.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
    }

    let compressedBuffer: Buffer;

    if (outputFormat === 'webp') {
      compressedBuffer = await image
        .webp({ quality: opts.quality, effort: 6 })
        .toBuffer();
    } else if (outputFormat === 'jpeg') {
      compressedBuffer = await image
        .jpeg({ quality: opts.quality, mozjpeg: true })
        .toBuffer();
    } else {
      compressedBuffer = await image
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
    }

    let quality = opts.quality;
    while (compressedBuffer.length > opts.maxFileSize && quality > 45) {
      quality -= 5;
      if (outputFormat === 'webp') {
        compressedBuffer = await image.webp({ quality, effort: 6 }).toBuffer();
      } else if (outputFormat === 'jpeg') {
        compressedBuffer = await image
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
      } else {
        break;
      }
    }

    // Still too large: shrink dimensions further.
    if (
      compressedBuffer.length > opts.maxFileSize &&
      metadata.width &&
      metadata.height
    ) {
      let scale = 0.85;
      while (compressedBuffer.length > opts.maxFileSize && scale > 0.4) {
        const w = Math.max(
          320,
          Math.round((metadata.width || opts.maxWidth) * scale),
        );
        const h = Math.max(
          320,
          Math.round((metadata.height || opts.maxHeight) * scale),
        );
        const resized = sharp(buffer).resize(w, h, {
          fit: 'inside',
          withoutEnlargement: true,
        });
        compressedBuffer =
          outputFormat === 'webp'
            ? await resized.webp({ quality: Math.min(quality, 70), effort: 6 }).toBuffer()
            : await resized.jpeg({ quality: Math.min(quality, 70), mozjpeg: true }).toBuffer();
        scale -= 0.1;
      }
    }

    return compressedBuffer;
  } catch (error) {
    throw new BadRequestException(
      `Ошибка обработки изображения: ${error.message}`,
    );
  }
}

function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

/**
 * Миниатюра главной фотографии товара (квадрат для таблицы).
 */
export async function createThumbnail(
  buffer: Buffer,
  size: number = PRODUCT_THUMB_SIZE,
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(size, size, {
      fit: 'cover',
      position: 'centre',
    })
    .webp({ quality: PRODUCT_THUMB_QUALITY, effort: 6 })
    .toBuffer();
}
