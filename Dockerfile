# Используем Node.js вместо Nginx
FROM node:18-alpine

# Рабочая директория
WORKDIR /usr/src/app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем остальные файлы
COPY . .

# Устанавливаем порт
EXPOSE 8080

# Запускаем сервер
CMD ["node", "server.js"]
