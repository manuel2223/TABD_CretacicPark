document.addEventListener("DOMContentLoaded", function() {
    cargarVisitantes();
    document.getElementById('formVisitante').addEventListener('submit', guardarVisitante);
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
    .catch(err => alert("Error en registro: " + err));
}