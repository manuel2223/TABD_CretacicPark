document.addEventListener("DOMContentLoaded", function() {
    cargarServicios();
    cargarVentas();
    cargarVisitasPago();
    cargarPagos();
    document.getElementById('formVenta').addEventListener('submit', guardarVenta);
    document.getElementById('formPago').addEventListener('submit', guardarPago);
});

let serviciosData = [];

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
                        <td class="text-warning">${v.servicio}</td>
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
            const tbody = document.getElementById('tabla-visitas-pago');
            tbody.innerHTML = '';
            data.forEach(v => {
                const estadoClase = v.estado === 'Pagado' ? 'text-success' : 'text-warning';
                tbody.innerHTML += `
                    <tr>
                        <td>${v.id}</td>
                        <td>${v.visitante}</td>
                        <td>${v.recinto}</td>
                        <td>${v.fecha}</td>
                        <td class="${estadoClase} fw-bold">${v.estado}</td>
                    </tr>
                `;
            });
        });
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
                        <td class="text-success fw-bold">${p.estado_visita}</td>
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
        if(data.error) alert("Error: " + data.error);
        else {
            document.getElementById('formVenta').reset();
            cargarVentas();
        }
    });
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
