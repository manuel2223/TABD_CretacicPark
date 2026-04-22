-- 1. Tipo base para la tabla anidada de Incidencias
CREATE OR REPLACE TYPE T_Incidencia AS OBJECT (
    fecha_incidencia DATE,
    descripcion      VARCHAR2(200),
    nivel_alerta     VARCHAR2(20) -- Ej: 'Bajo', 'Medio', 'Crítico'
);
/

-- 2. Colección (VARRAY o Nested Table Type) para almacenar múltiples incidencias
CREATE OR REPLACE TYPE T_Lista_Incidencias AS TABLE OF T_Incidencia;
/

-- 3. Jerarquía de Dinosaurios (Clase Padre) [cite: 683-684]
CREATE OR REPLACE TYPE T_Dinosaurio AS OBJECT (
    id_dino       NUMBER,
    nombre_propio VARCHAR2(50),
    especie       VARCHAR2(100),
    dieta_base    VARCHAR2(20)
) NOT FINAL; -- Permite herencia
/

-- 4. Subclase Carnívoro [cite: 683-684]
CREATE OR REPLACE TYPE T_Carnivoro UNDER T_Dinosaurio (
    nivel_agresividad NUMBER,
    tipo_denticion    VARCHAR2(50)
);
/

-- 5. Subclase Herbívoro [cite: 683-684]
CREATE OR REPLACE TYPE T_Herbivoro UNDER T_Dinosaurio (
    tipo_vegetacion VARCHAR2(100),
    es_manada       CHAR(1) -- 'S' o 'N'
);
/