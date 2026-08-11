# Base fundacional del backend de Kapos

## Objetivo

Definir la base mínima, sólida y escalable para que Kapos soporte sin choques:

- una sola identidad global por persona;
- múltiples empresas u organizaciones;
- acceso como cliente, colaborador, jefe o superadmin;
- roles y permisos por contexto;
- navegación por módulos y submódulos sin hardcodear todo en frontend.

## Regla más importante

La persona es global, pero sus accesos y perfiles son contextuales.

Eso significa:

- `User`: representa a la persona real.
- `Organization`: representa a la empresa cliente de Kapos.
- `Membership`: representa a la persona trabajando dentro de esa empresa.
- `CustomerProfile`: representa a la persona comprando o interactuando como cliente en esa empresa.
- `PlatformAccess`: representa a la persona actuando como parte del equipo interno de Kapos.

## Caso real de Miguel

Miguel con DNI `76466972` puede existir una sola vez como `User`.

Luego puede tener:

- un `CustomerProfile` en Basti;
- un `CustomerProfile` en AtlasFit;
- una `Membership` en Basti como colaborador;
- otra `Membership` en AtlasFit como jefe;
- un `PlatformAccess` si además forma parte del equipo interno de Kapos.

Así evitamos duplicar personas y, al mismo tiempo, evitamos mezclar datos entre empresas.

## Qué resuelve cada entidad principal

### `User`

Es la identidad base.

Guarda:

- correo;
- DNI o documento;
- nombre;
- teléfono;
- contraseña;
- estado;
- sesiones.

No guarda directamente:

- empresa activa;
- permisos ERP;
- sedes asignadas;
- nivel jerárquico laboral.

Todo eso depende del contexto.

### `Organization`

Es la empresa o tenant.

Ejemplos:

- Basti;
- AtlasFit;
- otra empresa futura hecha por ICode.

Aquí viven:

- sus sedes;
- sus colaboradores;
- sus módulos habilitados;
- sus roles internos;
- sus clientes.

### `Membership`

Es la relación laboral u operativa de un `User` con una `Organization`.

Responde preguntas como:

- ¿trabaja aquí?
- ¿con qué estado?
- ¿desde cuándo?
- ¿en qué sedes?
- ¿con qué roles?

Un `User` puede tener varias `Memberships`, una por organización.

### `CustomerProfile`

Es el lado consumidor de la misma persona dentro de una empresa.

Permite que alguien sea:

- cliente de Basti;
- cliente de AtlasFit;
- trabajador en una de ellas;
- y aun así siga siendo una sola persona en la base.

### `PlatformAccess`

Es el acceso interno a la plataforma Kapos.

Sirve para:

- superadmin;
- soporte;
- ventas;
- operaciones internas de ICode.

Esto no debe mezclarse con el acceso del dueño de una empresa cliente.

## Roles y permisos

### `Role`

Un rol agrupa permisos.

Hay dos contextos:

- `PLATFORM`: roles internos de Kapos.
- `ORGANIZATION`: roles de cada empresa cliente.

Ejemplos:

- `platform.super_admin`
- `platform.support`
- `organization.owner`
- `organization.admin`
- `organization.cashier`

### `Permission`

El permiso representa una acción concreta.

Ejemplos:

- `platform.organizations.read`
- `platform.organizations.manage`
- `settings.users.read`
- `settings.users.create`
- `sales.orders.read`
- `sales.orders.create`

La regla del sistema debe ser:

- nadie puede asignar permisos que no tiene;
- nadie puede crear roles por encima de su alcance;
- el frontend puede ocultar opciones, pero la seguridad real siempre vive en backend.

## Módulos y submódulos

`PlatformModule` y `PlatformSubmodule` sirven para que la navegación y la estructura del sistema sean data-driven.

Eso ayuda a que:

- el sidebar no dependa solo de arreglos quemados en frontend;
- una organización habilite o deshabilite módulos;
- superadmin vea módulos distintos a los de una empresa cliente.

## Flujo de autenticación y autorización

### Autenticación

1. El usuario inicia sesión con correo o DNI.
2. El backend valida identidad.
3. Devuelve `access token` y `refresh token`.
4. En cada request protegida, el token reconstruye `request.user`.

### Autorización

Después de autenticar, el backend debe resolver:

1. quién es el `User`;
2. si tiene `PlatformAccess`;
3. en qué `Organization` está operando;
4. cuál es su `Membership` activa allí;
5. qué roles tiene;
6. qué permisos efectivos tiene;
7. a qué sedes puede entrar.

## Flujo recomendado de guards en NestJS

```text
Request
-> JwtAuthGuard
-> PlatformAccessGuard o OrganizationContextGuard
-> PermissionsGuard
-> Controller
-> Service
```

## Árbol base recomendado del backend

```text
src/modules
  identity
    auth
    users
    sessions
  platform
    organizations
    platform-access
    modules
    permissions
  iam
    memberships
    roles
    branches
  crm
    customer-profiles
  shared
    authorization
    tenancy
```

## Orden correcto para construirlo

### Fase 1

- `Organization`
- `Branch`
- `Membership`
- `Role`
- `Permission`
- `PlatformAccess`

### Fase 2

- guards de organización activa;
- permisos efectivos;
- seed de roles y permisos base;
- modules y submodules del ERP.

### Fase 3

- `CustomerProfile`;
- cambio de organización activa;
- panel real de superadmin;
- filtros por sede y alcance.

## Regla final de diseño

En Kapos:

- la identidad no se duplica;
- el contexto sí cambia;
- los permisos no viven dentro del usuario;
- los permisos se resuelven según plataforma, organización, rol y sede.

Ese es el punto de partida correcto para que luego puedas crecer sin rehacer auth, usuarios y permisos cada vez que aparezca una nueva empresa o un nuevo caso.
