-- ====================================================================
-- FICHERO 1: CREACIÓN DE TIPOS Y HERENCIA (DISEÑO O/R)
-- ====================================================================
-- DEMOLICIÓN DE EMERGENCIA (Ignora los errores de "la tabla no existe" si salen)
DROP TABLE Pago CASCADE CONSTRAINTS;
DROP TABLE Ventas CASCADE CONSTRAINTS;
DROP TABLE Servicios_Extra CASCADE CONSTRAINTS;
DROP TABLE Registro_Visitas CASCADE CONSTRAINTS;
DROP TABLE Dinosaurios CASCADE CONSTRAINTS;
DROP TABLE Recintos CASCADE CONSTRAINTS;
DROP TABLE Auditoria_Empleados CASCADE CONSTRAINTS;
DROP TABLE Empleados CASCADE CONSTRAINTS;
DROP TABLE Visitantes CASCADE CONSTRAINTS;



-- 1. Tipo base para la tabla anidada de Incidencias
CREATE OR REPLACE TYPE T_Incidencia FORCE AS OBJECT (
    fecha_incidencia DATE,
    descripcion      VARCHAR2(200),
    nivel_alerta     VARCHAR2(20) -- Ej: 'Bajo', 'Medio', 'Crítico'
);
/

-- 2. Colección (VARRAY o Nested Table Type) para almacenar múltiples incidencias
CREATE OR REPLACE TYPE T_Lista_Incidencias FORCE AS TABLE OF T_Incidencia;
/

-- 3. Jerarquía de Dinosaurios (Clase Padre)
CREATE OR REPLACE TYPE T_Dinosaurio FORCE AS OBJECT (
    id_dino       NUMBER,
    nombre_propio VARCHAR2(50),
    especie       VARCHAR2(100),
    dieta_base    VARCHAR2(20),
    id_recinto    NUMBER -- <-- Relación con la tabla Recintos
) NOT FINAL;
/

-- 4. Subclase Carnívoro
CREATE OR REPLACE TYPE T_Carnivoro FORCE UNDER T_Dinosaurio (
    nivel_agresividad NUMBER,
    tipo_denticion    VARCHAR2(50)
);
/

-- 5. Subclase Herbívoro
CREATE OR REPLACE TYPE T_Herbivoro FORCE UNDER T_Dinosaurio (
    tipo_vegetacion VARCHAR2(100),
    es_manada       CHAR(1) -- 'S' o 'N'
);
/