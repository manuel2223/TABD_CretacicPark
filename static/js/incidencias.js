document.addEventListener("DOMContentLoaded", function() {
    cargarTablaIncidencias();
    document.getElementById('formEditInc').addEventListener('submit', guardarEdicionIncidencia);
});

let modalEditIncInstancia;

function cargarTablaIncidencias() {
    fetch('/api/incidencias/todas')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('tabla-incidencias');
            tbody.innerHTML = '';

            if(data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-success">No hay incidencias registradas en el parque.</td></tr>';
                return;
            }

            data.forEach(inc => {
                // Colorear según el nivel de alerta
                let colorInsignia = 'bg-secondary';
                if(inc.nivel === 'Bajo') colorInsignia = 'bg-success';
                if(inc.nivel === 'Medio') colorInsignia = 'bg-warning text-dark';
                if(inc.nivel === 'Alto') colorInsignia = 'bg-danger';
                if(inc.nivel === 'Crítico') colorInsignia = 'bg-danger border border-light';

                const fila = `
                    <tr>
                        <td class="text-secondary">${inc.fecha}</td>
                        <td class="fw-bold text-warning">${inc.sector} (ID: ${inc.id_recinto})</td>
                        <td><span class="badge ${colorInsignia}">${inc.nivel}</span></td>
                        <td>${inc.descripcion}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-warning me-1" 
                                onclick="abrirModalEdicion(${inc.id_recinto}, '${inc.descripcion}', '${inc.nivel}')">
                                ⚙️
                            </button>
                            <button class="btn btn-sm btn-outline-danger" 
                                onclick="borrarIncidencia(${inc.id_recinto}, '${inc.descripcion}')">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += fila;
            });
        })
        .catch(error => {
            console.error(error);
            document.getElementById('tabla-incidencias').innerHTML = '<tr><td colspan="5" class="text-danger">Fallo en la red principal.</td></tr>';
        });
}

function abrirModalEdicion(id_recinto, descripcion, nivel) {
    document.getElementById('editIncRecinto').value = id_recinto;
    document.getElementById('editIncViejaDesc').value = descripcion; // Guardamos la original para buscarla en Oracle
    document.getElementById('editIncDesc').value = descripcion;
    document.getElementById('editIncNivel').value = nivel;

    modalEditIncInstancia = new bootstrap.Modal(document.getElementById('modalEditarIncidencia'));
    modalEditIncInstancia.show();
}

function guardarEdicionIncidencia(event) {
    event.preventDefault();
    
    const id_recinto = document.getElementById('editIncRecinto').value;
    const payload = {
        vieja_desc: document.getElementById('editIncViejaDesc').value,
        nueva_desc: document.getElementById('editIncDesc').value,
        nuevo_nivel: document.getElementById('editIncNivel').value
    };

    fetch(`/api/incidencias/${id_recinto}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) throw new Error(data.error);
        modalEditIncInstancia.hide();
        cargarTablaIncidencias(); // Recargar la tabla
    })
    .catch(error => alert('Fallo al actualizar: ' + error));
}

function borrarIncidencia(id_recinto, descripcion) {
    if(confirm('¿Borrar este registro del historial oficial?')) {
        fetch(`/api/incidencias/${id_recinto}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descripcion: descripcion })
        })
        .then(response => response.json())
        .then(data => {
            if(data.error) throw new Error(data.error);
            cargarTablaIncidencias();
        })
        .catch(error => alert('Error al borrar: ' + error));
    }
}