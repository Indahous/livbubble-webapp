// script.js — Финальная версия

let tasks = [];
let completedTasks = 0;
let bubblesPopped = 0;

const bubblesContainer = document.getElementById('bubbles');
const completeButton = document.getElementById('complete');
const taskModal = document.getElementById('task-modal');
const taskTitle = document.getElementById('task-title');
const taskContent = document.getElementById('task-content');
const modalCloseButton = document.querySelector('#task-modal button');

// Разрешение на автовоспроизведение
let audioContext;
if ('AudioContext' in window || 'webkitAudioContext' in window) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
}
document.body.addEventListener('touchstart', () => {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}, { once: true });

// Загрузка заданий
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

// Показать модальное окно
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

// Эффект брызг
function createSplash(x, y) {
  const splash = document.createElement('div');
  splash.className = 'splash';
  splash.style.left = `${x}px`;
  splash.style.top = `${y}px`;
  document.body.appendChild(splash);

  setTimeout(() => {
    splash.remove();
  }, 1000);
}

// Лопнуть пузырь
function popBubble(bubble, x, y) {
  if (bubble.classList.contains('popped')) return;
  bubble.classList.add('popped');

  // Вибрация
  if ('vibrate' in navigator) {
    navigator.vibrate(100);
  }

  // Звук
  const popSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-balloon-pop-2564.mp3');
  popSound.volume = 0.3;
  popSound.play().catch(() => {});

  // Эффект брызг
  createSplash(x, y);

  bubblesPopped++;

  // Показать задание ТОЛЬКО если у пузыря есть метка
  if (bubble.dataset.hasTask === 'true' && completedTasks < tasks.length && tasks[completedTasks]) {
    showTaskModal(tasks[completedTasks]);
    completedTasks++;
    checkGameCompletion();
  }
}

function checkGameCompletion() {
  if (completedTasks >= 5) {
    setTimeout(() => {
      completeButton.style.display = 'block';
    }, 1000);
  }
}

completeButton.addEventListener('click', () => {
  if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    Telegram.WebApp.sendData(JSON.stringify({
      game_completed: true,
      bubbles_popped: bubblesPopped,
      tasks_completed: completedTasks
    }));
  } else {
    alert('Игра завершена!');
  }
});

// Генерация пузырей
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

// Инициализация
window.onload = async () => {
  await loadTasks();
  createBubbles();
  if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
  }
};
