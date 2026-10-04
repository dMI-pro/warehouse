# backend/Dockerfile
FROM node:20-alpine

# Устанавливаем необходимые библиотеки для Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Копируем Prisma схему
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Генерируем Prisma клиент
RUN npx prisma generate

# Копируем остальной код
COPY . .

# Открываем порт
EXPOSE 3000

# Команда запуска
CMD ["npm", "run", "start:dev"] 