document.addEventListener("DOMContentLoaded", function() {
    cargarEmpleados();
    cargarAuditoria();
    document.getElementById('formEmpleado').addEventListener('submit', guardarEmpleado);
});

let modalEmpInstancia;

function cargarEmpleados() {
    fetch('/api/empleados')
        .then(response => response.json())
        .then(data => {
            const contenedor = document.getElementById('contenedor-empleados');
            contenedor.innerHTML = '';

            data.forEach(emp => {
                const esActivo = emp.en_activo === 'S';
                const colorBorde = esActivo ? 'border-info' : 'border-secondary opacity-75';
                const badgeActivo = esActivo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>';

                const tarjeta = `
                    <div class="col-md-4 mb-4">
                        <div class="card bg-dark text-light border-2 ${colorBorde} shadow h-100 p-3 dino-card">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h5 class="text-info mb-0">${emp.nombre}</h5>
                                ${badgeActivo}
                            </div>
                            <h6 class="text-light fst-italic">ID: ${emp.id} | ${emp.cargo}</h6>
                            <hr class="border-secondary">
                            <p class="mb-1"><strong>Radio:</strong> ${emp.telefono}</p>
                            <p class="mb-3"><strong>Contrato:</strong> ${emp.fecha_contrato}</p>
                            <div class="mt-auto d-flex gap-2">
                                <button class="btn btn-sm btn-outline-info flex-grow-1"
                                    onclick="abrirModalEditarEmp(${emp.id}, '${emp.nombre}', '${emp.cargo}', '${emp.telefono}', '${emp.fecha_contrato}', '${emp.en_activo}')">
                                    Editar
                                </button>
                                ${esActivo ? `
                                <button class="btn btn-sm btn-outline-danger" onclick="bajaEmpleado(${emp.id}, '${emp.nombre}')">
                                    Baja
                                </button>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                contenedor.innerHTML += tarjeta;
            });
        })
        .catch(error => console.error("Error RRHH:", error));
}

function cargarAuditoria() {
    fetch('/api/auditoria_empleados')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('tabla-auditoria');
            tbody.innerHTML = '';
            if(data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">Sin auditorias todavia</td></tr>';
                return;
            }
            data.forEach(a => {
                tbody.innerHTML += `
                    <tr>
                        <td>${a.id}</td>
                        <td class="text-secondary">${a.fecha}</td>
                        <td>${a.empleado} <span class="text-secondary">(ID ${a.id_empleado})</span></td>
                        <td class="text-info fw-bold">${a.accion}</td>
                    </tr>
                `;
            });
        })
        .catch(error => console.error("Error auditoria:", error));
}

function abrirModalEmpleado() {
    document.getElementById('formEmpleado').reset();
    document.getElementById('empAction').value = 'crear';
    document.getElementById('empFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('empFecha').disabled = false;

    modalEmpInstancia = new bootstrap.Modal(document.getElementById('modalEmpleado'));
    modalEmpInstancia.show();
}

function abrirModalEditarEmp(id, nombre, cargo, telefono, fecha, activo) {
    document.getElementById('empAction').value = 'editar';
    document.getElementById('empId').value = id;
    document.getElementById('empNombre').value = nombre;
    document.getElementById('empCargo').value = cargo;
    document.getElementById('empTelefono').value = telefono;
    document.getElementById('empFecha').value = fecha;
    document.getElementById('empFecha').disabled = true;
    document.getElementById('empActivo').value = activo;

    modalEmpInstancia = new bootstrap.Modal(document.getElementById('modalEmpleado'));
    modalEmpInstancia.show();
}

function guardarEmpleado(event) {
    event.preventDefault();

    const accion = document.getElementById('empAction').value;
    const id = document.getElementById('empId').value;
    const payload = {
        nombre: document.getElementById('empNombre').value,
        cargo: document.getElementById('empCargo').value,
        telefono: document.getElementById('empTelefono').value,
        fecha_contrato: document.getElementById('empFecha').value,
        en_activo: document.getElementById('empActivo').value
    };

    const url = accion === 'crear' ? '/api/empleados' : `/api/empleados/${id}`;
    const metodo = accion === 'crear' ? 'POST' : 'PUT';

    fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) throw new Error(data.error);
        modalEmpInstancia.hide();
        cargarEmpleados();
        cargarAuditoria();
    })
    .catch(error => alert('Error RRHH: ' + error.message));
}

function bajaEmpleado(id, nombre) {
    if(confirm(`ATENCION: quieres revocar accesos y dar de baja a ${nombre}?`)) {
        fetch(`/api/empleados/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if(data.error) throw new Error(data.error);
            cargarEmpleados();
            cargarAuditoria();
        })
        .catch(error => alert('Fallo de seguridad: ' + error.message));
    }
}
