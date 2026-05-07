document.addEventListener("DOMContentLoaded", function() {
    cargarRecintos();
    document.getElementById('formRecinto').addEventListener('submit', guardarRecinto);
});

let modalRecInstancia;

function cargarRecintos() {
    fetch('/api/recintos')
        .then(res => res.json())
        .then(data => {
            const contenedor = document.getElementById('contenedor-recintos');
            contenedor.innerHTML = '';
            data.forEach(r => {
                const esDisponible = r.disponible === 'S';
                const claseEstado = esDisponible ? 'border-warning' : 'border-danger opacity-75';
                const textoEstado = esDisponible ? '<span class="text-success">SECTOR OPERATIVO</span>' : '<span class="text-danger fw-bold">SECTOR CERRADO</span>';

                contenedor.innerHTML += `
                    <div class="col-md-6 mb-4">
                        <div class="card bg-dark text-light border-2 ${claseEstado} shadow p-3">
                            <div class="d-flex justify-content-between">
                                <h4 class="text-warning">${r.sector}</h4>
                                <span class="badge bg-secondary">REF: ${r.id}</span>
                            </div>
                            <p class="mb-1 text-secondary"><strong>🛡️ Seguridad:</strong> ${r.seguridad}</p>
                            <p class="mb-1"><strong>👥 Capacidad:</strong> ${r.capacidad} activos/personas</p>
                            <p class="mb-3 border-top border-secondary pt-2">${textoEstado}</p>
                            
                            <button class="btn btn-outline-warning w-100" 
                                onclick="abrirModalRecinto(${r.id}, '${r.sector}', '${r.seguridad}', ${r.capacidad}, '${r.disponible}')">
                                🔧 Reconfigurar Sector
                            </button>
                        </div>
                    </div>
                `;
            });
        });
}

function abrirModalRecinto(id, nombre, seguridad, capacidad, disponible) {
    document.getElementById('recId').value = id;
    document.getElementById('recNombre').value = nombre;
    document.getElementById('recSeguridad').value = seguridad;
    document.getElementById('recCapacidad').value = capacidad;
    document.getElementById('recDisponible').value = disponible;

    modalRecInstancia = new bootstrap.Modal(document.getElementById('modalRecinto'));
    modalRecInstancia.show();
}

function guardarRecinto(event) {
    event.preventDefault();
    const id = document.getElementById('recId').value;
    const payload = {
        sector: document.getElementById('recNombre').value,
        seguridad: document.getElementById('recSeguridad').value,
        capacidad: parseInt(document.getElementById('recCapacidad').value),
        disponible: document.getElementById('recDisponible').value
    };

    fetch(`/api/recintos/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        modalRecInstancia.hide();
        cargarRecintos();
    });
}