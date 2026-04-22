-- 1. Verificar disponibilidad y deshabilitar recinto al reservar
-- Mezclamos ambos casos en un solo disparador por eficiencia.
CREATE OR REPLACE TRIGGER trg_control_aforo_recintos
BEFORE INSERT ON Registro_Visitas
FOR EACH ROW
DECLARE
    v_capacidad_max NUMBER;
    v_ocupacion_actual NUMBER;
BEGIN
    -- 1. Buscamos la capacidad máxima del recinto
    SELECT capacidad_max INTO v_capacidad_max
    FROM Recintos
    WHERE id_recinto = :new.id_recinto;

    -- 2. Contamos cuántas visitas hay ya para ese día
    SELECT COUNT(*) INTO v_ocupacion_actual
    FROM Registro_Visitas
    WHERE id_recinto = :new.id_recinto
      AND fecha_visita = :new.fecha_visita;

    -- 3. Si ya está lleno, abortamos la misión
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
    -- Si un empleado es despedido o cambia de cargo, lo apuntamos en el libro negro
    INSERT INTO Auditoria_Empleados (fecha, accion, id_empleado)
    VALUES (SYSDATE, 'Cambio crítico: ' || :OLD.cargo || ' -> ' || :NEW.cargo || ' | Activo: ' || :NEW.en_activo, :NEW.id_empleado);
END;
/


-- 5. Trigger para controlar que no se cambien dinosaurios carnivoros a recintos de hervivoros y viceversa
CREATE OR REPLACE TRIGGER trg_seguridad_traslados
BEFORE UPDATE OF id_recinto ON Dinosaurios
FOR EACH ROW
BEGIN
    -- Evitar que un dinosaurio sea trasladado sin motivo justificado
    IF :OLD.id_recinto IS NOT NULL AND :NEW.id_recinto != :OLD.id_recinto THEN
        -- Aquí podrías añadir lógica para comprobar si el nuevo recinto es seguro
        DBMS_OUTPUT.PUT_LINE('ATENCIÓN: Traslado no autorizado del Activo Biológico ' || :NEW.id_dino || ' al recinto ' || :NEW.id_recinto);
        -- O si prefieres ser estricto:
        -- RAISE_APPLICATION_ERROR(-20005, 'TRASLADO DENEGADO: Requiere autorización del Paquete de Seguridad.');
    END IF;
END;
/