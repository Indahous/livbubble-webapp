// server.js — Основной серверный файл приложения Liv Bubble
require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 8080;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
    console.error("❌ КРИТИЧЕСКАЯ ОШИБКА: Переменная окружения ADMIN_PASSWORD не установлена в .env файле!");
    process.exit(1);
}

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());

// --- Статические файлы ---
app.use(express.static(path.join(__dirname))); // index.html, style.css, script.js, sound/, и т.д.
app.use('/admin', express.static(path.join(__dirname, 'admin'))); // Админ-панель

// --- Middleware для проверки аутентификации администратора ---
const requireAdminAuth = (req, res, next) => {
    const token = req.cookies.authToken;
    if (token === ADMIN_PASSWORD) {
        return next();
    } else {
        console.log(`⚠️ Попытка несанкционированного доступа к ${req.originalUrl} от ${req.ip}`);
        return res.redirect('/admin');
    }
};

// --- Маршрут для входа в админку ---
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// --- Защищённые маршруты (только для авторизованных админов) ---
app.use('/admin/', requireAdminAuth);

// Маршрут для проверки пароля
app.post('/check-password', (req, res) => {
    const { password } = req.body;
    console.log(`🔐 Попытка входа: ${password ? '***' : '(пусто)'}`);
    if (password === ADMIN_PASSWORD) {
        res.cookie('authToken', ADMIN_PASSWORD, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true на Render
            maxAge: 30 * 60 * 1000,
            sameSite: 'strict'
        });
        return res.json({ success: true, message: 'Пароль верный' });
    } else {
        res.clearCookie('authToken');
        return res.status(401).json({ success: false, message: 'Неверный пароль' });
    }
});

// Маршрут для выхода
app.post('/logout', (req, res) => {
    res.clearCookie('authToken');
    res.json({ success: true });
});

// Чтение заданий
app.get('/tasks.json', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'tasks.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error('❌ Ошибка чтения tasks.json:', err);
        res.status(500).json({ priority_tasks: [] });
    }
});

// Сохранение заданий (только для админов)
app.post('/save-tasks', requireAdminAuth, async (req, res) => {
    const { priority_tasks } = req.body;
    if (!Array.isArray(priority_tasks)) {
        return res.status(400).json({ success: false, message: 'priority_tasks должен быть массивом' });
    }

    try {
        await fs.writeFile(path.join(__dirname, 'tasks.json'), JSON.stringify({ priority_tasks }, null, 2));
        console.log('✅ Задания сохранены');
        res.json({ success: true, message: 'Задания успешно сохранены!' });
    } catch (err) {
        console.error('❌ Ошибка записи tasks.json:', err);
        res.status(500).json({ success: false, message: 'Ошибка сохранения' });
    }
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Запуск сервера ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🔗 Доступно: http://localhost:${PORT}`);
});
