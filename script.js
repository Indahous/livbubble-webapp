// script.js

// Глобальные переменные
let tasks = [];
let completedTasks = 0;
let bubblesPopped = 0;

// Элементы DOM
const bubblesContainer = document.getElementById('bubbles');
const completeButton = document.getElementById('complete');
const taskModal = document.getElementById('task-modal');
const taskTitle = document.getElementById('task-title');
const taskContent = document.getElementById('task-content');
const modalCloseButton = document.querySelector('#task-modal button');

// Загрузка заданий с сервера
async function loadTasks() {
  try {
    const response = await fetch('/tasks.json');
    if (!response.ok) throw new Error('Не удалось загрузить tasks.json');
    const data = await response.json();
    tasks = data.priority_tasks || [];
    console.log('✅ Задания загружены:', tasks);
  } catch (error) {
    console.error('❌ Ошибка загрузки заданий:', error);
    // Для отладки: подставим тестовые задания, если файл недоступен
    tasks = [
      {
        id: 1,
        type: 'subscribe',
        title: 'Подписаться на канал',
        link: 'https://t.me/livbubble'
      },
      {
        id: 2,
        type: 'question',
        title: 'Кто написал "Войну и мир"?',
        correct_answer: 'Толстой',
        case_sensitive: false
      }
    ];
  }
}

// Показать модальное окно с заданием
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

// Закрыть модальное окно
function closeTaskModal() {
  taskModal.style.display = 'none';
  const input = document.getElementById('answer-input');
  if (input) input.value = '';
}

// Лопнуть пузырь
function popBubble(bubble) {
  if (bubble.classList.contains('popped')) return;
  bubble.classList.add('popped');
  bubblesPopped++;

  // Если ещё не все задания выполнены — показать следующее
  if (completedTasks < tasks.length && tasks[completedTasks]) {
    showTaskModal(tasks[completedTasks]);
    completedTasks++;
    checkGameCompletion();
  }

  // Вибрация (если поддерживается)
  if ('vibrate' in navigator) {
    navigator.vibrate(100);
  }
}

// Проверка завершения игры
function checkGameCompletion() {
  if (completedTasks >= 5) {
    setTimeout(() => {
      completeButton.style.display = 'block';
    }, 1000);
  }
}

// Обработчик завершения игры
completeButton.addEventListener('click', () => {
  if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    Telegram.WebApp.sendData(JSON.stringify({
      game_completed: true,
      bubbles_popped: bubblesPopped,
      tasks_completed: completedTasks
    }));
  } else {
    console.log('🎮 Игра завершена!', {
      bubbles_popped: bubblesPopped,
      tasks_completed: completedTasks
    });
    alert('Игра завершена! Результат отправлен.');
  }
});

// Генерация пузырей
function createBubbles() {
  for (let i = 0; i < 10; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = '🫧';

    // Случайные координаты
    const randomX = Math.random() * (window.innerWidth - 70);
    const randomY = Math.random() * (window.innerHeight - 70);

    bubble.style.left = `${randomX}px`;
    bubble.style.top = `${randomY}px`;

    bubble.addEventListener('click', () => popBubble(bubble));
    bubblesContainer.appendChild(bubble);
  }
}

// Инициализация игры
window.onload = async () => {
  await loadTasks();
  createBubbles();

  // Проверка, что Telegram WebApp загружен
  if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
  }
};