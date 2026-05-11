// Visitas — flujo completo: registro, confirmación, cancelación, reprogramación, completar, reembolso
(function () {
    'use strict';

    const state = {
        all: [],
        filtered: [],
        tab: 'hoy',
        query: '',
        selected: new Set(),
        currentDetail: null,
    };

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadKpis();
        loadVisitas();
        loadVisitantesSelect();
        loadRecintosSelect();

        document.querySelectorAll('.tab[data-tab]').forEach(t => {
            t.onclick = () => { state.tab = t.dataset.tab; renderTabs(); applyFilter(); };
        });

        const search = document.getElementById('search-visitas');
        if (search) search.oninput = e => { state.query = e.target.value.toLowerCase(); applyFilter(); };

        document.getElementById('formNuevaVisita').onsubmit = onCrearVisita;
        document.getElementById('btn-nueva-visita').onclick = abrirModalNueva;

        document.getElementById('side-panel-close').onclick = cerrarPanel;
        document.getElementById('side-panel-backdrop').onclick = cerrarPanel;

        document.getElementById('bulk-confirmar').onclick = bulkConfirmar;
        document.getElementById('bulk-cancelar').onclick = bulkCancelar;
        document.getElementById('bulk-clear').onclick = () => { state.selected.clear(); render(); };

        // Modales de transición de estado
        document.getElementById('formCobrar').onsubmit       = onSubmitCobrar;
        document.getElementById('formReprogramar').onsubmit  = onSubmitReprogramar;
        document.getElementById('formCancelar').onsubmit     = onSubmitCancelar;
        document.getElementById('formReembolsar').onsubmit   = onSubmitReembolsar;

        // Fecha mínima = hoy
        ['nv_fecha', 'repro_fecha'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.min = new Date().toISOString().split('T')[0];
        });
    }

    function loadVisitantesSelect() {
        fetch('/api/visitantes').then(r => r.json()).then(data => {
            if (!Array.isArray(data)) return;
            const sel = document.getElementById('nv_visitante');
            sel.innerHTML = '<option value="">Selecciona visitante…</option>' +
                data.map(v => `<option value="${v.id}">${v.nombre} · ${v.dni}</option>`).join('');
        }).catch(() => {});
    }

    function loadRecintosSelect() {
        fetch('/api/recintos').then(r => r.json()).then(data => {
            if (!Array.isArray(data)) return;
            const disponibles = data.filter(r => r.disponible === 'S');
            const opts = '<option value="">Selecciona recinto…</option>' +
                disponibles.map(r => `<option value="${r.id}">${r.sector} · cap. ${r.capacidad}</option>`).join('');
            const sel = document.getElementById('nv_recinto');
            if (sel) sel.innerHTML = opts;
            // repro_recinto: añade opción "mantener actual"
            const repro = document.getElementById('repro_recinto');
            if (repro) repro.innerHTML = '<option value="">Mantener recinto actual</option>' +
                disponibles.map(r => `<option value="${r.id}">${r.sector}</option>`).join('');
        }).catch(() => {});
    }

    // ─── DATA ────────────────────────────────────────────

    function loadKpis() {
        fetch('/api/visitas/kpis').then(r => r.json()).then(k => {
            if (k.error) return;
            setText('kpi-pendientes', k.pendientes);
            setText('kpi-confirmadas', k.confirmadas);
            setText('kpi-hoy', k.visitas_hoy);
            setText('kpi-7d', k.visitas_proximos_7d);
            setText('kpi-completadas-hoy', k.completadas_hoy);
        }).catch(() => {});
    }

    function loadVisitas() {
        fetch('/api/visitas').then(r => r.json()).then(data => {
            if (!Array.isArray(data)) return;
            state.all = data;
            renderTabs();
            applyFilter();
        }).catch(() => {});
    }

    // ─── FILTER + RENDER ─────────────────────────────────

    function renderTabs() {
        document.querySelectorAll('.tab[data-tab]').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === state.tab);
        });
        // Update counts
        const today = todayStr();
        const next7 = nextNDaysStr(7);
        setText('tab-count-hoy', state.all.filter(v => v.fecha === today).length);
        setText('tab-count-7d', state.all.filter(v => v.fecha >= today && v.fecha <= next7).length);
        setText('tab-count-pend', state.all.filter(v => v.estado === 'Pendiente').length);
        setText('tab-count-todas', state.all.length);
    }

    function applyFilter() {
        const today = todayStr();
        const next7 = nextNDaysStr(7);
        let list = state.all.slice();
        switch (state.tab) {
            case 'hoy':  list = list.filter(v => v.fecha === today); break;
            case '7d':   list = list.filter(v => v.fecha >= today && v.fecha <= next7); break;
            case 'pend': list = list.filter(v => v.estado === 'Pendiente'); break;
            // 'todas' = no filter
        }
        if (state.query) {
            list = list.filter(v =>
                String(v.visitante || '').toLowerCase().includes(state.query) ||
                String(v.id).includes(state.query) ||
                String(v.recinto || '').toLowerCase().includes(state.query)
            );
        }
        state.filtered = list;
        render();
    }

    function render() {
        const tbody = document.getElementById('tabla-visitas');
        if (!tbody) return;
        if (state.filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state-row">Sin visitas que coincidan con los filtros.</td></tr>';
        } else {
            tbody.innerHTML = state.filtered.map(rowHtml).join('');
            tbody.querySelectorAll('.row-checkbox').forEach(cb => {
                cb.onchange = e => { e.stopPropagation(); toggleSelect(parseInt(cb.dataset.id), cb.checked); };
            });
            tbody.querySelectorAll('tr.clickable').forEach(tr => {
                tr.onclick = e => {
                    if (e.target.matches('input, button, a')) return;
                    abrirPanelDetalle(parseInt(tr.dataset.id));
                };
            });
        }
        renderBulkBar();
    }

    function rowHtml(v) {
        const checked = state.selected.has(v.id) ? 'checked' : '';
        const selCls  = state.selected.has(v.id) ? 'selected' : '';
        const estadoCls = 'badge badge-' + String(v.estado || 'pendiente').toLowerCase();
        return `
            <tr class="clickable ${selCls}" data-id="${v.id}">
                <td onclick="event.stopPropagation()">
                    <input type="checkbox" class="row-checkbox" data-id="${v.id}" ${checked}>
                </td>
                <td>#${v.id}</td>
                <td><strong>${escapeHtml(v.visitante)}</strong></td>
                <td>${escapeHtml(v.recinto)}</td>
                <td>${v.fecha}</td>
                <td><span class="${estadoCls}">${v.estado}</span></td>
                <td>${primaryActionBtn(v)}</td>
            </tr>
        `;
    }

    function primaryActionBtn(v) {
        const e = v.estado;
        if (e === 'Pendiente')  return `<button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); confirmarVisita(${v.id}, this)">Confirmar</button>`;
        if (e === 'Confirmada') return `<button class="btn btn-sm btn-outline-light" onclick="event.stopPropagation(); abrirPanelDetalle(${v.id})">Cobrar</button>`;
        if (e === 'Pagada')     return `<button class="btn btn-sm btn-outline-light" onclick="event.stopPropagation(); completarVisita(${v.id}, this)">Marcar entrada</button>`;
        return `<button class="btn btn-sm btn-outline-light" onclick="event.stopPropagation(); abrirPanelDetalle(${v.id})">Detalle</button>`;
    }

    // ─── ACTIONS ─────────────────────────────────────────

    window.confirmarVisita = function (id, btn) {
        return doTransition(id, 'confirmar', {}, btn, 'Visita confirmada.');
    };
    window.completarVisita = function (id, btn) {
        if (!confirm('¿Marcar visita #' + id + ' como completada? El visitante ha accedido al parque.')) return;
        return doTransition(id, 'completar', {}, btn, 'Visita completada.');
    };
    window.cancelarVisita = function (id) {
        document.getElementById('cancel_id_registro').value = id;
        document.getElementById('cancel_motivo').value = '';
        new bootstrap.Modal(document.getElementById('modalCancelar')).show();
    };
    window.reprogramarVisita = function (id) {
        document.getElementById('repro_id_registro').value = id;
        document.getElementById('repro_fecha').value = '';
        document.getElementById('repro_recinto').value = '';
        new bootstrap.Modal(document.getElementById('modalReprogramar')).show();
    };
    window.reembolsarVisita = function (id) {
        document.getElementById('reemb_id_registro').value = id;
        document.getElementById('reemb_cantidad').value = '';
        document.getElementById('reemb_motivo').value = '';
        new bootstrap.Modal(document.getElementById('modalReembolsar')).show();
    };

    function onSubmitCancelar(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('cancel_id_registro').value);
        const motivo = document.getElementById('cancel_motivo').value;
        const btn = e.target.querySelector('button[type=submit]');
        return withLoading(btn, () =>
            doTransition(id, 'cancelar', { motivo }, null, 'Visita cancelada.').then(() => closeModal('modalCancelar'))
        );
    }
    function onSubmitReprogramar(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('repro_id_registro').value);
        const nueva_fecha = document.getElementById('repro_fecha').value;
        const nuevo_recinto = document.getElementById('repro_recinto').value || null;
        const btn = e.target.querySelector('button[type=submit]');
        return withLoading(btn, () =>
            doTransition(id, 'reprogramar', { nueva_fecha, nuevo_recinto }, null, 'Visita reprogramada.').then(() => closeModal('modalReprogramar'))
        );
    }
    function onSubmitReembolsar(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('reemb_id_registro').value);
        const cantidad = parseFloat(document.getElementById('reemb_cantidad').value);
        const motivo = document.getElementById('reemb_motivo').value;
        const btn = e.target.querySelector('button[type=submit]');
        return withLoading(btn, () =>
            doTransition(id, 'reembolsar', { cantidad, motivo }, null, 'Reembolso procesado.').then(() => closeModal('modalReembolsar'))
        );
    }
    function onSubmitCobrar(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('cobrar_id_registro').value);
        const cantidad = parseFloat(document.getElementById('cobrar_cantidad').value);
        const metodo = document.getElementById('cobrar_metodo').value;
        const btn = e.target.querySelector('button[type=submit]');
        return withLoading(btn, () =>
            fetch('/api/pagos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_registro: id, cantidad, metodo }),
            }).then(r => r.json()).then(d => {
                if (d.error) throw new Error(d.error);
                Toast.success('Pago registrado', `€${cantidad} cobrados por ${metodo.toLowerCase()}.`);
                closeModal('modalCobrar');
                loadKpis(); loadVisitas();
                if (state.currentDetail === id) abrirPanelDetalle(id);
            }).catch(err => Toast.error('Error al cobrar', err.message))
        );
    }

    function closeModal(id) {
        const inst = bootstrap.Modal.getInstance(document.getElementById(id));
        if (inst) inst.hide();
    }

    function doTransition(id, action, payload, btn, successMsg) {
        const exec = () => fetch(`/api/visitas/${id}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).then(r => r.json()).then(data => {
            if (data.error) throw new Error(data.error);
            Toast.success('Hecho', successMsg);
            loadKpis();
            loadVisitas();
            if (state.currentDetail === id) abrirPanelDetalle(id);
        }).catch(err => Toast.error('No se pudo completar', err.message));
        return btn ? withLoading(btn, exec) : exec();
    }

    function onCrearVisita(e) {
        e.preventDefault();
        const payload = {
            id_visitante: parseInt(document.getElementById('nv_visitante').value),
            id_recinto:   parseInt(document.getElementById('nv_recinto').value),
            fecha_visita: document.getElementById('nv_fecha').value,
            tipo_entrada: document.getElementById('nv_tipo').value,
        };
        if (new Date(payload.fecha_visita) < new Date(new Date().toDateString())) {
            return Toast.error('Fecha inválida', 'La fecha debe ser hoy o futura.');
        }
        const btn = e.target.querySelector('button[type=submit]');
        return withLoading(btn, () =>
            fetch('/api/visitas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }).then(r => r.json()).then(data => {
                if (data.error) throw new Error(data.error);
                Toast.success('Visita creada', `ID #${data.id_registro} en estado Pendiente.`);
                cerrarModalNueva();
                loadKpis();
                loadVisitas();
            }).catch(err => Toast.error('No se pudo crear', err.message))
        );
    }

    // ─── BULK ────────────────────────────────────────────

    function toggleSelect(id, checked) {
        if (checked) state.selected.add(id); else state.selected.delete(id);
        render();
    }

    function renderBulkBar() {
        const bar = document.getElementById('bulk-bar');
        if (!bar) return;
        if (state.selected.size === 0) { bar.classList.remove('show'); return; }
        bar.classList.add('show');
        document.getElementById('bulk-count').textContent = state.selected.size;
    }

    function bulkConfirmar() {
        if (!confirm(`¿Confirmar ${state.selected.size} visita(s) pendientes?`)) return;
        const ids = Array.from(state.selected);
        Promise.all(ids.map(id => fetch(`/api/visitas/${id}/confirmar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
            .then(r => r.json()))).then(results => {
            const ok = results.filter(r => !r.error).length;
            Toast.success('Lote procesado', `${ok}/${ids.length} confirmadas.`);
            state.selected.clear();
            loadKpis(); loadVisitas();
        });
    }

    function bulkCancelar() {
        const motivo = prompt(`Motivo de cancelación para ${state.selected.size} visita(s):`);
        if (!motivo) return;
        const ids = Array.from(state.selected);
        Promise.all(ids.map(id => fetch(`/api/visitas/${id}/cancelar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ motivo }) })
            .then(r => r.json()))).then(results => {
            const ok = results.filter(r => !r.error).length;
            Toast.success('Lote procesado', `${ok}/${ids.length} canceladas.`);
            state.selected.clear();
            loadKpis(); loadVisitas();
        });
    }

    // ─── SIDE PANEL ──────────────────────────────────────

    window.abrirPanelDetalle = function (id) {
        state.currentDetail = id;
        const panel = document.getElementById('side-panel');
        const backdrop = document.getElementById('side-panel-backdrop');
        panel.classList.add('open');
        backdrop.classList.add('open');
        document.getElementById('side-panel-body').innerHTML = '<div class="text-muted">Cargando…</div>';
        document.getElementById('side-panel-actions').innerHTML = '';

        fetch(`/api/visitas/${id}`).then(r => r.json()).then(v => {
            if (v.error) { Toast.error('Error', v.error); cerrarPanel(); return; }
            renderDetalle(v);
        });
    };

    function cerrarPanel() {
        state.currentDetail = null;
        document.getElementById('side-panel').classList.remove('open');
        document.getElementById('side-panel-backdrop').classList.remove('open');
    }

    function renderDetalle(v) {
        document.getElementById('side-panel-title').textContent = `Visita #${v.id}`;
        const body = document.getElementById('side-panel-body');
        const estadoCls = 'badge badge-' + String(v.estado || '').toLowerCase();
        body.innerHTML = `
            <div class="side-panel-section">
                <h6>Estado</h6>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span class="${estadoCls}">${v.estado}</span>
                    ${v.reprogrammed_cnt ? `<span class="text-muted" style="font-size:12px;">· ${v.reprogrammed_cnt} reprogramación(es)</span>` : ''}
                </div>
            </div>

            <div class="side-panel-section">
                <h6>Visitante</h6>
                <div class="detail-row"><span class="label">Nombre</span><span class="value">${escapeHtml(v.visitante)}</span></div>
                <div class="detail-row"><span class="label">DNI</span><span class="value">${escapeHtml(v.dni || '—')}</span></div>
                <div class="detail-row"><span class="label">Teléfono</span><span class="value">${escapeHtml(v.telefono || '—')}</span></div>
            </div>

            <div class="side-panel-section">
                <h6>Reserva</h6>
                <div class="detail-row"><span class="label">Recinto</span><span class="value">${escapeHtml(v.recinto)} · cap. ${v.capacidad}</span></div>
                <div class="detail-row"><span class="label">Fecha</span><span class="value">${v.fecha}</span></div>
                <div class="detail-row"><span class="label">Tipo entrada</span><span class="value">${v.tipo_entrada}</span></div>
                <div class="detail-row"><span class="label">Creada</span><span class="value">${v.created_at || '—'}</span></div>
                ${v.confirmed_at ? `<div class="detail-row"><span class="label">Confirmada</span><span class="value">${v.confirmed_at}</span></div>` : ''}
                ${v.completed_at ? `<div class="detail-row"><span class="label">Completada</span><span class="value">${v.completed_at}</span></div>` : ''}
                ${v.cancelled_at ? `<div class="detail-row"><span class="label">Cancelada</span><span class="value">${v.cancelled_at}</span></div>` : ''}
                ${v.cancelled_reason ? `<div class="detail-row"><span class="label">Motivo cancel.</span><span class="value">${escapeHtml(v.cancelled_reason)}</span></div>` : ''}
                ${v.refunded_amount ? `<div class="detail-row"><span class="label">Reembolsado</span><span class="value">€${v.refunded_amount}</span></div>` : ''}
            </div>

            <div class="side-panel-section">
                <h6>Notas internas</h6>
                <textarea id="notes-edit" class="form-control" rows="3" placeholder="Añade contexto…">${escapeHtml(v.notes || '')}</textarea>
                <button class="btn btn-sm btn-outline-light w-100" style="margin-top:6px;" onclick="guardarNotas(${v.id}, this)">Guardar notas</button>
            </div>

            ${v.historial && v.historial.length ? `
            <div class="side-panel-section">
                <h6>Historial</h6>
                <div class="timeline">
                    ${v.historial.map(h => `
                        <div class="timeline-item">
                            <div class="ts">${h.fecha}</div>
                            <div class="desc"><strong>${h.de || '—'}</strong> → <strong>${h.a}</strong>${h.motivo ? ` · ${escapeHtml(h.motivo)}` : ''}</div>
                        </div>`).join('')}
                </div>
            </div>` : ''}
        `;

        const actions = document.getElementById('side-panel-actions');
        actions.innerHTML = actionsForEstado(v).join('');
    }

    function actionsForEstado(v) {
        const a = [];
        const e = v.estado;
        if (e === 'Pendiente') {
            a.push(`<button class="btn btn-warning" onclick="confirmarVisita(${v.id}, this)">Confirmar</button>`);
            a.push(`<button class="btn btn-outline-light" onclick="reprogramarVisita(${v.id}, this)">Reprogramar</button>`);
            a.push(`<button class="btn btn-outline-danger" onclick="cancelarVisita(${v.id}, this)">Cancelar</button>`);
        } else if (e === 'Confirmada' || e === 'Reprogramada') {
            a.push(`<button class="btn btn-success" onclick="cobrarVisita(${v.id})">Registrar pago</button>`);
            a.push(`<button class="btn btn-outline-light" onclick="reprogramarVisita(${v.id}, this)">Reprogramar</button>`);
            a.push(`<button class="btn btn-outline-danger" onclick="cancelarVisita(${v.id}, this)">Cancelar</button>`);
        } else if (e === 'Pagada') {
            a.push(`<button class="btn btn-success" onclick="completarVisita(${v.id}, this)">Marcar entrada</button>`);
            a.push(`<button class="btn btn-outline-light" onclick="reembolsarVisita(${v.id}, this)">Reembolsar</button>`);
        } else if (e === 'Completada') {
            a.push(`<button class="btn btn-outline-light" onclick="reembolsarVisita(${v.id}, this)">Reembolso parcial</button>`);
        }
        return a;
    }

    window.guardarNotas = function (id, btn) {
        const notes = document.getElementById('notes-edit').value;
        return withLoading(btn, () =>
            fetch(`/api/visitas/${id}/notas`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes }),
            }).then(r => r.json()).then(d => {
                if (d.error) throw new Error(d.error);
                Toast.success('Guardado', 'Notas actualizadas.');
            }).catch(err => Toast.error('Error', err.message))
        );
    };

    window.cobrarVisita = function (id) {
        document.getElementById('cobrar_id_registro').value = id;
        document.getElementById('cobrar_vid').textContent = '#' + id;
        document.getElementById('cobrar_cantidad').value = '';
        document.getElementById('cobrar_metodo').value = 'Tarjeta';
        new bootstrap.Modal(document.getElementById('modalCobrar')).show();
    };

    // ─── MODAL NUEVA ─────────────────────────────────────

    function abrirModalNueva() {
        document.getElementById('formNuevaVisita').reset();
        const m = new bootstrap.Modal(document.getElementById('modalNuevaVisita'));
        m.show();
    }
    function cerrarModalNueva() {
        const inst = bootstrap.Modal.getInstance(document.getElementById('modalNuevaVisita'));
        if (inst) inst.hide();
    }

    // ─── HELPERS ─────────────────────────────────────────

    function setText(id, v) {
        const el = document.getElementById(id);
        if (el) el.textContent = (v ?? '—');
    }
    function todayStr() { return new Date().toISOString().split('T')[0]; }
    function nextNDaysStr(n) {
        const d = new Date(); d.setDate(d.getDate() + n);
        return d.toISOString().split('T')[0];
    }
    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
})();
