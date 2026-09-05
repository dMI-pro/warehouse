import { Logger } from '@nestjs/common';
import { MinioService } from '../../minio/minio.service';
import {
  createThumbnail,
  thumbKeyFromImageKey,
} from './image-compression.util';

const logger = new Logger('ProductImageThumb');

export async function removeThumbnailForImage(
  minio: MinioService,
  imageKey: string | null | undefined,
): Promise<void> {
  if (!imageKey) return;
  await minio.deleteFileQuietly(thumbKeyFromImageKey(imageKey));
}

/** Build/replace thumbnail object for the product main image (images[0]). */
export async function ensureMainThumbnail(
  minio: MinioService,
  mainKey: string | null | undefined,
): Promise<void> {
  if (!mainKey) return;
  try {
    const buffer = await minio.getObjectBuffer(mainKey);
    const thumb = await createThumbnail(buffer);
    await minio.uploadBuffer(
      thumbKeyFromImageKey(mainKey),
      thumb,
      'image/webp',
    );
  } catch (err: any) {
    logger.warn(
      `Failed to ensure thumbnail for ${mainKey}: ${err?.message || err}`,
    );
  }
}

/**
 * When the main photo changes (reorder / delete / new first upload):
 * drop old thumb, generate thumb only for the new images[0].
 */
export async function syncMainImageThumbnail(
  minio: MinioService,
  previousMain: string | null | undefined,
  nextMain: string | null | undefined,
): Promise<void> {
  const prev = previousMain || null;
  const next = nextMain || null;
  if (prev === next) {
    // Same main: still ensure thumb exists (legacy products without thumb).
    if (next) await ensureMainThumbnail(minio, next);
    return;
  }
  if (prev) await removeThumbnailForImage(minio, prev);
  if (next) await ensureMainThumbnail(minio, next);
}
