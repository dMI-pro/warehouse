# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev)
RUN npm ci

# Копируем исходный код
COPY . .

# Открываем порт
EXPOSE 5173

# Команда запуска ДЛЯ РАЗРАБОТКИ
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]