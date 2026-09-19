const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('[data-view]');

function showView(viewName) {
  views.forEach(view => view.classList.toggle('active', view.id === `view-${viewName}`));
  navLinks.forEach(link => link.classList.toggle('active', link.dataset.view === viewName));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navLinks.forEach(link => link.addEventListener('click', () => showView(link.dataset.view)));
document.querySelectorAll('[data-view-target]').forEach(button => button.addEventListener('click', () => showView(button.dataset.viewTarget)));

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function loadEntries() {
  const tbody = document.querySelector('#entriesTable tbody');
  try {
    const entries = await requestJson('/api/entries');
    tbody.innerHTML = entries.length ? entries.map(entry => `<tr><td><span class="date-chip">${formatDate(entry.entry_date)}</span></td><td><span class="person"><span class="person-avatar">${initials(entry.employee_name)}</span>${escapeHtml(entry.employee_name)}</span></td><td><span class="project-tag">${escapeHtml(entry.project)}</span></td><td><strong class="hours-value">${entry.hours}h</strong></td><td class="description">${escapeHtml(entry.description || 'No description')}</td></tr>`).join('') : '<tr><td colspan="5" class="empty-state">No time entries yet. Start by logging your first hour.</td></tr>';
    document.getElementById('entriesMetric').textContent = entries.length;
    document.getElementById('navEntries').textContent = entries.length;
    document.getElementById('hoursMetric').textContent = `${entries.reduce((total, entry) => total + Number(entry.hours), 0).toFixed(1)}h`;
  } catch (error) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state error-state">Could not load activity. Is the API running?</td></tr>'; }
}

async function loadProjectOptions() {
  try {
    const projects = await requestJson('/api/projects');
    const select = document.getElementById('projectSelect');
    select.innerHTML = projects.length ? projects.map(project => `<option value="${escapeHtml(project)}">${escapeHtml(project)}</option>`).join('') : '<option>No projects yet</option>';
    document.getElementById('projectsMetric').textContent = projects.length;
  } catch (error) { document.getElementById('projectsMetric').textContent = '—'; }
}

document.getElementById('loadSummaryBtn').addEventListener('click', async () => {
  const project = document.getElementById('projectSelect').value;
  const result = document.getElementById('summaryResult');
  if (!project) return;
  result.classList.add('is-loading');
  try {
    const summary = await requestJson(`/api/projects/${encodeURIComponent(project)}/summary`);
    const rows = Object.entries(summary.by_employee).map(([name, hours]) => `<div class="summary-row"><span><span class="person-avatar small">${initials(name)}</span>${escapeHtml(name)}</span><strong>${hours}h</strong></div>`).join('');
    result.innerHTML = `<div class="summary-kicker">${escapeHtml(summary.project)}</div><div class="summary-total">${summary.total_hours}<small>h</small></div><p>Total time invested by the team</p><div class="summary-divider"></div>${rows}`;
  } catch (error) { result.innerHTML = '<p class="error-state">Could not load this project summary.</p>'; } finally { result.classList.remove('is-loading'); }
});

document.getElementById('logForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const status = document.getElementById('formStatus');
  const button = form.querySelector('button');
  const body = {
    employee_name: document.getElementById('employeeInput').value.trim(),
    project: document.getElementById('projectInput').value.trim(),
    entry_date: document.getElementById('dateInput').value,
    hours: parseFloat(document.getElementById('hoursInput').value),
    description: document.getElementById('descInput').value.trim(),
  };
  button.disabled = true;
  status.textContent = 'Saving entry...';
  try {
    await requestJson('/api/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    form.reset(); status.textContent = 'Time entry saved to the shared workspace.'; status.className = 'form-status success-state';
    await Promise.all([loadEntries(), loadProjectOptions()]);
  } catch (error) { status.textContent = 'Could not save entry. Please check the details and try again.'; status.className = 'form-status error-state'; } finally { button.disabled = false; }
});

function initials(name) { return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase(); }
function formatDate(value) { const date = new Date(`${value}T00:00:00`); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = String(value); return div.innerHTML; }

document.getElementById('todayLabel').textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());
loadEntries();
loadProjectOptions();