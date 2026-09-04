const API = '';
const TOKEN_KEY = 'cvm_token';

let token = localStorage.getItem(TOKEN_KEY) || null;
let currentUser = null;
let currentConveyor = null;
let catalogComponents = [];
let checkCriteria = [];

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[m]));
}

function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

async function api(path, options = {}) {
    const config = { headers: {}, ...options };
    if (options.body && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
    }
    if (token) config.headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API + path, config);
    if (res.status === 401) {
        logout();
        throw new Error('Требуется вход');
    }
    if (!res.ok) {
        let detail = res.statusText;
        try { const data = await res.json(); detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail ?? data); } catch (e) {}
        throw new Error(detail);
    }
    return res.json();
}

async function login(email, password) {
    const body = new URLSearchParams({ username: email, password });
    const res = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
    if (!res.ok) {
        let detail = res.statusText;
        try { const data = await res.json(); detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail ?? data); } catch (e) {}
        throw new Error(detail);
    }
    const data = await res.json();
    token = data.access_token;
    localStorage.setItem(TOKEN_KEY, token);
}

async function loadMe() {
    currentUser = await api('/auth/me');
    return currentUser;
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('current-user').textContent = currentUser.username + ' (' + currentUser.role + ')';
    applyRole();
}

function applyRole() {
    document.querySelectorAll('.admin-only').forEach((el) => {
        el.classList.toggle('hidden', !isAdmin());
    });
}

/* ---------- Табы ---------- */
function activateTab(name) {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + name));
}

document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
        activateTab(btn.dataset.tab);
        if (btn.dataset.tab === 'check') loadCheck();
        if (btn.dataset.tab === 'audits') { loadAudits(); loadAuditResults(); }
        if (btn.dataset.tab === 'conveyors' && currentConveyor) loadConveyorDetail();
    });
});

/* ---------- Вход / выход ---------- */
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('login-msg');
    msg.textContent = '';
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    try {
        await login(email, password);
        await loadMe();
        showApp();
        e.target.reset();
        loadAll();
    } catch (err) {
        msg.textContent = 'Ошибка: ' + err.message;
    }
});

document.getElementById('logout-btn').addEventListener('click', logout);

/* ---------- Конвейеры: список ---------- */
async function loadConveyors() {
    const tbody = document.getElementById('conveyors-list');
    try {
        const rows = await api('/conveyors');
        tbody.innerHTML = rows.length
            ? rows.map((c) => `<tr><td>${c.id}</td><td>${esc(c.name)}</td><td>${esc(c.description)}</td><td><button data-id="${c.id}">Открыть</button></td></tr>`).join('')
            : '<tr><td colspan="4">Список пуст</td></tr>';
        tbody.querySelectorAll('button[data-id]').forEach((b) => b.addEventListener('click', () => {
            const c = rows.find((x) => x.id === Number(b.dataset.id));
            if (c) openConveyor(c);
        }));
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" class="error">${esc(e.message)}</td></tr>`;
    }
}

document.getElementById('conveyor-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('conveyor-name').value.trim();
    const description = document.getElementById('conveyor-desc').value.trim();
    const msg = document.getElementById('conveyor-msg');
    msg.textContent = '';
    try {
        await api('/conveyors/create', { method: 'POST', body: JSON.stringify({ name, description }) });
        e.target.reset();
        msg.textContent = 'Конвейер создан';
        loadConveyors();
    } catch (err) { msg.textContent = 'Ошибка: ' + err.message; }
});

/* ---------- Карточка конвейера ---------- */
function openConveyor(conveyor) {
    currentConveyor = conveyor;
    document.getElementById('conveyors-view').classList.add('hidden');
    document.getElementById('conveyor-detail-view').classList.remove('hidden');
    document.getElementById('detail-title').textContent = conveyor.name;
    loadConveyorDetail();
}

function closeConveyor() {
    currentConveyor = null;
    document.getElementById('conveyor-detail-view').classList.add('hidden');
    document.getElementById('conveyors-view').classList.remove('hidden');
    document.getElementById('add-component-form-wrap').classList.add('hidden');
    loadConveyors();
}

document.getElementById('back-to-conveyors').addEventListener('click', closeConveyor);

function latestStatus(results, criteriaId) {
    const own = results.filter((r) => r.criteria_id === criteriaId);
    if (!own.length) return null;
    const latestAudit = Math.max(...own.map((r) => r.audit_id));
    return own.find((r) => r.audit_id === latestAudit).status;
}

function componentAggregate(cc, results) {
    const statuses = (cc.criterias || []).map((k) => latestStatus(results, k.id)).filter((s) => s !== null);
    return { ok: statuses.filter((s) => s === true).length, total: statuses.length };
}

function pctHtml(ok, total) {
    if (!total) return '<span class="note">нет данных</span>';
    const pct = Math.round((ok / total) * 100);
    const color = pct === 100 ? 'ok' : (pct === 0 ? 'bad' : 'warn');
    return `<div class="bar small"><div class="bar-fill ${color}" style="width:${pct}%"></div></div><span>${ok}/${total} (${pct}%)</span>`;
}

function dotHtml(status) {
    if (status === null) return '<span class="dot gray"></span>';
    return status ? '<span class="dot green"></span>' : '<span class="dot red"></span>';
}

function componentCard(cc, results) {
    const agg = componentAggregate(cc, results);
    const name = cc.component ? cc.component.name : cc.component_id;
    const criterias = cc.criterias || [];
    const criteriaHtml = criterias.length
        ? criterias.map((k) => {
            const st = latestStatus(results, k.id);
            return `<div class="criteria-row">
                <span>${dotHtml(st)} ${esc(k.name)}</span>
                <div class="criteria-actions">
                    <button class="ok" data-criteria="${k.id}" data-status="true">ОК</button>
                    <button class="danger" data-criteria="${k.id}" data-status="false">Проблема</button>
                </div>
            </div>`;
        }).join('')
        : '<div class="note">Подкомпонентов пока нет</div>';
    const addForm = isAdmin()
        ? `<form class="criteria-form" data-cc="${cc.id}">
            <input class="criteria-name" placeholder="Название подкомпонента" required>
            <button type="submit">Добавить</button>
        </form>`
        : '';
    return `<div class="component-card">
        <div class="component-head">
            <div><strong>${esc(name)}</strong></div>
            <div class="component-state">${pctHtml(agg.ok, agg.total)}</div>
        </div>
        <div class="criteria">
            <div class="criteria-list">${criteriaHtml}</div>
            ${addForm}
        </div>
    </div>`;
}

async function loadConveyorDetail() {
    const list = document.getElementById('detail-components-list');
    const overall = document.getElementById('detail-overall');
    list.innerHTML = '<p class="note">Загрузка...</p>';
    try {
        const [detail, results] = await Promise.all([
            api('/conveyors/' + currentConveyor.id),
            api('/audits/results'),
        ]);
        const ccs = detail.conveyor_components || [];
        let totalOk = 0;
        let totalCount = 0;
        if (!ccs.length) {
            list.innerHTML = '<p class="note">На конвейере пока нет деталей</p>';
        } else {
            list.innerHTML = ccs.map((cc) => {
                const agg = componentAggregate(cc, results);
                totalOk += agg.ok;
                totalCount += agg.total;
                return componentCard(cc, results);
            }).join('');
            attachComponentHandlers();
        }
        if (!totalCount) {
            overall.innerHTML = '<p class="note">Нет данных аудитов по этому конвейеру</p>';
        } else {
            const pct = Math.round((totalOk / totalCount) * 100);
            const color = pct === 100 ? 'ok' : (pct === 0 ? 'bad' : 'warn');
            overall.innerHTML = `<div class="bar"><div class="bar-fill ${color}" style="width:${pct}%"></div></div><span>${totalOk}/${totalCount} критериев в порядке (${pct}%)</span>`;
        }
    } catch (e) {
        list.innerHTML = `<p class="error">${esc(e.message)}</p>`;
    }
}

async function submitResults(results) {
    if (!results.length) throw new Error('Нет результатов для сохранения');
    return await api('/audits/submit', { method: 'POST', body: JSON.stringify(results) });
}

function attachComponentHandlers() {
    document.querySelectorAll('#detail-components-list .criteria-form').forEach((form) => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const conveyor_component_id = Number(form.dataset.cc);
            const input = form.querySelector('.criteria-name');
            const name = input.value.trim();
            if (!name) return;
            try {
                await api('/catalog/criteria/create', { method: 'POST', body: JSON.stringify({ name, conveyor_component_id }) });
                loadConveyorDetail();
            } catch (err) { alert('Ошибка: ' + err.message); }
        });
    });

    // Кнопки «ОК»/«Проблема» не создают аудит сразу: переводим пользователя
    // на вкладку «Проверка», отмечаем критерий, аудит сохраняется одной кнопкой.
    document.querySelectorAll('#detail-components-list button[data-criteria]').forEach((b) => {
        b.addEventListener('click', async () => {
            try {
                const criteriaId = Number(b.dataset.criteria);
                const status = b.dataset.status === 'true';
                activateTab('check');
                await loadCheck();
                const item = checkCriteria.find((c) => c.criteriaId === criteriaId);
                if (!item) { alert('Критерий не найден в списке проверки'); return; }
                item.status = status;
                const row = document.querySelector('#check-list .check-row[data-criteria="' + criteriaId + '"]');
                if (row) {
                    const cb = row.querySelector('input[type="checkbox"]');
                    const state = row.querySelector('.check-state');
                    if (cb) cb.checked = status;
                    if (state) state.textContent = status ? 'ОК' : 'Проблема';
                    row.classList.toggle('dirty', isDirty(item));
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    row.classList.add('flash');
                    setTimeout(() => row.classList.remove('flash'), 1500);
                }
                updateCheckDirty();
            } catch (err) { alert('Ошибка: ' + err.message); }
        });
    });
}

/* ---------- Добавление детали на конвейер ---------- */
document.getElementById('add-component-btn').addEventListener('click', () => {
    document.getElementById('add-component-form-wrap').classList.toggle('hidden');
});

document.getElementById('cancel-component-btn').addEventListener('click', () => {
    document.getElementById('add-component-form-wrap').classList.add('hidden');
});

document.getElementById('detail-component-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const component_id = Number(document.getElementById('detail-component-select').value);
    const msg = document.getElementById('detail-component-msg');
    msg.textContent = '';
    if (!component_id) { msg.textContent = 'Сначала создайте деталь в каталоге'; return; }
    try {
        await api('/conveyors/' + currentConveyor.id + '/components', { method: 'POST', body: JSON.stringify({ component_id }) });
        e.target.reset();
        msg.textContent = 'Деталь добавлена на конвейер';
        document.getElementById('add-component-form-wrap').classList.add('hidden');
        loadConveyorDetail();
    } catch (err) { msg.textContent = 'Ошибка: ' + err.message; }
});

/* ---------- Каталог деталей ---------- */
async function loadCatalogComponents() {
    try {
        catalogComponents = await api('/catalog/components');
        renderCatalogComponents();
        const sel = document.getElementById('detail-component-select');
        sel.innerHTML = catalogComponents.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    } catch (e) {}
}

function renderCatalogComponents() {
    const tbody = document.getElementById('catalog-components-list');
    tbody.innerHTML = catalogComponents.length
        ? catalogComponents.map((c) => `<tr><td>${c.id}</td><td>${esc(c.name)}</td></tr>`).join('')
        : '<tr><td colspan="2">Каталог пуст</td></tr>';
}

document.getElementById('catalog-component-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('catalog-component-name').value.trim();
    const msg = document.getElementById('catalog-msg');
    msg.textContent = '';
    if (!name) return;
    try {
        await api('/catalog/components/create', { method: 'POST', body: JSON.stringify({ name }) });
        e.target.reset();
        msg.textContent = 'Деталь добавлена';
        loadCatalogComponents();
    } catch (err) { msg.textContent = 'Ошибка: ' + err.message; }
});

/* ---------- Аудиты ---------- */
async function loadAudits() {
    const tbody = document.getElementById('audits-list');
    try {
        const rows = await api('/audits');
        tbody.innerHTML = rows.length
            ? rows.map((a) => `<tr><td>${a.id}</td><td>${a.user_id}</td><td>${esc(a.created_at)}</td></tr>`).join('')
            : '<tr><td colspan="3">Список пуст</td></tr>';
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" class="error">${esc(e.message)}</td></tr>`;
    }
}

async function loadAuditResults() {
    const tbody = document.getElementById('audit-results-list');
    try {
        const rows = await api('/audits/results');
        tbody.innerHTML = rows.length
            ? rows.map((r) => `<tr><td>${r.id}</td><td>${r.audit_id}</td><td>${r.criteria_id}</td><td>${r.status ? 'OK' : 'Проблема'}</td><td>${esc(r.comment || '')}</td></tr>`).join('')
            : '<tr><td colspan="5">Список пуст</td></tr>';
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="error">${esc(e.message)}</td></tr>`;
    }
}

/* ---------- Вкладка «Проверка» ---------- */
function latestCheck(results, criteriaId) {
    const own = results.filter((r) => r.criteria_id === criteriaId);
    if (!own.length) return { status: null, comment: null };
    const latest = own.reduce((a, b) => (b.audit_id > a.audit_id ? b : a));
    return { status: latest.status, comment: latest.comment ?? '' };
}

async function loadCheck() {
    const list = document.getElementById('check-list');
    list.innerHTML = '<p class="note">Загрузка...</p>';
    try {
        const [conveyors, results] = await Promise.all([api('/conveyors'), api('/audits/results')]);
        const details = await Promise.all(conveyors.map((c) => api('/conveyors/' + c.id)));
        checkCriteria = [];
        details.forEach((detail, i) => {
            const conveyor = conveyors[i];
            (detail.conveyor_components || []).forEach((cc) => {
                (cc.criterias || []).forEach((k) => {
                    const latest = latestCheck(results, k.id);
                    checkCriteria.push({
                        criteriaId: k.id,
                        name: k.name,
                        conveyorId: conveyor.id,
                        conveyorName: conveyor.name,
                        initialStatus: latest.status,
                        initialComment: latest.comment,
                        status: latest.status,
                        comment: latest.comment,
                    });
                });
            });
        });
        renderCheck();
    } catch (e) {
        list.innerHTML = `<p class="error">${esc(e.message)}</p>`;
    }
}

function isDirty(c) {
    return c.status !== c.initialStatus || (c.comment || '') !== (c.initialComment || '');
}

function updateCheckDirty() {
    const dirtyCount = checkCriteria.filter(isDirty).length;
    document.getElementById('check-dirty-count').textContent = dirtyCount;
    document.getElementById('submit-check-btn').disabled = dirtyCount === 0;
}

function checkRow(c) {
    const checked = c.status === true;
    const noData = c.initialStatus === null;
    const dirty = isDirty(c);
    return `<div class="check-row${dirty ? ' dirty' : ''}" data-criteria="${c.criteriaId}">
        <label class="switch">
            <input type="checkbox" ${checked ? 'checked' : ''}>
            <span class="slider"></span>
        </label>
        <span class="check-state">${checked ? 'ОК' : 'Проблема'}</span>
        <span class="check-name">${esc(c.name)}${noData ? ' <span class="note">(нет данных)</span>' : ''}</span>
        <input type="text" class="check-comment" placeholder="Комментарий (что не так)" value="${esc(c.comment || '')}">
    </div>`;
}

function renderCheck() {
    const list = document.getElementById('check-list');
    if (!checkCriteria.length) {
        list.innerHTML = '<p class="note">Нет критериев для проверки. Добавьте конвейеры, детали и подкомпоненты.</p>';
        updateCheckDirty();
        return;
    }
    const byConveyor = {};
    checkCriteria.forEach((c) => {
        if (!byConveyor[c.conveyorId]) byConveyor[c.conveyorId] = { name: c.conveyorName, items: [] };
        byConveyor[c.conveyorId].items.push(c);
    });
    const groups = Object.values(byConveyor);
    list.innerHTML = groups.map((g, i) => {
        return `<details class="check-conveyor" ${i === 0 ? 'open' : ''}>
            <summary><strong>${esc(g.name)}</strong></summary>
            <div class="check-rows">${g.items.map(checkRow).join('')}</div>
        </details>`;
    }).join('');
    attachCheckHandlers();
    updateCheckDirty();
}

function attachCheckHandlers() {
    document.querySelectorAll('#check-list .check-row').forEach((row) => {
        const id = Number(row.dataset.criteria);
        const item = checkCriteria.find((c) => c.criteriaId === id);
        if (!item) return;
        const cb = row.querySelector('input[type="checkbox"]');
        const comment = row.querySelector('.check-comment');
        const state = row.querySelector('.check-state');
        cb.addEventListener('change', () => {
            item.status = cb.checked;
            if (state) state.textContent = cb.checked ? 'ОК' : 'Проблема';
            row.classList.toggle('dirty', isDirty(item));
            updateCheckDirty();
        });
        comment.addEventListener('input', () => {
            item.comment = comment.value.trim();
            row.classList.toggle('dirty', isDirty(item));
            updateCheckDirty();
        });
    });
}

document.getElementById('submit-check-btn').addEventListener('click', async () => {
    const msg = document.getElementById('check-msg');
    msg.textContent = '';
    const dirty = checkCriteria.filter(isDirty).map((c) => ({
        criteria_id: c.criteriaId,
        status: c.status === true,
        comment: c.comment || null,
    }));
    if (!dirty.length) return;
    try {
        const res = await submitResults(dirty);
        msg.textContent = 'Проверка сохранена: аудит #' + res.audit.id + ', критериев: ' + res.results.length;
        loadCheck();
        loadAudits();
        loadAuditResults();
    } catch (err) {
        msg.textContent = 'Ошибка: ' + err.message;
    }
});

/* ---------- Пользователи (админ) ---------- */
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('register-msg');
    msg.textContent = '';
    const username = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    try {
        await api('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, role }) });
        e.target.reset();
        msg.textContent = 'Пользователь создан';
    } catch (err) {
        msg.textContent = 'Ошибка: ' + err.message;
    }
});

/* ---------- Старт ---------- */
function loadAll() {
    loadConveyors();
    loadCatalogComponents();
    loadAudits();
    loadAuditResults();
    if (document.getElementById('tab-check').classList.contains('active')) loadCheck();
}

async function init() {
    if (token) {
        try {
            await loadMe();
            showApp();
            loadAll();
        } catch (e) {
            logout();
        }
    } else {
        logout();
    }
}

init();
