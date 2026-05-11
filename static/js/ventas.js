document.addEventListener("DOMContentLoaded", function() {
    cargarServicios();
    cargarVentas();
    cargarVisitasPago();
    cargarPagos();
    document.getElementById('formVenta').addEventListener('submit', guardarVenta);
    document.getElementById('formPago').addEventListener('submit', guardarPago);
    document.getElementById('formReprogramar').addEventListener('submit', guardarReprogramacion);
});

let serviciosData = [];
let visitasData = [];
let modalReprogramar;

function cargarServicios() {
    fetch('/api/servicios')
        .then(res => res.json())
        .then(data => {
            serviciosData = data;
            const select = document.getElementById('v_servicio');
            select.innerHTML = '<option value="">Seleccione servicio...</option>';
            data.forEach(s => {
                select.innerHTML += `<option value="${s.id}">${s.nombre} ($${s.precio})</option>`;
            });
        });
}

function actualizarPrecio() {
    const idS = document.getElementById('v_servicio').value;
    const servicio = serviciosData.find(s => s.id == idS);
    if(servicio) {
        document.getElementById('v_total').value = servicio.precio;
    }
}

function cargarVentas() {
    fetch('/api/ventas')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabla-ventas');
            let acumulado = 0;
            tbody.innerHTML = '';
            data.forEach(v => {
                acumulado += v.total;
                tbody.innerHTML += `
                    <tr>
                        <td>${v.id}</td>
                        <td class="text-info">${v.servicio}</td>
                        <td>${v.empleado}</td>
                        <td class="text-secondary">${v.fecha}</td>
                        <td class="fw-bold text-success">$${v.total.toFixed(2)}</td>
                    </tr>
                `;
            });
            document.getElementById('total-caja').innerText = `$${acumulado.toLocaleString()}`;
        });
}

function cargarVisitasPago() {
    fetch('/api/visitas')
        .then(res => res.json())
        .then(data => {
            visitasData = data;
            actualizarMetricas();
            renderVisitas();
        });
}

function actualizarMetricas() {
    document.getElementById('metric-pendientes').innerText = visitasData.filter(v => v.estado === 'Pendiente').length;
    document.getElementById('metric-confirmadas').innerText = visitasData.filter(v => ['Confirmada', 'Reprogramada'].includes(v.estado)).length;
    document.getElementById('metric-pagadas').innerText = visitasData.filter(v => v.estado_pago === 'Pagada').length;
}

function renderVisitas() {
    const estado = document.getElementById('filtroEstado').value;
    const pago = document.getElementById('filtroPago').value;
    const texto = document.getElementById('filtroTexto').value.toLowerCase().trim();
    const tbody = document.getElementById('tabla-visitas-pago');

    const filtradas = visitasData.filter(v => {
        const coincideEstado = estado === 'Todas' || v.estado === estado;
        const coincidePago = pago === 'Todos' || v.estado_pago === pago;
        const coincideTexto = !texto || `${v.visitante} ${v.recinto} ${v.id}`.toLowerCase().includes(texto);
        return coincideEstado && coincidePago && coincideTexto;
    });

    tbody.innerHTML = '';
    if(filtradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary">No hay visitas con esos filtros.</td></tr>';
        return;
    }

    filtradas.forEach(v => {
        tbody.innerHTML += `
            <tr>
                <td>${v.id}</td>
                <td class="fw-bold">${v.visitante}</td>
                <td>${v.recinto}</td>
                <td>${v.fecha}</td>
                <td>${badgeEstado(v.estado)}</td>
                <td>${badgePago(v.estado_pago, v.total_pagado)}</td>
                <td>${accionesVisita(v)}</td>
            </tr>
        `;
    });
}

function badgeEstado(estado) {
    const clases = {
        Pendiente: 'bg-warning text-dark',
        Confirmada: 'bg-info text-dark',
        Reprogramada: 'bg-orange text-dark',
        Cancelada: 'bg-danger',
        Completada: 'bg-success'
    };
    const clase = clases[estado] || 'bg-secondary';
    return `<span class="badge ${clase}">${estado}</span>`;
}

function badgePago(estadoPago, total) {
    if(estadoPago === 'Pagada') {
        return `<span class="badge bg-success">Pagada $${Number(total).toFixed(2)}</span>`;
    }
    return '<span class="badge bg-secondary">Sin pagar</span>';
}

function accionesVisita(v) {
    if(v.estado === 'Pendiente') {
        return `
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-success" onclick="cambiarEstado(${v.id}, 'Confirmada')">Confirmar</button>
                <button class="btn btn-outline-warning" onclick="abrirReprogramar(${v.id}, '${v.fecha}')">Reprogramar</button>
                <button class="btn btn-outline-danger" onclick="cambiarEstado(${v.id}, 'Cancelada')">Cancelar</button>
            </div>
        `;
    }

    if(v.estado === 'Confirmada' || v.estado === 'Reprogramada') {
        return `
            <div class="btn-group btn-group-sm">
                ${v.estado_pago === 'Sin pagar' ? `<button class="btn btn-outline-success" onclick="prepararPago(${v.id})">Pagar</button>` : ''}
                <button class="btn btn-outline-info" onclick="cambiarEstado(${v.id}, 'Completada')">Completar</button>
                <button class="btn btn-outline-warning" onclick="abrirReprogramar(${v.id}, '${v.fecha}')">Reprogramar</button>
                <button class="btn btn-outline-danger" onclick="cambiarEstado(${v.id}, 'Cancelada')">Cancelar</button>
            </div>
        `;
    }

    if(v.estado === 'Cancelada') {
        return '<span class="text-secondary">Sin acciones</span>';
    }

    return '<span class="text-success">Cerrada</span>';
}

function cambiarEstado(id, estado) {
    fetch(`/api/visitas/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ estado })
    })
    .then(res => res.json())
    .then(data => {
        if(data.error) throw new Error(data.error);
        cargarVisitasPago();
    })
    .catch(error => alert("No se pudo actualizar la visita: " + error.message));
}

function abrirReprogramar(id, fecha) {
    document.getElementById('reprogramarId').value = id;
    document.getElementById('reprogramarFecha').value = fecha;
    modalReprogramar = new bootstrap.Modal(document.getElementById('modalReprogramar'));
    modalReprogramar.show();
}

function guardarReprogramacion(event) {
    event.preventDefault();
    const id = document.getElementById('reprogramarId').value;
    const fecha = document.getElementById('reprogramarFecha').value;

    fetch(`/api/visitas/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ estado: 'Reprogramada', fecha_visita: fecha })
    })
    .then(res => res.json())
    .then(data => {
        if(data.error) throw new Error(data.error);
        modalReprogramar.hide();
        cargarVisitasPago();
    })
    .catch(error => alert("No se pudo reprogramar: " + error.message));
}

function prepararPago(id) {
    const tab = new bootstrap.Tab(document.getElementById('pagos-tab'));
    tab.show();
    document.getElementById('p_registro').value = id;
    document.getElementById('p_cantidad').focus();
}

function cargarPagos() {
    fetch('/api/pagos')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabla-pagos');
            tbody.innerHTML = '';
            data.forEach(p => {
                tbody.innerHTML += `
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.id_registro}</td>
                        <td class="text-secondary">${p.fecha}</td>
                        <td class="text-success fw-bold">$${p.cantidad.toFixed(2)}</td>
                        <td>${p.metodo}</td>
                        <td>${badgeEstado(p.estado_visita)}</td>
                    </tr>
                `;
            });
        });
}

function guardarVenta(event) {
    event.preventDefault();
    const payload = {
        id_registro: parseInt(document.getElementById('v_registro').value),
        id_servicio: parseInt(document.getElementById('v_servicio').value),
        id_empleado: parseInt(document.getElementById('v_empleado').value),
        total: parseFloat(document.getElementById('v_total').value)
    };

    fetch('/api/ventas', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if(data.error) throw new Error(data.error);
        document.getElementById('formVenta').reset();
        cargarVentas();
    })
    .catch(error => alert("No se pudo registrar la venta extra: " + error.message));
}

function guardarPago(event) {
    event.preventDefault();
    const payload = {
        id_registro: parseInt(document.getElementById('p_registro').value),
        cantidad: parseFloat(document.getElementById('p_cantidad').value),
        metodo: document.getElementById('p_metodo').value
    };

    fetch('/api/pagos', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if(data.error) throw new Error(data.error);
        document.getElementById('formPago').reset();
        cargarVisitasPago();
        cargarPagos();
        alert(data.mensaje);
    })
    .catch(error => alert("Error registrando pago: " + error.message));
}
