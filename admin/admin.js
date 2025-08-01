let tasks = [];

// Загрузка заданий
async function loadTasks() {
  try {
    const response = await fetch('/tasks.json');
    const data = await response.json();
    tasks = data.priority_tasks || [];
    renderTasks();
  } catch (e) {
    tasks = [];
    renderTasks();
  }
}

// Отображение заданий
function renderTasks() {
  const container = document.getElementById('tasks-list');
  container.innerHTML = '';
  tasks.forEach((task, index) => {
    const taskEl = document.createElement('div');
    taskEl.className = 'task';
    taskEl.innerHTML = `
      <div>
        <input type="text" placeholder="Название" value="${task.title || ''}" oninput="updateTask(${index}, 'title', this.value)">
        <select onchange="updateTask(${index}, 'type', this.value)" value="${task.type || 'question'}">
          <option value="subscribe" ${task.type === 'subscribe' ? 'selected' : ''}>Подписаться</option>
          <option value="buy" ${task.type === 'buy' ? 'selected' : ''}>Купить</option>
          <option value="question" ${task.type === 'question' ? 'selected' : ''}>Вопрос</option>
        </select>
        <input type="text" placeholder="Ссылка" value="${task.link || ''}" oninput="updateTask(${index}, 'link', this.value)">
        <input type="text" placeholder="Правильный ответ" value="${task.correct_answer || ''}" oninput="updateTask(${index}, 'correct_answer', this.value)">
      </div>
      <button onclick="removeTask(${index})">Удалить</button>
    `;
    container.appendChild(taskEl);
  });
}

// Обновление задания
function updateTask(index, field, value) {
  tasks[index][field] = value;
}

// Добавить задание
function addTask() {
  tasks.push({ title: '', type: 'question', link: '', correct_answer: '' });
  renderTasks();
}

// Удалить задание
function removeTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

// Сохранить задания
async function saveTasks() {
  const response = await fetch('/save-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority_tasks: tasks })
  });

  if (response.ok) {
    alert('Задания сохранены!');
  } else {
    alert('Ошибка сохранения');
  }
}

// Загрузка при старте
window.onload = loadTasks;
