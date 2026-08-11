# Guía rápida de Kapos Superadmin

## Objetivo

Este documento explica, en español y de forma práctica, los campos principales que usa el panel de superadmin de Kapos al crear:

- organizaciones
- módulos
- submódulos
- permisos

La idea es que el equipo no tenga que adivinar qué significa cada campo.

## 1. Organización

Una organización es una empresa cliente dentro de Kapos.

Ejemplos:

- Basti
- AtlasFit
- otra empresa que contrate el ERP

### Campos clave

#### `legalName`

Razón social formal de la empresa.

Ejemplo:

`Basti Foods S.A.C.`

#### `tradeName`

Nombre comercial o nombre visible para el negocio.

Ejemplo:

`Basti`

#### `slug`

Identificador corto, único y limpio que Kapos usa en URLs, referencias internas o futuras rutas por cliente.

Reglas recomendadas:

- solo minúsculas
- sin espacios
- sin tildes
- usar guiones si hace falta

Ejemplos válidos:

- `basti`
- `atlasfit`
- `basti-centro`

Ejemplos no recomendados:

- `Basti`
- `Basti SAC`
- `basti/centro`

#### `ownerUserId`

Usuario global que será el dueño inicial o responsable principal de esa organización.

Qué significa `owner`:

- es la persona que gobierna esa empresa dentro de Kapos
- puede entrar primero al ERP de su empresa
- luego podrá crear trabajadores, asignar roles y configurar su operación, según los permisos que tenga

Ejemplo:

- Miguel crea la organización `Basti`
- luego asigna a `ana@basti.com` como `owner`
- Ana entra y termina de configurar sucursales, personal y accesos

## 2. Módulo

Un módulo es una categoría grande del sistema.

Ejemplos:

- recursos humanos
- ventas
- finanzas
- configuración

### Campos clave

#### `key`

Clave técnica corta y estable del módulo.

Esta clave no debe pensarse como un texto bonito, sino como un identificador interno.

Reglas recomendadas:

- minúsculas
- sin espacios
- sin tildes
- preferir una palabra o dos muy cortas

Ejemplos:

- `rrhh`
- `ventas`
- `finanzas`
- `configuracion`
- `platform`

#### `audience`

Define quién puede ver o usar ese módulo.

Valores:

- `PLATFORM`: solo superadmin o capa de plataforma
- `ORGANIZATION`: solo clientes/empresas
- `BOTH`: existe en ambos lados

## 3. Submódulo

Un submódulo es una pantalla o sección interna dentro de un módulo.

Ejemplos:

- dentro de `rrhh`
  - `colaboradores`
  - `asistencia`
  - `boletas-pago`

### Campos clave

#### `key`

Clave técnica del submódulo.

Ejemplos:

- `colaboradores`
- `asistencia`
- `usuarios`

#### `route`

Ruta interna del frontend que abrirá esa pantalla.

Ejemplos:

- `/rrhh/colaboradores`
- `/platform/usuarios`
- `/configuracion/roles`

#### `permissionKey`

Permiso principal asociado a ese submódulo, si ya existe.

Ejemplo:

`platform.users.read`

## 4. Permiso

Un permiso define una acción puntual que un rol o usuario puede realizar.

La idea correcta es que los permisos sean atómicos.

Ejemplos:

- ver usuarios
- crear usuarios
- editar permisos
- suspender organizaciones

### Campos clave

#### `key`

Es la llave técnica más importante del permiso.

Formato recomendado:

`contexto.recurso.accion`

Ejemplos:

- `platform.organizations.read`
- `platform.organizations.manage`
- `platform.users.create`
- `organization.users.read`
- `organization.users.update`
- `organization.roles.manage`

Buenas prácticas:

- usar minúsculas
- separar por puntos
- que el nombre explique claramente qué hace
- evitar nombres ambiguos como `admin`, `master` o `general`

#### `name`

Nombre visible para el panel.

Ejemplos:

- `Ver organizaciones`
- `Crear usuarios globales`
- `Editar permisos de roles`

#### `scope`

Define hasta dónde llega el permiso.

Valores:

- `OWN`: solo sobre lo propio del usuario
- `BRANCH`: solo dentro de una sede
- `ORGANIZATION`: dentro de toda la empresa cliente
- `PLATFORM`: a nivel global de Kapos

#### `audience`

Define si el permiso pertenece a la plataforma, a las organizaciones o a ambos mundos.

Valores:

- `PLATFORM`
- `ORGANIZATION`
- `BOTH`

## 5. Ejemplos recomendados

### Crear una organización

- razón social: `Basti Foods S.A.C.`
- nombre comercial: `Basti`
- slug: `basti`
- owner: usuario global que será el jefe inicial

### Crear un módulo

- key: `rrhh`
- nombre: `Recursos humanos`
- audience: `ORGANIZATION`

### Crear un submódulo

- módulo padre: `rrhh`
- key: `colaboradores`
- nombre: `Colaboradores`
- route: `/rrhh/colaboradores`

### Crear un permiso

- key: `organization.users.read`
- nombre: `Ver usuarios del cliente`
- módulo: `configuracion`
- submódulo: `usuarios`
- scope: `ORGANIZATION`

## 6. Regla práctica para nombrar bien

Si dudas entre dos nombres, elige el que:

- se entienda rápido
- sea estable en el tiempo
- no dependa de un texto bonito
- no mezcle varias acciones en una sola clave

Ejemplo bueno:

`organization.users.read`

Ejemplo malo:

`organization.users.read-create-edit`

## 7. Idea arquitectónica

Kapos debe crecer agregando:

- nuevos módulos
- nuevos submódulos
- nuevos permisos

No debería crecer rompiendo tablas o renombrando claves cada semana.

Por eso:

- las `keys` deben ser estables
- los `slug` deben ser únicos
- los permisos deben ser atómicos
- los owners deben representar al responsable inicial de una organización

## 8. Flujo mínimo real de Kapos

### Flujo de creación desde superadmin

1. se crea una organización cliente
2. se define su `slug`
3. se asigna un `owner` inicial si ya existe como usuario global
4. se encienden módulos base para esa organización
5. el owner entra a Kapos
6. el owner configura sucursales, colaboradores, roles y operación

### Flujo de crecimiento

Kapos no debería crecer agregando columnas improvisadas para cada cliente.

Debe crecer así:

1. crear nuevos módulos
2. crear nuevos submódulos
3. crear nuevos permisos
4. asignar esos permisos a roles
5. asignar roles a memberships o usuarios según contexto

## 9. Estructura mental correcta

Piensa Kapos así:

- `User`: la persona global
- `Organization`: la empresa cliente
- `Membership`: la relación de esa persona con la empresa
- `Role`: el conjunto de permisos
- `Permission`: la acción concreta
- `Module`: la categoría grande del sistema
- `Submodule`: la pantalla o sección concreta

## 10. Ejemplo completo

### Caso Basti

1. creas organización `Basti`
2. le das `slug` = `basti`
3. asignas a Ana como `owner`
4. activas módulos como `rrhh`, `ventas`, `configuracion`
5. Ana entra y crea colaboradores
6. Ana asigna roles como admin, cajero o supervisor

### Caso de un permiso bien nombrado

Si quieres permitir ver usuarios de una empresa:

- módulo: `configuracion`
- submódulo: `usuarios`
- permiso: `organization.users.read`

Si quieres permitir gestionar organizaciones desde Kapos:

- módulo: `platform`
- submódulo: `organizaciones`
- permiso: `platform.organizations.manage`

## 11. Regla para no equivocarte

Antes de crear algo, pregúntate:

1. ¿esto es una empresa o una persona?
2. ¿esto es una categoría o una pantalla?
3. ¿esto es un rol o una acción puntual?
4. ¿esto pertenece a platform o a organization?
5. ¿esta key seguirá teniendo sentido dentro de seis meses?

Si la respuesta es confusa, todavía no conviene crear la clave.
