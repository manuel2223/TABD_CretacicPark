-- 1. Verificar disponibilidad y deshabilitar recinto al reservar
CREATE OR REPLACE TRIGGER trg_control_aforo_recintos
BEFORE INSERT ON Registro_Visitas
FOR EACH ROW
DECLARE
    v_capacidad_max NUMBER;
    v_ocupacion_actual NUMBER;
BEGIN
    SELECT capacidad_max INTO v_capacidad_max
    FROM Recintos
    WHERE id_recinto = :new.id_recinto;

    SELECT COUNT(*) INTO v_ocupacion_actual
    FROM Registro_Visitas
    WHERE id_recinto = :new.id_recinto
      AND TRUNC(fecha_visita) = TRUNC(:new.fecha_visita);

    IF v_ocupacion_actual >= v_capacidad_max THEN
        RAISE_APPLICATION_ERROR(-20001, 'ALERTA DE AFORO: El recinto ' || :new.id_recinto || ' ya está al límite de su capacidad para esa fecha. ¡Peligro de estampida!');
    END IF;
END;
/

-- 2. Validar que la fecha de la visita no sea incoherente (pasada)
CREATE OR REPLACE TRIGGER trg_valida_fecha_visita
BEFORE INSERT OR UPDATE ON Registro_Visitas
FOR EACH ROW
BEGIN
    IF :new.fecha_visita < TRUNC(SYSDATE) THEN
        RAISE_APPLICATION_ERROR(-20002, 'ERROR: No se pueden registrar visitas en fechas pasadas.');
    END IF;
END;
/

-- 3. Actualizar estado de la reserva a 'Pagado' al realizar el pago
CREATE OR REPLACE TRIGGER trg_confirmar_pago_reserva
AFTER INSERT ON Pago
FOR EACH ROW
BEGIN
    UPDATE Registro_Visitas
    SET estado = 'Pagado'
    WHERE id_registro = :new.id_registro;
END;
/


-- 4. Trigger de auditoría para cambios en el cargo de los empleados
CREATE OR REPLACE TRIGGER trg_auditoria_rh
AFTER UPDATE OF en_activo, cargo ON Empleados
FOR EACH ROW
BEGIN
    INSERT INTO Auditoria_Empleados (fecha, accion, id_empleado)
    VALUES (SYSDATE, 'Cambio crítico: ' || :OLD.cargo || ' -> ' || :NEW.cargo || ' | Activo: ' || :NEW.en_activo, :NEW.id_empleado);
END;
/


-- 5. Trigger para controlar que no se cambien dinosaurios carnivoros a recintos de hervivoros y viceversa
CREATE OR REPLACE TRIGGER trg_seguridad_traslados
BEFORE INSERT OR UPDATE ON Dinosaurios
FOR EACH ROW
DECLARE
    PRAGMA AUTONOMOUS_TRANSACTION;
    v_incompatibles NUMBER := 0;
    v_dieta_new VARCHAR2(50);
BEGIN
    IF :NEW.id_recinto IS NULL THEN
        RETURN;
    END IF;

    v_dieta_new := LOWER(:NEW.dieta_base);

    IF v_dieta_new LIKE '%carn%' THEN
        SELECT COUNT(*)
        INTO v_incompatibles
        FROM Dinosaurios
        WHERE id_recinto = :NEW.id_recinto
          AND LOWER(dieta_base) NOT LIKE '%carn%'
          AND id_dino != NVL(:OLD.id_dino, -1);
    ELSE
        SELECT COUNT(*)
        INTO v_incompatibles
        FROM Dinosaurios
        WHERE id_recinto = :NEW.id_recinto
          AND LOWER(dieta_base) LIKE '%carn%'
          AND id_dino != NVL(:OLD.id_dino, -1);
    END IF;

    IF v_incompatibles > 0 THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20005, 'SISTEMA INGEN: Traslado denegado. El recinto ' || :NEW.id_recinto || ' ya contiene especies incompatibles (Riesgo Crítico).');
    END IF;

    COMMIT;
END;
/
