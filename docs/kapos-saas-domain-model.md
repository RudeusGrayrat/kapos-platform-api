# Modelo de dominio SaaS de Kapos

## Objetivo

Definir la base de datos y el modelo de acceso para un SaaS multiempresa donde:

- una persona tenga una sola identidad global;
- esa misma identidad pueda ser cliente en una marca y trabajador en otra;
- cada empresa administre sus propias sedes, usuarios, roles, permisos, módulos y datos;
- Basti, AtlasFit y futuras webs hechas por ICode compartan identidad sin mezclar información entre empresas.

## Regla central

La identidad es global, pero el acceso siempre es contextual.

- `User`: quién es la persona.
- `Organization`: qué empresa o tenant la contiene.
- `Membership`: cómo pertenece esa persona a esa organización.
- `Role` y `Permission`: qué puede hacer dentro de esa organización.

## Caso real

Miguel puede existir una sola vez en el sistema:

- como cliente de Basti usando su DNI o correo personal;
- como trabajador de AtlasFit porque AtlasFit contrató Kapos;
- como trabajador o administrador de otra empresa después.

Eso implica que:

- Miguel debe tener un solo `User`;
- Miguel puede tener varias `Memberships`;
- cada membership pertenece a una `Organization`;
- cada membership puede tener un rol distinto.

## Entidades recomendadas

### Identidad global

```prisma
model User {
  id                 String   @id @default(uuid()) @db.Uuid
  email              String?  @unique
  passwordHash       String?
  documentType       DocumentType?
  documentNumber     String?  @unique
  firstName          String?
  lastName           String?
  phone              String?
  avatarUrl          String?
  emailVerifiedAt    DateTime?
  documentVerifiedAt DateTime?
  status             UserStatus @default(ACTIVE)
  lastLoginAt        DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  sessions           Session[]
  oauthAccounts      OAuthAccount[]
  memberships        Membership[]
  customerProfiles   CustomerProfile[]
}
```

### Organización o tenant

```prisma
model Organization {
  id             String   @id @default(uuid()) @db.Uuid
  slug           String   @unique
  legalName      String
  tradeName      String?
  documentType   OrganizationDocumentType?
  documentNumber String?
  email          String?
  phone          String?
  websiteUrl     String?
  status         OrganizationStatus @default(ACTIVE)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  memberships    Membership[]
  branches       Branch[]
  modules        OrganizationModule[]
}
```

### Membership o pertenencia

Este es el registro real de acceso ERP.

```prisma
model Membership {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @db.Uuid
  organizationId  String   @db.Uuid
  employeeCode    String?
  title           String?
  status          MembershipStatus @default(ACTIVE)
  startsAt        DateTime?
  endsAt          DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  branchAccess    MembershipBranch[]
  roleAssignments MembershipRole[]

  @@unique([userId, organizationId])
}
```

### Sedes

```prisma
model Branch {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @db.Uuid
  code           String?
  name           String
  address        String?
  phone          String?
  status         BranchStatus @default(ACTIVE)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  memberships    MembershipBranch[]
}
```

### Roles y permisos

Los roles deben depender de la empresa, no de etiquetas fijas globales solamente.

```prisma
model Role {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String?  @db.Uuid
  key             String
  name            String
  description     String?
  isSystem        Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  permissions     RolePermission[]
  memberships     MembershipRole[]

  @@unique([organizationId, key])
}

model Permission {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique
  name        String
  description String?
  moduleKey   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  roles       RolePermission[]
}

model MembershipRole {
  id            String   @id @default(uuid()) @db.Uuid
  membershipId  String   @db.Uuid
  roleId        String   @db.Uuid

  membership    Membership @relation(fields: [membershipId], references: [id], onDelete: Cascade)
  role          Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([membershipId, roleId])
}

model RolePermission {
  id            String   @id @default(uuid()) @db.Uuid
  roleId        String   @db.Uuid
  permissionId  String   @db.Uuid

  role          Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission    Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}
```

### Acceso a sedes

```prisma
model MembershipBranch {
  id            String   @id @default(uuid()) @db.Uuid
  membershipId  String   @db.Uuid
  branchId      String   @db.Uuid

  membership    Membership @relation(fields: [membershipId], references: [id], onDelete: Cascade)
  branch        Branch @relation(fields: [branchId], references: [id], onDelete: Cascade)

  @@unique([membershipId, branchId])
}
```

## Lado consumidor versus lado trabajador

La misma persona también puede ser cliente de una marca.

```prisma
model CustomerProfile {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @db.Uuid
  organizationId  String   @db.Uuid
  loyaltyStatus   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
}
```

Esto resuelve el caso:

- Miguel compra en Basti como cliente;
- Miguel trabaja en AtlasFit como colaborador;
- Miguel además podría ser cliente de AtlasFit si crea una cuenta de consumidor allí.

La identidad se comparte, pero los perfiles de cliente y trabajador quedan separados por organización y tipo de relación.

## Módulos y submódulos

La navegación también debe ser data-driven.

```prisma
model PlatformModule {
  id            String   @id @default(uuid()) @db.Uuid
  key           String   @unique
  name          String
  icon          String?
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  submodules    PlatformSubmodule[]
}

model PlatformSubmodule {
  id            String   @id @default(uuid()) @db.Uuid
  moduleId      String   @db.Uuid
  key           String
  name          String
  route         String
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  module        PlatformModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@unique([moduleId, key])
}

model OrganizationModule {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String   @db.Uuid
  moduleKey       String
  enabled         Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([organizationId, moduleKey])
}
```

## Estilo de claves de permiso

Desde el inicio conviene usar claves legibles por máquina:

```text
dashboard.read
rrhh.read
rrhh.collaborators.read
rrhh.collaborators.create
rrhh.payroll.read
finance.read
finance.treasury.read
sales.orders.read
settings.users.manage
settings.roles.manage
platform.organizations.read
platform.organizations.manage
platform.memberships.block
```

## Admin de plataforma versus admin de empresa

No hace falta crear otra app todavía.

Se puede usar el mismo Kapos con distintos alcances:

- `tenant_admin`: solo ve su empresa;
- `tenant_supervisor`: solo ve sus sedes permitidas;
- `platform_admin`: ve todas las organizaciones de la plataforma.

Módulos especiales recomendados para `platform_admin`:

- `Platform > Organizaciones`
- `Platform > Sedes`
- `Platform > Memberships`
- `Platform > Facturación`
- `Platform > Actividad`
- `Platform > Soporte`

Esos módulos deben ocultarse a los administradores normales de cada empresa.

## Flujo de acceso

1. El usuario se autentica una sola vez con identidad global.
2. El backend carga sus memberships disponibles.
3. El usuario elige el contexto de organización si pertenece a varias.
4. La sesión guarda la organización activa y opcionalmente el alcance de sede.
5. El frontend renderiza módulos según módulos habilitados y permisos efectivos.

## Por qué este modelo resuelve el caso Basti + AtlasFit

Si Miguel:

- compra en Basti,
- luego empieza a trabajar en AtlasFit,
- y más adelante se registra en otra web hecha por ICode,

sigue teniendo un solo `User`.

Lo que cambia es:

- su `CustomerProfile` en cada marca;
- su `Membership` en cada organización;
- su conjunto de `Role` y `Permission` por organización.

Así se evita duplicar personas, pero sin mezclar información entre empresas.

## Fases sugeridas de implementación

### Fase 1

- Agregar `Organization`
- Agregar `Membership`
- Agregar `Branch`
- Agregar `Role`
- Agregar `Permission`

### Fase 2

- Agregar `CustomerProfile`
- Agregar cambio de organización activa en sesión
- Agregar habilitación de módulos por organización

### Fase 3

- Agregar módulos de admin de plataforma
- Agregar facturación, auditoría y soporte
- Agregar feature flags por plan
