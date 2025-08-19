// script.js — Полная версия с Haptic Feedback, вибрацией и звуком

let tasks = [];
let completedTasks = 0;
let bubblesPopped = 0;

// DOM-элементы
const bubblesContainer = document.getElementById('bubbles');
const completeButton = document.getElementById('complete');
const taskModal = document.getElementById('task-modal');
const taskTitle = document.getElementById('task-title');
const taskContent = document.getElementById('task-content');
const soundButton = document.getElementById('toggle-sound');
const vibrationButton = document.getElementById('toggle-vibration');

// Аудио
const startSound = document.getElementById('start-sound');
const popSound = document.getElementById('pop-sound');

// Состояние
let isSoundEnabled = true;
let isVibrationEnabled = true;

// ================
// Активация вибрации и звука при первом взаимодействии
// ================

// Активация вибрации и звука при первом касании
document.body.addEventListener('touchstart', activateFeedback, { once: true });
document.body.addEventListener('click', activateFeedback, { once: true });

function activateFeedback() {
  // Активация вибрации (для Android)
  if ('vibrate' in navigator) {
    navigator.vibrate(1);
  }

  // Активация звука
  if (isSoundEnabled && startSound) {
    startSound.play().catch(e => console.warn("❌ Не удалось воспроизвести стартовую музыку:", e));
  }

  // Активация Haptic Feedback (Telegram)
  if (typeof Telegram !== 'undefined' && Telegram.WebApp.HapticFeedback) {
    Telegram.WebApp.HapticFeedback.impactOccurred('light');
  }
}

// ================
// Загрузка заданий
// ================

async function loadTasks() {
  try {
    const response = await fetch('/tasks.json');
    const data = await response.json();
    tasks = data.priority_tasks || [];
    console.log('✅ Задания загружены:', tasks);
  } catch (error) {
    console.error('❌ Ошибка загрузки заданий:', error);
  }
}

// ================
// Модальное окно с заданием
// ================

function showTaskModal(task) {
  taskTitle.textContent = task.title;
  taskContent.innerHTML = '';

  if (task.type === 'subscribe' || task.type === 'buy') {
    const link = document.createElement('a');
    link.href = task.link;
    link.target = '_blank';
    link.textContent = 'Перейти к заданию';
    link.className = 'task-btn';
    taskContent.appendChild(link);
  }

  if (task.type === 'question') {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'answer-input';
    input.placeholder = 'Введите ответ';
    input.className = 'task-input';
    taskContent.appendChild(input);

    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Проверить';
    submitBtn.className = 'task-btn';
    submitBtn.onclick = () => {
      const userAnswer = input.value.trim();
      const correctAnswer = task.correct_answer.trim();
      const isCorrect = task.case_sensitive
        ? userAnswer === correctAnswer
        : userAnswer.toLowerCase() === correctAnswer.toLowerCase();

      if (isCorrect) {
        alert('✅ Правильно! Задание выполнено.');
        closeTaskModal();
        completedTasks++;
        checkGameCompletion();
      } else {
        alert('❌ Неверно. Попробуй ещё раз.');
      }
    };
    taskContent.appendChild(submitBtn);
  }

  taskModal.style.display = 'block';
}

function closeTaskModal() {
  taskModal.style.display = 'none';
  const input = document.getElementById('answer-input');
  if (input) input.value = '';
}

// ================
// Эффект брызг
// ================

function createSplash(x, y) {
  const splash = document.createElement('div');
  splash.className = 'splash';
  splash.style.left = `${x}px`;
  splash.style.top = `${y}px`;
  splash.style.setProperty('--x', `${Math.random() * 20 - 10}px`);
  splash.style.setProperty('--y', `${Math.random() * 20 - 10}px`);
  document.body.appendChild(splash);

  setTimeout(() => {
    splash.remove();
  }, 1000);
}

// ================
// Лопнуть пузырь
// ================

function popBubble(bubble, x, y) {
  if (bubble.classList.contains('popped')) return;
  bubble.classList.add('popped');

  // Тактильная обратная связь
  if (isVibrationEnabled) {
    // Приоритет: Haptic Feedback (Telegram, iOS)
    if (typeof Telegram !== 'undefined' && Telegram.WebApp.HapticFeedback) {
      Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    } else if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }

  // Звук
  if (isSoundEnabled && popSound) {
    popSound.currentTime = 0;
    popSound.play().catch(e => console.warn("❌ Не удалось воспроизвести звук:", e));
  }

  // Эффект брызг
  createSplash(x, y);

  bubblesPopped++;

  // Показать задание (если есть)
  if (bubble.dataset.hasTask === 'true' && completedTasks < tasks.length && tasks[completedTasks]) {
    showTaskModal(tasks[completedTasks]);
    completedTasks++;
    checkGameCompletion();
  }
}

// ================
// Проверка завершения игры
// ================

function checkGameCompletion() {
  if (completedTasks >= 5) {
    setTimeout(() => {
      completeButton.style.display = 'block';
    }, 1000);
  }
}

// ================
// Завершение игры
// ================

completeButton.addEventListener('click', () => {
  if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    Telegram.WebApp.sendData(JSON.stringify({
      game_completed: true,
      bubbles_popped: bubblesPopped,
      tasks_completed: completedTasks
    }));
  } else {
    alert('🎉 Игра завершена! Результат отправлен.');
  }
});

// ================
// Управление звуком
// ================

soundButton.addEventListener('click', () => {
  isSoundEnabled = !isSoundEnabled;
  if (isSoundEnabled) {
    soundButton.textContent = '🔊 Звук: Вкл';
    if (startSound) startSound.muted = false;
    if (popSound) popSound.muted = false;
  } else {
    soundButton.textContent = '🔇 Звук: Выкл';
    if (startSound) startSound.muted = true;
    if (popSound) popSound.muted = true;
  }
});

// ================
// Управление вибрацией
// ================

vibrationButton.addEventListener('click', () => {
  isVibrationEnabled = !isVibrationEnabled;
  if (isVibrationEnabled) {
    vibrationButton.textContent = '📳 Вибрация: Вкл';
    // Краткая вибрация для подтверждения
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    if (typeof Telegram !== 'undefined' && Telegram.WebApp.HapticFeedback) {
      Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  } else {
    vibrationButton.textContent = '📴 Вибрация: Выкл';
  }
});

// ================
// Генерация пузырей
// ================

function createBubbles() {
  const count = 100;
  const taskIndices = new Set();
  while (taskIndices.size < 5) {
    taskIndices.add(Math.floor(Math.random() * count));
  }

  for (let i = 0; i < count; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const size = Math.random() * 40 + 40;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    const randomX = Math.random() * (window.innerWidth - size);
    const randomY = Math.random() * (window.innerHeight - size);
    bubble.style.left = `${randomX}px`;
    bubble.style.top = `${randomY}px`;
    if (taskIndices.has(i)) {
      bubble.dataset.hasTask = 'true';
    }
    bubble.addEventListener('click', (e) => {
      popBubble(bubble, e.clientX, e.clientY);
    });
    bubblesContainer.appendChild(bubble);
  }
}

// ================
// Инициализация
// ================

window.onload = async () => {
  await loadTasks();
  createBubbles();

  // Подготовка Telegram WebApp
  if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
  }
};
