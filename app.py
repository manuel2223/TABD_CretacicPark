from flask import Flask, render_template, jsonify
import oracledb

app = Flask(__name__)

# TODO: Cuando tengamos la BD, descomentaremos esto:
# def get_db_connection():
#     return oracledb.connect(user="tu_usuario", password="tu_password", dsn="localhost:1521/XEPDB1")

@app.route('/')
def home():
    """Ruta principal que carga la interfaz web"""
    return render_template('index.html')

@app.route('/api/dinosaurios')
def api_dinosaurios():
    """Ruta API que devuelve datos en formato JSON para que el frontend los dibuje"""
    # Aquí irá tu SELECT real. Por ahora, simulamos lo que devolvería la BD:
    dinosaurios_falsos = [
        {"id": 1, "nombre": "Rexy", "especie": "T-Rex", "recinto": "Paddock 9", "alerta": True},
        {"id": 2, "nombre": "Blue", "especie": "Velociraptor", "recinto": "Sector Norte", "alerta": False},
        {"id": 3, "nombre": "Bumpy", "especie": "Ankylosaurus", "recinto": "Valle de Giroesferas", "alerta": False}
    ]
    return jsonify(dinosaurios_falsos)

if __name__ == '__main__':
    # Arrancamos el servidor en modo debug para que se actualice solo al guardar
    app.run(debug=True, port=5000)