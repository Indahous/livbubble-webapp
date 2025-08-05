require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Загрузка задач
app.get('/tasks.json', (req, res) => {
  fs.readFile('tasks.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Ошибка чтения файла tasks.json');
      return;
    }
    res.json(JSON.parse(data));
  });
});

// Сохранение задач
app.post('/save-tasks', async (req, res) => {
  const { password, priority_tasks } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Неверный пароль' });
  }
  try {
    await fs.writeFile('tasks.json', JSON.stringify({ priority_tasks }, null, 2));
    res.json({ success: true, message: 'Задания сохранены!' });
  } catch (err) {
    console.error('Ошибка сохранения:', err);
    res.status(500).json({ success: false, message: 'Ошибка сохранения' });
  }
});

// Старт сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
