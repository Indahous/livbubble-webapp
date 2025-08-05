// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Пароль из .env
require('dotenv').config();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
    console.error("❌ КРИТИЧЕСКАЯ ОШИБКА: Переменная окружения ADMIN_PASSWORD не установлена!");
    process.exit(1); // Останавливаем приложение
} else {
    console.log("✅ ADMIN_PASSWORD успешно загружен из переменных окружения.");
}

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Роуты
app.get('/admin/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.post('/check-password', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false, message: 'Пароль не предоставлен' });
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Неверный пароль' });
});

app.get('/tasks.json', async (req, res) => {
  try {
    const data = await fs.readFile('tasks.json', 'utf8');
    res.json(JSON.parse(data));
  } catch {
    res.json({ priority_tasks: [] });
  }
});

app.post('/save-tasks', async (req, res) => {
  const { password, priority_tasks } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false, message: 'Неверный пароль' });
  try {
    await fs.writeFile('tasks.json', JSON.stringify({ priority_tasks }, null, 2));
    res.json({ success: true, message: 'Задания сохранены!' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Ошибка сохранения' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));