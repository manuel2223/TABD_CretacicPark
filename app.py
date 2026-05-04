from flask import Flask, render_template, jsonify
import oracledb

app = Flask(__name__)

# Función maestra de conexión al sistema InGen
def get_db_connection():
    # TODO: ¡Cambia estos datos por tus credenciales de Oracle!
    return oracledb.connect(
        user="system",       # Ej: SYSTEM o tu nombre de esquema
        password="oracle",  # Tu contraseña de Oracle
        dsn="localhost:1521/XEPDB1"  # Puede ser XE, XEPDB1 o ORCL, fíjate en SQL Developer
    )

@app.route('/')
def home():
    """Ruta principal que carga la interfaz web"""
    return render_template('index.html')

@app.route('/api/dinosaurios', methods=['GET'])
def api_dinosaurios():
    """Ruta API que devuelve el catálogo vivo del parque"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Hacemos un JOIN entre la tabla de objetos Dinosaurios y la tabla Recintos
        # para devolver también el nombre del sector donde viven.
        sql = """
            SELECT d.id_dino, d.nombre_propio, d.especie, d.dieta_base, r.nombre_sector
            FROM Dinosaurios d
            JOIN Recintos r ON d.id_recinto = r.id_recinto
            ORDER BY d.id_dino
        """
        cursor.execute(sql)
        
        # Transformamos las filas crudas de Oracle en un diccionario que el Frontend (JS) entienda
        lista_dinos = []
        for row in cursor:
            lista_dinos.append({
                "id": row[0],
                "nombre": row[1],
                "especie": row[2],
                "dieta": row[3],
                "recinto": row[4]
            })
            
        cursor.close()
        conn.close()
        
        return jsonify(lista_dinos)
        
    except Exception as e:
        print(f"ALERTA DEL SISTEMA: {e}")
        return jsonify({"error": "Fallo en la red principal de InGen"}), 500

if __name__ == '__main__':
    # Arrancamos el servidor
    app.run(debug=True, port=5000)