# копируем образ для начальной сбоки
FROM node:22-alpine AS builder
# сздаём рабочую дирректорию (по дефолту app)
WORKDIR /app
# копируем файл с зависимостями
COPY package*.json ./
# инсталим зависимости
RUN npm ci
# копируем файлы проекта
COPY . .
# генерируем призму (делаем генерацию призмы до билда, что бы типы со схем подтянулись в проект)
RUN npx prisma generate
# делаем билд
RUN npm run build

# финальная сборка, копируем образ
FROM node:22-alpine AS runner
# сздаём рабочую дирректорию (по дефолту app)
WORKDIR /app
# копируем файл с зависимостями
COPY package*.json ./
# инсталим зависимости (толлько прод-зависимости)
RUN npm install --omit=dev
# закидываем билд файлик
COPY --from=builder /app/dist ./dist
# закидываем призма файлик
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate