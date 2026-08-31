const API = '';

let currentConveyor = null;
let typeNames = {};
let selectedAuditId = null;

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[m]));
}

async function api(path, options = {}) {
    const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    };
    if (options.headers) {
        config.headers = { ...config.headers, ...options.headers };
    }
    const res = await fetch(API + path, config);
    if (!res.ok) {
        let detail = res.statusText;
        try {
            const data = await res.json();
            detail = JSON.stringify(data.detail ?? data);
        } catch (e) { /* ignore */ }
        throw new Error(detail);
    }
    return res.json();
}

/* ---------- Табы ---------- */
document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

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
    } catch (err) {
        msg.textContent = 'Ошибка: ' + err.message;
    }
});

/* ---------- Конвейер: карточка ---------- */
function openConveyor(conveyor) {
    currentConveyor = conveyor;
    document.getElementById('conveyors-view').classList.add('hidden');
    document.getElementById('conveyor-detail-view').classList.remove('hidden');
    document.getElementById('detail-title').textContent = conveyor.name;
    loadAuditSelect();
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

function computeComponentState(results, componentId) {
    const own = results.filter((r) => r.component_id === componentId);
    if (!own.length) return { ok: 0, total: 0 };
    const latestAudit = Math.max(...own.map((r) => r.audit_id));
    const latest = own.filter((r) => r.audit_id === latestAudit);
    return { ok: latest.filter((r) => r.status === true).length, total: latest.length };
}

function pctHtml(ok, total) {
    if (!total) return '<span class="note">нет данных</span>';
    const pct = Math.round((ok / total) * 100);
    const color = pct === 100 ? 'ok' : (pct === 0 ? 'bad' : 'warn');
    return `<div class="bar small"><div class="bar-fill ${color}" style="width:${pct}%"></div></div><span>${ok}/${total} (${pct}%)</span>`;
}

function componentCard(c, s, typeName, itsCriteria) {
    const criteriaHtml = itsCriteria.length
        ? itsCriteria.map((k) => `
            <div class="criteria-row">
                <span>${esc(k.name)}</span>
                <div class="criteria-actions">
                    <button class="ok" data-component="${c.id}" data-criteria="${k.id}" data-status="true">ОК</button>
                    <button class="danger" data-component="${c.id}" data-criteria="${k.id}" data-status="false">Проблема</button>
                </div>
            </div>`).join('')
        : '<div class="note">Критериев пока нет</div>';
    return `
      <div class="component-card">
        <div class="component-head">
          <div><strong>${esc(c.name)}</strong> <span class="note">${esc(typeName)}</span></div>
          <div class="component-state">${pctHtml(s.ok, s.total)}</div>
        </div>
        <div class="criteria">
          <div class="criteria-list">${criteriaHtml}</div>
          <form class="criteria-form" data-component="${c.id}">
            <input class="criteria-name" placeholder="Название критерия" required>
            <button type="submit">Добавить критерий</button>
          </form>
        </div>
      </div>`;
}

function attachComponentHandlers() {
    document.querySelectorAll('#detail-components-list .criteria-form').forEach((form) => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const component_id = Number(form.dataset.component);
            const input = form.querySelector('.criteria-name');
            const name = input.value.trim();
            if (!name) return;
            try {
                await api('/catalog/criteria/create', { method: 'POST', body: JSON.stringify({ name, component_id }) });
                loadConveyorDetail();
            } catch (err) {
                alert('Ошибка: ' + err.message);
            }
        });
    });

    document.querySelectorAll('#detail-components-list button[data-criteria]').forEach((b) => {
        b.addEventListener('click', async () => {
            if (!selectedAuditId) { alert('Сначала создайте или выберите аудит'); return; }
            const audit_id = selectedAuditId;
            const component_id = Number(b.dataset.component);
            const criteria_id = Number(b.dataset.criteria);
            const status = b.dataset.status === 'true';
            try {
                await api('/audits/results/create', {
                    method: 'POST',
                    body: JSON.stringify({ audit_id, component_id, criteria_id, status }),
                });
                loadConveyorDetail();
            } catch (err) {
                alert('Ошибка: ' + err.message);
            }
        });
    });
}

async function loadConveyorDetail() {
    const list = document.getElementById('detail-components-list');
    const overall = document.getElementById('detail-overall');
    list.innerHTML = '<p class="note">Загрузка...</p>';
    try {
        const [components, criteria, results] = await Promise.all([
            api('/catalog/components'),
            api('/catalog/criteria'),
            api('/audits/results'),
        ]);
        const mine = components.filter((c) => c.conveyor_id === currentConveyor.id);

        let totalOk = 0;
        let totalCount = 0;

        if (!mine.length) {
            list.innerHTML = '<p class="note">Деталей пока нет</p>';
        } else {
            list.innerHTML = mine.map((c) => {
                const s = computeComponentState(results, c.id);
                totalOk += s.ok;
                totalCount += s.total;
                const typeName = typeNames[c.component_type_id] || c.component_type_id;
                const itsCriteria = criteria.filter((k) => k.component_id === c.id);
                return componentCard(c, s, typeName, itsCriteria);
            }).join('');
            attachComponentHandlers();
        }

        if (!totalCount) {
            overall.innerHTML = '<p class="note">Нет данных аудитов по деталям этого конвейера</p>';
        } else {
            const pct = Math.round((totalOk / totalCount) * 100);
            const color = pct === 100 ? 'ok' : (pct === 0 ? 'bad' : 'warn');
            overall.innerHTML = `<div class="bar"><div class="bar-fill ${color}" style="width:${pct}%"></div></div><p>${totalOk} из ${totalCount} проверок пройдено (${pct}%)</p>`;
        }
    } catch (e) {
        list.innerHTML = `<p class="error">${esc(e.message)}</p>`;
    }
}

/* ---------- Создать деталь на конвейере ---------- */
document.getElementById('add-component-btn').addEventListener('click', () => {
    document.getElementById('add-component-form-wrap').classList.toggle('hidden');
});

document.getElementById('cancel-component-btn').addEventListener('click', () => {
    document.getElementById('add-component-form-wrap').classList.add('hidden');
});

document.getElementById('detail-component-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('detail-component-name').value.trim();
    const component_type_id = Number(document.getElementById('detail-component-type').value);
    const msg = document.getElementById('detail-component-msg');
    msg.textContent = '';
    if (!component_type_id) {
        msg.textContent = 'Сначала создайте хотя бы один тип компонента во вкладке «Каталог».';
        return;
    }
    try {
        await api('/catalog/components/create', {
            method: 'POST',
            body: JSON.stringify({ name, conveyor_id: currentConveyor.id, component_type_id }),
        });
        e.target.reset();
        msg.textContent = 'Деталь добавлена';
        document.getElementById('add-component-form-wrap').classList.add('hidden');
        loadConveyorDetail();
    } catch (err) {
        msg.textContent = 'Ошибка: ' + err.message;
    }
});

/* ---------- Аудит в карточке ---------- */
async function loadAuditSelect() {
    const sel = document.getElementById('audit-select');
    try {
        const audits = await api('/audits');
        sel.innerHTML = '<option value="">— выберите аудит —</option>' +
            audits.map((a) => `<option value="${a.id}">#${a.id} (пользователь ${a.user_id})</option>`).join('');
        if (selectedAuditId != null && audits.some((a) => a.id === selectedAuditId)) {
            sel.value = String(selectedAuditId);
        } else if (audits.length) {
            selectedAuditId = audits[audits.length - 1].id;
            sel.value = String(selectedAuditId);
        } else {
            selectedAuditId = null;
        }
    } catch (e) { /* ignore */ }
}

document.getElementById('audit-select').addEventListener('change', (e) => {
    selectedAuditId = e.target.value ? Number(e.target.value) : null;
});

document.getElementById('create-audit-btn').addEventListener('click', async () => {
    const input = document.getElementById('audit-user-id');
    const user_id = Number(input.value);
    const msg = document.getElementById('audit-create-msg');
    msg.textContent = '';
    if (!user_id) { msg.textContent = 'Введите ID пользователя'; return; }
    try {
        const audit = await api('/audits/create', { method: 'POST', body: JSON.stringify({ user_id }) });
        input.value = '';
        selectedAuditId = audit.id;
        await loadAuditSelect();
        msg.textContent = 'Аудит #' + audit.id + ' создан и выбран';
        loadConveyorDetail();
    } catch (err) {
        msg.textContent = 'Ошибка: ' + err.message;
    }
});

/* ---------- Каталог: типы ---------- */
async function fetchTypes() {
    return await api('/catalog/types');
}

async function loadTypesOptions() {
    try {
        const types = await fetchTypes();
        typeNames = {};
        const sel = document.getElementById('detail-component-type');
        sel.innerHTML = types.map((t) => {
            typeNames[t.id] = t.name;
            return `<option value="${t.id}">${esc(t.name)}</option>`;
        }).join('');
    } catch (e) { /* типы подгрузятся позже */ }
}

async function loadTypes() {
    const tbody = document.getElementById('types-list');
    try {
        const rows = await fetchTypes();
        tbody.innerHTML = rows.length
            ? rows.map((t) => `<tr><td>${t.id}</td><td>${esc(t.name)}</td><td><button class="danger" data-id="${t.id}">Удалить</button></td></tr>`).join('')
            : '<tr><td colspan="3">Список пуст</td></tr>';
        tbody.querySelectorAll('button[data-id]').forEach((b) => b.addEventListener('click', () => deleteType(b.dataset.id)));
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" class="error">${esc(e.message)}</td></tr>`;
    }
}

async function deleteType(id) {
    if (!confirm('Удалить тип ' + id + '?')) return;
    try {
        await api('/catalog/types/delete?id=' + encodeURIComponent(id), { method: 'DELETE' });
        loadTypes();
        loadTypesOptions();
    } catch (e) {
        alert('Ошибка: ' + e.message);
    }
}

document.getElementById('type-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('type-name').value.trim();
    try {
        await api('/catalog/types/create', { method: 'POST', body: JSON.stringify({ name }) });
        e.target.reset();
        loadTypes();
        loadTypesOptions();
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
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
            ? rows.map((r) => `<tr><td>${r.id}</td><td>${r.audit_id}</td><td>${r.component_id}</td><td>${r.criteria_id}</td><td>${r.status ? 'OK' : 'Проблема'}</td></tr>`).join('')
            : '<tr><td colspan="5">Список пуст</td></tr>';
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="error">${esc(e.message)}</td></tr>`;
    }
}

document.getElementById('audit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user_id = Number(document.getElementById('audit-user').value);
    const msg = document.getElementById('audit-msg');
    msg.textContent = '';
    try {
        await api('/audits/create', { method: 'POST', body: JSON.stringify({ user_id }) });
        e.target.reset();
        msg.textContent = 'Аудит создан';
        loadAudits();
    } catch (err) {
        msg.textContent = 'Ошибка: ' + err.message;
    }
});

/* ---------- Старт ---------- */
loadConveyors();
loadTypes();
loadTypesOptions();
loadAuditSelect();
loadAudits();
loadAuditResults();