// server.js — Исправленная версия с /tmp

require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
    console.error("❌ КРИТИЧЕСКАЯ ОШИБКА: ADMIN_PASSWORD не установлен!");
    process.exit(1);
}

// --- CORS ---
app.use(cors({
    origin: 'https://livbubble-webapp.onrender.com',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// --- Путь к временному файлу ---
const TASKS_FILE = path.join('/tmp', 'tasks.json');
const DEFAULT_TASKS = path.join(__dirname, 'tasks.json'); // путь к исходному файлу

// --- Инициализация: копируем tasks.json в /tmp при старте ---
async function initTasks() {
    try {
        await fs.access(TASKS_FILE);
        console.log('✅ tasks.json уже в /tmp');
    } catch (err) {
        console.log('📁 Копирую tasks.json из корня в /tmp');
        const data = await fs.readFile(DEFAULT_TASKS, 'utf8');
        await fs.writeFile(TASKS_FILE, data);
        console.log('✅ tasks.json скопирован в /tmp');
    }
}

// --- Статические файлы ---
app.use(express.static(path.join(__dirname)));

// --- Middleware для аутентификации ---
const requireAdminAuth = (req, res, next) => {
    const token = req.cookies.authToken;
    if (token === ADMIN_PASSWORD) {
        return next();
    } else {
        console.log(`⚠️ Попытка несанкционированного доступа к ${req.originalUrl} от ${req.ip}`);
        return res.status(401).json({ 
            success: false, 
            message: 'Требуется авторизация' 
        }); // ✅ Теперь возвращает JSON
    }
};

// --- Маршрут для админки ---
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// --- Защищённые маршруты ---
app.use('/admin/', requireAdminAuth);

// --- Проверка пароля ---
app.post('/check-password', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.cookie('authToken', ADMIN_PASSWORD, {
            httpOnly: true,
            secure: true, // ✅ Render всегда использует HTTPS
            maxAge: 30 * 60 * 1000,
            sameSite: 'lax' // ✅ Разрешает POST-запросы
        });
        return res.json({ success: true, message: 'Пароль верный' });
    } else {
        res.clearCookie('authToken');
        return res.status(401).json({ success: false, message: 'Неверный пароль' });
    }
});

// --- Выход ---
app.post('/logout', (req, res) => {
    res.clearCookie('authToken');
    res.json({ success: true });
});

// --- Чтение заданий ---
app.get('/tasks.json', async (req, res) => {
    try {
        const data = await fs.readFile(TASKS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error('❌ Ошибка чтения из /tmp/tasks.json:', err);
        res.status(500).json({ priority_tasks: [] });
    }
});

// --- Сохранение заданий ---
app.post('/save-tasks', requireAdminAuth, async (req, res) => {
    const { priority_tasks } = req.body;
    if (!Array.isArray(priority_tasks)) {
        return res.status(400).json({ success: false, message: 'priority_tasks должен быть массивом' });
    }

    try {
        await fs.writeFile(TASKS_FILE, JSON.stringify({ priority_tasks }, null, 2));
        console.log('✅ Задания сохранены в /tmp/tasks.json');
        res.json({ success: true, message: 'Задания успешно сохранены!' });
    } catch (err) {
        console.error('❌ Ошибка записи в /tmp/tasks.json:', err);
        res.status(500).json({ success: false, message: 'Ошибка сохранения' });
    }
});

// --- Главная страница ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Запуск сервера ---
app.listen(PORT, '0.0.0.0', async () => {
    await initTasks(); // ← Инициализация /tmp
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
