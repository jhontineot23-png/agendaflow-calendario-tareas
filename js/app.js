/* AgendaFlow: calendario de tareas hecho con JavaScript nativo. */
(() => {
  'use strict';

  const STORAGE_KEY = 'agendaflow.tasks.v1';
  const categoryNames = { personal: 'Personal', study: 'Estudio', work: 'Trabajo' };
  const categoryClasses = { personal: 'category-purple', study: 'category-blue', work: 'category-teal' };
  const monthFormatter = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' });
  const longDateFormatter = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const shortDateFormatter = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' });
  const $ = (selector) => document.querySelector(selector);

  let tasks = loadTasks();
  let selectedDate = toISODate(new Date());
  let visibleMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let activeFilter = 'all';
  let toastTimer;

  const elements = {
    welcomeMessage: $('#welcomeMessage'), saveStatus: $('#saveStatus'), totalCount: $('#totalCount'),
    pendingCount: $('#pendingCount'), completedCount: $('#completedCount'), progressPercent: $('#progressPercent'),
    progressBar: $('#progressBar'), calendarGrid: $('#calendarGrid'), monthTitle: $('#monthTitle'),
    selectedDateTitle: $('#selectedDateTitle'), selectedDateSubtitle: $('#selectedDateSubtitle'), taskList: $('#taskList'),
    emptyState: $('#emptyState'), filterAllCount: $('#filterAllCount'), filterPendingCount: $('#filterPendingCount'),
    filterCompletedCount: $('#filterCompletedCount'), modalBackdrop: $('#taskModalBackdrop'), modalTitle: $('#modalTitle'),
    taskForm: $('#taskForm'), taskId: $('#taskId'), taskTitle: $('#taskTitle'), taskDescription: $('#taskDescription'),
    taskDate: $('#taskDate'), taskTime: $('#taskTime'), taskCategory: $('#taskCategory'), toast: $('#toast')
  };

  // Coloca el texto de bienvenida desde la configuración: aquí practicaremos el conflicto.
  if (window.AGENDA_CONFIG && window.AGENDA_CONFIG.welcomeMessage) {
    elements.welcomeMessage.textContent = window.AGENDA_CONFIG.welcomeMessage;
  }

  // Los ejemplos iniciales solo se crean si este navegador aún no tiene datos guardados.
  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return JSON.parse(stored);
    } catch (error) {
      console.warn('No se pudieron leer las tareas guardadas.', error);
    }
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const afterTomorrow = addDays(today, 2);
    return [
      { id: createId(), title: 'Organizar mis prioridades', description: 'Elegir las tres cosas más importantes del día.', date: toISODate(today), time: '09:00', category: 'personal', completed: false, createdAt: Date.now() },
      { id: createId(), title: 'Avanzar el proyecto de clase', description: 'Revisar el código y anotar los siguientes pasos.', date: toISODate(today), time: '16:00', category: 'study', completed: false, createdAt: Date.now() + 1 },
      { id: createId(), title: 'Revisar los pendientes', description: 'Cerrar las tareas terminadas y actualizar la lista.', date: toISODate(tomorrow), time: '11:30', category: 'work', completed: false, createdAt: Date.now() + 2 },
      { id: createId(), title: 'Reservar un momento de descanso', description: 'Hacer una pausa y recargar energía.', date: toISODate(afterTomorrow), time: '', category: 'personal', completed: true, createdAt: Date.now() + 3 }
    ];
  }

  function createId() {
    return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseISODate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function addDays(date, amount) {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() + amount);
    return result;
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      elements.saveStatus.textContent = 'Guardado en este navegador';
    } catch (error) {
      elements.saveStatus.textContent = 'No se pudo guardar';
      console.error('No se pudieron guardar las tareas.', error);
      showToast('No se pudo guardar. Revisa el almacenamiento del navegador.');
    }
  }

  function renderAll() {
    renderStats();
    renderCalendar();
    renderSelectedDate();
  }

  function renderStats() {
    const completed = tasks.filter((task) => task.completed).length;
    const pending = tasks.length - completed;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    elements.totalCount.textContent = tasks.length;
    elements.pendingCount.textContent = pending;
    elements.completedCount.textContent = completed;
    elements.progressPercent.textContent = `${progress}%`;
    elements.progressBar.style.width = `${progress}%`;
  }

  function renderCalendar() {
    elements.monthTitle.textContent = capitalize(monthFormatter.format(visibleMonth));
    elements.calendarGrid.replaceChildren();
    const weekNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    weekNames.forEach((name) => {
      const heading = document.createElement('div');
      heading.className = 'weekday-heading';
      heading.textContent = name;
      heading.setAttribute('role', 'columnheader');
      elements.calendarGrid.append(heading);
    });

    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = addDays(firstDay, -mondayOffset);
    const todayISO = toISODate(new Date());
    for (let index = 0; index < 42; index += 1) {
      const date = addDays(gridStart, index);
      const dateISO = toISODate(date);
      const dayTasks = tasks.filter((task) => task.date === dateISO).sort(sortTasks);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'calendar-day';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `${longDateFormatter.format(date)}, ${dayTasks.length} tareas`);
      if (date.getMonth() !== visibleMonth.getMonth()) cell.classList.add('outside-month');
      if (dateISO === todayISO) cell.classList.add('is-today');
      if (dateISO === selectedDate) cell.classList.add('is-selected');
      const number = document.createElement('span');
      number.className = 'day-number';
      number.textContent = date.getDate();
      cell.append(number);
      if (dayTasks.length) {
        const dots = document.createElement('span');
        dots.className = 'day-task-dots';
        dayTasks.slice(0, 3).forEach((task) => {
          const dot = document.createElement('i');
          dot.className = `day-dot ${categoryClasses[task.category] || categoryClasses.personal}`;
          if (task.completed) dot.classList.add('dot-completed');
          dots.append(dot);
        });
        cell.append(dots);
        const count = document.createElement('span');
        count.className = 'day-task-count';
        count.textContent = `${dayTasks.length} ${dayTasks.length === 1 ? 'tarea' : 'tareas'}`;
        cell.append(count);
      } else {
        const quiet = document.createElement('span');
        quiet.className = 'day-quiet';
        quiet.textContent = '—';
        cell.append(quiet);
      }
      cell.addEventListener('click', () => {
        selectedDate = dateISO;
        if (date.getMonth() !== visibleMonth.getMonth()) visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        renderAll();
      });
      elements.calendarGrid.append(cell);
    }
  }

  function renderSelectedDate() {
    const date = parseISODate(selectedDate);
    const headingDate = longDateFormatter.format(date);
    elements.selectedDateTitle.textContent = capitalize(new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric' }).format(date));
    elements.selectedDateSubtitle.textContent = capitalize(new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(date));
    const allForDay = tasks.filter((task) => task.date === selectedDate).sort(sortTasks);
    const pending = allForDay.filter((task) => !task.completed).length;
    elements.filterAllCount.textContent = allForDay.length;
    elements.filterPendingCount.textContent = pending;
    elements.filterCompletedCount.textContent = allForDay.length - pending;
    elements.taskList.replaceChildren();
    const visibleTasks = allForDay.filter((task) => activeFilter === 'all' || (activeFilter === 'pending' && !task.completed) || (activeFilter === 'completed' && task.completed));
    elements.emptyState.hidden = visibleTasks.length > 0;
    elements.taskList.hidden = visibleTasks.length === 0;
    if (!visibleTasks.length) {
      const emptyCopy = elements.emptyState.querySelector('p');
      emptyCopy.textContent = allForDay.length ? `No hay tareas ${activeFilter === 'pending' ? 'pendientes' : 'completadas'} para este día.` : `No hay tareas para el ${headingDate}. Agrega una y organiza tu día.`;
      return;
    }
    visibleTasks.forEach((task) => elements.taskList.append(createTaskCard(task)));
  }

  function createTaskCard(task) {
    const card = document.createElement('article');
    card.className = `task-card ${task.completed ? 'task-completed' : ''}`;
    const checkbox = document.createElement('button');
    checkbox.type = 'button';
    checkbox.className = `task-check ${task.completed ? 'checked' : ''}`;
    checkbox.setAttribute('aria-label', task.completed ? `Marcar ${task.title} como pendiente` : `Marcar ${task.title} como completada`);
    checkbox.textContent = task.completed ? '✓' : '';
    checkbox.addEventListener('click', () => toggleTask(task.id));

    const content = document.createElement('div');
    content.className = 'task-content';
    const title = document.createElement('h3');
    title.textContent = task.title;
    content.append(title);
    if (task.description) {
      const description = document.createElement('p');
      description.className = 'task-description';
      description.textContent = task.description;
      content.append(description);
    }
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const category = document.createElement('span');
    category.className = `category-tag ${categoryClasses[task.category] || categoryClasses.personal}`;
    category.textContent = categoryNames[task.category] || 'Personal';
    meta.append(category);
    if (task.time) {
      const time = document.createElement('span');
      time.className = 'task-time';
      time.textContent = `◷ ${task.time}`;
      meta.append(time);
    }
    content.append(meta);

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'small-action'; edit.title = 'Editar tarea'; edit.setAttribute('aria-label', `Editar ${task.title}`); edit.textContent = '✎';
    edit.addEventListener('click', () => openTaskModal(task));
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'small-action delete-action'; remove.title = 'Eliminar tarea'; remove.setAttribute('aria-label', `Eliminar ${task.title}`); remove.textContent = '⌫';
    remove.addEventListener('click', () => deleteTask(task.id));
    actions.append(edit, remove);
    card.append(checkbox, content, actions);
    return card;
  }

  function sortTasks(a, b) {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    if (!a.time && b.time) return 1;
    if (a.time && !b.time) return -1;
    return (a.time || '').localeCompare(b.time || '') || a.createdAt - b.createdAt;
  }

  function toggleTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks(); renderAll();
    showToast(task.completed ? '¡Tarea completada! Buen trabajo.' : 'Tarea marcada como pendiente.');
  }

  function deleteTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    if (!window.confirm(`¿Eliminar la tarea “${task.title}”?`)) return;
    tasks = tasks.filter((item) => item.id !== id);
    saveTasks(); renderAll();
    showToast('Tarea eliminada.');
  }

  function openTaskModal(task = null) {
    elements.taskForm.reset();
    elements.taskId.value = task ? task.id : '';
    elements.modalTitle.textContent = task ? 'Editar tarea' : 'Nueva tarea';
    elements.taskTitle.value = task ? task.title : '';
    elements.taskDescription.value = task ? task.description : '';
    elements.taskDate.value = task ? task.date : selectedDate;
    elements.taskTime.value = task ? task.time : '';
    elements.taskCategory.value = task ? task.category : 'personal';
    elements.modalBackdrop.hidden = false;
    document.body.classList.add('modal-open');
    window.setTimeout(() => elements.taskTitle.focus(), 30);
  }

  function closeTaskModal() {
    elements.modalBackdrop.hidden = true;
    document.body.classList.remove('modal-open');
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add('toast-visible');
    toastTimer = window.setTimeout(() => elements.toast.classList.remove('toast-visible'), 2600);
  }

  function capitalize(value) { return value ? value[0].toLocaleUpperCase('es-PE') + value.slice(1) : value; }

  $('#prevMonth').addEventListener('click', () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1); renderCalendar(); });
  $('#nextMonth').addEventListener('click', () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1); renderCalendar(); });
  function goToToday() { const today = new Date(); selectedDate = toISODate(today); visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1); activeFilter = 'all'; updateFilterButtons(); renderAll(); }
  $('#todayButton').addEventListener('click', goToToday);
  $('#todayMonthButton').addEventListener('click', goToToday);
  $('#addTaskTopButton').addEventListener('click', () => openTaskModal());
  $('#addTaskDayButton').addEventListener('click', () => openTaskModal());
  $('#emptyAddButton').addEventListener('click', () => openTaskModal());
  $('#closeModalButton').addEventListener('click', closeTaskModal);
  $('#cancelModalButton').addEventListener('click', closeTaskModal);
  elements.modalBackdrop.addEventListener('click', (event) => { if (event.target === elements.modalBackdrop) closeTaskModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !elements.modalBackdrop.hidden) closeTaskModal(); });

  elements.taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = elements.taskTitle.value.trim();
    const date = elements.taskDate.value;
    if (!title || !date) { showToast('Escribe un nombre y elige una fecha.'); return; }
    const data = { title, description: elements.taskDescription.value.trim(), date, time: elements.taskTime.value, category: elements.taskCategory.value };
    const id = elements.taskId.value;
    if (id) {
      const task = tasks.find((item) => item.id === id);
      if (task) Object.assign(task, data);
      showToast('Cambios guardados.');
    } else {
      tasks.push({ id: createId(), ...data, completed: false, createdAt: Date.now() });
      showToast('Nueva tarea agregada.');
    }
    selectedDate = date;
    const parsed = parseISODate(date);
    visibleMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    activeFilter = 'all'; updateFilterButtons();
    saveTasks(); closeTaskModal(); renderAll();
  });

  function updateFilterButtons() {
    document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('is-active', button.dataset.filter === activeFilter));
  }
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.filter; updateFilterButtons(); renderSelectedDate(); }));

  saveTasks();
  renderAll();
})();
