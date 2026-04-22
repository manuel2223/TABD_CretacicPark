-- ====================================================================
-- SCRIPT MAESTRO DE INSTALACIÓN: CRETACIC PARK DATABASE
-- ====================================================================
SET FEEDBACK ON;
SET ECHO ON;
SET SERVEROUTPUT ON;

PROMPT [INICIO] Reconstruyendo el ecosistema de Cretacic Park...

-- 1. LIMPIEZA (Opcional - Borra en orden inverso por las FK)
PROMPT Borrando tablas y tipos previos si existen...
DROP TABLE Pago CASCADE CONSTRAINTS;
DROP TABLE Ventas CASCADE CONSTRAINTS;
DROP TABLE Servicios_Extra CASCADE CONSTRAINTS;
DROP TABLE Registro_Visitas CASCADE CONSTRAINTS;
DROP TABLE Dinosaurios CASCADE CONSTRAINTS;
DROP TABLE Recintos CASCADE CONSTRAINTS;
DROP TABLE Auditoria_Empleados CASCADE CONSTRAINTS;
DROP TABLE Empleados CASCADE CONSTRAINTS;
DROP TABLE Visitantes CASCADE CONSTRAINTS;

DROP TYPE T_Herbivoro;
DROP TYPE T_Carnivoro;
DROP TYPE T_Dinosaurio;
DROP TYPE T_Lista_Incidencias;
DROP TYPE T_Incidencia;

-- 2. CREACIÓN DE ESTRUCTURAS (Tipos y Herencia)
PROMPT Ejecutando 01_creacion_tipos.sql...
@@01_creacion_tipos.sql

-- 3. CREACIÓN DE TABLAS FÍSICAS E IDENTITY
PROMPT Ejecutando 02_creacion_tablas.sql...
@@02_creacion_tablas.sql

-- 4. CREACIÓN DE LÓGICA (Triggers, Funciones y Procedimientos)
PROMPT Ejecutando 03_logica_y_triggers.sql...
@@03_logica_y_triggers.sql

-- 5. CARGA INICIAL DE DATOS
PROMPT Ejecutando 04_insercion_datos.sql...
@@04_insercion_datos.sql

PROMPT [FINALIZADO] El sistema de Cretacic Park está operativo y seguro.
SET ECHO OFF;