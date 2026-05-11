-- ====================================================================
-- FICHERO 1: CREACION DE TIPOS Y HERENCIA
-- ====================================================================
-- Limpieza idempotente: permite ejecutar 7prueba.sql tantas veces como haga falta.
BEGIN
    FOR t IN (
        SELECT column_value AS object_name
        FROM TABLE(sys.odcivarchar2list(
            'PAGO',
            'VENTAS',
            'SERVICIOS_EXTRA',
            'REGISTRO_VISITAS',
            'DINOSAURIOS',
            'RECINTOS',
            'AUDITORIA_EMPLEADOS',
            'EMPLEADOS',
            'VISITANTES'
        ))
    ) LOOP
        BEGIN
            EXECUTE IMMEDIATE 'DROP TABLE ' || t.object_name || ' CASCADE CONSTRAINTS PURGE';
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE != -942 THEN
                    RAISE;
                END IF;
        END;
    END LOOP;

    FOR ty IN (
        SELECT column_value AS object_name
        FROM TABLE(sys.odcivarchar2list(
            'T_HERBIVORO',
            'T_CARNIVORO',
            'T_DINOSAURIO',
            'T_LISTA_INCIDENCIAS',
            'T_INCIDENCIA'
        ))
    ) LOOP
        BEGIN
            EXECUTE IMMEDIATE 'DROP TYPE ' || ty.object_name || ' FORCE';
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE != -4043 THEN
                    RAISE;
                END IF;
        END;
    END LOOP;
END;
/

-- 1. Tipo base para la tabla anidada de incidencias.
CREATE OR REPLACE TYPE T_Incidencia FORCE AS OBJECT (
    fecha_incidencia DATE,
    descripcion      VARCHAR2(200),
    nivel_alerta     VARCHAR2(20)
);
/

-- 2. Coleccion para almacenar multiples incidencias.
CREATE OR REPLACE TYPE T_Lista_Incidencias FORCE AS TABLE OF T_Incidencia;
/

-- 3. Jerarquia de dinosaurios.
CREATE OR REPLACE TYPE T_Dinosaurio FORCE AS OBJECT (
    id_dino        NUMBER,
    nombre_propio  VARCHAR2(50),
    especie        VARCHAR2(100),
    dieta_base     VARCHAR2(20),
    id_recinto     NUMBER
) NOT FINAL;
/

-- 4. Subclase carnivoro.
CREATE OR REPLACE TYPE T_Carnivoro FORCE UNDER T_Dinosaurio (
    nivel_agresividad NUMBER,
    tipo_denticion    VARCHAR2(50)
);
/

-- 5. Subclase herbivoro.
CREATE OR REPLACE TYPE T_Herbivoro FORCE UNDER T_Dinosaurio (
    tipo_vegetacion VARCHAR2(100),
    es_manada       CHAR(1)
);
/
