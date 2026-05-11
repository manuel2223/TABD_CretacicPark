-- ====================================================================
-- PRUEBAS FUNCIONALES: TRIGGERS Y PROCEDIMIENTOS
-- Ejecutar desde SQL*Plus con:
--   @bd/8pruebas_funcionales.sql
-- ====================================================================

SET SERVEROUTPUT ON
SET FEEDBACK ON
SET VERIFY OFF

WHENEVER OSERROR EXIT FAILURE ROLLBACK
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK

PROMPT [SETUP] Reconstruyendo datos limpios
@@7prueba.sql

PROMPT [TEST] Ejecutando pruebas funcionales
DECLARE
    v_estado Registro_Visitas.estado%TYPE;
    v_auditorias NUMBER;
    v_precio Servicios_Extra.precio%TYPE;
    v_disponible Recintos.disponible%TYPE;
    v_visitantes NUMBER;
    v_alertas NUMBER;

    PROCEDURE expect_error(p_name VARCHAR2, p_expected NUMBER, p_sql VARCHAR2) IS
    BEGIN
        BEGIN
            EXECUTE IMMEDIATE p_sql;
            RAISE_APPLICATION_ERROR(-20999, p_name || ' no lanzo el error esperado.');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE = p_expected THEN
                    DBMS_OUTPUT.PUT_LINE('OK: ' || p_name || ' lanza ' || p_expected);
                ELSE
                    RAISE;
                END IF;
        END;
    END;
BEGIN
    expect_error(
        'trg_valida_fecha_visita',
        -20002,
        q'[INSERT INTO Registro_Visitas (id_visitante, id_recinto, fecha_visita, tipo_entrada, estado) VALUES (1, 2, SYSDATE - 1, 'General', 'Pendiente')]'
    );

    expect_error(
        'trg_control_aforo_recintos',
        -20001,
        q'[INSERT INTO Registro_Visitas (id_visitante, id_recinto, fecha_visita, tipo_entrada, estado) VALUES (2, 1, SYSDATE + 5, 'VIP', 'Pendiente')]'
    );

    expect_error(
        'trg_seguridad_traslados',
        -20005,
        q'[INSERT INTO Dinosaurios VALUES (T_Herbivoro(99, 'TestHerb', 'Testaurus', 'Herbivoro', 1, 'Hojas', 'S'))]'
    );

    sp_registrar_pago(3, 123, 'Test');
    SELECT estado INTO v_estado FROM Registro_Visitas WHERE id_registro = 3;
    IF v_estado != 'Pagado' THEN
        RAISE_APPLICATION_ERROR(-20998, 'trg_confirmar_pago_reserva no marco la visita como Pagado.');
    END IF;
    DBMS_OUTPUT.PUT_LINE('OK: trg_confirmar_pago_reserva actualiza estado a Pagado');

    sp_baja_empleado(1);
    SELECT COUNT(*) INTO v_auditorias FROM Auditoria_Empleados WHERE id_empleado = 1;
    IF v_auditorias = 0 THEN
        RAISE_APPLICATION_ERROR(-20997, 'trg_auditoria_rh no genero auditoria.');
    END IF;
    DBMS_OUTPUT.PUT_LINE('OK: trg_auditoria_rh genera auditoria');

    sp_registrar_visitante('Visitante Test', 'TST123', '555-0000');
    SELECT COUNT(*) INTO v_visitantes FROM Visitantes WHERE dni_pasaporte = 'TST123';
    IF v_visitantes != 1 THEN
        RAISE_APPLICATION_ERROR(-20996, 'sp_registrar_visitante no inserto el visitante.');
    END IF;
    DBMS_OUTPUT.PUT_LINE('OK: sp_registrar_visitante inserta visitante');

    sp_ajustar_precio_servicio(1, 151.25);
    SELECT precio INTO v_precio FROM Servicios_Extra WHERE id_servicio = 1;
    IF v_precio != 151.25 THEN
        RAISE_APPLICATION_ERROR(-20995, 'sp_ajustar_precio_servicio no actualizo el precio.');
    END IF;
    DBMS_OUTPUT.PUT_LINE('OK: sp_ajustar_precio_servicio actualiza precio');

    sp_estado_seguridad_recinto(2, 'N');
    SELECT disponible INTO v_disponible FROM Recintos WHERE id_recinto = 2;
    IF v_disponible != 'N' THEN
        RAISE_APPLICATION_ERROR(-20994, 'sp_estado_seguridad_recinto no actualizo disponibilidad.');
    END IF;
    DBMS_OUTPUT.PUT_LINE('OK: sp_estado_seguridad_recinto actualiza disponibilidad');

    sp_actualizar_ticket(4, 'Cancelado');
    SELECT estado INTO v_estado FROM Registro_Visitas WHERE id_registro = 4;
    IF v_estado != 'Cancelado' THEN
        RAISE_APPLICATION_ERROR(-20993, 'sp_actualizar_ticket no actualizo estado.');
    END IF;
    DBMS_OUTPUT.PUT_LINE('OK: sp_actualizar_ticket actualiza estado');

    sp_registrar_incidencia(2, 'Incidencia Test', 'Bajo');
    SELECT COUNT(*) INTO v_alertas
    FROM Recintos r, TABLE(r.historial_alertas) i
    WHERE r.id_recinto = 2 AND i.descripcion = 'Incidencia Test';
    IF v_alertas != 1 THEN
        RAISE_APPLICATION_ERROR(-20992, 'sp_registrar_incidencia no inserto alerta anidada.');
    END IF;
    DBMS_OUTPUT.PUT_LINE('OK: sp_registrar_incidencia inserta alerta anidada');

    DBMS_OUTPUT.PUT_LINE('OK: pruebas funcionales terminadas');
END;
/

PROMPT [TEST] Procedimientos con salida DBMS_OUTPUT
BEGIN
    DBMS_OUTPUT.PUT_LINE('Salida sp_listar_dinos_dieta(''Herb''):');
    sp_listar_dinos_dieta('Herb');
    DBMS_OUTPUT.PUT_LINE('Salida sp_ver_alertas_recinto(2):');
    sp_ver_alertas_recinto(2);
END;
/

PROMPT [RESTORE] Dejando la base con los datos semilla originales
@@7prueba.sql

PROMPT [OK] Pruebas funcionales superadas
