let tasks = [];
let completedTasks = 0;

async function loadTasks() {
  try {
    const response = await fetch('/tasks.json');
    const data = await response.json();
    tasks = data.priority_tasks;
  } catch (e) {
    console.error("Не удалось загрузить задания:", e);
  }
}

function showTaskModal(task) {
  const modal = document.getElementById('task-modal');
  const title = document.getElementById('task-title');
  const content = document.getElementById('task-content');

  title.textContent = task.title;

  if (task.type === 'question') {
    content.innerHTML = `
      <input type="text" id="answer-input" placeholder="Введите ответ">
      <button onclick="checkAnswer('${task.correct_answer}', ${task.case_sensitive})">Проверить</button>
    `;
  } else {
    content.innerHTML = `
      <a href="${task.link}" target="_blank" class="task-btn">Перейти</a>
    `;
  }

  modal.style.display = 'flex';
}

function checkAnswer(correct, caseSensitive) {
  const input = document.getElementById('answer-input').value.trim();
  const userAnswer = caseSensitive ? input : input.toLowerCase();
  const correctAnswer = caseSensitive ? correct : correct.toLowerCase();

  if (userAnswer === correctAnswer) {
    alert('Правильно!');
    Telegram.WebApp.sendData(JSON.stringify({ task_completed: true, task_id: tasks[completedTasks].id }));
    closeTaskModal();
  } else {
    alert('Неверно! Попробуй ещё раз.');
  }
}

function closeTaskModal() {
  document.getElementById('task-modal').style.display = 'none';
}

function popBubble(bubble) {
  bubble.classList.add('popped');
  playPopSound();
  createSplashEffect(bubble);
  vibrate();
}

function playPopSound() {
  const audio = new Audio('/assets/pop.mp3');
  audio.play();
}

function createSplashEffect(bubble) {
  for (let i = 0; i < 8; i++) {
    const splash = document.createElement('div');
    splash.className = 'splash';
    const angle = Math.random() * 360;
    const distance = 20 + Math.random() * 30;
    splash.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: white;
      border-radius: 50%;
      left: ${bubble.offsetLeft + 30}px;
      top: ${bubble.offsetTop + 30}px;
      transform: translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px);
      opacity: 0;
      animation: fadeOut 0.5s forwards;
    `;
    document.body.appendChild(splash);
    setTimeout(() => splash.remove(), 500);
  }
}

function vibrate() {
  if ('vibrate' in navigator) {
    navigator.vibrate(100);
  }
}

// Генерация пузырей
window.onload = async () => {
  await loadTasks();
  const bubbles = document.getElementById('bubbles');

  for (let i = 0; i < 10; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = '🫧';
    bubble.addEventListener('click', () => {
      if (bubble.classList.contains('popped')) return;

      if (completedTasks < 5 && tasks[completedTasks]) {
        showTaskModal(tasks[completedTasks]);
        completedTasks++;
      } else {
        popBubble(bubble);
      }

      if (completedTasks === 5) {
        setTimeout(() => document.getElementById('complete').style.display = 'block', 1000);
      }
    });
    bubbles.appendChild(bubble);
  }
};
