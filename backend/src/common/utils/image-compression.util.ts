import sharp from 'sharp';
import { BadRequestException } from '@nestjs/common';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxFileSize?: number; // в байтах
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 85,
  format: 'webp',
  maxFileSize: 500 * 1024, // 500KB
};

/**
 * Сжимает изображение с сохранением качества
 * @param buffer - буфер изображения
 * @param options - опции сжатия
 * @returns сжатый буфер изображения
 */
export async function compressImage(
  buffer: Buffer,
  options: ImageCompressionOptions = {},
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    let image = sharp(buffer);
    const metadata = await image.metadata();

    // Определяем формат, если не указан
    const outputFormat = opts.format || (metadata.format === 'png' ? 'png' : 'jpeg');

    // Изменяем размер, если нужно
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

    // Применяем сжатие в зависимости от формата
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
      // PNG - используем оптимизацию без потери качества
      compressedBuffer = await image
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
    }

    // Если файл все еще слишком большой, уменьшаем качество
    let quality = opts.quality;
    while (compressedBuffer.length > opts.maxFileSize && quality > 50) {
      quality -= 5;
      if (outputFormat === 'webp') {
        compressedBuffer = await image.webp({ quality, effort: 6 }).toBuffer();
      } else if (outputFormat === 'jpeg') {
        compressedBuffer = await image.jpeg({ quality, mozjpeg: true }).toBuffer();
      } else {
        break; // PNG не сжимается с потерей качества
      }
    }

    return compressedBuffer;
  } catch (error) {
    throw new BadRequestException(`Ошибка обработки изображения: ${error.message}`);
  }
}

/**
 * Вычисляет оптимальные размеры изображения с сохранением пропорций
 */
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
 * Создает миниатюру изображения
 */
export async function createThumbnail(
  buffer: Buffer,
  size: number = 300,
): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 80 })
    .toBuffer();
}

