document.addEventListener("DOMContentLoaded", function() {
    cargarDinosaurios();
});

function cargarDinosaurios() {
    // Hacemos una petición a nuestra propia API en Python
    fetch('/api/dinosaurios')
        .then(response => response.json())
        .then(data => {
            const contenedor = document.getElementById('contenedor-dinosaurios');
            contenedor.innerHTML = ''; // Limpiamos el mensaje de "Cargando..."

            // Recorremos cada dinosaurio y creamos su tarjeta HTML
            data.forEach(dino => {
                // Si está en alerta, borde rojo. Si no, verde.
                const claseAlerta = dino.alerta ? 'alerta-roja' : 'alerta-verde';
                const estadoTexto = dino.alerta ? '<span class="text-danger fw-bold">¡PELIGRO!</span>' : '<span class="text-success">Seguro</span>';

                const tarjetaHTML = `
                    <div class="col-md-4 mb-4">
                        <div class="card dino-card ${claseAlerta} h-100 p-3 shadow">
                            <h4 class="text-warning">${dino.nombre}</h4>
                            <h6 class="text-light fst-italic">${dino.especie}</h6>
                            <hr class="border-secondary">
                            <p class="mb-1 text-light"><strong>Recinto:</strong> ${dino.recinto}</p>
                            <p class="mb-0 text-light"><strong>Estado:</strong> ${estadoTexto}</p>
                        </div>
                    </div>
                `;
                // Insertamos la tarjeta en la web
                contenedor.innerHTML += tarjetaHTML;
            });
        })
        .catch(error => {
            console.error("Error al obtener los datos de InGen:", error);
            document.getElementById('contenedor-dinosaurios').innerHTML = '<p class="text-danger">Error crítico del sistema. Contacte con Ray Arnold.</p>';
        });
}