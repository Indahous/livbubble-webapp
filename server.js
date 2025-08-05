// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// 🔐 Пароль из переменных окружения (не в коде!)
require('dotenv').config();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('❌ Ошибка: ADMIN_PASSWORD не задан в переменных окружения');
  process.exit(1);
}

console.log('✅ ADMIN_PASSWORD успешно загружен из переменных окружения.');

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Роуты

// Страница входа
app.get('/admin/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/index.html'));
});

// Проверка пароля
app.post('/check-password', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Пароль не предоставлен' });
  }
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Неверный пароль' });
});

// Загрузка заданий
app.get('/tasks.json', async (req, res) => {
  try {
    const data = await fs.readFile('tasks.json', 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.warn('⚠️ tasks.json не найден, возвращаем пустой список');
    res.json({ priority_tasks: [] });
  }
});

// Сохранение заданий
app.post('/save-tasks', async (req, res) => {
  const { password, priority_tasks } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Неверный пароль' });
  }
  try {
    await fs.writeFile('tasks.json', JSON.stringify({ priority_tasks }, null, 2));
    console.log('✅ Задания успешно сохранены');
    res.json({ success: true, message: 'Задания сохранены!' });
  } catch (err) {
    console.error('❌ Ошибка сохранения:', err);
    res.status(500).json({ success: false, message: 'Ошибка сохранения' });
  }
});

// Статический контент для админ-панели
app.use('/admin-panel', express.static(path.join(__dirname, 'admin-panel')));

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
