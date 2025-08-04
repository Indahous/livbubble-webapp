// admin.js
async function saveTasks() {
  const password = prompt("🔐 Введите пароль администратора:");
  if (!password) return;

  try {
    const response = await fetch('/save-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, priority_tasks: tasks })
    });

    const data = await response.json();
    if (data.success) {
      alert('✅ Задания сохранены!');
    } else {
      alert(`❌ ${data.message}`);
    }
  } catch (e) {
    alert('⚠️ Ошибка сети');
  }
}