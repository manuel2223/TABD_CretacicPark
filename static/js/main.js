document.addEventListener("DOMContentLoaded", function() {
    cargarDinosaurios();

    // Listeners para los formularios
    document.getElementById('formDino').addEventListener('submit', guardarDinosaurio);
    document.getElementById('formIncidencia').addEventListener('submit', guardarIncidencia);
});

let modalDinoInstancia;
let modalIncidenciaInstancia;

//  LÓGICA DE DINOSAURIOS 

function cargarDinosaurios() {
    fetch('/api/dinosaurios')
        .then(response => response.json())
        .then(data => {
            const contenedor = document.getElementById('contenedor-dinosaurios');
            contenedor.innerHTML = ''; 

            data.forEach(dino => {
                const esCarnivoro = dino.dieta.toLowerCase().includes('carnívoro');
                const claseAlerta = esCarnivoro ? 'border-danger' : 'border-success';
                const estadoTexto = esCarnivoro ? '<span class="text-danger fw-bold">Peligro Alto</span>' : '<span class="text-success">Estable</span>';
                const iconoDieta = esCarnivoro ? '🥩' : '🌿';

                const tarjetaHTML = `
                    <div class="col-md-4 mb-4">
                        <div class="card bg-dark text-light ${claseAlerta} border-2 h-100 p-3 shadow dino-card">
                            <div class="d-flex justify-content-between align-items-start">
                                <h4 class="text-warning mb-0">${dino.nombre}</h4>
                                <span class="badge bg-secondary">ID: ${dino.id}</span>
                            </div>
                            <h6 class="text-secondary fst-italic mt-1">${dino.especie} ${iconoDieta}</h6>
                            <hr class="border-secondary">
                            <p class="mb-1"><strong>Dieta:</strong> ${dino.dieta}</p>
                            <p class="mb-1"><strong>Recinto:</strong> ${dino.recinto}</p>
                            <p class="mb-3 border-top border-secondary pt-2">
                                <strong>Nivel de Amenaza:</strong> ${estadoTexto}
                            </p>
                            
                            <div class="mt-auto d-flex gap-2">
                                <button class="btn btn-sm btn-outline-warning flex-grow-1" 
                                    onclick="abrirModalEditar(${dino.id}, '${dino.nombre}', '${dino.especie}', '${dino.dieta}', ${dino.id_recinto})">
                                    ⚙️ Ajustar
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="eliminarDinosaurio(${dino.id})">
                                    🗑️ Baja
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                contenedor.innerHTML += tarjetaHTML;
            });
        })
        .catch(error => {
            console.error("Error al obtener los datos:", error);
            document.getElementById('contenedor-dinosaurios').innerHTML = '<div class="alert alert-danger">Error crítico del sistema. Red inoperativa.</div>';
        });
}

function abrirModalDino() {
    document.getElementById('formDino').reset();
    document.getElementById('dinoAction').value = 'crear';
    document.getElementById('dinoId').disabled = false; 
    document.getElementById('modalDinoTitle').innerText = 'Registrar Nuevo Activo';
    
    modalDinoInstancia = new bootstrap.Modal(document.getElementById('modalDino'));
    modalDinoInstancia.show();
}

function abrirModalEditar(id, nombre, especie, dieta, id_recinto) {
    document.getElementById('dinoAction').value = 'editar';
    document.getElementById('dinoId').value = id;
    document.getElementById('dinoId').disabled = true; 
    document.getElementById('dinoNombre').value = nombre;
    document.getElementById('dinoEspecie').value = especie;
    document.getElementById('dinoDieta').value = dieta;
    document.getElementById('dinoRecintoId').value = id_recinto;
    
    document.getElementById('modalDinoTitle').innerText = 'Modificar Datos Genéticos';
    
    modalDinoInstancia = new bootstrap.Modal(document.getElementById('modalDino'));
    modalDinoInstancia.show();
}

function guardarDinosaurio(event) {
    event.preventDefault();
    
    const accion = document.getElementById('dinoAction').value;
    const id = document.getElementById('dinoId').value;
    
    const payload = {
        id: parseInt(id),
        nombre: document.getElementById('dinoNombre').value,
        especie: document.getElementById('dinoEspecie').value,
        dieta: document.getElementById('dinoDieta').value,
        id_recinto: parseInt(document.getElementById('dinoRecintoId').value)
    };

    const url = accion === 'crear' ? '/api/dinosaurios' : `/api/dinosaurios/${id}`;
    const metodo = accion === 'crear' ? 'POST' : 'PUT';

    fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) throw new Error(data.error);
        modalDinoInstancia.hide();
        cargarDinosaurios();
    })
    .catch(error => alert('Fallo al guardar: ' + error));
}

function eliminarDinosaurio(id) {
    if(confirm('ALERTA: ¿Estás seguro de que quieres dar de baja a este activo biológico del sistema?')) {
        fetch(`/api/dinosaurios/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if(data.error) throw new Error(data.error);
            cargarDinosaurios();
        })
        .catch(error => alert('Error al eliminar: ' + error));
    }
}

//  LÓGICA DE INCIDENCIAS 

function abrirModalIncidencia() {
    document.getElementById('formIncidencia').reset();
    modalIncidenciaInstancia = new bootstrap.Modal(document.getElementById('modalIncidencia'));
    modalIncidenciaInstancia.show();
}

function guardarIncidencia(event) {
    event.preventDefault();
    
    const payload = {
        descripcion: document.getElementById('incDesc').value,
        id_recinto: parseInt(document.getElementById('incRecinto').value),
        nivel_alerta: document.getElementById('incNivel').value
    };

    fetch('/api/incidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) throw new Error(data.error);
        modalIncidenciaInstancia.hide();
        alert('SISTEMA INGEN: ' + data.mensaje);
    })
    .catch(error => alert('Fallo de red al registrar incidencia: ' + error));
}