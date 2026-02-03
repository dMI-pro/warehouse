import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
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
      this.usePresigned = this.configService.get<string>('NODE_ENV') === 'production';
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
    const fileName = `${folder}/${uuidv4()}${fileExt}`;
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
    const publicUrl = this.configService.get<string>(
      'MINIO_PUBLIC_URL',
      'http://localhost:9000',
    );
    return `${publicUrl}/${this.bucketName}/${fileName}`;
  }

  getKeyFromUrl(url: string): string | null {
    try {
      const u = new URL(url);
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
}
