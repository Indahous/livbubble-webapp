// server.js - Основной серверный файл приложения Liv Bubble

// 1. Импорты необходимых модулей
require('dotenv').config(); // Загружает переменные окружения из .env
const express = require('express');
const fs = require('fs').promises; // Используем промисифицированную версию fs
const path = require('path');

// 2. Инициализация приложения Express
const app = express();
const PORT = process.env.PORT || 8080;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// 3. Middleware
// Middleware для парсинга JSON в теле запроса (например, для POST-запросов)
app.use(express.json());

// --- Настройка обслуживания статических файлов ---
// Middleware для обслуживания статических файлов из папки 'admin' по пути '/admin'
// Это позволит загружать admin.css и admin.js по адресам /admin/admin.css и /admin/admin.js
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Middleware для обслуживания статических файлов из папки 'admin-panel' по пути '/admin-panel'
// Это позволит загружать index.html и другие файлы из admin-panel по адресам /admin-panel/...
app.use('/admin-panel', express.static(path.join(__dirname, 'admin-panel')));

// Middleware для обслуживания статических файлов из корня проекта (для index.html, style.css, script.js, tasks.json)
// Предполагается, что основной сайт находится в корне. Если у вас есть папка 'public', замените '.' на 'public'.
app.use(express.static(path.join(__dirname))); // Или path.join(__dirname, 'public') если файлы там

// 4. Маршруты API

// --- Маршрут для проверки пароля (используется на странице входа /admin) ---
app.post('/check-password', (req, res) => {
    const { password } = req.body;
    console.log(`Попытка входа с паролем: ${password}`); // Для отладки
    if (password === ADMIN_PASSWORD) {
        console.log('✅ Вход в админ-панель разрешен');
        return res.json({ success: true, message: 'Пароль верный' });
    } else {
        console.log('❌ Вход в админ-панель запрещен: неверный пароль');
        return res.status(401).json({ success: false, message: 'Неверный пароль' });
    }
});

// --- Маршрут для получения заданий (используется в админке и на основном сайте) ---
app.get('/tasks.json', async (req, res) => {
    try {
        // Читаем файл tasks.json
        const data = await fs.readFile(path.join(__dirname, 'tasks.json'), 'utf8');
        // Парсим JSON и отправляем клиенту
        res.json(JSON.parse(data));
        console.log('✅ Задания успешно отправлены клиенту');
    } catch (err) {
        console.error('❌ Ошибка чтения файла tasks.json:', err);
        // Отправляем пустой массив, если файл не найден или ошибка
        res.status(500).json({ priority_tasks: [] });
    }
});

// --- Маршрут для добавления нового пустого задания (через админку) ---
// Примечание: Эта функциональность уже частично реализована в admin.js через push в массив.
// Этот маршрут может быть избыточным, если admin.js напрямую модифицирует массив в памяти,
// а сохранение происходит через /save-tasks. Оставлен для совместимости или если нужна серверная логика.
app.post('/add-task', (req, res) => {
    const { password } = req.body;
    console.log('Попытка добавить задание через API /add-task');
    if (password !== ADMIN_PASSWORD) {
        console.log('❌ Отказано в добавлении задания: неверный пароль');
        return res.status(401).json({ success: false, message: 'Неверный пароль' });
    }
    // Логика добавления задания на сервере (если бы она была нужна здесь)
    // Но в текущей реализации admin.js это делает клиент
    res.json({ success: true, message: 'Задание добавлено! (на клиенте)' });
    console.log('✅ Задание добавлено (API вызван, но логика на клиенте)');
});

// --- Маршрут для сохранения всех заданий (из админки) ---
app.post('/save-tasks', async (req, res) => {
    const { password, priority_tasks } = req.body;
    console.log('Попытка сохранить задания через API /save-tasks');
    if (password !== ADMIN_PASSWORD) {
        console.log('❌ Отказано в сохранении заданий: неверный пароль');
        return res.status(401).json({ success: false, message: 'Неверный пароль' });
    }
    try {
        // Записываем полученные данные в файл tasks.json
        await fs.writeFile(path.join(__dirname, 'tasks.json'), JSON.stringify({ priority_tasks }, null, 2));
        console.log('✅ Задания успешно сохранены в файл tasks.json');
        res.json({ success: true, message: 'Задания успешно сохранены!' });
    } catch (err) {
        console.error('❌ Ошибка сохранения файла tasks.json:', err);
        res.status(500).json({ success: false, message: 'Ошибка сохранения на сервере' });
    }
});

// 5. Маршруты для страниц (чтобы Express знал, какие HTML-файлы отдавать)

// --- Маршрут для главной страницы сайта ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Или path.join(__dirname, 'public', 'index.html')
    console.log('🏠 Отправлена главная страница index.html');
});

// --- Маршрут для страницы входа в админку ---
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
    console.log('🔐 Отправлена страница входа admin/index.html');
});

// --- Маршрут для админ-панели ---
// Обрабатывает прямой переход по /admin-panel/ (без index.html в URL)
app.get('/admin-panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
    console.log('🎯 Отправлена админ-панель admin-panel/index.html');
});

// 6. Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен и слушает порт ${PORT}`);
    console.log(`🔗 Локальный адрес: http://localhost:${PORT}`);
});

