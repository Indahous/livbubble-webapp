// Глобальный массив задач
let tasks = [];
const tasksList = document.getElementById('tasks-list');

// Загрузка заданий
async function loadTasks() {
  try {
    const response = await fetch('/tasks.json');
    const data = await response.json();
    tasks = data.priority_tasks || [];
    renderTasks();
  } catch (error) {
    console.error('❌ Ошибка загрузки заданий:', error);
    tasks = [];
    renderTasks();
  }
}

// Отображение всех заданий
function renderTasks() {
  tasksList.innerHTML = '';
  tasks.forEach((task, index) => {
    const taskEl = document.createElement('div');
    taskEl.className = 'task';
    taskEl.innerHTML = `
      <div>
        <input type="text" placeholder="Название" value="${task.title || ''}" oninput="updateTask(${index}, 'title', this.value)">
        <select onchange="updateTask(${index}, 'type', this.value)">
          <option value="subscribe" ${task.type === 'subscribe' ? 'selected' : ''}>Подписаться</option>
          <option value="buy" ${task.type === 'buy' ? 'selected' : ''}>Купить</option>
          <option value="question" ${task.type === 'question' ? 'selected' : ''}>Вопрос</option>
        </select>
        <input type="text" placeholder="Ссылка (если есть)" value="${task.link || ''}" oninput="updateTask(${index}, 'link', this.value)">
        <input type="text" placeholder="Правильный ответ (для вопросов)" value="${task.correct_answer || ''}" oninput="updateTask(${index}, 'correct_answer', this.value)">
      </div>
      <button onclick="removeTask(${index})">🗑️ Удалить</button>
    `;
    tasksList.appendChild(taskEl);
  });
}

// Обновление поля задания
function updateTask(index, field, value) {
  tasks[index][field] = value;
}

// Добавить новое задание
function addTask() {
  tasks.push({
    title: '',
    type: 'question',
    link: '',
    correct_answer: ''
  });
  renderTasks();
}

// Удалить задание
function removeTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

// Сохранить задания
async function saveTasks() {
  const password = prompt("🔒 Введите пароль администратора:");
  if (!password) return;
  try {
    const response = await fetch('/save-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, priority_tasks: tasks })
    });
    const data = await response.json();
    if (data.success) {
      alert('✅ Задания успешно сохранены!');
    } else {
      alert(`❌ ${data.message}`);
    }
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    alert('⚠️ Ошибка сети. Попробуйте позже.');
  }
}

// Загрузка при старте
window.onload = loadTasks;
