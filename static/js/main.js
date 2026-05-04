document.addEventListener("DOMContentLoaded", function() {
    cargarDinosaurios();
});

function cargarDinosaurios() {
    // Hacemos una petición a nuestra API conectada a Oracle
    fetch('/api/dinosaurios')
        .then(response => response.json())
        .then(data => {
            const contenedor = document.getElementById('contenedor-dinosaurios');
            contenedor.innerHTML = ''; // Limpiamos el mensaje de "Cargando..."

            // Recorremos cada dinosaurio y creamos su tarjeta HTML
            data.forEach(dino => {
                // Lógica de seguridad de InGen basada en la dieta de la BD
                const esCarnivoro = dino.dieta.toLowerCase().includes('carnívoro');
                
                // Usamos colores de Bootstrap según la peligrosidad
                const claseAlerta = esCarnivoro ? 'border-danger' : 'border-success';
                const estadoTexto = esCarnivoro ? '<span class="text-danger fw-bold">Peligro Alto</span>' : '<span class="text-success">Estable</span>';
                const iconoDieta = esCarnivoro ? '🥩' : '🌿';

                // Usamos bg-dark y border-2 para que destaquen sobre el fondo
                const tarjetaHTML = `
                    <div class="col-md-4 mb-4">
                        <div class="card bg-dark text-light ${claseAlerta} border-2 h-100 p-3 shadow">
                            <h4 class="text-warning">${dino.nombre}</h4>
                            <h6 class="text-secondary fst-italic">${dino.especie} ${iconoDieta}</h6>
                            <hr class="border-secondary">
                            <p class="mb-1"><strong>Dieta:</strong> ${dino.dieta}</p>
                            <p class="mb-1"><strong>Recinto:</strong> ${dino.recinto}</p>
                            <p class="mb-0 mt-2 border-top border-secondary pt-2">
                                <strong>Nivel de Amenaza:</strong> ${estadoTexto}
                            </p>
                        </div>
                    </div>
                `;
                // Insertamos la tarjeta en la web
                contenedor.innerHTML += tarjetaHTML;
            });
        })
        .catch(error => {
            console.error("Error al obtener los datos de InGen:", error);
            document.getElementById('contenedor-dinosaurios').innerHTML = '<div class="alert alert-danger" role="alert">Error crítico del sistema. Red de recintos inoperativa. Contacte con Ray Arnold.</div>';
        });
}