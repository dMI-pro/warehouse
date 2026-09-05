import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.35,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  fileType: 'image/webp',
};

/**
 * Сжимает изображение на клиенте перед загрузкой.
 * Для товаров сжатие всегда включено (сервер всё равно пережмёт).
 */
export async function compressImageFile(
  file: File,
  options: CompressionOptions = {},
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const fileType = file.type || opts.fileType || 'image/webp';

    const compressedFile = await imageCompression(file, {
      maxSizeMB: opts.maxSizeMB || 0.35,
      maxWidthOrHeight: opts.maxWidthOrHeight || 1600,
      useWebWorker: opts.useWebWorker !== false,
      fileType: fileType.includes('webp') ? 'image/webp' : fileType,
      initialQuality: 0.8,
    });
    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'image';
    const targetName = `${baseName}.webp`;
    const needsRename = !(compressedFile instanceof File) || !/\.[a-z0-9]+$/i.test(compressedFile.name);
    const finalFile = needsRename
      ? new File([compressedFile], targetName, { type: 'image/webp' })
      : compressedFile;

    return finalFile;
  } catch (error) {
    console.error('Ошибка сжатия изображения:', error);
    return file;
  }
}

/**
 * Создает превью изображения
 * @param file - файл изображения
 * @param maxSize - максимальный размер превью
 * @returns URL превью
 */
export function createImagePreview(
  file: File,
  maxSize: number = 300,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Не удалось создать canvas контекст'));
          return;
        }

        // Вычисляем размеры с сохранением пропорций
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

