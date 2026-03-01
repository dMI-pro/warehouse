import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return this.transform(data);
      }),
    );
  }

  private transform(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.transform(item));
    }

    // Рекурсивно удаляем конфиденциальные поля
    const sensitiveFields = ['password', 'passwordHash', 'secret', 'token'];
    const newData = { ...data };

    for (const field of sensitiveFields) {
      if (field in newData) {
        delete newData[field];
      }
    }

    // Обработка вложенных объектов
    for (const key in newData) {
      if (typeof newData[key] === 'object' && newData[key] !== null) {
        newData[key] = this.transform(newData[key]);
      }
    }

    return newData;
  }
}
