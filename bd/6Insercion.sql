-- ====================================================================
-- FICHERO 4: INSERCIÓN DE DATOS DE PRUEBA (DATA SEEDING)
-- ====================================================================

-- 1. Insertar Empleados (Rangers y Veterinarios)
INSERT INTO Empleados (nombre, cargo, telefono, fecha_contrato, en_activo) 
VALUES ('Alan Grant', 'Paleontólogo Jefe', '555-0101', TO_DATE('1993-06-11', 'YYYY-MM-DD'), 'S');

INSERT INTO Empleados (nombre, cargo, telefono, fecha_contrato, en_activo) 
VALUES ('Robert Muldoon', 'Jefe de Seguridad', '555-0900', TO_DATE('1992-05-20', 'YYYY-MM-DD'), 'S');

INSERT INTO Empleados (nombre, cargo, telefono, fecha_contrato, en_activo) 
VALUES ('Sarah Harding', 'Experta en Comportamiento', '555-0202', TO_DATE('1997-05-10', 'YYYY-MM-DD'), 'S');

INSERT INTO Empleados (nombre, cargo, telefono, fecha_contrato, en_activo) 
VALUES ('Ray Arnold', 'Ingeniero de Sistemas', '555-0042', TO_DATE('1992-12-01', 'YYYY-MM-DD'), 'S');

INSERT INTO Empleados (nombre, cargo, telefono, fecha_contrato, en_activo) 
VALUES ('Owen Grady', 'Entrenador de Etología', '555-0707', TO_DATE('2015-06-12', 'YYYY-MM-DD'), 'S');

-- 2. Insertar Recintos
-- Nota: Inicializamos la tabla anidada vacía con T_Lista_Incidencias()
INSERT INTO Recintos (nombre_sector, tipo_seguridad, capacidad_max, disponible, historial_alertas)
VALUES ('T-Rex Kingdom', 'Valla Electrificada Nivel 10', 1, 'S', T_Lista_Incidencias());

INSERT INTO Recintos (nombre_sector, tipo_seguridad, capacidad_max, disponible, historial_alertas)
VALUES ('Aviario', 'Cúpula de Cristal Reforzado', 15, 'S', T_Lista_Incidencias(
    T_Incidencia(SYSDATE-10, 'Grieta menor en panel 4', 'Bajo'),
    T_Incidencia(SYSDATE-2, 'Fuga de gas en zona norte', 'Medio')
));

INSERT INTO Recintos (nombre_sector, tipo_seguridad, capacidad_max, disponible, historial_alertas)
VALUES ('Valle de Gallimimus', 'Vallado Perimetral Nivel 3', 50, 'S', T_Lista_Incidencias());

INSERT INTO Recintos (nombre_sector, tipo_seguridad, capacidad_max, disponible, historial_alertas)
VALUES ('Laguna Mosasaurus', 'Cristal Blindado Subacuático', 1, 'S', T_Lista_Incidencias(
    T_Incidencia(SYSDATE-30, 'Filtración detectada en junta 7', 'Medio'),
    T_Incidencia(SYSDATE-5, 'Calibración de grúas de alimentación', 'Bajo')
));

INSERT INTO Recintos (nombre_sector, tipo_seguridad, capacidad_max, disponible, historial_alertas)
VALUES ('Paddock de Velociraptores', 'Muro de Hormigón y Electricidad', 4, 'S', T_Lista_Incidencias(
    T_Incidencia(SYSDATE-1, 'Intento de escalada por espécimen Blue', 'Crítico')
));

INSERT INTO Recintos (nombre_sector, tipo_seguridad, capacidad_max, disponible, historial_alertas)
VALUES ('Bosque de Triceratops', 'Foso Natural', 10, 'S', T_Lista_Incidencias());


-- 3. Insertar Dinosaurios (Usando constructores de Herencia)
-- Sintaxis: T_Tipo(id, nombre, especie, dieta, atributo_especifico1, ...)
INSERT INTO Dinosaurios VALUES (
    T_Carnivoro(1, 'Rexy', 'Tyrannosaurus Rex', 'Carnívoro', 10, 'Serrada 20cm'), 
    (SELECT id_recinto FROM Recintos WHERE nombre_sector = 'T-Rex Kingdom')
);

INSERT INTO Dinosaurios VALUES (
    T_Herbivoro(2, 'Ducky', 'Parasaurolophus', 'Herbívoro', 'Helechos y Coníferas', 'S'), 
    (SELECT id_recinto FROM Recintos WHERE nombre_sector = 'Valle de Gallimimus')
);

INSERT INTO Dinosaurios VALUES (
    T_Carnivoro(3, 'Blue', 'Velociraptor', 'Carnívoro', 9, 'Garras de hoz'), 
    (SELECT id_recinto FROM Recintos WHERE nombre_sector = 'Paddock de Velociraptores')
);

INSERT INTO Dinosaurios VALUES (
    T_Carnivoro(4, 'Mosa', 'Mosasaurus', 'Carnívoro (Peces)', 10, 'Dientes cónicos'), 
    (SELECT id_recinto FROM Recintos WHERE nombre_sector = 'Laguna Mosasaurus')
);

-- Herbívoros
INSERT INTO Dinosaurios VALUES (
    T_Herbivoro(5, 'Cera', 'Triceratops', 'Herbívoro', 'Palmeras y Cicadáceas', 'S'), 
    (SELECT id_recinto FROM Recintos WHERE nombre_sector = 'Bosque de Triceratops')
);

INSERT INTO Dinosaurios VALUES (
    T_Herbivoro(6, 'Spot', 'Diplodocus', 'Herbívoro', 'Copa de árboles altos', 'S'), 
    (SELECT id_recinto FROM Recintos WHERE nombre_sector = 'Valle de Gallimimus')
);


-- 4. Insertar Visitantes
INSERT INTO Visitantes (nombre, dni_pasaporte, telefono) 
VALUES ('John Hammond', '99999999Z', '555-0001');

INSERT INTO Visitantes (nombre, dni_pasaporte, telefono) 
VALUES ('Ian Malcolm', '12345678A', '555-6666');

INSERT INTO Visitantes (nombre, dni_pasaporte, telefono) VALUES ('Ellie Sattler', '87654321B', '555-2233');
INSERT INTO Visitantes (nombre, dni_pasaporte, telefono) VALUES ('Lex Murphy', '11112222C', '555-4455');
INSERT INTO Visitantes (nombre, dni_pasaporte, telefono) VALUES ('Tim Murphy', '33334444D', '555-6677');
INSERT INTO Visitantes (nombre, dni_pasaporte, telefono) VALUES ('Claire Dearing', '55556666E', '555-8899');

-- 5. Registro de Visitas (Reservas)
-- El trigger 'trg_gestion_disponibilidad_recinto' cambiará el recinto a disponible='N'
INSERT INTO Registro_Visitas (id_visitante, id_recinto, fecha_visita, tipo_entrada, estado)
VALUES (1, 1, SYSDATE + 5, 'VIP', 'Pendiente');

INSERT INTO Registro_Visitas (id_visitante, id_recinto, fecha_visita, tipo_entrada, estado)
VALUES (2, 2, SYSDATE + 2, 'General', 'Pendiente');

-- Visita al Bosque de Triceratops
INSERT INTO Registro_Visitas (id_visitante, id_recinto, fecha_visita, tipo_entrada, estado)
VALUES (3, 5, SYSDATE + 10, 'Infantil', 'Confirmada');

-- Visita a los Gallimimus
INSERT INTO Registro_Visitas (id_visitante, id_recinto, fecha_visita, tipo_entrada, estado)
VALUES (4, 3, SYSDATE + 1, 'General', 'Pendiente');

-- 6. Servicios Extra
INSERT INTO Servicios_Extra (nombre, descripcion, precio)
VALUES ('Safari Nocturno', 'Tour en jeep con gafas de visión nocturna', 150.00);

INSERT INTO Servicios_Extra (nombre, descripcion, precio)
VALUES ('Alimentación de Crías', 'Sesión interactiva en el laboratorio', 75.50);

INSERT INTO Servicios_Extra (nombre, descripcion, precio)
VALUES ('Giroesfera', 'Paseo autónomo entre herbívoros', 50.00);

INSERT INTO Servicios_Extra (nombre, descripcion, precio)
VALUES ('Foto con Raptor', 'Fotografía profesional (con medidas de seguridad)', 30.00);

-- 7. Pagos
-- El trigger 'trg_confirmar_pago_reserva' cambiará el estado de la visita a 'Pagado'
INSERT INTO Pago (id_registro, fecha_pago, cantidad, metodo)
VALUES (1, SYSDATE, 500.00, 'Tarjeta');

INSERT INTO Pago (id_registro, fecha_pago, cantidad, metodo)
VALUES (2, SYSDATE, 200.00, 'Efectivo');

-- 8. Ventas dentro del parque
INSERT INTO Ventas (id_registro, id_servicio, id_empleado, total)
VALUES (1, 1, 1, 150.00);

INSERT INTO Ventas (id_registro, id_servicio, id_empleado, total)
VALUES (3, 3, 3, 50.00);

COMMIT;
