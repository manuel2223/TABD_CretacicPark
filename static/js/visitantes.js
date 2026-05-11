document.addEventListener("DOMContentLoaded", function() {
    cargarVisitantes();
    cargarVisitas();
    document.getElementById('formVisitante').addEventListener('submit', guardarVisitante);
    document.getElementById('formVisita').addEventListener('submit', guardarVisita);
});

let modalVisInstancia;

function cargarVisitantes() {
    fetch('/api/visitantes')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('tabla-visitantes');
            tbody.innerHTML = '';
            data.forEach(v => {
                tbody.innerHTML += `
                    <tr>
                        <td>${v.id}</td>
                        <td class="fw-bold">${v.nombre}</td>
                        <td>${v.dni}</td>
                        <td>${v.telefono}</td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error("Error al cargar visitantes:", err));
}

function cargarVisitas() {
    fetch('/api/visitas')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('tabla-visitas');
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
        })
        .catch(err => console.error("Error al cargar visitas:", err));
}

function abrirModalVisitante() {
    document.getElementById('formVisitante').reset();
    modalVisInstancia = new bootstrap.Modal(document.getElementById('modalVisitante'));
    modalVisInstancia.show();
}

function guardarVisitante(event) {
    event.preventDefault();
    const payload = {
        nombre: document.getElementById('visNombre').value,
        dni: document.getElementById('visDni').value,
        telefono: document.getElementById('visTel').value
    };

    fetch('/api/visitantes', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if(data.error) throw new Error(data.error);
        modalVisInstancia.hide();
        cargarVisitantes();
    })
    .catch(err => alert("Error en registro: " + err.message));
}

function guardarVisita(event) {
    event.preventDefault();
    const payload = {
        id_visitante: parseInt(document.getElementById('expVisitante').value),
        id_recinto: parseInt(document.getElementById('expRecinto').value),
        fecha_visita: document.getElementById('expFecha').value,
        tipo_entrada: document.getElementById('expTipo').value,
        estado: 'Pendiente'
    };

    fetch('/api/visitas', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if(data.error) throw new Error(data.error);
        document.getElementById('formVisita').reset();
        cargarVisitas();
    })
    .catch(err => alert("Operacion denegada por la base de datos: " + err.message));
}
