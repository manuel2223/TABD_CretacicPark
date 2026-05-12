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

PROMPT [FINALIZADO] Cretacic Park esta operativo.

SET ECHO OFF
