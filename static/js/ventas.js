document.addEventListener("DOMContentLoaded", function() {
    cargarServicios();
    cargarVentas();
    document.getElementById('formVenta').addEventListener('submit', guardarVenta);
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