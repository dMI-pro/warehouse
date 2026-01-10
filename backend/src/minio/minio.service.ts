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

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'antiquar-products');
    
    const endPoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = parseInt(this.configService.get<string>('MINIO_PORT', '9000'));
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin');

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
        
        // Set public read policy
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
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        
        this.logger.log(`Bucket ${this.bucketName} created successfully with public read policy.`);
      }
    } catch (err) {
      this.logger.error(`Error checking/creating bucket: ${err.message}`, err.stack);
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'products'): Promise<string> {
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

  getPublicUrl(fileName: string): string {
    const publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL', 'http://localhost:9000');
    return `${publicUrl}/${this.bucketName}/${fileName}`;
  }
}
