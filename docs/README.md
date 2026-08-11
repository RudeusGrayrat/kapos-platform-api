# Documentación de backend de Kapos

## Orden recomendado de lectura

En esta carpeta hay tres documentos principales. No compiten entre sí: cada uno cumple un rol distinto.

### 1. Documento fundacional

Archivo:

`kapos-backend-foundation.md`

Úsalo para entender:

- la base arquitectónica del backend;
- la separación entre identidad global, organización y membresía;
- el árbol sugerido de módulos en NestJS;
- el orden correcto de construcción.

Este documento responde:

- cómo debe pensarse Kapos por dentro;
- qué piezas son obligatorias;
- qué guards y capas necesita el backend.

### 2. Documento de dominio SaaS

Archivo:

`kapos-saas-domain-model.md`

Úsalo para entender:

- el modelo multiempresa;
- las entidades principales;
- relaciones de base de datos;
- ejemplos de Prisma;
- cómo conviven cliente, colaborador, owner y superadmin.

Este documento responde:

- cómo se modela el SaaS;
- cómo se evita duplicar personas;
- cómo se resuelve el caso Basti + AtlasFit + futuras marcas.

### 3. Documento práctico de superadmin

Archivo:

`kapos-superadmin-es.md`

Úsalo para entender:

- qué significan los campos del panel actual;
- qué es un `slug`;
- qué es un `owner`;
- cómo nombrar `keys`;
- cómo crear módulos, submódulos y permisos sin improvisar.

Este documento responde:

- qué debo escribir en el frontend;
- qué formato usar al crear cosas;
- cómo no romper consistencia al administrar Kapos.

## Cuál es el definitivo

Si por “definitivo” te refieres al documento guía para el trabajo diario del panel actual, el más práctico es:

`kapos-superadmin-es.md`

Si por “definitivo” te refieres al documento más importante a nivel de arquitectura, el principal es:

`kapos-backend-foundation.md`

Si por “definitivo” te refieres al modelo más completo de negocio y datos, el central es:

`kapos-saas-domain-model.md`

## Recomendación simple

Para trabajar bien sin perderte:

1. lee `kapos-backend-foundation.md`
2. valida después `kapos-saas-domain-model.md`
3. usa `kapos-superadmin-es.md` como manual operativo del panel

## Regla práctica

Cuando aparezca una duda:

- si es de arquitectura: revisa `kapos-backend-foundation.md`
- si es de tablas y relaciones: revisa `kapos-saas-domain-model.md`
- si es de campos, keys o paneles: revisa `kapos-superadmin-es.md`
