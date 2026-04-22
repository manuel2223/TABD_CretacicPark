-- ==========================================================
-- PROCEDIMIENTOS DE INSERCIÓN
-- ==========================================================

-- A. Insertar Visitante (Antes Cliente)
CREATE OR REPLACE PROCEDURE sp_registrar_visitante(
    p_nombre VARCHAR2, p_dni VARCHAR2, p_tel VARCHAR2
) AS
BEGIN
    INSERT INTO Visitantes (nombre, dni_pasaporte, telefono) 
    VALUES (p_nombre, p_dni, p_tel);
    COMMIT;
END;
/

-- B. Insertar Dinosaurio (Específica de tu parque)
-- Maneja la inserción polimórfica según el tipo
CREATE OR REPLACE PROCEDURE sp_nuevo_activo_biologico(
    p_dino T_Dinosaurio, p_id_recinto NUMBER
) AS
BEGIN
    INSERT INTO Dinosaurios VALUES (p_dino, p_id_recinto);
    COMMIT;
END;
/

-- C. Insertar Pago de Expedición
CREATE OR REPLACE PROCEDURE sp_registrar_pago(
    p_id_reg NUMBER, p_monto NUMBER, p_metodo VARCHAR2
) AS
BEGIN
    INSERT INTO Pago (id_registro, fecha_pago, cantidad, metodo)
    VALUES (p_id_reg, SYSDATE, p_monto, p_metodo);
    COMMIT;
END;
/

-- D. Mostrar Incidencias de un Recinto (Lee la Nested Table)
CREATE OR REPLACE PROCEDURE sp_ver_alertas_recinto(p_id_recinto NUMBER) AS
    v_alertas T_Lista_Incidencias;
BEGIN
    SELECT historial_alertas INTO v_alertas FROM Recintos WHERE id_recinto = p_id_recinto;
    
    DBMS_OUTPUT.PUT_LINE('--- ALERTAS DEL RECINTO ' || p_id_recinto || ' ---');
    FOR i IN 1..v_alertas.COUNT LOOP
        DBMS_OUTPUT.PUT_LINE('Fecha: ' || v_alertas(i).fecha_incidencia || 
                             ' | Nivel: ' || v_alertas(i).nivel_alerta ||
                             ' | Descr: ' || v_alertas(i).descripcion);
    END LOOP;
END;
/

-- E. Función para Listar Dinosaurios por Dieta
CREATE OR REPLACE PROCEDURE sp_listar_dinos_dieta(p_dieta VARCHAR2) AS
BEGIN
    FOR r IN (SELECT nombre_propio, especie FROM Dinosaurios WHERE dieta_base = p_dieta) LOOP
        DBMS_OUTPUT.PUT_LINE('Dino: ' || r.nombre_propio || ' (' || r.especie || ')');
    END LOOP;
END;
/

-- F. Desactivar Empleado (Baja en el sistema)
CREATE OR REPLACE PROCEDURE sp_baja_empleado(p_id NUMBER) AS
BEGIN
    UPDATE Empleados SET en_activo = 'N' WHERE id_empleado = p_id;
    COMMIT;
END;
/

-- G. Modificar Costo de Mantenimiento (Antes Precio Habitación)
-- Nota: Como no teníamos "precio" en recintos, asumo un nuevo campo o lógica de servicios.
-- Si quieres cambiar el precio de los SERVICIOS:
CREATE OR REPLACE PROCEDURE sp_ajustar_precio_servicio(p_id NUMBER, p_nuevo_precio NUMBER) AS
BEGIN
    UPDATE Servicios_Extra SET precio = p_nuevo_precio WHERE id_servicio = p_id;
    COMMIT;
END;
/

-- H. Cambiar Estado de Recinto (Antes Estado Habitación)
-- Útil para cerrar sectores por fugas o mantenimiento
CREATE OR REPLACE PROCEDURE sp_estado_seguridad_recinto(p_id NUMBER, p_disponible CHAR) AS
BEGIN
    UPDATE Recintos SET disponible = p_disponible WHERE id_recinto = p_id;
    COMMIT;
END;
/

-- I. Modificar Estado de Visita (Antes Estado Reserva)
CREATE OR REPLACE PROCEDURE sp_actualizar_ticket(p_id NUMBER, p_estado VARCHAR2) AS
BEGIN
    UPDATE Registro_Visitas SET estado = p_estado WHERE id_registro = p_id;
    COMMIT;
END;
/

CREATE OR REPLACE PROCEDURE sp_registrar_incidencia(
    p_id_recinto NUMBER, 
    p_desc VARCHAR2, 
    p_nivel VARCHAR2
) AS
BEGIN
    INSERT INTO TABLE(SELECT historial_alertas FROM Recintos WHERE id_recinto = p_id_recinto)
    VALUES (T_Incidencia(SYSDATE, p_desc, p_nivel));
    COMMIT;
END;
/