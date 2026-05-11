-- ====================================================================
-- SCRIPT MAESTRO DE INSTALACION: CRETACIC PARK DATABASE
-- Ejecutar desde SQL*Plus con:
--   @bd/7prueba.sql
-- ====================================================================

SET ECHO ON
SET FEEDBACK ON
SET SERVEROUTPUT ON
SET VERIFY OFF

WHENEVER OSERROR EXIT FAILURE ROLLBACK
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK

PROMPT [INICIO] Reconstruyendo Cretacic Park...

PROMPT [1/5] Tipos y limpieza previa
@@1tipos.sql

PROMPT [2/5] Tablas
@@2tablas.sql

PROMPT [3/5] Triggers
@@4triggers.sql

PROMPT [4/5] Procedimientos
@@5paquetes.sql

PROMPT [5/5] Datos de prueba
@@6Insercion.sql

PROMPT [VALIDACION] Comprobando objetos invalidos
DECLARE
    v_invalidos NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_invalidos
    FROM user_objects
    WHERE status <> 'VALID'
      AND object_name IN (
          'T_INCIDENCIA',
          'T_LISTA_INCIDENCIAS',
          'T_DINOSAURIO',
          'T_CARNIVORO',
          'T_HERBIVORO',
          'TRG_CONTROL_AFORO_RECINTOS',
          'TRG_VALIDA_FECHA_VISITA',
          'TRG_CONFIRMAR_PAGO_RESERVA',
          'TRG_AUDITORIA_RH',
          'TRG_SEGURIDAD_TRASLADOS',
          'SP_REGISTRAR_VISITANTE',
          'SP_NUEVO_ACTIVO_BIOLOGICO',
          'SP_REGISTRAR_PAGO',
          'SP_VER_ALERTAS_RECINTO',
          'SP_LISTAR_DINOS_DIETA',
          'SP_BAJA_EMPLEADO',
          'SP_AJUSTAR_PRECIO_SERVICIO',
          'SP_ESTADO_SEGURIDAD_RECINTO',
          'SP_ACTUALIZAR_TICKET',
          'SP_REGISTRAR_INCIDENCIA'
      );

    IF v_invalidos > 0 THEN
        RAISE_APPLICATION_ERROR(-20990, 'Hay objetos invalidos. Ejecuta SELECT object_name, object_type FROM user_objects WHERE status <> ''VALID'';');
    END IF;

    DBMS_OUTPUT.PUT_LINE('OK: todos los tipos, triggers y procedimientos estan validos.');
END;
/

PROMPT [VALIDACION] Comprobando carga minima de datos
DECLARE
    PROCEDURE assert_count(p_table VARCHAR2, p_min NUMBER) IS
        v_total NUMBER;
    BEGIN
        EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM ' || p_table INTO v_total;
        IF v_total < p_min THEN
            RAISE_APPLICATION_ERROR(-20991, 'La tabla ' || p_table || ' tiene ' || v_total || ' filas; se esperaban al menos ' || p_min || '.');
        END IF;
        DBMS_OUTPUT.PUT_LINE('OK: ' || p_table || ' = ' || v_total || ' filas.');
    END;
BEGIN
    assert_count('EMPLEADOS', 5);
    assert_count('RECINTOS', 6);
    assert_count('DINOSAURIOS', 6);
    assert_count('VISITANTES', 6);
    assert_count('REGISTRO_VISITAS', 4);
    assert_count('SERVICIOS_EXTRA', 4);
    assert_count('PAGO', 2);
    assert_count('VENTAS', 2);
END;
/

PROMPT [FINALIZADO] Cretacic Park esta operativo.

SET ECHO OFF
