import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import * as path from 'path';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucketName: string;
  private readonly logger = new Logger(MinioService.name);
  private usePresigned: boolean;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>(
      'MINIO_BUCKET',
      'antiquar-products',
    );

    const endPoint = this.configService.get<string>(
      'MINIO_ENDPOINT',
      'localhost',
    );
    const port = parseInt(this.configService.get<string>('MINIO_PORT', '9000'));
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    const accessKey = this.configService.get<string>(
      'MINIO_ACCESS_KEY',
      'minioadmin',
    );
    const secretKey = this.configService.get<string>(
      'MINIO_SECRET_KEY',
      'minioadmin',
    );

    const presignedConfig = this.configService.get<string>('MINIO_PRESIGNED');
    if (presignedConfig !== undefined) {
      this.usePresigned = presignedConfig === 'true';
    } else {
      this.usePresigned =
        this.configService.get<string>('NODE_ENV') === 'production';
    }

    this.minioClient = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  async onModuleInit() {
    await this.createBucketIfNotExists();
  }

  async createBucketIfNotExists() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');

        // In production/private mode do not set public policy
        if (!this.usePresigned) {
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucketName}/*`],
              },
            ],
          };
          await this.minioClient.setBucketPolicy(
            this.bucketName,
            JSON.stringify(policy),
          );
        }

        this.logger.log(`Bucket ${this.bucketName} created successfully.`);
      }
    } catch (err) {
      this.logger.error(
        `Error checking/creating bucket: ${err.message}`,
        err.stack,
      );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<string> {
    const fileExt = path.extname(file.originalname);
    const originalBase = path.basename(file.originalname, fileExt);
    const safeBase = this.toLatinSlug(originalBase) || 'file';
    const fileName = await this.buildUniqueFileName(folder, safeBase, fileExt);
    const metaData = {
      'Content-Type': file.mimetype,
    };

    try {
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        file.buffer,
        file.size,
        metaData,
      );

      return fileName;
    } catch (err) {
      this.logger.error(`Error uploading file: ${err.message}`, err.stack);
      throw err;
    }
  }

  async uploadBuffer(
    objectName: string,
    buffer: Buffer,
    contentType: string = 'image/webp',
  ): Promise<string> {
    try {
      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        buffer,
        buffer.length,
        { 'Content-Type': contentType },
      );
      return objectName;
    } catch (err) {
      this.logger.error(
        `Error uploading buffer ${objectName}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  async getObjectBuffer(objectName: string): Promise<Buffer> {
    const stream = await this.minioClient.getObject(
      this.bucketName,
      objectName,
    );
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async deleteFileQuietly(fileName: string) {
    try {
      await this.deleteFile(fileName);
    } catch (err: any) {
      if (err?.code === 'NotFound' || err?.code === 'NoSuchKey') return;
      this.logger.warn(
        `Quiet delete failed for ${fileName}: ${err?.message || err}`,
      );
    }
  }

  private async buildUniqueFileName(folder: string, base: string, ext: string) {
    const normalizedFolder = folder.replace(/^\/+|\/+$/g, '');
    const prefix = normalizedFolder ? `${normalizedFolder}/` : '';
    let candidate = `${prefix}${base}${ext}`;
    let counter = 1;
    while (await this.objectExists(candidate)) {
      candidate = `${prefix}${base}-${counter}${ext}`;
      counter += 1;
      if (counter > 1000) {
        candidate = `${prefix}${base}-${Date.now()}${ext}`;
        break;
      }
    }
    return candidate;
  }

  private async objectExists(objectName: string) {
    try {
      await this.minioClient.statObject(this.bucketName, objectName);
      return true;
    } catch (err: any) {
      if (err?.code === 'NotFound' || err?.code === 'NoSuchKey') return false;
      throw err;
    }
  }

  private toLatinSlug(value: string) {
    const map: Record<string, string> = {
      а: 'a',
      б: 'b',
      в: 'v',
      г: 'g',
      д: 'd',
      е: 'e',
      ё: 'e',
      ж: 'zh',
      з: 'z',
      и: 'i',
      й: 'y',
      к: 'k',
      л: 'l',
      м: 'm',
      н: 'n',
      о: 'o',
      п: 'p',
      р: 'r',
      с: 's',
      т: 't',
      у: 'u',
      ф: 'f',
      х: 'h',
      ц: 'ts',
      ч: 'ch',
      ш: 'sh',
      щ: 'sch',
      ъ: '',
      ы: 'y',
      ь: '',
      э: 'e',
      ю: 'yu',
      я: 'ya',
    };
    const lowered = value.toLowerCase();
    let result = '';
    for (const ch of lowered) {
      result += map[ch] ?? ch;
    }
    return result
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async deleteFile(fileName: string) {
    try {
      await this.minioClient.removeObject(this.bucketName, fileName);
    } catch (err) {
      this.logger.error(`Error deleting file: ${err.message}`, err.stack);
      throw err;
    }
  }

  async getPresignedUrl(
    fileName: string,
    expiresSeconds: number = 24 * 60 * 60,
  ) {
    return await this.minioClient.presignedGetObject(
      this.bucketName,
      fileName,
      expiresSeconds,
    );
  }

  async getFileUrl(fileName: string): Promise<string> {
    const isUrl = /^https?:\/\//.test(fileName);
    if (isUrl) {
      const key = this.getKeyFromUrl(fileName);
      if (this.usePresigned && key) {
        return await this.getPresignedUrl(key);
      }
      return fileName;
    }
    if (this.usePresigned) {
      return await this.getPresignedUrl(fileName);
    }

    // Fix: Если fileName уже содержит имя бакета в пути, возвращаем как есть,
    // чтобы избежать дублирования пути (например, если в БД уже лежит полный путь)
    if (fileName.includes(`/${this.bucketName}/`)) {
      return fileName;
    }

    const publicUrl = this.configService.get<string>(
      'MINIO_PUBLIC_URL',
      'http://localhost:9000',
    );

    // Убираем конечный слеш из publicUrl, если он есть
    const normalizedPublicUrl = publicUrl.replace(/\/$/, '');
    // Убираем начальный слеш из fileName, если он есть, чтобы избежать двойных слешей при склеивании
    const normalizedFileName = fileName.startsWith('/')
      ? fileName.substring(1)
      : fileName;

    // Проверка на случай, если fileName уже начинается с publicUrl
    if (
      fileName.startsWith(publicUrl) ||
      fileName.startsWith(normalizedPublicUrl)
    ) {
      return fileName;
    }

    return `${normalizedPublicUrl}/${this.bucketName}/${normalizedFileName}`;
  }

  getKeyFromUrl(url: string): string | null {
    try {
      // Используем dummy base для поддержки относительных URL (например /minio/...)
      const u = new URL(url, 'http://dummy.base');
      const parts = u.pathname.split('/').filter(Boolean);
      const bucketIndex = parts.lastIndexOf(this.bucketName);
      if (bucketIndex >= 0 && bucketIndex < parts.length - 1) {
        const keyParts = parts.slice(bucketIndex + 1);
        const joined = keyParts.join('/');
        if (joined.includes('products/')) {
          const i = joined.lastIndexOf('products/');
          return joined.slice(i);
        }
        return joined;
      }
      return null;
    } catch {
      return null;
    }
  }

  async listObjects(
    prefix: string = '',
    recursive: boolean = true,
  ): Promise<
    Array<{
      name: string;
      size: number;
      lastModified: Date;
      etag?: string;
    }>
  > {
    const objects: Array<{
      name: string;
      size: number;
      lastModified: Date;
      etag?: string;
    }> = [];
    return new Promise((resolve, reject) => {
      const stream = this.minioClient.listObjectsV2(
        this.bucketName,
        prefix,
        recursive,
      );
      stream.on('data', (obj) => {
        if (obj?.name && obj?.size != null && obj?.lastModified) {
          objects.push({
            name: obj.name,
            size: obj.size,
            lastModified: obj.lastModified,
            etag: obj.etag,
          });
        }
      });
      stream.on('error', (err) => {
        this.logger.error(`Error listing objects: ${err.message}`, err.stack);
        reject(err);
      });
      stream.on('end', () => resolve(objects));
    });
  }
}
