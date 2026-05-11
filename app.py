from flask import Flask, render_template, jsonify, request
import oracledb

app = Flask(__name__)

# --- CONFIGURACIÓN DE CONEXIÓN ---
def get_db_connection():
    return oracledb.connect(
        user="system",       
        password="oracle",  
        dsn="localhost:1521/XEPDB1"
    )

# --- RUTAS FRONTEND ---
@app.route('/')
def home():
    """Ruta principal que carga la interfaz web"""
    return render_template('index.html')

# ==========================================
#              API DINOSAURIOS
# ==========================================

@app.route('/api/dinosaurios', methods=['GET'])
def get_dinosaurios():
    """Obtener todos los dinosaurios (El catálogo)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Consulta adaptada a tu esquema exacto
        sql = """
            SELECT d.id_dino, d.nombre_propio, d.especie, d.dieta_base, r.nombre_sector, d.id_recinto
            FROM Dinosaurios d
            JOIN Recintos r ON d.id_recinto = r.id_recinto
            ORDER BY d.id_dino
        """
        cursor.execute(sql)
        
        lista = [{"id": r[0], "nombre": r[1], "especie": r[2], "dieta": r[3], "recinto": r[4], "id_recinto": r[5]} for r in cursor]
        
        cursor.close()
        conn.close()
        return jsonify(lista)
    except Exception as e:
        print(f"Error GET Dinosaurios: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dinosaurios', methods=['POST'])
def add_dinosaurio():
    """Insertar un nuevo dinosaurio respetando la herencia de objetos"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Determinar si es Carnívoro o Herbívoro para usar el constructor correcto
        es_carnivoro = "carn" in data['dieta'].lower()
        
        if es_carnivoro:
            # Si es carnívoro, usamos T_Carnivoro. Pasamos valores por defecto para los atributos específicos (agresividad y dentición)
            sql = """
                INSERT INTO Dinosaurios VALUES (
                    T_Carnivoro(:1, :2, :3, :4, :5, 5, 'Dientes Estándar')
                )
            """
        else:
            # Si es herbívoro/omnívoro, usamos T_Herbivoro. Pasamos valores por defecto (tipo vegetación y si es manada)
            sql = """
                INSERT INTO Dinosaurios VALUES (
                    T_Herbivoro(:1, :2, :3, :4, :5, 'Vegetación Mixta', 'S')
                )
            """
            
        cursor.execute(sql, [data['id'], data['nombre'], data['especie'], data['dieta'], data['id_recinto']])
        conn.commit()
        
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Dinosaurio registrado con éxito usando Genética Avanzada"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/dinosaurios/<int:id_dino>', methods=['PUT'])
def update_dinosaurio(id_dino):
    """Modificar datos respetando las subclases de la base de datos"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Como es una tabla OF T_Dinosaurio, el UPDATE afecta a los atributos directamente,
        # pero mantenemos el mismo objeto base.
        sql = """
            UPDATE Dinosaurios 
            SET nombre_propio = :1, especie = :2, dieta_base = :3, id_recinto = :4
            WHERE id_dino = :5
        """
        cursor.execute(sql, [data['nombre'], data['especie'], data['dieta'], data['id_recinto'], id_dino])
        conn.commit()
        
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Datos genéticos/ubicación actualizados"})
    except Exception as e:
        # Aquí es donde el Trigger trg_seguridad_traslados lanzará su error ORA-20005
        return jsonify({"error": str(e)}), 500

@app.route('/api/dinosaurios/<int:id_dino>', methods=['DELETE'])
def delete_dinosaurio(id_dino):
    """Eliminar un dinosaurio"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = "DELETE FROM Dinosaurios WHERE id_dino = :1"
        cursor.execute(sql, [id_dino])
        conn.commit()
        
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Dinosaurio eliminado de los registros"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
#              API INCIDENCIAS
# ==========================================

@app.route('/api/incidencias', methods=['POST'])
def registrar_incidencia():
    """Registrar un fallo usando el Procedimiento Almacenado y Tabla Anidada"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Llamamos a tu procedimiento exacto de 5paquetes.sql
        cursor.callproc('sp_registrar_incidencia', [
            data['id_recinto'],
            data['descripcion'],
            data['nivel_alerta']
        ])
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"mensaje": f"Alerta de nivel {data['nivel_alerta']} registrada."}), 201
    except Exception as e:
        print(f"Error POST Incidencias: {e}")
        return jsonify({"error": str(e)}), 500
    
# ==========================================
#        NUEVO: PANEL DE INCIDENCIAS
# ==========================================

@app.route('/panel_incidencias')
def panel_incidencias():
    """Carga la página HTML de incidencias"""
    return render_template('incidencias.html')

@app.route('/api/incidencias/todas', methods=['GET'])
def get_todas_incidencias():
    """Obtiene todas las incidencias de las tablas anidadas"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Magia de Oracle para leer tablas anidadas: usamos TABLE()
        sql = """
            SELECT r.id_recinto, r.nombre_sector, 
                   TO_CHAR(i.fecha_incidencia, 'DD/MM/YYYY HH24:MI'), 
                   i.descripcion, i.nivel_alerta
            FROM Recintos r, TABLE(r.historial_alertas) i
            ORDER BY i.fecha_incidencia DESC
        """
        cursor.execute(sql)
        lista = [{"id_recinto": r[0], "sector": r[1], "fecha": r[2], "descripcion": r[3], "nivel": r[4]} for r in cursor]
        
        cursor.close()
        conn.close()
        return jsonify(lista)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/incidencias/<int:id_recinto>', methods=['PUT'])
def update_incidencia(id_recinto):
    """Modifica una incidencia en la tabla anidada"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Como no tienen ID propio, buscamos por la descripción antigua para actualizarla
        sql = """
            UPDATE TABLE(SELECT historial_alertas FROM Recintos WHERE id_recinto = :1) i
            SET i.descripcion = :2, i.nivel_alerta = :3
            WHERE i.descripcion = :4
        """
        cursor.execute(sql, [id_recinto, data['nueva_desc'], data['nuevo_nivel'], data['vieja_desc']])
        conn.commit()
        
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Registro de seguridad actualizado"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/incidencias/<int:id_recinto>', methods=['DELETE'])
def delete_incidencia(id_recinto):
    """Borra una incidencia específica"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """
            DELETE FROM TABLE(SELECT historial_alertas FROM Recintos WHERE id_recinto = :1) i
            WHERE i.descripcion = :2
        """
        cursor.execute(sql, [id_recinto, data['descripcion']])
        conn.commit()
        
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Alerta eliminada del historial"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
#        NUEVO: PANEL DE EMPLEADOS (RRHH)
# ==========================================

@app.route('/panel_empleados')
def panel_empleados():
    """Carga la interfaz de Recursos Humanos"""
    return render_template('empleados.html')

@app.route('/api/empleados', methods=['GET'])
def get_empleados():
    """Obtener el listado del personal de InGen"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """
            SELECT id_empleado, nombre, cargo, telefono, 
                   TO_CHAR(fecha_contrato, 'YYYY-MM-DD'), en_activo
            FROM Empleados
            ORDER BY en_activo DESC, id_empleado ASC
        """
        cursor.execute(sql)
        lista = [{"id": r[0], "nombre": r[1], "cargo": r[2], "telefono": r[3], "fecha_contrato": r[4], "en_activo": r[5]} for r in cursor]
        
        cursor.close()
        conn.close()
        return jsonify(lista)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/empleados', methods=['POST'])
def add_empleado():
    """Contratar a un nuevo empleado (El ID se genera solo)"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """
            INSERT INTO Empleados (nombre, cargo, telefono, fecha_contrato, en_activo)
            VALUES (:1, :2, :3, TO_DATE(:4, 'YYYY-MM-DD'), :5)
        """
        cursor.execute(sql, [data['nombre'], data['cargo'], data['telefono'], data['fecha_contrato'], data['en_activo']])
        conn.commit()
        
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Nuevo empleado registrado en InGen"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/empleados/<int:id_empleado>', methods=['PUT'])
def update_empleado(id_empleado):
    """Modificar expediente. ¡Esto activará tu trigger de Auditoría!"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """
            UPDATE Empleados 
            SET nombre = :1, cargo = :2, telefono = :3, en_activo = :4
            WHERE id_empleado = :5
        """
        cursor.execute(sql, [data['nombre'], data['cargo'], data['telefono'], data['en_activo'], id_empleado])
        conn.commit()
        
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Expediente actualizado. Auditoría notificada."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/empleados/<int:id_empleado>', methods=['DELETE'])
def baja_empleado(id_empleado):
    """Despedir empleado usando tu Procedimiento Almacenado"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Usamos tu procedimiento de 5paquetes.sql para darlo de baja
        cursor.callproc('sp_baja_empleado', [id_empleado])
        conn.commit()
        
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Se han revocado los accesos del empleado."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auditoria_empleados', methods=['GET'])
def get_auditoria_empleados():
    """Consultar auditoria generada automaticamente por el trigger de RRHH"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """
            SELECT a.id, TO_CHAR(a.fecha, 'YYYY-MM-DD HH24:MI:SS'), a.accion,
                   a.id_empleado, e.nombre
            FROM Auditoria_Empleados a
            LEFT JOIN Empleados e ON a.id_empleado = e.id_empleado
            ORDER BY a.id DESC
        """
        cursor.execute(sql)
        lista = [
            {
                "id": r[0],
                "fecha": r[1],
                "accion": r[2],
                "id_empleado": r[3],
                "empleado": r[4] or "Empleado eliminado"
            }
            for r in cursor
        ]
        cursor.close()
        conn.close()
        return jsonify(lista)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
#        NUEVO: PANEL DE VISITANTES
# ==========================================

@app.route('/panel_visitantes')
def panel_visitantes():
    """Carga la interfaz de control de turistas"""
    return render_template('visitantes.html')

@app.route('/api/visitantes', methods=['GET'])
def get_visitantes():
    """Obtener lista de visitantes en el parque"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "SELECT id_visitante, nombre, dni_pasaporte, telefono FROM Visitantes ORDER BY id_visitante DESC"
        cursor.execute(sql)
        lista = [{"id": r[0], "nombre": r[1], "dni": r[2], "telefono": r[3]} for r in cursor]
        cursor.close()
        conn.close()
        return jsonify(lista)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/visitantes', methods=['POST'])
def add_visitante():
    """Registrar nuevo visitante usando tu procedimiento sp_registrar_visitante"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Usamos tu procedimiento de 5paquetes.sql
        cursor.callproc('sp_registrar_visitante', [data['nombre'], data['dni'], data['telefono']])
        
        # sp_registrar_visitante ya tiene COMMIT dentro, pero por seguridad:
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Visitante registrado y seguro de vida firmado."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/visitas', methods=['GET'])
def get_visitas():
    """Obtener expediciones/visitas registradas para probar fecha y pagos"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """
            SELECT rv.id_registro, v.nombre, r.nombre_sector,
                   TO_CHAR(rv.fecha_visita, 'YYYY-MM-DD'),
                   rv.tipo_entrada, rv.estado
            FROM Registro_Visitas rv
            JOIN Visitantes v ON rv.id_visitante = v.id_visitante
            JOIN Recintos r ON rv.id_recinto = r.id_recinto
            ORDER BY rv.id_registro DESC
        """
        cursor.execute(sql)
        lista = [
            {
                "id": r[0],
                "visitante": r[1],
                "recinto": r[2],
                "fecha": r[3],
                "tipo_entrada": r[4],
                "estado": r[5]
            }
            for r in cursor
        ]
        cursor.close()
        conn.close()
        return jsonify(lista)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/visitas', methods=['POST'])
def add_visita():
    """Registrar una nueva visita. El trigger valida fechas pasadas y aforo."""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """
            INSERT INTO Registro_Visitas (id_visitante, id_recinto, fecha_visita, tipo_entrada, estado)
            VALUES (:1, :2, TO_DATE(:3, 'YYYY-MM-DD'), :4, :5)
        """
        cursor.execute(sql, [
            data['id_visitante'],
            data['id_recinto'],
            data['fecha_visita'],
            data['tipo_entrada'],
            data.get('estado', 'Pendiente')
        ])
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Expedicion registrada"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# ==========================================
#          PANEL DE RECINTOS
# ==========================================

@app.route('/panel_recintos')
def panel_recintos():
    """Carga la interfaz de gestión de sectores"""
    return render_template('recintos.html')

@app.route('/api/recintos', methods=['GET'])
def get_recintos():
    """Listar todos los recintos y su estado actual"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Traemos los datos básicos. Las incidencias se ven en su propio panel.
        sql = "SELECT id_recinto, nombre_sector, tipo_seguridad, capacidad_max, disponible FROM Recintos ORDER BY id_recinto"
        cursor.execute(sql)
        lista = [{"id": r[0], "sector": r[1], "seguridad": r[2], "capacidad": r[3], "disponible": r[4]} for r in cursor]
        cursor.close()
        conn.close()
        return jsonify(lista)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recintos/<int:id_recinto>', methods=['PUT'])
def update_recinto(id_recinto):
    """Actualizar estado de seguridad o disponibilidad usando tu lógica de negocio"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Podemos usar un UPDATE directo o llamar a tu procedimiento sp_estado_seguridad_recinto
        # Vamos a usar el procedimiento para la disponibilidad:
        cursor.callproc('sp_estado_seguridad_recinto', [id_recinto, data['disponible']])
        
        # Y un update manual para el resto de campos
        sql = "UPDATE Recintos SET nombre_sector = :1, tipo_seguridad = :2, capacidad_max = :3 WHERE id_recinto = :4"
        cursor.execute(sql, [data['sector'], data['seguridad'], data['capacidad'], id_recinto])
        
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Configuración del recinto actualizada."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

# ==========================================
#           PANEL DE VENTAS (FINANZAS)
# ==========================================

@app.route('/panel_ventas')
def panel_ventas():
    """Carga la interfaz financiera"""
    return render_template('ventas.html')

@app.route('/api/ventas', methods=['GET'])
def get_ventas():
    """Listado detallado de ventas con JOINs"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Unimos Ventas con Servicios y Empleados para tener nombres, no solo IDs
        sql = """
            SELECT v.id_venta, s.nombre, e.nombre, v.total, 
                   TO_CHAR(rv.fecha_visita, 'DD/MM/YYYY')
            FROM Ventas v
            JOIN Servicios_Extra s ON v.id_servicio = s.id_servicio
            JOIN Empleados e ON v.id_empleado = e.id_empleado
            JOIN Registro_Visitas rv ON v.id_registro = rv.id_registro
            ORDER BY v.id_venta DESC
        """
        cursor.execute(sql)
        lista = [{"id": r[0], "servicio": r[1], "empleado": r[2], "total": r[3], "fecha": r[4]} for r in cursor]
        cursor.close()
        conn.close()
        return jsonify(lista)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/servicios', methods=['GET'])
def get_servicios():
    """Obtener catálogo de servicios para los desplegables"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id_servicio, nombre, precio FROM Servicios_Extra")
        lista = [{"id": r[0], "nombre": r[1], "precio": r[2]} for r in cursor]
        cursor.close()
        conn.close()
        return jsonify(lista)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ventas', methods=['POST'])
def add_venta():
    """Registrar una nueva venta de servicio"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """
            INSERT INTO Ventas (id_registro, id_servicio, id_empleado, total)
            VALUES (:1, :2, :3, :4)
        """
        cursor.execute(sql, [data['id_registro'], data['id_servicio'], data['id_empleado'], data['total']])
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Transacción completada satisfactoriamente."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pagos', methods=['GET'])
def get_pagos():
    """Listado de pagos reales. Insertarlos dispara trg_confirmar_pago_reserva."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """
            SELECT p.id_pago, p.id_registro, TO_CHAR(p.fecha_pago, 'YYYY-MM-DD HH24:MI'),
                   p.cantidad, p.metodo, rv.estado
            FROM Pago p
            JOIN Registro_Visitas rv ON p.id_registro = rv.id_registro
            ORDER BY p.id_pago DESC
        """
        cursor.execute(sql)
        lista = [
            {
                "id": r[0],
                "id_registro": r[1],
                "fecha": r[2],
                "cantidad": r[3],
                "metodo": r[4],
                "estado_visita": r[5]
            }
            for r in cursor
        ]
        cursor.close()
        conn.close()
        return jsonify(lista)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pagos', methods=['POST'])
def add_pago():
    """Registrar pago de una visita mediante procedimiento; el trigger marca Pagado."""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.callproc('sp_registrar_pago', [
            data['id_registro'],
            data['cantidad'],
            data['metodo']
        ])
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Pago registrado. La visita debe quedar como Pagado."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

if __name__ == '__main__':
    app.run(debug=True, port=5000)
