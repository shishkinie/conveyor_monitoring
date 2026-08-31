const API = '';

let currentConveyor = null;
let selectedAuditId = null;
let catalogComponents = [];

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
    const config = { headers: { 'Content-Type': 'application/json' }, ...options };
    if (options.headers) config.headers = { ...config.headers, ...options.headers };
    const res = await fetch(API + path, config);
    if (!res.ok) {
        let detail = res.statusText;
        try { const data = await res.json(); detail = JSON.stringify(data.detail ?? data); } catch (e) {}
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
    } catch (err) { msg.textContent = 'Ошибка: ' + err.message; }
});

/* ---------- Карточка конвейера ---------- */
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
    return `<div class="component-card">
        <div class="component-head">
            <div><strong>${esc(name)}</strong></div>
            <div class="component-state">${pctHtml(agg.ok, agg.total)}</div>
        </div>
        <div class="criteria">
            <div class="criteria-list">${criteriaHtml}</div>
            <form class="criteria-form" data-cc="${cc.id}">
                <input class="criteria-name" placeholder="Название подкомпонента" required>
                <button type="submit">Добавить подкомпонент</button>
            </form>
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
            overall.innerHTML = `<div class="bar"><div class="bar-fill ${color}" style="width:${pct}%"></div></div><p>${totalOk} из ${totalCount} проверок пройдено (${pct}%)</p>`;
        }
    } catch (e) {
        list.innerHTML = `<p class="error">${esc(e.message)}</p>`;
    }
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

    document.querySelectorAll('#detail-components-list button[data-criteria]').forEach((b) => {
        b.addEventListener('click', async () => {
            if (!selectedAuditId) { alert('Сначала создайте или выберите аудит'); return; }
            try {
                await api('/audits/results/create', {
                    method: 'POST',
                    body: JSON.stringify({
                        audit_id: selectedAuditId,
                        criteria_id: Number(b.dataset.criteria),
                        status: b.dataset.status === 'true',
                    }),
                });
                loadConveyorDetail();
            } catch (err) { alert('Ошибка: ' + err.message); }
        });
    });
}

/* ---------- Добавить деталь из каталога ---------- */
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
    } catch (e) {}
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
    if (!name) return;
    try {
        await api('/catalog/components/create', { method: 'POST', body: JSON.stringify({ name }) });
        e.target.reset();
        loadCatalogComponents();
    } catch (err) { alert('Ошибка: ' + err.message); }
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
            ? rows.map((r) => `<tr><td>${r.id}</td><td>${r.audit_id}</td><td>${r.criteria_id}</td><td>${r.status ? 'OK' : 'Проблема'}</td></tr>`).join('')
            : '<tr><td colspan="4">Список пуст</td></tr>';
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" class="error">${esc(e.message)}</td></tr>`;
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
    } catch (err) { msg.textContent = 'Ошибка: ' + err.message; }
});

/* ---------- Старт ---------- */
loadConveyors();
loadCatalogComponents();
loadAuditSelect();
loadAudits();
loadAuditResults();