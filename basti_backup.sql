--
-- PostgreSQL database dump
--

\restrict Jft1taOnTomCkO8i4iORZM69I5oYO9V6pOr9oBRmSoIE8P8Xeqse1098elhWdvw

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: BranchStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BranchStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'CLOSED'
);


ALTER TYPE public."BranchStatus" OWNER TO postgres;

--
-- Name: CashMovementType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CashMovementType" AS ENUM (
    'INCOME',
    'EXPENSE',
    'WITHDRAWAL',
    'DEPOSIT',
    'ADJUSTMENT'
);


ALTER TYPE public."CashMovementType" OWNER TO postgres;

--
-- Name: CashRegisterStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CashRegisterStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ARCHIVED'
);


ALTER TYPE public."CashRegisterStatus" OWNER TO postgres;

--
-- Name: CashSessionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CashSessionStatus" AS ENUM (
    'OPEN',
    'CLOSED',
    'CANCELLED'
);


ALTER TYPE public."CashSessionStatus" OWNER TO postgres;

--
-- Name: CustomerProfileStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CustomerProfileStatus" AS ENUM (
    'ACTIVE',
    'BLOCKED',
    'ARCHIVED'
);


ALTER TYPE public."CustomerProfileStatus" OWNER TO postgres;

--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DocumentType" AS ENUM (
    'DNI',
    'CE',
    'PASSPORT'
);


ALTER TYPE public."DocumentType" OWNER TO postgres;

--
-- Name: MembershipStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MembershipStatus" AS ENUM (
    'INVITED',
    'ACTIVE',
    'SUSPENDED',
    'INACTIVE',
    'TERMINATED'
);


ALTER TYPE public."MembershipStatus" OWNER TO postgres;

--
-- Name: ModuleAudience; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ModuleAudience" AS ENUM (
    'PLATFORM',
    'ORGANIZATION',
    'BOTH'
);


ALTER TYPE public."ModuleAudience" OWNER TO postgres;

--
-- Name: OAuthProvider; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OAuthProvider" AS ENUM (
    'GOOGLE'
);


ALTER TYPE public."OAuthProvider" OWNER TO postgres;

--
-- Name: OrganizationDocumentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrganizationDocumentType" AS ENUM (
    'RUC',
    'OTHER'
);


ALTER TYPE public."OrganizationDocumentType" OWNER TO postgres;

--
-- Name: OrganizationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrganizationStatus" AS ENUM (
    'ACTIVE',
    'TRIAL',
    'SUSPENDED',
    'DISABLED',
    'ARCHIVED'
);


ALTER TYPE public."OrganizationStatus" OWNER TO postgres;

--
-- Name: PaymentMethodType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethodType" AS ENUM (
    'CASH',
    'CARD',
    'DIGITAL_WALLET',
    'BANK_TRANSFER',
    'CREDIT',
    'OTHER'
);


ALTER TYPE public."PaymentMethodType" OWNER TO postgres;

--
-- Name: PermissionOverrideEffect; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PermissionOverrideEffect" AS ENUM (
    'ALLOW',
    'DENY'
);


ALTER TYPE public."PermissionOverrideEffect" OWNER TO postgres;

--
-- Name: PermissionScope; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PermissionScope" AS ENUM (
    'OWN',
    'BRANCH',
    'ORGANIZATION',
    'PLATFORM'
);


ALTER TYPE public."PermissionScope" OWNER TO postgres;

--
-- Name: PlatformAccessStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PlatformAccessStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'DISABLED'
);


ALTER TYPE public."PlatformAccessStatus" OWNER TO postgres;

--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ARCHIVED'
);


ALTER TYPE public."ProductStatus" OWNER TO postgres;

--
-- Name: ProductType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProductType" AS ENUM (
    'PRODUCT',
    'SERVICE',
    'INGREDIENT',
    'COMBO'
);


ALTER TYPE public."ProductType" OWNER TO postgres;

--
-- Name: RoleContext; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RoleContext" AS ENUM (
    'PLATFORM',
    'ORGANIZATION'
);


ALTER TYPE public."RoleContext" OWNER TO postgres;

--
-- Name: RoleStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RoleStatus" AS ENUM (
    'ACTIVE',
    'ARCHIVED'
);


ALTER TYPE public."RoleStatus" OWNER TO postgres;

--
-- Name: StockStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StockStatus" AS ENUM (
    'OK',
    'LOW',
    'OUT'
);


ALTER TYPE public."StockStatus" OWNER TO postgres;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INVITED',
    'SUSPENDED',
    'DISABLED'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Branch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Branch" (
    id uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    code text,
    name text NOT NULL,
    address text,
    phone text,
    status public."BranchStatus" DEFAULT 'ACTIVE'::public."BranchStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Branch" OWNER TO postgres;

--
-- Name: CashMovement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CashMovement" (
    id uuid NOT NULL,
    "cashSessionId" uuid NOT NULL,
    "paymentMethodId" uuid,
    "createdByUserId" uuid NOT NULL,
    type public."CashMovementType" NOT NULL,
    amount numeric(12,2) NOT NULL,
    concept text NOT NULL,
    note text,
    "occurredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CashMovement" OWNER TO postgres;

--
-- Name: CashRegister; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CashRegister" (
    id uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    "branchId" uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    status public."CashRegisterStatus" DEFAULT 'ACTIVE'::public."CashRegisterStatus" NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CashRegister" OWNER TO postgres;

--
-- Name: CashSession; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CashSession" (
    id uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    "branchId" uuid NOT NULL,
    "cashRegisterId" uuid NOT NULL,
    "openedByUserId" uuid NOT NULL,
    "closedByUserId" uuid,
    status public."CashSessionStatus" DEFAULT 'OPEN'::public."CashSessionStatus" NOT NULL,
    "openingAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "expectedAmount" numeric(12,2),
    "countedAmount" numeric(12,2),
    "differenceAmount" numeric(12,2),
    "openedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "closedAt" timestamp(3) without time zone,
    "openingNote" text,
    "closingNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CashSession" OWNER TO postgres;

--
-- Name: CustomerProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CustomerProfile" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    "externalCustomerCode" text,
    "loyaltyTier" text,
    status public."CustomerProfileStatus" DEFAULT 'ACTIVE'::public."CustomerProfileStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CustomerProfile" OWNER TO postgres;

--
-- Name: Membership; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Membership" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    "employeeCode" text,
    title text,
    status public."MembershipStatus" DEFAULT 'ACTIVE'::public."MembershipStatus" NOT NULL,
    "startsAt" timestamp(3) without time zone,
    "endsAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Membership" OWNER TO postgres;

--
-- Name: MembershipBranch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MembershipBranch" (
    id uuid NOT NULL,
    "membershipId" uuid NOT NULL,
    "branchId" uuid NOT NULL
);


ALTER TABLE public."MembershipBranch" OWNER TO postgres;

--
-- Name: MembershipPermissionOverride; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MembershipPermissionOverride" (
    id uuid NOT NULL,
    "membershipId" uuid NOT NULL,
    "permissionId" uuid NOT NULL,
    effect public."PermissionOverrideEffect" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MembershipPermissionOverride" OWNER TO postgres;

--
-- Name: MembershipRole; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MembershipRole" (
    id uuid NOT NULL,
    "membershipId" uuid NOT NULL,
    "roleId" uuid NOT NULL
);


ALTER TABLE public."MembershipRole" OWNER TO postgres;

--
-- Name: OAuthAccount; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OAuthAccount" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    provider public."OAuthProvider" NOT NULL,
    "providerAccountId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OAuthAccount" OWNER TO postgres;

--
-- Name: Organization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Organization" (
    id uuid NOT NULL,
    slug text NOT NULL,
    "legalName" text NOT NULL,
    "tradeName" text,
    "documentType" public."OrganizationDocumentType",
    "documentNumber" text,
    email text,
    phone text,
    "websiteUrl" text,
    status public."OrganizationStatus" DEFAULT 'ACTIVE'::public."OrganizationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Organization" OWNER TO postgres;

--
-- Name: OrganizationModule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrganizationModule" (
    id uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    "moduleKey" text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrganizationModule" OWNER TO postgres;

--
-- Name: OrganizationSetting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrganizationSetting" (
    id uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    "currencyCode" text DEFAULT 'PEN'::text NOT NULL,
    timezone text DEFAULT 'America/Lima'::text NOT NULL,
    "taxRate" numeric(5,2) DEFAULT 18.00 NOT NULL,
    "receiptFooter" text,
    "logoUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrganizationSetting" OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PaymentMethod" (
    id uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type public."PaymentMethodType" NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PaymentMethod" OWNER TO postgres;

--
-- Name: Permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Permission" (
    id uuid NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    "moduleKey" text,
    "submoduleKey" text,
    scope public."PermissionScope" DEFAULT 'ORGANIZATION'::public."PermissionScope" NOT NULL,
    audience public."ModuleAudience" DEFAULT 'ORGANIZATION'::public."ModuleAudience" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Permission" OWNER TO postgres;

--
-- Name: PlatformAccess; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlatformAccess" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    status public."PlatformAccessStatus" DEFAULT 'ACTIVE'::public."PlatformAccessStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlatformAccess" OWNER TO postgres;

--
-- Name: PlatformAccessPermissionOverride; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlatformAccessPermissionOverride" (
    id uuid NOT NULL,
    "platformAccessId" uuid NOT NULL,
    "permissionId" uuid NOT NULL,
    effect public."PermissionOverrideEffect" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlatformAccessPermissionOverride" OWNER TO postgres;

--
-- Name: PlatformAccessRole; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlatformAccessRole" (
    id uuid NOT NULL,
    "platformAccessId" uuid NOT NULL,
    "roleId" uuid NOT NULL
);


ALTER TABLE public."PlatformAccessRole" OWNER TO postgres;

--
-- Name: PlatformModule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlatformModule" (
    id uuid NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    icon text,
    audience public."ModuleAudience" DEFAULT 'ORGANIZATION'::public."ModuleAudience" NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlatformModule" OWNER TO postgres;

--
-- Name: PlatformSubmodule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlatformSubmodule" (
    id uuid NOT NULL,
    "moduleId" uuid NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    route text NOT NULL,
    "permissionKey" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlatformSubmodule" OWNER TO postgres;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    "categoryId" uuid,
    sku text,
    name text NOT NULL,
    description text,
    type public."ProductType" DEFAULT 'PRODUCT'::public."ProductType" NOT NULL,
    status public."ProductStatus" DEFAULT 'ACTIVE'::public."ProductStatus" NOT NULL,
    price numeric(12,2) DEFAULT 0 NOT NULL,
    cost numeric(12,2),
    "taxRate" numeric(5,2),
    "trackStock" boolean DEFAULT true NOT NULL,
    "availableForPos" boolean DEFAULT true NOT NULL,
    "imageUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- Name: ProductCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductCategory" (
    id uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    "parentId" uuid,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    color text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductCategory" OWNER TO postgres;

--
-- Name: ProductStock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductStock" (
    id uuid NOT NULL,
    "productId" uuid NOT NULL,
    "branchId" uuid NOT NULL,
    quantity numeric(14,3) DEFAULT 0 NOT NULL,
    "minQuantity" numeric(14,3) DEFAULT 0 NOT NULL,
    status public."StockStatus" DEFAULT 'OK'::public."StockStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductStock" OWNER TO postgres;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Role" (
    id uuid NOT NULL,
    context public."RoleContext" NOT NULL,
    "scopeKey" text NOT NULL,
    "organizationId" uuid,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status public."RoleStatus" DEFAULT 'ACTIVE'::public."RoleStatus" NOT NULL
);


ALTER TABLE public."Role" OWNER TO postgres;

--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RolePermission" (
    id uuid NOT NULL,
    "roleId" uuid NOT NULL,
    "permissionId" uuid NOT NULL
);


ALTER TABLE public."RolePermission" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "refreshTokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id uuid NOT NULL,
    email text,
    "passwordHash" text,
    "firstName" text,
    "lastName" text,
    phone text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "documentType" public."DocumentType",
    "documentNumber" text,
    "avatarUrl" text,
    "emailVerifiedAt" timestamp(3) without time zone,
    "documentVerifiedAt" timestamp(3) without time zone,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    "lastLoginAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Branch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Branch" (id, "organizationId", code, name, address, phone, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CashMovement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CashMovement" (id, "cashSessionId", "paymentMethodId", "createdByUserId", type, amount, concept, note, "occurredAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CashRegister; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CashRegister" (id, "organizationId", "branchId", code, name, status, "sortOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CashSession; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CashSession" (id, "organizationId", "branchId", "cashRegisterId", "openedByUserId", "closedByUserId", status, "openingAmount", "expectedAmount", "countedAmount", "differenceAmount", "openedAt", "closedAt", "openingNote", "closingNote", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CustomerProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CustomerProfile" (id, "userId", "organizationId", "externalCustomerCode", "loyaltyTier", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Membership; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Membership" (id, "userId", "organizationId", "employeeCode", title, status, "startsAt", "endsAt", "createdAt", "updatedAt") FROM stdin;
c7a1dfcf-4969-46ed-ac3a-0c80e240ad89	11c5fe46-3c98-468f-822b-a481a6d2f439	bbe5a1da-0ec6-4add-8473-4aa13111310b	123456	GERENTE	TERMINATED	\N	2026-08-03 22:02:43.153	2026-08-03 19:47:37.082	2026-08-03 22:02:43.154
005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	bbe5a1da-0ec6-4add-8473-4aa13111310b	luis123	Jefe	ACTIVE	\N	\N	2026-08-03 22:32:50.249	2026-08-04 22:32:12.772
99a62882-105a-49be-8709-fa250887ebff	45cdd238-68d7-42b4-bf51-3562ceb7815f	bbe5a1da-0ec6-4add-8473-4aa13111310b	lu123	Cajero	ACTIVE	\N	\N	2026-08-05 16:11:03.493	2026-08-05 16:11:03.493
\.


--
-- Data for Name: MembershipBranch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MembershipBranch" (id, "membershipId", "branchId") FROM stdin;
\.


--
-- Data for Name: MembershipPermissionOverride; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MembershipPermissionOverride" (id, "membershipId", "permissionId", effect, "createdAt", "updatedAt") FROM stdin;
035f3b03-1389-442e-a93d-0e5080a82d53	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	ebcbf8bc-3478-403d-af9d-b30b5c20644a	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
2edf7751-4060-45fd-bdf3-3948f2124275	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	ddb978fc-42fa-4a68-af94-c3fa03620a46	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
b5f2940a-0017-4bf6-b61c-033e2422fbdf	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	fd96798e-f8a6-426c-bc1b-3dcea9191823	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
206fb74f-4c51-4a04-ac16-03bb9557f358	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	9ea304b5-db24-410a-8834-8e646a70ead8	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
14a5bb12-80fe-4c92-a8e1-72144b75097c	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	39e64eee-569d-402d-ae89-3141e8d803f9	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
ab23cb38-2d28-41c6-80b3-ba30693ccfbe	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	fc54a4d6-a5b1-40b4-83fe-8fe908acea8b	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
cdbe4876-2970-413e-a6f1-a723367b1a8e	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	81257861-8452-4de2-9649-0d6e24492a98	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
eb702cca-102b-4626-840d-34cf4381e2e9	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	7ea86c73-d5bb-4b0e-8bce-bc884fddd16e	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
4d2cd573-624d-48d2-b95f-b75fa4183b1e	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	bba8556a-5fe5-4948-9660-34436efb5445	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
7e50bc28-db95-417c-bc60-df3af9991119	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	9590bc17-6cbc-44b9-a62d-a9d6f12d403a	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
37821498-f127-42ca-82ae-be534bf935d3	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	a5eafffa-b0d6-485a-8e24-515371566eac	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
0cee02a7-8ce3-437c-8793-8e241126f29d	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	0bd3b6b0-7fe0-43b5-a71b-d7ffdfa31998	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
3f3f3579-6bb4-4ecb-b941-1ef7bd35f0f9	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	1fbebbff-5ecf-4203-93b0-3530aaeac89b	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
0c21f77f-ffce-4325-a416-98d81a7b4ffc	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	5a061cdb-5050-4688-bd3f-3a9e5d23e094	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
f46bfe8e-50df-4f7f-915a-6459909f5f79	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	68afc77d-47d7-472d-b008-dd24dbc9c8fb	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
743eb919-1cac-4f59-a2e1-55490688a63b	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	65001cd0-a4b5-46e6-851f-def8356fedb9	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
14627879-2929-4b11-98d5-b235ab1cea5a	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	56297163-3566-4f19-8a09-65867d24502e	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
13ba2b15-7918-440c-ace8-528ebdef56b8	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	300a0b6a-3671-45fc-8f5b-443aab4a5a38	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
f579aba6-6d42-401b-8a2d-260cd9b216a5	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	a4dd9440-94e5-4d7f-aa01-44b8ecf0e55f	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
a855f2ed-a84e-4af6-b9bb-1734cf2cfdcf	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	a6122ec0-8df0-4cee-8cee-24a2ec765000	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
ca13575b-83d3-4ab6-b295-5169b7fa5524	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	e574882b-dcdb-491a-aad6-c6e667f6d711	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
0880e587-3f86-4429-9d27-a4b7d7cb2159	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	c2d4283c-97c1-4db7-b502-36625961505b	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
3a75dd41-7d67-441d-99f8-a0c47b9faa50	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	bbaeda5e-b880-44e2-b932-192e160799d1	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
a22d69b2-baa2-4dc7-89ee-6279e4ae5c9e	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	62a19e0e-a967-4baa-9bce-7db137be18fa	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
215f3c68-0c9a-4c9e-beb0-00a0a49eaec3	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	e74ffc74-6c68-4b2f-affa-7b831889fb05	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
9c873209-1e0c-496f-8d69-4ad2782d382b	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	528f6052-356d-4d29-9df9-1318bfbe0730	ALLOW	2026-08-05 16:45:24.808	2026-08-05 16:45:24.808
\.


--
-- Data for Name: MembershipRole; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MembershipRole" (id, "membershipId", "roleId") FROM stdin;
c76f63d9-99e8-41e1-9679-e6c8a5f7e9c9	005a8d17-2b85-4e16-9f21-e20a9f3fb7a0	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707
e98309c7-e3e7-45e8-8ee6-2433b306495f	99a62882-105a-49be-8709-fa250887ebff	e8d2c42b-d586-4243-bd54-4b4e8ec67bea
\.


--
-- Data for Name: OAuthAccount; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OAuthAccount" (id, "userId", provider, "providerAccountId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Organization" (id, slug, "legalName", "tradeName", "documentType", "documentNumber", email, phone, "websiteUrl", status, "createdAt", "updatedAt") FROM stdin;
bbe5a1da-0ec6-4add-8473-4aa13111310b	basti	BASTI SA	Basti	RUC	1234567890	basti@gmail.com	987654321	\N	ACTIVE	2026-08-01 18:01:18.404	2026-08-04 22:31:44.919
\.


--
-- Data for Name: OrganizationModule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrganizationModule" (id, "organizationId", "moduleKey", enabled, "createdAt", "updatedAt") FROM stdin;
1a1e0f40-5da5-472f-96cf-1a74f8e22ebb	bbe5a1da-0ec6-4add-8473-4aa13111310b	rrhh	f	2026-08-01 18:01:18.421	2026-08-04 22:31:44.92
940dd265-67a1-482a-9449-3c90de522a2d	bbe5a1da-0ec6-4add-8473-4aa13111310b	dashboard	t	2026-08-01 18:01:18.424	2026-08-04 22:31:44.923
8d333975-94c7-4709-805f-0ed3e9954df3	bbe5a1da-0ec6-4add-8473-4aa13111310b	catalog	t	2026-08-04 20:04:55.064	2026-08-04 22:31:44.926
541ce7e6-6e58-4549-be73-1359e6a9dc31	bbe5a1da-0ec6-4add-8473-4aa13111310b	settings	t	2026-08-04 19:10:33.721	2026-08-04 22:31:44.927
05e7dd6a-8939-40f3-a375-4bad19859b5a	bbe5a1da-0ec6-4add-8473-4aa13111310b	cash	t	2026-08-04 21:55:14.633	2026-08-04 22:31:44.93
\.


--
-- Data for Name: OrganizationSetting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrganizationSetting" (id, "organizationId", "currencyCode", timezone, "taxRate", "receiptFooter", "logoUrl", "createdAt", "updatedAt") FROM stdin;
ab408785-2974-4e5e-b0b7-868c3fcdf592	bbe5a1da-0ec6-4add-8473-4aa13111310b	PEN	America/Lima	18.00	\N	\N	2026-08-04 19:12:03.034	2026-08-04 19:12:03.034
\.


--
-- Data for Name: PaymentMethod; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PaymentMethod" (id, "organizationId", code, name, type, enabled, "sortOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Permission" (id, key, name, description, "moduleKey", "submoduleKey", scope, audience, "createdAt", "updatedAt") FROM stdin;
07089aca-38dd-4737-b587-96c1f3f5fd92	rrhh.collaborators.create	Crear colaboradores	Permite registrar nuevos colaboradores.	rrhh	collaborators	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.611	2026-08-04 21:52:34.856
cf37ab03-3194-4bbb-8a4c-7198d50fcc7c	rrhh.collaborators.update	Editar colaboradores	Permite actualizar datos de colaboradores.	rrhh	collaborators	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.615	2026-08-04 21:52:34.857
6eae1a3a-b154-4b6a-99f7-71852aa5e0a2	rrhh.attendance.read	Ver asistencia	Permite revisar asistencia por sede.	rrhh	attendance	BRANCH	ORGANIZATION	2026-07-31 17:32:07.619	2026-08-04 21:52:34.86
346d274c-b24e-41b9-bcb5-8c92925ea2f9	rrhh.payroll.read	Ver boletas	Permite revisar boletas y planillas.	rrhh	payroll	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.621	2026-08-04 21:52:34.861
e574882b-dcdb-491a-aad6-c6e667f6d711	settings.roles.create	Crear roles	Permite crear roles internos.	settings	roles	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.659	2026-08-04 21:52:34.851
c2d4283c-97c1-4db7-b502-36625961505b	settings.roles.manage_permissions	Gestionar permisos de roles	Permite definir permisos de roles internos.	settings	roles	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.661	2026-08-04 21:52:34.852
7e955882-5c6c-49b7-af8d-0d2113246581	platform.users.create	Crear usuarios globales	Permite registrar identidades globales manualmente.	platform	global-users	PLATFORM	PLATFORM	2026-07-31 17:32:07.674	2026-08-04 21:52:34.833
0c76c55b-160e-4c23-bb9f-ea9c9f1db753	platform.memberships.read	Ver memberships	Permite revisar relaciones entre usuarios y organizaciones.	platform	global-users	PLATFORM	PLATFORM	2026-07-31 17:32:07.675	2026-08-04 21:52:34.835
f3af590e-aea4-4449-9602-f45bf37df21d	platform.memberships.manage	Gestionar memberships	Permite vincular owners, admins o colaboradores a organizaciones.	platform	global-users	PLATFORM	PLATFORM	2026-07-31 17:32:07.677	2026-08-04 21:52:34.835
f4d61423-90f0-4655-a187-93683540c029	sales.customers.read	Ver clientes	Permite consultar clientes comerciales.	sales	customers	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.623	2026-08-04 21:52:34.862
36144b03-3b6f-41c4-9642-498b2dbbb39b	sales.quotes.read	Ver cotizaciones	Permite revisar cotizaciones.	sales	quotes	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.625	2026-08-04 21:52:34.863
a799b798-fb15-4e17-a0ec-2d0e76a99b71	sales.quotes.create	Crear cotizaciones	Permite emitir cotizaciones.	sales	quotes	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.626	2026-08-04 21:52:34.864
27aba3b9-b2ec-443f-b630-c2523e146ffd	sales.orders.read	Ver pedidos	Permite consultar pedidos.	sales	orders	BRANCH	ORGANIZATION	2026-07-31 17:32:07.63	2026-08-04 21:52:34.865
a1f1e082-4f36-4b9f-8405-d55f98e78bb8	sales.orders.create	Crear pedidos	Permite registrar pedidos.	sales	orders	BRANCH	ORGANIZATION	2026-07-31 17:32:07.635	2026-08-04 21:52:34.866
36858a42-7c84-48e6-8e04-1468d82ba4f7	operations.manifests.read	Ver manifiestos	Permite consultar manifiestos operativos.	operations	manifests	BRANCH	ORGANIZATION	2026-07-31 17:32:07.643	2026-08-04 21:52:34.888
3058ffe5-816e-45b5-85f0-62123cfb4b00	operations.carriers.read	Ver transportistas	Permite listar transportistas.	operations	carriers	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.644	2026-08-04 21:52:34.889
21df9f92-d6a2-4d2a-99f8-148b05b87d49	operations.routes.read	Ver rutas	Permite consultar rutas operativas.	operations	routes	BRANCH	ORGANIZATION	2026-07-31 17:32:07.65	2026-08-04 21:52:34.889
3c15438c-45dc-4b4c-bd52-391d5cdcad10	finance.billing.read	Ver facturación	Permite revisar información de facturación.	finance	billing	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.637	2026-07-31 18:02:28.141
3e00fced-b462-4c65-9525-2a23e8a9f2b9	finance.treasury.read	Ver tesorería	Permite revisar tesorería y caja consolidada.	finance	treasury	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.639	2026-07-31 18:02:28.142
72cc0ee9-f2ce-41ae-a5bc-99bbbfa9799f	finance.reports.read	Ver reportes financieros	Permite consultar reportes financieros.	finance	reports	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.641	2026-07-31 18:02:28.144
16e0aa36-02f6-4353-8ad6-eea56dc20c25	platform.organizations.create	Crear organizaciones	Permite crear nuevas organizaciones cliente.	platform	organizations	PLATFORM	PLATFORM	2026-07-31 17:32:07.669	2026-08-04 21:52:34.831
0b76d156-6481-40da-aa74-01194703edd7	platform.organizations.manage	Gestionar organizaciones	Permite editar, suspender o reactivar organizaciones.	platform	organizations	PLATFORM	PLATFORM	2026-07-31 17:32:07.671	2026-08-04 21:52:34.832
ddb24f54-08bd-49fb-9c50-288e50aa2471	platform.users.read	Ver usuarios globales	Permite revisar identidades globales de la plataforma.	platform	global-users	PLATFORM	PLATFORM	2026-07-31 17:32:07.672	2026-08-04 21:52:34.833
e74ffc74-6c68-4b2f-affa-7b831889fb05	settings.parameters.read	Ver parametros	Permite revisar parametros generales del ERP.	settings	parameters	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.664	2026-08-04 21:52:34.853
62a19e0e-a967-4baa-9bce-7db137be18fa	settings.parameters.manage	Gestionar parametros	Permite editar parametros globales del cliente.	settings	parameters	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.666	2026-08-04 21:52:34.854
086d4053-8c24-4af0-9831-89d0e214ea6d	rrhh.collaborators.read	Ver colaboradores	Permite listar colaboradores de la organizacion.	rrhh	collaborators	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.609	2026-08-04 21:52:34.855
5336d594-301d-4949-a6ab-f939167765d2	platform.organizations.read	Ver organizaciones	Permite ver empresas cliente registradas en Kapos.	platform	organizations	PLATFORM	PLATFORM	2026-07-31 17:32:07.668	2026-08-04 21:52:34.83
56297163-3566-4f19-8a09-65867d24502e	settings.branches.read	Ver sucursales	Permite revisar sucursales habilitadas.	settings	branches	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:14.934	2026-08-04 21:52:34.845
a6122ec0-8df0-4cee-8cee-24a2ec765000	settings.users.read	Ver usuarios	Permite listar usuarios internos de la organizacion.	settings	users	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.653	2026-08-04 21:52:34.847
3c0f7d83-d3b4-420b-bf81-b2ade136e39e	platform.roles.read	Ver roles base	Permite consultar roles maestros de plataforma y organizacion.	platform	roles	PLATFORM	PLATFORM	2026-08-01 15:52:14.906	2026-08-04 21:52:34.836
0f5e503c-86a8-424d-9107-c72fc8ff1b80	platform.roles.manage	Gestionar roles base	Permite editar roles base del sistema.	platform	roles	PLATFORM	PLATFORM	2026-08-01 15:52:14.909	2026-08-04 21:52:34.837
ca76d52a-f323-4ac9-b7dd-7ada284ff9bb	platform.permissions.read	Ver permisos maestros	Permite consultar el catalogo de permisos base.	platform	permissions	PLATFORM	PLATFORM	2026-08-01 15:52:14.912	2026-08-04 21:52:34.837
4b6afbe7-ba3a-491a-93ad-bbee15e846b5	platform.permissions.manage	Gestionar permisos maestros	Permite crear o ajustar permisos base del sistema.	platform	permissions	PLATFORM	PLATFORM	2026-08-01 15:52:14.914	2026-08-04 21:52:34.838
5043c4ed-93eb-4838-88e5-f8dc26d36abb	platform.modules.read	Ver modulos del sistema	Permite consultar modulos y submodulos sembrados en Kapos.	platform	modules	PLATFORM	PLATFORM	2026-08-01 15:52:14.916	2026-08-04 21:52:34.839
a8db67e8-d632-4b23-bcb4-81dff8158814	platform.modules.manage	Gestionar modulos del sistema	Permite crear o ajustar modulos y submodulos base.	platform	modules	PLATFORM	PLATFORM	2026-08-01 15:52:14.918	2026-08-04 21:52:34.839
c11bfc62-2887-4750-8972-7ae8ce9e4b92	platform.activity.read	Ver actividad global	Permite consultar actividad global de clientes y accesos.	platform	activity	PLATFORM	PLATFORM	2026-07-31 17:32:07.679	2026-08-04 21:52:34.84
ebcbf8bc-3478-403d-af9d-b30b5c20644a	dashboard.read	Ver dashboard	Permite ver el panel principal del ERP.	dashboard	home	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.606	2026-08-04 21:52:34.842
65001cd0-a4b5-46e6-851f-def8356fedb9	settings.organization.read	Ver empresa	Permite consultar datos generales de la organizacion.	settings	organization	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:14.929	2026-08-04 21:52:34.843
68afc77d-47d7-472d-b008-dd24dbc9c8fb	settings.organization.manage	Gestionar empresa	Permite editar datos base de la organizacion.	settings	organization	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:14.932	2026-08-04 21:52:34.844
a4dd9440-94e5-4d7f-aa01-44b8ecf0e55f	settings.users.create	Crear usuarios	Permite crear cuentas internas.	settings	users	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.654	2026-08-04 21:52:34.849
300a0b6a-3671-45fc-8f5b-443aab4a5a38	settings.users.assign_roles	Asignar roles	Permite asignar roles a memberships internas.	settings	users	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.656	2026-08-04 21:52:34.85
bbaeda5e-b880-44e2-b932-192e160799d1	settings.roles.read	Ver roles	Permite listar roles de la organizacion.	settings	roles	ORGANIZATION	ORGANIZATION	2026-07-31 17:32:07.657	2026-08-04 21:52:34.85
1f7165cd-e6d9-4e75-943f-1275023c877e	billing.series.read	Ver series	Permite revisar series y correlativos.	billing	series	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.038	2026-08-04 21:52:34.883
528f6052-356d-4d29-9df9-1318bfbe0730	settings.branches.manage	Gestionar sucursales	Permite crear o editar sucursales.	settings	branches	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:14.936	2026-08-04 21:52:34.846
01a4014c-1c24-457c-81b3-eeede7c09349	inventory.products.read	Ver productos	Permite listar productos e insumos.	inventory	products	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.016	2026-08-03 21:49:55.858
0c9f471d-b2f1-48bb-a927-b86eb0426b84	inventory.products.manage	Gestionar productos	Permite crear o editar productos e insumos.	inventory	products	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.019	2026-08-03 21:49:55.859
47444a10-7a55-4fa1-8a04-70df13ae8d26	inventory.categories.read	Ver categorias	Permite revisar categorias de inventario.	inventory	categories	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.021	2026-08-03 21:49:55.86
a3d6fd91-f630-40c5-ac7a-37c4a6a4c5db	inventory.categories.manage	Gestionar categorias	Permite crear o editar categorias.	inventory	categories	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.024	2026-08-03 21:49:55.861
51ac3c99-28ce-4fcf-b6f6-450825cc62ac	inventory.stock.read	Ver stock	Permite consultar stock por organizacion o sede.	inventory	stock	BRANCH	ORGANIZATION	2026-08-01 15:52:15.026	2026-08-03 21:49:55.861
1c7b1519-b76f-4432-a0fa-80b0c8d9b384	inventory.adjustments.read	Ver ajustes de stock	Permite consultar ajustes de stock.	inventory	adjustments	BRANCH	ORGANIZATION	2026-08-01 15:52:15.029	2026-08-03 21:49:55.862
6420ef5b-62b9-41dd-8879-220356c0ba24	inventory.adjustments.manage	Gestionar ajustes de stock	Permite crear ajustes de inventario.	inventory	adjustments	BRANCH	ORGANIZATION	2026-08-01 15:52:15.032	2026-08-03 21:49:55.863
fd96798e-f8a6-426c-bc1b-3dcea9191823	catalog.products.read	Ver productos	Permite listar productos e insumos.	catalog	products	ORGANIZATION	ORGANIZATION	2026-08-04 17:07:47.506	2026-08-04 21:52:34.874
ddb978fc-42fa-4a68-af94-c3fa03620a46	catalog.products.manage	Gestionar productos	Permite crear o editar productos e insumos.	catalog	products	ORGANIZATION	ORGANIZATION	2026-08-04 17:07:47.509	2026-08-04 21:52:34.875
39e64eee-569d-402d-ae89-3141e8d803f9	catalog.categories.read	Ver categorias	Permite revisar categorias del catalogo.	catalog	categories	ORGANIZATION	ORGANIZATION	2026-08-04 17:07:47.51	2026-08-04 21:52:34.876
9ea304b5-db24-410a-8834-8e646a70ead8	catalog.categories.manage	Gestionar categorias	Permite crear o editar categorias.	catalog	categories	ORGANIZATION	ORGANIZATION	2026-08-04 17:07:47.511	2026-08-04 21:52:34.877
fc54a4d6-a5b1-40b4-83fe-8fe908acea8b	catalog.stock.read	Ver stock	Permite consultar stock por organizacion o sede.	catalog	stock	BRANCH	ORGANIZATION	2026-08-04 17:07:47.512	2026-08-04 21:52:34.879
7ea86c73-d5bb-4b0e-8bce-bc884fddd16e	catalog.adjustments.read	Ver ajustes de stock	Permite consultar ajustes de stock.	catalog	adjustments	BRANCH	ORGANIZATION	2026-08-04 17:07:47.513	2026-08-04 21:52:34.88
81257861-8452-4de2-9649-0d6e24492a98	catalog.adjustments.manage	Gestionar ajustes de stock	Permite crear ajustes de catalogo y stock.	catalog	adjustments	BRANCH	ORGANIZATION	2026-08-04 17:07:47.514	2026-08-04 21:52:34.881
0852e3ff-3bcd-4f0b-8a0e-38d14dbabb31	billing.documents.read	Ver documentos	Permite revisar documentos emitidos.	billing	documents	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.034	2026-08-04 21:52:34.882
3443e466-4336-4b34-a43c-ce4eb726e1ac	billing.documents.manage	Gestionar documentos	Permite emitir o reenviar documentos.	billing	documents	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.037	2026-08-04 21:52:34.883
a1eab005-8fa2-4f3b-a53d-4234cbbd7104	billing.series.manage	Gestionar series	Permite editar series y correlativos.	billing	series	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.04	2026-08-04 21:52:34.884
9cabc5e9-6284-4885-b201-7b4d4dbd6088	billing.providers.read	Ver integraciones de facturacion	Permite revisar integraciones de facturacion.	billing	providers	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.043	2026-08-04 21:52:34.885
cbdba807-5a17-4867-a339-abd7b2e55403	reports.sales.read	Ver reportes de ventas	Permite consultar reportes de ventas.	reports	sales	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.044	2026-08-04 21:52:34.885
e84e9e65-6805-4e60-a868-e208488ee749	reports.cash.read	Ver reportes de caja	Permite consultar reportes de caja.	reports	cash	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.046	2026-08-04 21:52:34.886
bbe4fbf3-2fd2-4a8c-bf51-66c1d57c03e9	reports.inventory.read	Ver reportes de inventario	Permite consultar reportes de inventario.	reports	inventory	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.048	2026-08-04 21:52:34.887
b3b0e0e2-ed42-466e-8e3d-894839eb85b9	reports.customers.read	Ver reportes de clientes	Permite consultar reportes de clientes.	reports	customers	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:15.05	2026-08-04 21:52:34.887
b332a27a-9f45-48d2-8eeb-ac3d90714261	sales.customers.create	Crear clientes	Permite registrar nuevos clientes.	sales	customers	ORGANIZATION	ORGANIZATION	2026-08-01 15:52:14.984	2026-08-04 21:52:34.863
06ec265c-c511-4d9b-80d9-3feec7607a40	sales.pos.read	Ver POS	Permite usar o revisar el punto de venta.	sales	pos	BRANCH	ORGANIZATION	2026-08-01 15:52:14.995	2026-08-04 21:52:34.866
9590bc17-6cbc-44b9-a62d-a9d6f12d403a	cash.openings.read	Ver aperturas de caja	Permite consultar aperturas de caja.	cash	openings	BRANCH	ORGANIZATION	2026-08-01 15:52:14.997	2026-08-04 21:52:34.867
bba8556a-5fe5-4948-9660-34436efb5445	cash.openings.manage	Gestionar aperturas de caja	Permite abrir caja o ajustar una apertura.	cash	openings	BRANCH	ORGANIZATION	2026-08-01 15:52:14.998	2026-08-04 21:52:34.868
0bd3b6b0-7fe0-43b5-a71b-d7ffdfa31998	cash.movements.read	Ver movimientos de caja	Permite consultar ingresos y salidas de caja.	cash	movements	BRANCH	ORGANIZATION	2026-08-01 15:52:15	2026-08-04 21:52:34.869
a5eafffa-b0d6-485a-8e24-515371566eac	cash.movements.manage	Gestionar movimientos de caja	Permite registrar ingresos y egresos de caja.	cash	movements	BRANCH	ORGANIZATION	2026-08-01 15:52:15.003	2026-08-04 21:52:34.869
5a061cdb-5050-4688-bd3f-3a9e5d23e094	cash.closings.read	Ver cierres de caja	Permite consultar cierres de caja.	cash	closings	BRANCH	ORGANIZATION	2026-08-01 15:52:15.011	2026-08-04 21:52:34.87
1fbebbff-5ecf-4203-93b0-3530aaeac89b	cash.closings.manage	Gestionar cierres de caja	Permite cerrar caja y validar diferencias.	cash	closings	BRANCH	ORGANIZATION	2026-08-01 15:52:15.014	2026-08-04 21:52:34.871
2be72871-8982-4286-b78c-789a913e37d7	platform.users.manage	Gestionar usuarios globales	Permite editar identidad, estado y acceso de plataforma de usuarios globales.	platform	global-users	PLATFORM	PLATFORM	2026-08-03 21:49:55.81	2026-08-04 21:52:34.834
\.


--
-- Data for Name: PlatformAccess; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlatformAccess" (id, "userId", status, "createdAt", "updatedAt") FROM stdin;
a6a649e6-8e10-4cf9-9b96-fd75a867a7be	11c5fe46-3c98-468f-822b-a481a6d2f439	ACTIVE	2026-07-31 17:40:02.883	2026-08-04 21:52:35.345
\.


--
-- Data for Name: PlatformAccessPermissionOverride; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlatformAccessPermissionOverride" (id, "platformAccessId", "permissionId", effect, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PlatformAccessRole; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlatformAccessRole" (id, "platformAccessId", "roleId") FROM stdin;
137faa66-af37-4e58-bf2c-89e5fff6cc98	a6a649e6-8e10-4cf9-9b96-fd75a867a7be	c8c3853b-7d29-477c-bbf6-983e103990db
\.


--
-- Data for Name: PlatformModule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlatformModule" (id, key, name, icon, audience, "sortOrder", "createdAt", "updatedAt") FROM stdin;
c369c46e-fb83-4e98-939d-fedf78ac6f70	platform	Superadmin	shield	PLATFORM	10	2026-07-31 17:32:07.593	2026-08-04 21:52:34.615
269c2a67-b783-46cf-84b1-d78f09fb88ca	dashboard	Inicio	layout-dashboard	ORGANIZATION	10	2026-07-31 17:32:07.318	2026-08-04 21:52:34.786
90cbac81-dd69-4d7d-aa87-3f9b53889220	settings	Configuracion	settings	ORGANIZATION	90	2026-07-31 17:32:07.582	2026-08-04 21:52:34.794
600bc2e8-bd84-4170-89f5-a261056f0dd1	rrhh	Recursos humanos	users	ORGANIZATION	100	2026-07-31 17:32:07.534	2026-08-04 21:52:34.799
a812aaf0-c471-4a8a-a2aa-d509da566725	sales	Ventas	shopping-bag	ORGANIZATION	40	2026-07-31 17:32:07.551	2026-08-04 21:52:34.803
0762d095-02ef-40d8-a885-e522362b06c8	cash	Caja	wallet	ORGANIZATION	30	2026-08-01 15:52:14.761	2026-08-04 21:52:34.81
793c96bf-400c-4159-a384-ea5086558dae	catalog	Catalogo	package	ORGANIZATION	20	2026-08-04 17:07:47.417	2026-08-04 21:52:34.815
21c48467-263c-4d88-b4ac-c1a84aa07e40	billing	Facturacion	receipt	ORGANIZATION	70	2026-08-01 15:52:14.851	2026-08-04 21:52:34.819
33364899-d547-4ced-8897-e2ed9a1cf3a7	reports	Reportes	bar-chart-3	ORGANIZATION	80	2026-08-01 15:52:14.863	2026-08-04 21:52:34.822
0df9cd23-0080-48b2-9b44-be98841aef0d	operations	Operaciones	truck	ORGANIZATION	110	2026-07-31 17:32:07.569	2026-08-04 21:52:34.826
a2f82ae6-8075-4e15-bc3c-64d1ca3b62d0	finance	Finanzas	wallet	ORGANIZATION	40	2026-07-31 17:32:07.561	2026-07-31 18:02:28.074
92b2e2d5-f92e-4fba-978c-b21f20cbb199	inventory	Inventario	package	ORGANIZATION	70	2026-08-01 15:52:14.771	2026-08-03 21:49:55.784
\.


--
-- Data for Name: PlatformSubmodule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlatformSubmodule" (id, "moduleId", key, name, route, "permissionKey", "sortOrder", "createdAt", "updatedAt") FROM stdin;
6cf93d5b-473b-4c54-b91e-79bd8851970c	90cbac81-dd69-4d7d-aa87-3f9b53889220	parameters	Parametros	/configuracion/parametros	settings.parameters.read	50	2026-07-31 17:32:07.589	2026-08-04 21:52:34.799
c2f00443-8e80-4165-a962-0733a42fa2b5	a812aaf0-c471-4a8a-a2aa-d509da566725	orders	Pedidos	/ventas/pedidos	sales.orders.read	30	2026-07-31 17:32:07.559	2026-08-04 21:52:34.807
2e25dfaa-b243-4cf7-b1f7-d79bd44b5f91	a812aaf0-c471-4a8a-a2aa-d509da566725	pos	POS	/ventas/pos	sales.pos.read	40	2026-08-01 15:52:14.759	2026-08-04 21:52:34.808
69fd543d-7d25-40db-a476-2f6077f5d57c	0762d095-02ef-40d8-a885-e522362b06c8	openings	Apertura	/caja/apertura	cash.openings.read	10	2026-08-01 15:52:14.765	2026-08-04 21:52:34.812
fdc46b54-d8d2-4bd7-9428-9ec3b35d6a36	793c96bf-400c-4159-a384-ea5086558dae	stock	Stock	/catalogo/stock	catalog.stock.read	30	2026-08-04 17:07:47.426	2026-08-04 21:52:34.817
8bff24b9-d8d5-4451-ab74-dd4849b59711	793c96bf-400c-4159-a384-ea5086558dae	adjustments	Ajustes	/catalogo/ajustes	catalog.adjustments.read	40	2026-08-04 17:07:47.428	2026-08-04 21:52:34.818
bb2aae67-a8a4-44ce-86ac-cda10caa53b9	a2f82ae6-8075-4e15-bc3c-64d1ca3b62d0	billing	Facturación	/finanzas/facturacion	finance.billing.read	10	2026-07-31 17:32:07.565	2026-07-31 18:02:28.076
77f5ac6b-b219-4c4d-9e43-2893d09257f0	a2f82ae6-8075-4e15-bc3c-64d1ca3b62d0	treasury	Tesorería	/finanzas/tesoreria	finance.treasury.read	20	2026-07-31 17:32:07.567	2026-07-31 18:02:28.079
002126de-6a2a-430f-b473-54461bb21977	a2f82ae6-8075-4e15-bc3c-64d1ca3b62d0	reports	Reportes	/finanzas/reportes	finance.reports.read	30	2026-07-31 17:32:07.568	2026-07-31 18:02:28.081
bec54bee-6853-4248-bdce-157e51b9b1ac	21c48467-263c-4d88-b4ac-c1a84aa07e40	documents	Documentos	/facturacion/documentos	billing.documents.read	10	2026-08-01 15:52:14.855	2026-08-04 21:52:34.82
aee9c6c2-767b-4901-9d4d-40f533ac4f6a	92b2e2d5-f92e-4fba-978c-b21f20cbb199	products	Productos	/inventario/productos	inventory.products.read	10	2026-08-01 15:52:14.777	2026-08-03 21:49:55.786
12bf4f8d-e638-4b24-a6fc-fe8a48da677b	33364899-d547-4ced-8897-e2ed9a1cf3a7	cash	Caja	/reportes/caja	reports.cash.read	20	2026-08-01 15:52:14.867	2026-08-04 21:52:34.823
04ee95e6-a24e-4153-bf8f-bfe30ff52b11	33364899-d547-4ced-8897-e2ed9a1cf3a7	inventory	Inventario	/reportes/inventario	reports.inventory.read	30	2026-08-01 15:52:14.869	2026-08-04 21:52:34.824
b82516e4-7755-4a06-a33c-c3927e02d204	92b2e2d5-f92e-4fba-978c-b21f20cbb199	categories	Categorias	/inventario/categorias	inventory.categories.read	20	2026-08-01 15:52:14.785	2026-08-03 21:49:55.787
e6b54657-6582-4d98-9f9c-d27e82ceab85	92b2e2d5-f92e-4fba-978c-b21f20cbb199	stock	Stock	/inventario/stock	inventory.stock.read	30	2026-08-01 15:52:14.847	2026-08-03 21:49:55.788
0fae0273-9027-4c18-b394-2597bd38d58d	33364899-d547-4ced-8897-e2ed9a1cf3a7	customers	Clientes	/reportes/clientes	reports.customers.read	40	2026-08-01 15:52:14.871	2026-08-04 21:52:34.825
1516cb66-8e82-47ef-b8c3-b4b0d12a367b	92b2e2d5-f92e-4fba-978c-b21f20cbb199	adjustments	Ajustes	/inventario/ajustes	inventory.adjustments.read	40	2026-08-01 15:52:14.849	2026-08-03 21:49:55.789
f76e81e4-cbb9-4094-a1d7-c236866b76c5	0df9cd23-0080-48b2-9b44-be98841aef0d	manifests	Manifiestos	/manifiestos	operations.manifests.read	10	2026-07-31 17:32:07.571	2026-08-04 21:52:34.827
fd5b3567-46e0-49d6-9150-6fb44d7cd760	c369c46e-fb83-4e98-939d-fedf78ac6f70	memberships	Membresías	/platform/membresias	platform.memberships.read	30	2026-07-31 17:32:07.602	2026-07-31 18:02:28.111
4d950c64-2914-4f36-99c5-b7cfd2d14c96	0df9cd23-0080-48b2-9b44-be98841aef0d	carriers	Transportistas	/transportistas	operations.carriers.read	20	2026-07-31 17:32:07.572	2026-08-04 21:52:34.828
d3116c46-3e2e-41f1-8eee-237f25cb99ed	c369c46e-fb83-4e98-939d-fedf78ac6f70	organizations	Organizaciones	/platform/organizaciones	platform.organizations.read	10	2026-07-31 17:32:07.596	2026-08-04 21:52:34.777
0baafc69-9518-4719-90d4-11271e4bfe7a	21c48467-263c-4d88-b4ac-c1a84aa07e40	series	Series	/facturacion/series	billing.series.read	20	2026-08-01 15:52:14.857	2026-08-04 21:52:34.82
f8f6b815-e291-42bc-aa04-b82a813b67fc	21c48467-263c-4d88-b4ac-c1a84aa07e40	providers	Integraciones	/facturacion/integraciones	billing.providers.read	30	2026-08-01 15:52:14.86	2026-08-04 21:52:34.821
62539b6c-4a29-4554-99a8-b3c732255175	33364899-d547-4ced-8897-e2ed9a1cf3a7	sales	Ventas	/reportes/ventas	reports.sales.read	10	2026-08-01 15:52:14.865	2026-08-04 21:52:34.823
5e2056d8-52de-4fd7-b4e0-d8dc0e632b21	0df9cd23-0080-48b2-9b44-be98841aef0d	routes	Rutas	/operaciones/rutas	operations.routes.read	30	2026-07-31 17:32:07.577	2026-08-04 21:52:34.828
21cf41b9-7337-41c9-906d-7e6ca1cba63f	c369c46e-fb83-4e98-939d-fedf78ac6f70	global-users	Usuarios globales	/platform/usuarios	platform.users.read	20	2026-07-31 17:32:07.599	2026-08-04 21:52:34.779
1096b7f2-4667-4386-a13e-0e6c54763daf	c369c46e-fb83-4e98-939d-fedf78ac6f70	roles	Roles base	/platform/roles	platform.roles.read	30	2026-08-01 15:52:14.699	2026-08-04 21:52:34.78
d5d8b410-299c-4140-a100-75afd7bd3590	c369c46e-fb83-4e98-939d-fedf78ac6f70	permissions	Permisos maestros	/platform/permisos	platform.permissions.read	40	2026-08-01 15:52:14.708	2026-08-04 21:52:34.782
e0d17311-8918-4cbd-a76c-be61da3993fe	c369c46e-fb83-4e98-939d-fedf78ac6f70	modules	Modulos del sistema	/platform/modulos	platform.modules.read	50	2026-08-01 15:52:14.71	2026-08-04 21:52:34.783
2d709aa4-33f3-47be-b378-8c6706d27428	c369c46e-fb83-4e98-939d-fedf78ac6f70	activity	Actividad global	/platform/actividad	platform.activity.read	60	2026-07-31 17:32:07.604	2026-08-04 21:52:34.784
5e18d7f9-d08d-4eae-a858-7ba85cce8abe	269c2a67-b783-46cf-84b1-d78f09fb88ca	home	Panel principal	/dashboard	dashboard.read	10	2026-07-31 17:32:07.524	2026-08-04 21:52:34.788
22ecc876-8c6f-4479-aca9-50d29bfb0ec9	90cbac81-dd69-4d7d-aa87-3f9b53889220	organization	Empresa	/configuracion/empresa	settings.organization.read	10	2026-08-01 15:52:14.731	2026-08-04 21:52:34.796
524c3669-dafe-4eaf-9fb0-bf543e8a1376	90cbac81-dd69-4d7d-aa87-3f9b53889220	branches	Sucursales	/configuracion/sucursales	settings.branches.read	20	2026-08-01 15:52:14.734	2026-08-04 21:52:34.797
259422c1-6c6e-4e3a-a5d1-2456cc7149b8	90cbac81-dd69-4d7d-aa87-3f9b53889220	users	Usuarios	/configuracion/usuarios	settings.users.read	30	2026-07-31 17:32:07.586	2026-08-04 21:52:34.797
de203a5e-3592-4458-91ce-4778c10f1292	90cbac81-dd69-4d7d-aa87-3f9b53889220	roles	Roles	/configuracion/roles	settings.roles.read	40	2026-07-31 17:32:07.587	2026-08-04 21:52:34.798
5590a6af-063e-4ffa-8a23-74c0a17a76db	600bc2e8-bd84-4170-89f5-a261056f0dd1	collaborators	Colaboradores	/rrhh/colaboradores	rrhh.collaborators.read	10	2026-07-31 17:32:07.54	2026-08-04 21:52:34.801
50671869-75b6-4159-b6cf-a0b87d3ae307	600bc2e8-bd84-4170-89f5-a261056f0dd1	attendance	Asistencia	/rrhh/asistencia	rrhh.attendance.read	20	2026-07-31 17:32:07.546	2026-08-04 21:52:34.801
dd025f50-cff9-4a21-964b-c25bf1274581	600bc2e8-bd84-4170-89f5-a261056f0dd1	payroll	Boletas de pago	/rrhh/boletas-pago	rrhh.payroll.read	30	2026-07-31 17:32:07.543	2026-08-04 21:52:34.802
ddcba999-bae2-49ae-9b7e-10a3e417dbf4	a812aaf0-c471-4a8a-a2aa-d509da566725	customers	Clientes	/ventas/clientes	sales.customers.read	10	2026-07-31 17:32:07.556	2026-08-04 21:52:34.805
b60cf745-b11c-4792-9f4b-3710aeef31d0	a812aaf0-c471-4a8a-a2aa-d509da566725	quotes	Cotizaciones	/ventas/cotizaciones	sales.quotes.read	20	2026-07-31 17:32:07.558	2026-08-04 21:52:34.806
d960fb0e-b554-41bd-9afe-e8f7181b25ef	0762d095-02ef-40d8-a885-e522362b06c8	movements	Movimientos	/caja/movimientos	cash.movements.read	20	2026-08-01 15:52:14.767	2026-08-04 21:52:34.813
6bd006dd-fe92-475f-be59-4568b09f0f08	0762d095-02ef-40d8-a885-e522362b06c8	closings	Cierre	/caja/cierre	cash.closings.read	30	2026-08-01 15:52:14.769	2026-08-04 21:52:34.814
f5e2c47a-6106-439c-87c5-d448fbfda545	793c96bf-400c-4159-a384-ea5086558dae	products	Productos	/catalogo/productos	catalog.products.read	10	2026-08-04 17:07:47.421	2026-08-04 21:52:34.816
440c6483-e025-470c-b7b6-e45714d60565	793c96bf-400c-4159-a384-ea5086558dae	categories	Categorias	/catalogo/categorias	catalog.categories.read	20	2026-08-04 17:07:47.424	2026-08-04 21:52:34.817
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, "organizationId", "categoryId", sku, name, description, type, status, price, cost, "taxRate", "trackStock", "availableForPos", "imageUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductCategory" (id, "organizationId", "parentId", name, slug, description, color, "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProductStock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductStock" (id, "productId", "branchId", quantity, "minQuantity", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Role" (id, context, "scopeKey", "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt", status) FROM stdin;
c8c3853b-7d29-477c-bbf6-983e103990db	PLATFORM	platform:platform.super_admin	\N	platform.super_admin	Superadmin de plataforma	Acceso completo a clientes, catalogos base y actividad global de Kapos.	t	2026-07-31 17:32:07.683	2026-08-04 21:52:34.891	ACTIVE
084471c7-4a37-4966-9e0c-4e5d5c847ac5	PLATFORM	platform:platform.assistant	\N	platform.assistant	Asistente de plataforma	Apoya al superadmin con lectura operativa y tareas delegadas sin control absoluto de Kapos.	t	2026-08-03 21:49:55.9	2026-08-04 21:52:34.923	ACTIVE
ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	ORGANIZATION	system:organization.owner	\N	organization.owner	Owner de organizacion	Maximo responsable del cliente dentro de Kapos.	t	2026-07-31 17:32:07.711	2026-08-04 21:52:34.932	ACTIVE
0e01e874-9196-47b4-a012-8a841b2c4a58	ORGANIZATION	system:organization.admin	\N	organization.admin	Administrador de organizacion	Gestiona usuarios internos, configuracion y operacion general.	t	2026-07-31 17:32:07.752	2026-08-04 21:52:34.975	ACTIVE
70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	ORGANIZATION	system:organization.supervisor	\N	organization.supervisor	Supervisor	Controla operacion diaria y revisa resultados sin dominio total del sistema.	t	2026-08-01 15:52:15.394	2026-08-04 21:52:35.015	ACTIVE
e8d2c42b-d586-4243-bd54-4b4e8ec67bea	ORGANIZATION	system:organization.cashier	\N	organization.cashier	Cajero u operador base	Rol operativo para caja, pedidos y POS con alcance limitado.	t	2026-07-31 17:32:07.79	2026-08-04 21:52:35.03	ACTIVE
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RolePermission" (id, "roleId", "permissionId") FROM stdin;
5f59c850-b5be-400d-ba90-360e294b1d2b	c8c3853b-7d29-477c-bbf6-983e103990db	5336d594-301d-4949-a6ab-f939167765d2
3f3fc81e-66e8-43f7-8248-661d3ee4a77d	c8c3853b-7d29-477c-bbf6-983e103990db	16e0aa36-02f6-4353-8ad6-eea56dc20c25
161145ac-394a-4982-a7a5-f7d6383245f2	c8c3853b-7d29-477c-bbf6-983e103990db	0b76d156-6481-40da-aa74-01194703edd7
7598126d-55d2-4978-b662-0c5db4396c53	c8c3853b-7d29-477c-bbf6-983e103990db	ddb24f54-08bd-49fb-9c50-288e50aa2471
1718cc57-ba52-4464-8b48-a3b512f4c9c1	c8c3853b-7d29-477c-bbf6-983e103990db	7e955882-5c6c-49b7-af8d-0d2113246581
01006ee6-5d7a-43a9-bd41-417eaf3e1f48	c8c3853b-7d29-477c-bbf6-983e103990db	2be72871-8982-4286-b78c-789a913e37d7
6d55d916-b016-4249-9b40-013aea14d9a4	c8c3853b-7d29-477c-bbf6-983e103990db	0c76c55b-160e-4c23-bb9f-ea9c9f1db753
e57d1b7b-46e8-4393-99ab-23e062965251	c8c3853b-7d29-477c-bbf6-983e103990db	f3af590e-aea4-4449-9602-f45bf37df21d
29dcd7d6-3f49-4761-8707-ff28f758ca9d	c8c3853b-7d29-477c-bbf6-983e103990db	3c0f7d83-d3b4-420b-bf81-b2ade136e39e
afe31507-26a7-4f39-82f2-f6e4b51bc745	c8c3853b-7d29-477c-bbf6-983e103990db	0f5e503c-86a8-424d-9107-c72fc8ff1b80
29c78364-4016-439b-9d04-3eb7ec1893c6	c8c3853b-7d29-477c-bbf6-983e103990db	ca76d52a-f323-4ac9-b7dd-7ada284ff9bb
a8dfb651-9871-4f7f-95d5-dec6f24dc194	c8c3853b-7d29-477c-bbf6-983e103990db	4b6afbe7-ba3a-491a-93ad-bbee15e846b5
04c35568-2dc2-48bc-8170-d0985df2ed59	c8c3853b-7d29-477c-bbf6-983e103990db	5043c4ed-93eb-4838-88e5-f8dc26d36abb
f54a64e8-4dd1-4dd0-8c09-838c7548fab7	c8c3853b-7d29-477c-bbf6-983e103990db	a8db67e8-d632-4b23-bcb4-81dff8158814
f522f4dd-8fff-4a73-9868-871cd93737d9	c8c3853b-7d29-477c-bbf6-983e103990db	c11bfc62-2887-4750-8972-7ae8ce9e4b92
9f2e7880-14e4-4f2d-887f-75f534fed95c	084471c7-4a37-4966-9e0c-4e5d5c847ac5	5336d594-301d-4949-a6ab-f939167765d2
be27ba1b-9c2e-4f52-b4d3-f0df87a1061a	084471c7-4a37-4966-9e0c-4e5d5c847ac5	ddb24f54-08bd-49fb-9c50-288e50aa2471
3c953a89-b2fe-4284-8af9-b6284b8f0c8a	084471c7-4a37-4966-9e0c-4e5d5c847ac5	0c76c55b-160e-4c23-bb9f-ea9c9f1db753
5f991081-3af6-423e-bbcd-f9a4b191a44e	084471c7-4a37-4966-9e0c-4e5d5c847ac5	3c0f7d83-d3b4-420b-bf81-b2ade136e39e
79690193-e7f4-45d6-8202-ee623e5ca682	084471c7-4a37-4966-9e0c-4e5d5c847ac5	ca76d52a-f323-4ac9-b7dd-7ada284ff9bb
8d8aca05-4bb8-439b-aff6-9aa0ef1d0b80	084471c7-4a37-4966-9e0c-4e5d5c847ac5	5043c4ed-93eb-4838-88e5-f8dc26d36abb
ba64497c-158f-4bf5-b114-e3427f9d1545	084471c7-4a37-4966-9e0c-4e5d5c847ac5	c11bfc62-2887-4750-8972-7ae8ce9e4b92
82ade2cc-6e0a-45d8-8356-8403bd7c2f14	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	ebcbf8bc-3478-403d-af9d-b30b5c20644a
01f93ae4-0dfc-4519-91a1-b729a3d2036f	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	65001cd0-a4b5-46e6-851f-def8356fedb9
56cbae6d-651a-4c84-b1ff-61321a740869	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	68afc77d-47d7-472d-b008-dd24dbc9c8fb
d96391a8-1507-4e5c-9c9f-e9255289758b	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	56297163-3566-4f19-8a09-65867d24502e
4643931a-7a4a-4fa5-9b18-1b4ba93f5634	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	528f6052-356d-4d29-9df9-1318bfbe0730
65a6ccc0-1529-49ab-b5d7-96093ff8fb90	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	a6122ec0-8df0-4cee-8cee-24a2ec765000
8b46f6b7-3d44-493c-8cb1-5fc5960c7b33	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	a4dd9440-94e5-4d7f-aa01-44b8ecf0e55f
4780d20a-10c7-45b5-8e5c-cd9a0bb7718d	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	300a0b6a-3671-45fc-8f5b-443aab4a5a38
f2230aa1-9aa4-485c-9128-2a8fc3817146	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	bbaeda5e-b880-44e2-b932-192e160799d1
cd163767-f9c8-4de2-8510-5337d6a3e898	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	e574882b-dcdb-491a-aad6-c6e667f6d711
a68f0395-220d-48bc-84ef-e560df169cda	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	c2d4283c-97c1-4db7-b502-36625961505b
35f93ce1-9dea-46fc-b9e6-a693bbdacd87	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	e74ffc74-6c68-4b2f-affa-7b831889fb05
736a0f5e-1b9b-4957-9554-bbed5aeb4e02	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	62a19e0e-a967-4baa-9bce-7db137be18fa
6ba065c7-eaf7-41b7-bf20-7ab908fa8d51	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	086d4053-8c24-4af0-9831-89d0e214ea6d
e4705b33-212d-40fc-9294-b9f8f292960b	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	07089aca-38dd-4737-b587-96c1f3f5fd92
35079e3c-988e-49d1-baab-0310fd9f9049	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	cf37ab03-3194-4bbb-8a4c-7198d50fcc7c
51ba19c7-656b-43d6-96a0-c7cca93c8d0c	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	6eae1a3a-b154-4b6a-99f7-71852aa5e0a2
2c1c5e04-cdef-4f2f-8b33-258b5ba6bc68	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	346d274c-b24e-41b9-bcb5-8c92925ea2f9
88dacf34-ced1-4916-96f4-1631c4ded019	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	f4d61423-90f0-4655-a187-93683540c029
7cd675e2-32f8-4186-8be3-d273440688d3	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	b332a27a-9f45-48d2-8eeb-ac3d90714261
6dc050fe-33d6-43ba-8e52-cf5236f2cb68	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	36144b03-3b6f-41c4-9642-498b2dbbb39b
e068a50c-15be-4090-b4d4-aa8adc47540d	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	a799b798-fb15-4e17-a0ec-2d0e76a99b71
8faaa2bd-78f6-4bc8-bbf3-a6a03c8c068b	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	27aba3b9-b2ec-443f-b630-c2523e146ffd
0d863cbe-edb9-4ca9-bb75-940dc62ddae8	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	a1f1e082-4f36-4b9f-8405-d55f98e78bb8
e25aaad2-744b-40f5-bcb8-faffce571937	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	06ec265c-c511-4d9b-80d9-3feec7607a40
806d129c-c07d-45f7-a291-211ae4af4b56	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	9590bc17-6cbc-44b9-a62d-a9d6f12d403a
7d8b34d6-9549-4c3a-bb39-279053282730	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	bba8556a-5fe5-4948-9660-34436efb5445
bf3ea226-aa0c-43ec-89be-db36f7e8aa10	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	0bd3b6b0-7fe0-43b5-a71b-d7ffdfa31998
f9b51682-76a6-442b-9cb4-32337a11931e	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	a5eafffa-b0d6-485a-8e24-515371566eac
674b8802-3cac-49fd-9c42-fcdbc6d71d0f	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	5a061cdb-5050-4688-bd3f-3a9e5d23e094
e3e4cd29-9a98-4475-869b-43115790a62b	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	1fbebbff-5ecf-4203-93b0-3530aaeac89b
78fbec84-3cd4-4bbb-bce7-7d9abfd7d610	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	fd96798e-f8a6-426c-bc1b-3dcea9191823
88e91a59-7d1c-40cd-a57a-2e11e360ce6a	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	ddb978fc-42fa-4a68-af94-c3fa03620a46
9e1fc994-5648-4a61-b546-71f64c968163	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	39e64eee-569d-402d-ae89-3141e8d803f9
40fdb1c8-ce1a-480b-831b-a1573853594a	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	9ea304b5-db24-410a-8834-8e646a70ead8
279dd87b-511b-41d3-92f5-349cf4554475	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	fc54a4d6-a5b1-40b4-83fe-8fe908acea8b
7c79cb8d-e764-4450-b77e-c546fc39f6ab	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	7ea86c73-d5bb-4b0e-8bce-bc884fddd16e
f8c74479-a61d-4fa0-87f1-d009627e3125	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	81257861-8452-4de2-9649-0d6e24492a98
311ca3ff-424e-450e-92f7-48826ba13d77	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	0852e3ff-3bcd-4f0b-8a0e-38d14dbabb31
a72a305c-72b0-4372-9996-3fcda463d1e9	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	3443e466-4336-4b34-a43c-ce4eb726e1ac
2770acdf-5dbb-482e-833b-c59658016fc7	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	1f7165cd-e6d9-4e75-943f-1275023c877e
d3922c95-e43a-4a26-9fcc-1a765af756ca	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	a1eab005-8fa2-4f3b-a53d-4234cbbd7104
cf8635ea-7fa4-4f81-86a9-51c9b9f96343	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	9cabc5e9-6284-4885-b201-7b4d4dbd6088
d87150d9-93f5-468b-8634-8eab6d940055	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	cbdba807-5a17-4867-a339-abd7b2e55403
c6b1b5c9-d0d7-4d50-9ed0-db7ae3bbc512	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	e84e9e65-6805-4e60-a868-e208488ee749
fcf2242b-7dd1-4293-a379-c5ce8ac4eca5	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	bbe4fbf3-2fd2-4a8c-bf51-66c1d57c03e9
224dd7be-7386-4c73-85db-50395cd2e96e	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	b3b0e0e2-ed42-466e-8e3d-894839eb85b9
3e057b2e-fc0c-4237-b2d8-a8fdf8f76082	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	36858a42-7c84-48e6-8e04-1468d82ba4f7
472efca4-6db9-4be6-b6df-d62a2c9661a6	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	3058ffe5-816e-45b5-85f0-62123cfb4b00
9a9afc0e-84b7-4c98-8882-af1b3b4302c3	ab6d4cff-dc72-49ea-ae36-c3dfe9a2a707	21df9f92-d6a2-4d2a-99f8-148b05b87d49
bc0f9613-4bb1-41b0-ab3c-eab4d216a2df	0e01e874-9196-47b4-a012-8a841b2c4a58	ebcbf8bc-3478-403d-af9d-b30b5c20644a
f1d3cf15-ffee-4acd-b886-607338829ff6	0e01e874-9196-47b4-a012-8a841b2c4a58	65001cd0-a4b5-46e6-851f-def8356fedb9
101ba951-6eac-4e21-a83e-1c12ffa911a0	0e01e874-9196-47b4-a012-8a841b2c4a58	68afc77d-47d7-472d-b008-dd24dbc9c8fb
31108f52-b10e-46a2-81f8-3dbb188764e0	0e01e874-9196-47b4-a012-8a841b2c4a58	56297163-3566-4f19-8a09-65867d24502e
64900b15-2c93-4e9a-b0e0-d45e683590c3	0e01e874-9196-47b4-a012-8a841b2c4a58	528f6052-356d-4d29-9df9-1318bfbe0730
c3db5da4-0465-499c-946b-ca3217e2eea1	0e01e874-9196-47b4-a012-8a841b2c4a58	a6122ec0-8df0-4cee-8cee-24a2ec765000
6d268776-7ce8-40cd-a7eb-930b51103fb9	0e01e874-9196-47b4-a012-8a841b2c4a58	a4dd9440-94e5-4d7f-aa01-44b8ecf0e55f
5981220c-f19e-4cb2-8344-395c6d104d4c	0e01e874-9196-47b4-a012-8a841b2c4a58	300a0b6a-3671-45fc-8f5b-443aab4a5a38
d29b80d8-d961-455a-a330-0f4a513cdf6a	0e01e874-9196-47b4-a012-8a841b2c4a58	bbaeda5e-b880-44e2-b932-192e160799d1
25134912-5aee-4dc4-8dba-b7ffd739e816	0e01e874-9196-47b4-a012-8a841b2c4a58	e574882b-dcdb-491a-aad6-c6e667f6d711
ba4d45db-160c-4d03-b4db-45127816c9bd	0e01e874-9196-47b4-a012-8a841b2c4a58	c2d4283c-97c1-4db7-b502-36625961505b
2d039ea5-21bf-4b79-9252-f2c0ab10738c	0e01e874-9196-47b4-a012-8a841b2c4a58	e74ffc74-6c68-4b2f-affa-7b831889fb05
24bdda13-0a62-40f5-b551-6ce0a6f4426e	0e01e874-9196-47b4-a012-8a841b2c4a58	62a19e0e-a967-4baa-9bce-7db137be18fa
c84803d6-ac1c-4868-b18d-6f38179949c1	0e01e874-9196-47b4-a012-8a841b2c4a58	086d4053-8c24-4af0-9831-89d0e214ea6d
f079bd52-856c-4c26-9533-d3230e49331c	0e01e874-9196-47b4-a012-8a841b2c4a58	07089aca-38dd-4737-b587-96c1f3f5fd92
46f0e2c1-3c67-4616-94cc-fa4171f5d3cb	0e01e874-9196-47b4-a012-8a841b2c4a58	cf37ab03-3194-4bbb-8a4c-7198d50fcc7c
ace399af-3351-4d3f-896c-12c70605ffef	0e01e874-9196-47b4-a012-8a841b2c4a58	6eae1a3a-b154-4b6a-99f7-71852aa5e0a2
a8e17a1f-9dcf-4f50-9a44-50f06e81f900	0e01e874-9196-47b4-a012-8a841b2c4a58	346d274c-b24e-41b9-bcb5-8c92925ea2f9
246c7e3f-f4cc-4b2e-9181-682fa951f997	0e01e874-9196-47b4-a012-8a841b2c4a58	f4d61423-90f0-4655-a187-93683540c029
5859f8f6-15cc-454c-9e33-afd637f5b9e2	0e01e874-9196-47b4-a012-8a841b2c4a58	b332a27a-9f45-48d2-8eeb-ac3d90714261
029a98ea-d47d-46d4-9bb9-c80cf39c51cd	0e01e874-9196-47b4-a012-8a841b2c4a58	36144b03-3b6f-41c4-9642-498b2dbbb39b
298fbbfd-2c04-465d-ac6d-284e9f1c26ac	0e01e874-9196-47b4-a012-8a841b2c4a58	a799b798-fb15-4e17-a0ec-2d0e76a99b71
f7559cdc-be4b-4f3b-a137-c35db0fe98dd	0e01e874-9196-47b4-a012-8a841b2c4a58	27aba3b9-b2ec-443f-b630-c2523e146ffd
5b10b239-279e-4a76-954b-4210b01d893e	0e01e874-9196-47b4-a012-8a841b2c4a58	a1f1e082-4f36-4b9f-8405-d55f98e78bb8
68aa100c-c726-4d7e-a3db-08e5f66a589b	0e01e874-9196-47b4-a012-8a841b2c4a58	06ec265c-c511-4d9b-80d9-3feec7607a40
b049de91-f47f-4f00-aa7d-cfa5eb061f8f	0e01e874-9196-47b4-a012-8a841b2c4a58	9590bc17-6cbc-44b9-a62d-a9d6f12d403a
153b6244-6e10-4bc5-b435-33ff84967a70	0e01e874-9196-47b4-a012-8a841b2c4a58	bba8556a-5fe5-4948-9660-34436efb5445
beb27724-be2c-4e0a-a7fc-15b03fcd1dbf	0e01e874-9196-47b4-a012-8a841b2c4a58	0bd3b6b0-7fe0-43b5-a71b-d7ffdfa31998
2230e1fd-9b4f-4a7c-81f4-821f4b4f8a93	0e01e874-9196-47b4-a012-8a841b2c4a58	a5eafffa-b0d6-485a-8e24-515371566eac
ba2f7506-6a80-4ace-9c47-4ef7a81f706d	0e01e874-9196-47b4-a012-8a841b2c4a58	5a061cdb-5050-4688-bd3f-3a9e5d23e094
d052f247-fb21-47e4-b7a6-b3cb3782e940	0e01e874-9196-47b4-a012-8a841b2c4a58	1fbebbff-5ecf-4203-93b0-3530aaeac89b
dc7fe6ad-2665-4947-9e33-cbb58eaa9c65	0e01e874-9196-47b4-a012-8a841b2c4a58	fd96798e-f8a6-426c-bc1b-3dcea9191823
4ef63922-3055-4ede-98ea-750478065ec0	0e01e874-9196-47b4-a012-8a841b2c4a58	ddb978fc-42fa-4a68-af94-c3fa03620a46
36654eec-5dee-4a5c-87a6-726eb79df987	0e01e874-9196-47b4-a012-8a841b2c4a58	39e64eee-569d-402d-ae89-3141e8d803f9
79c9e4a9-42f6-45ca-99e8-0857e6d7b963	0e01e874-9196-47b4-a012-8a841b2c4a58	9ea304b5-db24-410a-8834-8e646a70ead8
017ce6c5-4e0f-43a5-a35c-dc592b373913	0e01e874-9196-47b4-a012-8a841b2c4a58	fc54a4d6-a5b1-40b4-83fe-8fe908acea8b
532a3f98-a597-47e3-89b0-ac4ef07a375a	0e01e874-9196-47b4-a012-8a841b2c4a58	0852e3ff-3bcd-4f0b-8a0e-38d14dbabb31
55659a89-404b-40eb-b09a-97db616155db	0e01e874-9196-47b4-a012-8a841b2c4a58	1f7165cd-e6d9-4e75-943f-1275023c877e
07e2d145-855e-4964-b793-7e66f675ccdf	0e01e874-9196-47b4-a012-8a841b2c4a58	cbdba807-5a17-4867-a339-abd7b2e55403
16b28958-e138-4841-b1f5-bf12e05cd4b8	0e01e874-9196-47b4-a012-8a841b2c4a58	e84e9e65-6805-4e60-a868-e208488ee749
36642be0-4062-4047-9996-abb21411ec88	0e01e874-9196-47b4-a012-8a841b2c4a58	bbe4fbf3-2fd2-4a8c-bf51-66c1d57c03e9
c786e700-8741-4347-98ca-53b719d80ea0	0e01e874-9196-47b4-a012-8a841b2c4a58	b3b0e0e2-ed42-466e-8e3d-894839eb85b9
53c822e2-9c22-45a7-af16-5395f50647b8	0e01e874-9196-47b4-a012-8a841b2c4a58	36858a42-7c84-48e6-8e04-1468d82ba4f7
97af1e89-1355-4c2e-b1fb-79b8539494af	0e01e874-9196-47b4-a012-8a841b2c4a58	3058ffe5-816e-45b5-85f0-62123cfb4b00
ced94c02-02d0-4419-a8ee-f76cd1a9d9f5	0e01e874-9196-47b4-a012-8a841b2c4a58	21df9f92-d6a2-4d2a-99f8-148b05b87d49
0065858a-3c13-41bd-8d28-922cd3c72967	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	ebcbf8bc-3478-403d-af9d-b30b5c20644a
cbee453b-c225-4269-81a4-0fda3d1c9048	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	086d4053-8c24-4af0-9831-89d0e214ea6d
9ada74a7-c1f6-4230-bd0d-4a7b44e8d4f0	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	6eae1a3a-b154-4b6a-99f7-71852aa5e0a2
aa897bfa-e08e-4af9-a07a-eeb7fe1909a4	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	f4d61423-90f0-4655-a187-93683540c029
fe339254-92f5-47bb-88dd-f4d798db9e37	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	36144b03-3b6f-41c4-9642-498b2dbbb39b
c38f88d6-c6a4-4da7-8384-bcf1f8d182ed	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	27aba3b9-b2ec-443f-b630-c2523e146ffd
71243033-cd5a-42f4-8045-635a3e79cb1b	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	a1f1e082-4f36-4b9f-8405-d55f98e78bb8
1f738434-4f20-44c2-be87-4cec21be3a00	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	06ec265c-c511-4d9b-80d9-3feec7607a40
422b0797-8b9d-4908-abf6-c8269c29fd84	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	9590bc17-6cbc-44b9-a62d-a9d6f12d403a
abf48690-8de2-4897-8e45-6b6a9f95cdd0	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	0bd3b6b0-7fe0-43b5-a71b-d7ffdfa31998
a0a1d987-46e8-4088-95a1-459b3ec17579	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	5a061cdb-5050-4688-bd3f-3a9e5d23e094
615f0fdb-04b8-4e82-8660-42bc963ec5fa	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	fd96798e-f8a6-426c-bc1b-3dcea9191823
f0424201-b428-4749-91e9-d563dca1db69	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	39e64eee-569d-402d-ae89-3141e8d803f9
97f76fc7-f870-4242-a939-2b32e85e5a43	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	fc54a4d6-a5b1-40b4-83fe-8fe908acea8b
cfe89328-122e-4bcf-ba4d-3d0987dd7f17	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	cbdba807-5a17-4867-a339-abd7b2e55403
20dc53dd-b614-42c1-b696-79fe92d49d5b	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	e84e9e65-6805-4e60-a868-e208488ee749
8fa9107d-93c1-4b94-adbe-b80495f3f760	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	36858a42-7c84-48e6-8e04-1468d82ba4f7
84ad0c85-c9ce-480f-bf95-b07488e87a7c	70a5dcd7-ad1b-4f0d-8732-86d48443e7e8	21df9f92-d6a2-4d2a-99f8-148b05b87d49
7d1a7bdb-fdea-4799-b4f6-80a7df626725	e8d2c42b-d586-4243-bd54-4b4e8ec67bea	ebcbf8bc-3478-403d-af9d-b30b5c20644a
4dede2eb-584e-40b6-9110-384b450f05f0	e8d2c42b-d586-4243-bd54-4b4e8ec67bea	f4d61423-90f0-4655-a187-93683540c029
3cd3d66a-449e-4e9b-8c55-9de655f48dde	e8d2c42b-d586-4243-bd54-4b4e8ec67bea	27aba3b9-b2ec-443f-b630-c2523e146ffd
f464b113-edf8-4c83-a39d-1f64b76b08e6	e8d2c42b-d586-4243-bd54-4b4e8ec67bea	a1f1e082-4f36-4b9f-8405-d55f98e78bb8
f38a808e-d716-43ef-a378-33221da658cc	e8d2c42b-d586-4243-bd54-4b4e8ec67bea	06ec265c-c511-4d9b-80d9-3feec7607a40
26f208b1-c289-456b-9359-ad903143ebad	e8d2c42b-d586-4243-bd54-4b4e8ec67bea	9590bc17-6cbc-44b9-a62d-a9d6f12d403a
221fa9dd-4ece-4b55-89dd-dd16908bce0a	e8d2c42b-d586-4243-bd54-4b4e8ec67bea	bba8556a-5fe5-4948-9660-34436efb5445
fdf96199-cbfe-4408-bf98-1c224c767a1f	e8d2c42b-d586-4243-bd54-4b4e8ec67bea	0bd3b6b0-7fe0-43b5-a71b-d7ffdfa31998
b1335adf-0a5f-46a8-92ae-92f84c1d8a6a	e8d2c42b-d586-4243-bd54-4b4e8ec67bea	a5eafffa-b0d6-485a-8e24-515371566eac
d0f77608-8bb0-41ba-bcc8-eb3f11501d0b	e8d2c42b-d586-4243-bd54-4b4e8ec67bea	5a061cdb-5050-4688-bd3f-3a9e5d23e094
ea2075b7-56e7-4349-8340-559eea58cedf	e8d2c42b-d586-4243-bd54-4b4e8ec67bea	1fbebbff-5ecf-4203-93b0-3530aaeac89b
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "userId", "refreshTokenHash", "expiresAt", "revokedAt", "createdAt", "updatedAt") FROM stdin;
ac5585eb-79bf-4e2d-b803-609a7ca832e6	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$X4lsYfMI5aKxXclBLKyC0.olFhY32SsXns/Kjszd7sxPJGSsz5TH6	2026-07-29 17:13:11	2026-07-22 17:20:08.323	2026-07-22 17:13:11.393	2026-07-22 17:20:08.324
ab49e64d-c87e-4c8e-b779-a21cf060d804	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$NoNsZ5GJZgXY58KsmqURkulKoaFlDnWZhXd.cmM35rLNug.hYw4Zq	2026-07-29 17:20:08	2026-07-22 17:20:09.258	2026-07-22 17:20:08.614	2026-07-22 17:20:09.258
1ea047b9-1ece-4631-8fe1-dac5733b6240	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$zxseNJCp33qzAZaM0.qCPeLwyq4rStn849Ho9L2Sax1PCCKaH7BRy	2026-07-29 17:20:09	\N	2026-07-22 17:20:09.572	2026-07-22 17:20:09.572
e9f9d9cb-bc64-4495-88dc-071307da464e	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$oo.B2bmNifZYzYhV.BYI5eSfJnViT6YAWFmSd5Mr0bJTDICGVJSza	2026-07-29 17:20:26	2026-07-22 17:20:49.507	2026-07-22 17:20:26.651	2026-07-22 17:20:49.507
b1d5047e-90b3-4a8f-961c-cfeddf448cb2	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$Pi3W6XMMuRbq8A0wemVY1uYHNvCdeWZ9mFSfGReQrr.nOLzwTAO1q	2026-07-29 17:20:49	2026-07-22 17:24:19.451	2026-07-22 17:20:49.788	2026-07-22 17:24:19.451
f7babb10-c3d9-48ed-9868-83bff0f2c50f	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$Tx04wa1mmm31WSqXTgrYPOhG/KwBfsKh4uD/TNOCMrstttQYKA86W	2026-07-29 17:24:19	2026-07-22 17:34:00.175	2026-07-22 17:24:19.737	2026-07-22 17:34:00.175
619b19dc-6101-4df1-a0e6-66f75f2147e6	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$q9MD3i/YxFx.56hu.O8pEu/QtrbG.M7St.qdI7Ox7Jjjf.O0BhHtS	2026-07-29 17:34:00	2026-07-22 17:35:29.506	2026-07-22 17:34:00.583	2026-07-22 17:35:29.506
b333097c-0f14-4c56-8abe-a0b4465c66d4	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$Wf8Y5ic9SvvqSKU7r4UsCeKpInQCS8ACKfENNkEqzymBUaNvigCS6	2026-07-27 17:54:40	2026-07-20 18:59:57.263	2026-07-20 17:54:41.188	2026-07-20 18:59:57.27
5bfb3eb0-94ef-436f-9d42-09ed300910b3	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$WsaFg2e3Ml7lq6sUmDNwT.jJUrgBF.MbU.BVC0GJn/ghmgrdX.DAi	2026-07-27 18:59:57	2026-07-20 19:00:38.075	2026-07-20 18:59:57.572	2026-07-20 19:00:38.075
9993df93-6a65-42e0-9c87-4fba2843f2f9	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$smrXELrqa8O2ZI6tDo5mCetMO7xhmSZh.7SevjoEXFU/Fxi5NW2o2	2026-07-27 19:01:10	2026-07-20 19:03:14.784	2026-07-20 19:01:10.836	2026-07-20 19:03:14.784
25829d35-5aef-4af7-b0cf-7e83253bc675	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$djN1FbsdNIpgQQn8rrLWcOHNgzfrQIdhSdwWRtijOBlumD1K36p1e	2026-07-27 19:03:22	2026-07-20 20:24:12.829	2026-07-20 19:03:22.834	2026-07-20 20:24:12.84
151172a0-6707-471f-8a4c-a2afa65f87a9	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$9Cky4MkwJtYgFr5BHieBOea7Mtrth8iAlpcFC0FIpZXbKgW9j.3O.	2026-07-27 20:24:12	2026-07-21 21:06:24.749	2026-07-20 20:24:13.276	2026-07-21 21:06:24.76
37ecfab5-7d97-44ce-91ae-471782b72bb7	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$Mf4sFbMdz2duYRirPbS9FOaPWhW5nAoa8m5/L513XzeTXTuYCdkni	2026-07-28 21:06:24	2026-07-22 15:11:03.503	2026-07-21 21:06:25.078	2026-07-22 15:11:03.515
e371ee19-9b53-4bb5-b87d-cc96c1b384c3	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$WqBCwyNsGndZEt10pkUDoeNQfSXMLBzzNYwr.0qOLKQ8OunYoYrVS	2026-07-29 15:11:03	2026-07-22 17:13:07.912	2026-07-22 15:11:03.891	2026-07-22 17:13:07.912
3beb83e9-3b34-45f8-9d19-48bc1dd67498	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$K6coB3Ne4UxEvEyC4gv01uy0r6degVBQs1DQQui1xRgW9jn7S6cd2	2026-07-29 17:13:07	2026-07-22 17:13:09.845	2026-07-22 17:13:08.206	2026-07-22 17:13:09.846
80c20d99-78ed-495d-b9d5-9d62651df351	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$9i9cPdHiYGeSdAOhOt3V/ONCRDVno.LwVEEKdvyhgGWxXijV6N1ni	2026-07-29 17:13:09	2026-07-22 17:13:11.111	2026-07-22 17:13:10.121	2026-07-22 17:13:11.111
6ded1698-2b37-4855-b5c6-89673ad67117	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$sRu8gu0m.Ep9.2STwrjU/eOxcgH/vT1wvBzCiknrVt/a0.4mZp4jG	2026-07-29 17:35:29	2026-07-22 17:38:36.64	2026-07-22 17:35:29.784	2026-07-22 17:38:36.64
d5152934-8e8e-4450-8066-13f6f1f60483	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$IgOx3p8ljYfoGbCttvfpDujluEsK.blP9XaLaSzX7zo2J.IMyqsUC	2026-07-29 17:38:36	2026-07-22 17:38:56.076	2026-07-22 17:38:36.918	2026-07-22 17:38:56.076
fe830bd0-0613-49d0-9e8d-c95ee622429f	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$O46WLUXDFO.8.1.Hi8rnOeWKBmhc1RKuofywICvLuGgqkR3U4P66K	2026-07-29 17:38:56	2026-07-22 17:50:52.109	2026-07-22 17:38:56.365	2026-07-22 17:50:52.11
331f9039-d7e5-41fc-beac-2ce01ff3c3a4	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$iJvUeAtug0k5rpBxFAGlb.7HDz48B8W1Lzy0lbt6090ivZT2TpaBm	2026-07-29 17:50:52	2026-07-22 17:52:30.816	2026-07-22 17:50:52.408	2026-07-22 17:52:30.816
5c9d8e96-47c2-44a8-a2f9-7a0596cc46fc	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$tnObSEUgovrryt9CjMXBsOKvtd3LFYd3x86ueWrP1lhP/g73EOQfa	2026-07-29 17:52:30	2026-07-22 17:53:56.867	2026-07-22 17:52:31.28	2026-07-22 17:53:56.868
fe5debde-c058-4b6e-bd22-b23f1cd536e4	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$8AXjLv3.Rg7w5C19jOuthOyX9CeJlBOYHKrOhe71ymfYdIihZnFjm	2026-07-29 17:53:56	2026-07-22 17:54:26.101	2026-07-22 17:53:57.173	2026-07-22 17:54:26.102
2b9b5e3d-03ce-4235-afac-16d271ac29c4	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$yNOEl6c1i6x72kFMLRftPuI8MgFrBgSKBe62bGwMgUqIKtTWKwMYW	2026-07-29 17:54:26	2026-07-22 17:57:10.132	2026-07-22 17:54:26.639	2026-07-22 17:57:10.155
0b4a775b-ecf9-4a71-948f-63f4d6462f0f	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$/knhqgkh4yCV9tFazzgHWeUpK.8pNnNlSfn5YrUABP5nbx9rcf4im	2026-07-29 17:57:10	2026-07-22 18:01:44.457	2026-07-22 17:57:10.575	2026-07-22 18:01:44.457
af397592-b30d-43ef-9b75-566808936059	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$jECUWxBN/8akbphwZDa5mu3x5GZrkfN1tEkdpDkqRd9yjqB9YHMia	2026-07-29 18:01:44	2026-07-22 18:02:35.795	2026-07-22 18:01:44.753	2026-07-22 18:02:35.795
9685bce9-438e-43fd-8e56-bd33a5d1fcff	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$zjDmAcgl2K9UmcXL6L90RefK3SHFepPwPdU6by.vwiinfLLxnva6G	2026-07-29 18:02:35	2026-07-22 20:09:00.108	2026-07-22 18:02:36.276	2026-07-22 20:09:00.109
4b604c8e-5870-4585-9ab5-eb268ab2d0f6	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$8N3qxlBixnigCknukxJAFO30vFUbmTFy/CiOHKiLZlKV2Anjz0tB6	2026-07-29 20:09:00	2026-07-22 20:15:06.545	2026-07-22 20:09:00.409	2026-07-22 20:15:06.545
cd084f48-9e4a-4d88-a984-461b58b26fa9	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$PxGPQEBVh.GCpb6YY.P47uqmRiwtDOXQC0H725YfMWHxf9HFcNwLu	2026-07-29 20:15:06	2026-07-22 22:17:38.693	2026-07-22 20:15:06.853	2026-07-22 22:17:38.701
5d385a43-9e70-4e3d-8020-3f72d3e92c1c	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$q8WytLB92eA6VyEVrd5BNOFCBwPcGy/HvK6Q9pESeorSP5qRfX7OW	2026-07-29 22:17:38	\N	2026-07-22 22:17:39.062	2026-07-22 22:17:39.062
7639d7f5-bf96-45d5-a702-01d9a8eea199	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$7xsOVLhaFbYObcIfHJJhz.3Sij1qJ/Nbc./WH8kc/dgfTR4h5pDGC	2026-07-30 22:30:11	\N	2026-07-23 22:30:11.489	2026-07-23 22:30:11.489
ef6d002e-a4ec-4721-a12f-2c7ee192970f	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$XIKUdtW8bdROvAcW3aA6vuNXKT9rj6Iiw80we1rXFcKX.F4Rws.Gu	2026-07-31 14:33:01	2026-07-24 14:37:26.882	2026-07-24 14:33:02.015	2026-07-24 14:37:26.885
42a56837-5176-4ab6-93b0-b6545a3b1c6a	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$tJEUtMQ6iKqu7n0dxNCLROum8CKNDUEbUJwOEsEOuWVgmliE0WTKm	2026-07-31 14:39:40	2026-07-24 14:39:42.259	2026-07-24 14:39:41.091	2026-07-24 14:39:42.26
db6ebaa5-0eed-46bc-930d-c3f03341b0f0	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$U3wWLHNG18uyORhP1KVZUeD4vM72bB7qcAHprIur9L44ypBlvSleq	2026-07-31 14:37:26	2026-07-24 14:38:18.412	2026-07-24 14:37:27.381	2026-07-24 14:38:18.412
04947015-1c68-4c2c-a919-f99e0f4d5559	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$iP2.f/bPZ5tWtGRDiAEZ1uAnKFzosgzuZolcPhEgjxR6vUFzxJb7W	2026-07-31 14:38:18	\N	2026-07-24 14:38:18.998	2026-07-24 14:38:18.998
c4e62747-3b5b-4e5e-9dce-9a1f14503e0d	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$CjxH7j9gLuUjFhzsNTcwIuccYoV864MpdVatSIuQRZ1K8Uws4qsMC	2026-07-31 14:39:42	\N	2026-07-24 14:39:42.679	2026-07-24 14:39:42.679
e7e0da6c-8d41-49f6-9536-4a5a266cb61e	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$/dA86f4.gLSXZdmWlREX7uRQzW4/RCZ1P5Hi/qMjTLJP7KfyVDWA2	2026-07-31 14:38:18	2026-07-24 14:38:40.322	2026-07-24 14:38:19.151	2026-07-24 14:38:40.322
bcec73c1-e869-4bc8-bd6b-3d09b0e8b619	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$NOiNQFngpJVMW/hLbVzY9u3RSDlDzElX9J3CFy8M664FlhEkJmqvm	2026-07-31 14:38:40	\N	2026-07-24 14:38:40.879	2026-07-24 14:38:40.879
f572dd3f-059f-42b7-89a3-6b42e356e86a	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$LmbBxQFXT8.fF5mIKXzgoeFWLu2Rgz6sZfGNDMZYc7njQryfUgXcy	2026-07-31 14:38:40	2026-07-24 14:39:34.737	2026-07-24 14:38:41.042	2026-07-24 14:39:34.737
7790f90f-b5e5-4402-ab34-f3e2bab6e187	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$POfRxeJyfgUuwjWcoZbJY.Mb/KYaNGUrOFlH7R95sqKiuUD/YJzl6	2026-07-31 14:39:34	\N	2026-07-24 14:39:35.449	2026-07-24 14:39:35.449
0bfd2441-5d83-4b46-868a-90dd461cd26d	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$USUr8VtAcgiz6badfD/O8uxrPNA/DEZYg0Eeb9D.7e3U8Zw5FA3Ny	2026-07-31 14:39:34	2026-07-24 14:39:40.625	2026-07-24 14:39:35.55	2026-07-24 14:39:40.626
1e13c98e-d870-4acb-8273-a345aa2e2ee8	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$rLWqKS8vn7bVAv1GAudo2u.dNUn4mwT64KIXAGWxZJiz9eCI48Cfy	2026-07-31 14:44:50	2026-07-24 14:52:30.887	2026-07-24 14:44:50.375	2026-07-24 14:52:30.887
d3ccf123-7cd4-46eb-964f-8c1d19957f33	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$3ZSDsFdMDGyX22wc4XhVuuOSf/x5Hb/NlIBFy.vpTCda5YJA5ydEe	2026-07-31 14:39:53	2026-07-24 14:43:11.041	2026-07-24 14:39:54.12	2026-07-24 14:43:11.041
43261b75-52d2-4555-84a2-6e9fb3d3773b	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$jHXVle4ja8CVGIhCrsYXHO88ibg6YNpHdakTBbnyzVzxmFPyxr9T2	2026-07-31 14:43:11	\N	2026-07-24 14:43:11.509	2026-07-24 14:43:11.509
aa496608-28ae-4b14-9edd-f87975e7509b	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$uZ88d.AOUF/hYuw5StF.6uIE1SaR/rViL/mYmN1UelDDx/5Grcnym	2026-07-31 14:43:10	2026-07-24 14:44:36.66	2026-07-24 14:43:11.143	2026-07-24 14:44:36.661
cf74c68d-2678-4f22-98df-16f00e16c681	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$Y20t9jYZvgYJjsVIaUfOm.tuuyEEJKg/z3lEaE/7Jv1yLEekkUSRi	2026-07-31 14:52:30	2026-07-24 14:52:57.041	2026-07-24 14:52:31.291	2026-07-24 14:52:57.042
1ef66c33-f298-4a45-8280-7b120efd802d	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$zDzm7Oz3VeGVCFyRHCYuJuYwVbvmgFNSDWYLZ9tU69/G6JTJLoO7a	2026-07-31 15:21:43	2026-07-24 15:24:17.013	2026-07-24 15:21:44.004	2026-07-24 15:24:17.013
885601ec-7009-4b47-a659-99dca1b0512c	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$EBu1/C5xlPGF/M3sTc.SB.TKxk2Ih7TWO.d9w/I9Kl3H3n3XrcV3W	2026-07-31 14:52:57	2026-07-24 15:21:42.907	2026-07-24 14:52:57.449	2026-07-24 15:21:42.907
82bb2db2-d92b-47cd-8ddc-93be88b334f2	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$hHxvF/X2GkWEWYnE0HXROuWJjMctJ1uzELGHJM3SzqCIgeGNIRHCW	2026-07-31 15:21:42	\N	2026-07-24 15:21:43.785	2026-07-24 15:21:43.785
04ea0b64-b86f-4be5-b764-0023dd022915	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$JehoQ4AdicD.fFPyxasjtecgEc0N5.VyUoQduoSU4mALrKB5NBzVa	2026-07-31 15:24:17	2026-07-24 15:30:38.852	2026-07-24 15:24:17.338	2026-07-24 15:30:38.852
6a529965-17fb-442e-bcc8-b0f26f3862f0	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$.kZEcemVVN72k6fMcPEub.CSmy3zVklGx.JBYoqgQgKkZVVc9Ide.	2026-07-31 15:30:38	\N	2026-07-24 15:30:39.619	2026-07-24 15:30:39.619
a74277a7-b463-45bc-ae85-31d2e25dee6a	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$qqAHvjoD9u3F0y5llwpC5e6dPnxEJbwv2.6SmRla9xdvcuKdv/qYa	2026-07-31 15:30:39	2026-07-24 15:32:48.978	2026-07-24 15:30:39.751	2026-07-24 15:32:48.978
a9d5dcb9-9e39-4a06-a2c9-c5a043ff1b28	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$2lV0d.VLoSRRj3kfi/3TDuPWbpORL7dJupFm0fIoI8x/cx9TAAgV.	2026-07-31 15:32:48	2026-07-24 15:33:26.361	2026-07-24 15:32:49.282	2026-07-24 15:33:26.361
afb24de2-f44f-4184-bee6-85c84e73f987	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$wgwf3NTgrvAG7jceozG32.Eq4fWOiBQGrkbkIa/s68VFwCl4pLzPm	2026-07-31 15:33:26	\N	2026-07-24 15:33:26.784	2026-07-24 15:33:26.784
0406acb9-18b7-4b17-a23f-f468121ad893	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$fJtIYshp0R9PHisYrPWULeG/SIhKHalDKOgwD9i9LsM.7pRAZYf5i	2026-07-31 15:33:35	2026-07-24 15:39:09.283	2026-07-24 15:33:36.158	2026-07-24 15:39:09.284
f9cfba95-634e-441e-a8ab-7f28443b61cb	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$eq4pLfFYPBGIF2AAfICw4.nIyz2fb1EA2JjCGAuewqrNVFrqBbvcW	2026-07-31 15:39:09	2026-07-24 15:59:58.509	2026-07-24 15:39:09.77	2026-07-24 15:59:58.51
682defc2-bf09-4b2e-8978-243bad930be0	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$.RxRwVJ41.guc8Y/o7ivtOXrCcShHtdISfx38uybjW8hqdCzf0cvK	2026-07-31 15:59:58	2026-07-24 16:00:01.109	2026-07-24 15:59:58.865	2026-07-24 16:00:01.109
d9e597f9-0cfa-4fdd-9cb7-19e097c94cfc	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$RrPDkF.rTj6kS6vJLJN.yOMjzhbwWFw0/aYbCIqBlkUv06M0LJO0e	2026-07-31 16:00:01	2026-07-24 16:00:04.254	2026-07-24 16:00:01.443	2026-07-24 16:00:04.254
fdcd1699-c6d9-4966-9d65-1215bbbdd699	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$V3jDFl3tD1ztTboa6dPWxuPwh5g0ERvy3z.fm6G2gWmq9JXeqThA.	2026-07-31 16:00:04	2026-07-24 21:52:52.609	2026-07-24 16:00:04.533	2026-07-24 21:52:52.624
7ac364af-de0b-42f5-bd6c-3c8801d34084	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$MYq0GMXFRYQzbHZ5hGx7LOJSIiN.JR05JM7ciBAISllTXj7/KiLTO	2026-07-31 21:52:52	2026-07-24 21:52:56.583	2026-07-24 21:52:52.948	2026-07-24 21:52:56.584
510a2383-db9d-4e78-a084-3a516ed8533f	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$okyTaM1ZwtcBqFOcJ217uuhf0a1uTtKCE7O8tbddgT/lS162Mh/P6	2026-07-31 21:53:06	2026-07-30 14:02:17.324	2026-07-24 21:53:06.672	2026-07-30 14:02:17.339
4772718c-d4ed-4c19-9140-3070ee4e68fe	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$yix7lWkz33V5SbC3mC2Lpul9O/tt0zqlaWqH9UUwN2ynWwKMtP7Ti	2026-08-06 14:02:17	2026-07-30 14:29:17.86	2026-07-30 14:02:17.654	2026-07-30 14:29:17.866
da8a87c1-6df5-4a1a-8625-804b2fc9aca8	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$iFx7FxqWd/gocrNz9wzfEeI1IdA/4zpv3ltu220MnMjG8MlEnFDvy	2026-08-06 14:29:17	2026-07-30 14:29:25.86	2026-07-30 14:29:18.158	2026-07-30 14:29:25.86
dcd597a0-e33f-4aa4-a213-a629844c747c	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$MO.TMobgSkE0iUBPR3tMPe6GRdg7ctV6pyxNfvYwgqsaV7G.J/.te	2026-08-06 14:29:25	2026-07-30 14:29:28.11	2026-07-30 14:29:26.139	2026-07-30 14:29:28.11
4f04da76-a245-40bd-b4c9-7099425636fe	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$/kQPZ65t868/64wW1cLcMOc9S/fZ0iwmIE5A2tabPL/3Ea8vHOGUe	2026-08-06 14:29:28	2026-07-30 14:29:29.692	2026-07-30 14:29:28.382	2026-07-30 14:29:29.692
186c1d60-83a3-4748-9e3b-fcc67f2b7959	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$WJoYmalNI9Hb3Q1xkYU11.a1D9xrkWMWHRBBYMbL8Kxp.HjNyMCLy	2026-08-06 14:29:29	2026-07-30 14:29:30.904	2026-07-30 14:29:29.966	2026-07-30 14:29:30.904
19b5a1e8-d106-476a-a158-0a14a6c1f3a9	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$a3FHJ321LjBSS6G1iRDU8uu.EYixHxHEXuJzRYKTYDJIx2wakTpG2	2026-08-06 14:29:30	2026-07-30 14:56:39.546	2026-07-30 14:29:31.174	2026-07-30 14:56:39.547
a46f2319-2c59-4b76-8465-21cf48c6b502	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$uW6Em0JD4nua31LPqOOEJ.MOI3P/RHDQUp2TR8jJ5jgtNRXmaIUmC	2026-08-06 14:56:39	2026-07-30 21:26:49.455	2026-07-30 14:56:39.837	2026-07-30 21:26:49.456
8e9261ee-4830-4f15-881c-34175f2bd178	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$izbawQPNGwkLpXLZHaHTBeWq1FkG20gvB1BwGsqYCKkmGFKSI0pGe	2026-08-06 21:26:49	2026-07-30 22:21:52.695	2026-07-30 21:26:49.759	2026-07-30 22:21:52.695
36d964e1-c51c-4897-a1af-3acbabf9570b	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$9B42RvcSJM67BSszlEpG9uB4Z4WFc1ltSanfZYHmnD/odSz03SP2y	2026-08-06 22:21:52	2026-07-30 22:22:13.872	2026-07-30 22:21:52.996	2026-07-30 22:22:13.873
c80e0426-ee86-4f59-9010-1de15be2d3aa	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$SauTrugxoU2RlBibsMRY3.UpdgumlNhy5BYA1CmyHaRj221DLF8KG	2026-08-06 22:22:13	2026-07-30 22:22:23.679	2026-07-30 22:22:14.147	2026-07-30 22:22:23.679
00fbf80e-852b-47c8-92b1-f7b4ed43999b	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$Yk1neS3DTYkxni4u0/HDT.4F3L/cdT6xwr01cYD/ecMXQMZMRBoMK	2026-08-06 22:22:36	2026-07-31 17:54:35.208	2026-07-30 22:22:36.738	2026-07-31 17:54:35.218
66256b20-9ac9-437f-9ab3-ef7e75e2d7ab	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$maZC0q8Tk1Ycq7L3a/JxyOAONyB6AqeCRFhm2ZpvPD0SMCUCbE3lW	2026-08-07 17:54:35	2026-07-31 17:54:55.095	2026-07-31 17:54:35.52	2026-07-31 17:54:55.095
d8af668d-c196-4d73-b3ec-eaee608917c4	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$ORFUqDWxxMqVJ1uaA6ijcuQR7jMZEtIxXBdFo/r.fwP2JuNzJO.6K	2026-08-07 17:54:55	2026-07-31 17:57:02.354	2026-07-31 17:54:55.374	2026-07-31 17:57:02.354
eb0a87f9-effd-4c0d-b1a7-5330889304d3	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$Q5/6hlflPu8CYVuSWoY1D.VGnCs/h24AkWTnc7AWn.oNDRG0kK.Ki	2026-08-07 17:57:02	2026-07-31 17:57:05.454	2026-07-31 17:57:02.632	2026-07-31 17:57:05.454
942d7cb4-ea97-4ab1-ad71-22e1bb6fee45	49e65655-a6bb-4f9b-bfcc-a1c57831852f	$2b$12$VeKV9HSiDHuzO/LUxivb9..KV.g5sYKSN5azsiFEUcgh6rHmGj51e	2026-08-07 17:57:05	2026-07-31 17:57:10.408	2026-07-31 17:57:05.728	2026-07-31 17:57:10.408
0415bbd2-f24b-410e-b4e9-da79f15e00bf	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$aSxevCMpxzVOersHpJz7Ae2m4jySzJN/djYOyq97h68wZ16dysMIq	2026-08-07 21:00:35	2026-07-31 21:00:47.614	2026-07-31 21:00:35.428	2026-07-31 21:00:47.615
b18bda39-d5d0-4022-9090-1c1d1650d147	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$U6QWk9luIssCt.SSeEBpUu0CyVPf6y.JxYKgvRIe/B6CZw2cwewQq	2026-08-07 17:57:19	2026-07-31 18:03:02.985	2026-07-31 17:57:19.659	2026-07-31 18:03:02.985
71506f43-8609-4a0a-94aa-1d7ffa9d631e	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$u3JM.asNWNngPfVRfhDegun3VaIN/6czJ9q4uw5czcDYtLoJH.K7O	2026-08-07 18:03:02	\N	2026-07-31 18:03:03.366	2026-07-31 18:03:03.366
97691b9b-c418-415d-addf-b584c1c06653	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$9m2i93kdxQnnQQfMXH58K.s6a1bdykXKFwDRa0c7tvOEVPnKnjWXW	2026-08-07 18:03:03	2026-07-31 18:09:10.811	2026-07-31 18:03:03.545	2026-07-31 18:09:10.812
39d4b44a-1ff9-4c66-87e3-2898a5983cc5	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$a01qluhEwlgKktkEY.o8xOevk1Q2JqdlTsh75oOkatg.GJtDCmdLC	2026-08-07 18:09:10	2026-07-31 18:15:19.621	2026-07-31 18:09:11.093	2026-07-31 18:15:19.621
c2a07f06-47fc-422c-b6dc-4910b2e02a69	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$1nEV0RK1MA/DyEEtE2pq7usUI9QfORc4maNtU3Gpf1RQRm6mjkLxW	2026-08-07 18:15:19	2026-07-31 19:50:33.233	2026-07-31 18:15:19.955	2026-07-31 19:50:33.24
4cfefbfc-5323-4f70-8761-7138251516e0	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$RminN5wkI.u5e5p56ua0JeRWN2OIDcvLYV5eV/1nOursv9nD/tAhi	2026-08-07 19:50:33	2026-07-31 20:11:20.211	2026-07-31 19:50:33.547	2026-07-31 20:11:20.217
e1d0ef55-552f-498c-8205-7d1c5648fdf3	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$O9cQccVfjL67iWCa2TQMH.c4Jb.KWrqPRgvmvF3VAnSP901n2NsiO	2026-08-07 20:11:20	2026-07-31 20:26:48.766	2026-07-31 20:11:20.517	2026-07-31 20:26:48.766
c0f74180-4654-4155-ad53-cc04e64579c5	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$7UAbYswa86cN2WXxvYkgfO30pl6UUFOy0ziNJ2zL8s6ugA1UeZyzq	2026-08-07 20:26:48	2026-07-31 20:35:32.29	2026-07-31 20:26:49.05	2026-07-31 20:35:32.291
8f704b75-0623-45c0-a276-93fe99518fc4	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$kyMKq0yEP5oDv3Ej7zZfQe0OJOptv0W7Z8.5/A5bIqlz9cmvO1NuC	2026-08-07 20:35:32	2026-07-31 20:53:54.396	2026-07-31 20:35:32.589	2026-07-31 20:53:54.396
eda3f282-fdfa-41db-bbe1-267c2511e2b2	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$C1I0bkX6mm70sb57EOFZ1.cFVTM76X/TEu9PjVzh4XpaK8OPIKHn6	2026-08-07 20:41:54	2026-07-31 20:53:57.102	2026-07-31 20:41:54.339	2026-07-31 20:53:57.102
b45a9dbb-582b-4a47-9bc5-902244f3da20	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$ae0IPPVF69JbKvbzbJNQAucR3HN/uZ6tuu1X34YT49OWlkH3QJ.1i	2026-08-07 20:53:57	\N	2026-07-31 20:53:57.384	2026-07-31 20:53:57.384
bb93fc7f-352d-413b-887f-49237efb5685	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$E2yZscJqm8WdkGaMOzFEY.dpPgGBseEXJWQlDUKSVdL709JQzOOEO	2026-08-07 20:53:54	2026-07-31 21:00:35.125	2026-07-31 20:53:54.703	2026-07-31 21:00:35.126
0547489b-2899-4287-8c0a-8b8ec42578e8	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$siPzuH/qVaJaMCV3Gbj4Ve5hu5YySYfut/rr2NJd5E7rBfVWgjqxu	2026-08-08 15:56:21	2026-08-01 16:14:16.116	2026-08-01 15:56:21.664	2026-08-01 16:14:16.123
8e82b92c-45fa-487e-aba8-0bfdcb1f33e7	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$/1mFMTtW.Oh6AtSlk.YN9usK8BoGDiPt2JC6SYtWTkHqwL3fgdJoG	2026-08-07 21:00:47	2026-07-31 21:02:49.331	2026-07-31 21:00:47.894	2026-07-31 21:02:49.331
7129d02b-4405-4c0f-977e-55e44adeb4a8	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$pdkpQ0Vk6uyF6RnGnyjO6u4py7iPmzBHpVih5BYtvwbJ84Mg4mMhC	2026-08-07 21:02:49	\N	2026-07-31 21:02:49.514	2026-07-31 21:02:49.514
d3a3f4b7-d64c-428e-80d0-2bcbe570209b	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$wGzVLdYzm/LQMpF7yfvAru2GhZzCcGjFCRiJmDamzRTNyCaaDEyY.	2026-08-07 21:02:49	\N	2026-07-31 21:02:49.785	2026-07-31 21:02:49.785
6ad1c2c5-a955-4e6b-ade3-351bd3b5c9b4	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$NBS8TfzKQ9kmUGgYz7ugv.pAsHNsjq0EE5dsCf5G9JB5rIX4H1YDm	2026-08-07 21:03:25	2026-07-31 21:05:30.862	2026-07-31 21:03:25.466	2026-07-31 21:05:30.862
5da15cd1-7269-4a9a-b17d-1874756ddb92	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$5DazRBsHLvc.8KgiX6ECZuZFMAuUNucK9zdOrht7lO/CT5X1SJSF2	2026-08-07 21:05:30	\N	2026-07-31 21:05:31.14	2026-07-31 21:05:31.14
e3923895-5ce9-4f7d-8242-29e56c16c0bf	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$m9MLeF67o/SqmOOU0hmaFuIwJWD7SeQ8AT2yjdHSZrPZJgYd/cOZG	2026-08-08 15:22:11	\N	2026-08-01 15:22:11.593	2026-08-01 15:22:11.593
b8f26d0c-735a-46cf-ae9a-b5d568c6c0f9	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$8il5.feLcfECBkoL8LQQaO0lhhrrDdZux6XKtvgzFy4oW7mdwHqkG	2026-08-08 16:14:16	2026-08-01 16:14:25.114	2026-08-01 16:14:16.424	2026-08-01 16:14:25.115
c04826ab-58c6-4662-a2c8-5dfd0f5a8bc6	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$2P0lsdnw3ZSAjwicPxgb0.njExFBhw1YvF6JVtb.xFj5iX6G/R.nS	2026-08-08 16:14:25	2026-08-01 16:19:32.533	2026-08-01 16:14:25.402	2026-08-01 16:19:32.533
b974bea8-e13e-43de-82db-8c435116fba2	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$C5.U4dnTUJeR6qkOvgeGf.ac0IjT0CeBUP.pGTBct3IvDIL06hlr2	2026-08-08 16:19:32	2026-08-01 16:20:19.634	2026-08-01 16:19:32.824	2026-08-01 16:20:19.634
384451ed-7683-43f5-b054-a1c15d26b742	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$BpXzRVB6g0zrKXqYceQsB.pV8Aw/PZffDm4XpiP7q.T0Qn55w5P4y	2026-08-08 16:21:50	\N	2026-08-01 16:21:50.734	2026-08-01 16:21:50.734
fd97df3c-5d5a-427d-addc-8c27797c5dd3	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$DjH4atszGugNASMXirRiveIMHqnQd5e7b7Tgg8/OrJZbdmp6VnrJu	2026-08-08 16:20:19	2026-08-01 16:23:35.936	2026-08-01 16:20:19.958	2026-08-01 16:23:35.942
0181dce7-c4ee-4b4c-beb3-3fc2a3bafb1b	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$IoVNMjoq53NTecsqb5pUsujRFTNgY5KPW2p6ePIXSlyuf62ScPoje	2026-08-08 16:23:35	2026-08-01 16:24:58.244	2026-08-01 16:23:36.236	2026-08-01 16:24:58.245
d00c39ec-3d5c-4699-85bd-ef000dcdcb57	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$KHcoM1b5OQXSo2OnA9SwGuXfCZdy5f02Q7nwWxEfOLC.46Xn7S5wC	2026-08-08 16:24:58	2026-08-01 16:57:54.015	2026-08-01 16:24:58.541	2026-08-01 16:57:54.016
69c3761a-2d81-4fde-8cb3-67b8069022b6	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$Jqd2j5pJFCSLT/jpUwgneuCpA6wYfUt2HcepeIruzsFAv90nHC8Ou	2026-08-08 16:57:54	2026-08-01 16:58:14.121	2026-08-01 16:57:54.329	2026-08-01 16:58:14.122
ade51602-0e54-4c16-b0de-a892c7cca831	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$ba77WcM91p8IxkmfymdiuuZZUwIsoiZzNdobJba9HCZ/.wHlKIEyq	2026-08-08 16:58:14	2026-08-01 17:02:54.095	2026-08-01 16:58:14.399	2026-08-01 17:02:54.095
82465399-39e6-4d38-894a-5ed94a3e78d3	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$UuoOlWauzkFv5LeDu29.Led1Wdy5zKJYh9kQXeCk8napBg4z1ri6i	2026-08-08 17:02:54	2026-08-01 17:03:58	2026-08-01 17:02:54.378	2026-08-01 17:03:58
cfe33737-3ba2-416c-b5cb-9ac05c02e26d	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$UIbD.b.gCXvt8.gT9/S7ge3cfvi2r2Ia6/kCYcCcmzlpUQpvIVNW6	2026-08-08 17:03:58	2026-08-01 17:04:00.107	2026-08-01 17:03:58.308	2026-08-01 17:04:00.107
61e3281d-6a9e-48db-a7eb-6fa9e2bf4d07	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$EKRplNqyBJFULmp0z/f/PuehmtigLqFyjco8lvwQI3XOOcujldZ5W	2026-08-08 17:04:00	2026-08-01 17:28:40.576	2026-08-01 17:04:00.379	2026-08-01 17:28:40.582
cbf862f5-3180-4b02-b966-0f0962d6b813	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$WnQIaRW79UtDERHpXueBiuM7ykwaqXCFIwyxEvyCaeeFdgNdSr2FC	2026-08-08 17:28:40	2026-08-01 17:33:40.463	2026-08-01 17:28:40.886	2026-08-01 17:33:40.463
b7ce2cf4-c306-4dd6-aa77-4d38cef9e91c	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$090uB/665/Er56ugx1cAUu1/73YuJK7vb0NKSHJkC1dfEjihnELj6	2026-08-08 17:33:40	2026-08-01 17:42:36.694	2026-08-01 17:33:40.801	2026-08-01 17:42:36.695
52b190ed-534a-4758-ba26-98b79ed409a5	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$QU6lXo8iCFv4aCg3QoLFSeXMHH0TnHUJ7DipAruNEodjZwJH/M9Xm	2026-08-08 17:42:36	2026-08-01 17:47:37.187	2026-08-01 17:42:37.036	2026-08-01 17:47:37.187
70ba8cb2-7526-4a9d-9e6f-204c573b8d7b	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$51SXwaerbPxcd/KYnwT.fuIAQLI7fNNT2Ij970Hf/sJ8iQY/RnW0W	2026-08-08 17:47:37	2026-08-01 17:56:30.497	2026-08-01 17:47:37.477	2026-08-01 17:56:30.497
a271fa95-a907-49db-8c39-53c1418ad5c2	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$1zzSAVkt6yvmPiEzNpLCKOyoD6.d/efXgYIF3CX5TMz.rspSFqDfi	2026-08-08 17:56:30	2026-08-01 17:57:47.92	2026-08-01 17:56:30.799	2026-08-01 17:57:47.92
900fed3d-0bad-4c13-8b9d-71bb2b942750	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$QI6Y1QQsmB2283sZEKNl/eIpCnKW9t01LtZJuuH3hGJq97mIZdOB.	2026-08-08 17:57:47	2026-08-01 17:59:21.311	2026-08-01 17:57:48.296	2026-08-01 17:59:21.311
81dbdf89-cf43-4578-aa37-88652d4d6299	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$4Hx0hP4arLf2Lx4cL83.ze3n18NI7kPWX9rmzl8ECarcrj2yvS86e	2026-08-08 17:59:21	2026-08-01 18:01:22.761	2026-08-01 17:59:21.601	2026-08-01 18:01:22.761
a73b0ffa-ec17-4a56-b98c-247db66fbd36	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$OSCHx9aHwDX8RG3Q5QLEoejg1CpFGfdrAWRHu0.Z0FIPepNpTRWt.	2026-08-08 18:01:22	2026-08-01 18:04:43.26	2026-08-01 18:01:23.039	2026-08-01 18:04:43.26
514324f9-1875-4cd6-9a02-da986a16eaa6	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$SmpE1gQ/qN57ALukWI3liO3n1zaBgVoOPNIwRV9FpV3gcYcZjjvty	2026-08-08 18:04:43	2026-08-01 18:04:45.078	2026-08-01 18:04:43.539	2026-08-01 18:04:45.078
3838ce50-e61d-4e0c-a727-57bfe3778376	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$W19BJGreYbl/PJi4YD4/oOzFb8n.mzjs1ufpEhGrwOEMUzw1ps9KK	2026-08-08 18:04:45	2026-08-03 16:56:30.001	2026-08-01 18:04:45.372	2026-08-03 16:56:30.007
643218a1-f82a-4733-967b-2ba6cce41391	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$gcacm.HRDO42cOXL5JI8mOajixglMtTis.KGNiGyK95KQ4VLtpgmy	2026-08-10 16:56:30	2026-08-03 16:56:40.75	2026-08-03 16:56:30.308	2026-08-03 16:56:40.75
e929445a-5d96-4200-b96f-a23983e2242d	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$.U4jWyu/EvecPPL43flw.uqGAULGu7THiLCVlmdXnqvEI/Jjb7L3S	2026-08-10 16:56:40	\N	2026-08-03 16:56:41.034	2026-08-03 16:56:41.034
d651d18b-a79d-47c7-98da-77434c6e7d34	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$LRfVqgqx7y9Owo4JHkjdlOCCCXUMFk2ckgeao.OwGdvKnzlZlogHO	2026-08-10 18:03:11	2026-08-03 19:19:50.608	2026-08-03 18:03:12.025	2026-08-03 19:19:50.613
4c39fb78-7fc4-4078-8f1b-fd3e9c3d6512	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$HoK9LmGc1hYD19mojhUnP.CFYuT3X4bxw6n9LvH.P6Yj7fpotmZA6	2026-08-10 19:19:50	2026-08-03 19:20:04.507	2026-08-03 19:19:50.911	2026-08-03 19:20:04.508
bc307dfe-5242-48eb-8a40-eeea5e6d23de	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$dAbjTbH0H1jz1XaFH17bquVPKXHCkENRn3ght2SfTWAlQ2jEb4yzW	2026-08-10 19:20:04	2026-08-03 19:27:02.647	2026-08-03 19:20:04.87	2026-08-03 19:27:02.647
eafd55fa-fad6-479f-b421-9af0c6732590	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$NY1WIWSV8.r7jtmPktO1dO1M2IojDKWAXq1IfqngOojCYb7UYE7Py	2026-08-10 19:27:02	2026-08-03 19:27:48.086	2026-08-03 19:27:02.936	2026-08-03 19:27:48.086
9b5d172f-4b65-4dc2-9021-da5b9561f04d	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$4A/0PpdEYc0GSs2chyfME.F9ssZJ7cGseUnZOqsieRpLmmjdc3Xly	2026-08-10 19:27:48	2026-08-03 19:34:21.122	2026-08-03 19:27:48.375	2026-08-03 19:34:21.128
abe98f74-c36c-4eb6-ba54-8437d844cf34	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$m2cxKZcfoREaODa68RyyhObFb5HcgvvJoQuX9PidLrLGbVR0rA4tS	2026-08-10 19:34:21	2026-08-03 19:34:32.521	2026-08-03 19:34:21.425	2026-08-03 19:34:32.521
9116d4b9-b332-43f6-93f0-33569281761c	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$TbD2BkoduQig1O8F1dXf.uwRimcrqSQxKHHjJEN0UKp2ch3SYUWx.	2026-08-10 19:34:32	2026-08-03 19:36:51.408	2026-08-03 19:34:32.8	2026-08-03 19:36:51.408
214989db-99ee-4930-b671-eccb0aebf726	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$/ignWUUde8MqXGkryVCCEOiqtUy7/gKDfBhauv1q8UkyQOH5bitAO	2026-08-10 19:36:51	2026-08-03 19:36:52.181	2026-08-03 19:36:51.683	2026-08-03 19:36:52.181
5ecfa95c-9478-4e56-9267-7e40ace7d04a	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$9KYkjJv3AWKabigWaMCcv.mOcoL8OTgyE6xbCWNpat2CMqV39xaz6	2026-08-10 19:36:52	2026-08-03 19:37:19.972	2026-08-03 19:36:52.455	2026-08-03 19:37:19.972
da50b3d4-f50f-4ee7-b749-2abb721a873b	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$4PQtHWvZ3afapgphKPIu8egBA.7SuIfkvWwh29E8QNqNrCXkWD4Yq	2026-08-10 19:37:19	2026-08-03 19:37:21.588	2026-08-03 19:37:20.251	2026-08-03 19:37:21.588
18c44519-6486-4749-a7d3-baba7429abfd	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$RQF35K7nDe99wOhp0Dqol.zxdvLbK5YhrAM0yWBVqhc7EZNv4rPvS	2026-08-10 19:37:21	2026-08-03 19:39:42.97	2026-08-03 19:37:21.863	2026-08-03 19:39:42.97
16fec7e6-b489-4cea-882b-8c5b7d9f5b1d	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$ohu8bg0TDocFsM2zHUVS7ugTBD/7XLj1ksiX02tQVSANBne4R4Csy	2026-08-10 19:39:42	2026-08-03 19:39:44.042	2026-08-03 19:39:43.248	2026-08-03 19:39:44.042
fb58ae5e-961d-4b41-a531-4e09f05ae0ca	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$KXsskrue/UE5PbeEBKjU2uCj7CktcB/Ceq0yo2AmuTF7vIuDtLSN.	2026-08-10 19:39:44	2026-08-03 19:41:20.945	2026-08-03 19:39:44.319	2026-08-03 19:41:20.945
3a6b9731-1230-4d47-8c7d-3fc1979fe894	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$JuZ3qFxsoTOHO1bw7oAPLevDERmsH49voeHwcmUGpSjxtmI8bPzGK	2026-08-10 19:41:20	2026-08-03 19:41:24.004	2026-08-03 19:41:21.22	2026-08-03 19:41:24.004
2b43627b-0477-4500-ab90-665729db3a3f	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$NiEh.BmwO/J7o/hCMQ2DdeoGNEjoSaydDS499MwdMRWMPD.5OaEsu	2026-08-10 19:41:24	2026-08-03 19:44:42.342	2026-08-03 19:41:24.278	2026-08-03 19:44:42.342
e89268be-1ef9-43c1-b3a8-a60b40a035cc	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$LscTrEIScKVOoypLxG8G3OzMBLaJ.epHq1yYg/cXZoXXCe/E7mvm6	2026-08-10 19:44:42	2026-08-03 19:44:44.481	2026-08-03 19:44:42.617	2026-08-03 19:44:44.481
e18bfc5b-301e-4789-be86-ef9beb9b7721	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$8m8klad.im3NRDVmlS3TGOeStsXFGewfwsuCb38avawgBw5A.Rcdy	2026-08-10 19:44:44	2026-08-03 19:44:45.773	2026-08-03 19:44:44.754	2026-08-03 19:44:45.773
10839b16-9bde-42e6-92f7-581a21a4d968	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$O10uzW/1HxytVMIan2XF1uEQYS4WlkDjIXcxtDLVeauoVgRSfPG4O	2026-08-10 19:44:45	2026-08-03 20:05:59.273	2026-08-03 19:44:46.05	2026-08-03 20:05:59.273
98838bf4-cef2-412c-8f17-5dca0d300295	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$nmwhB0rcVH.dMuaQCocOIeSn2ktTJIyO2Xlp9E8pD9C2QZZali4sq	2026-08-10 20:05:59	2026-08-03 20:06:02.699	2026-08-03 20:05:59.562	2026-08-03 20:06:02.699
983abf4d-9aa1-4163-aee0-429f0912e904	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$a.DYgeDHokh6CI7ayQCXseYG8cQqVw1bEhMdvRt6zfYasuwRgNZ2u	2026-08-10 20:06:02	2026-08-03 20:06:07.178	2026-08-03 20:06:02.974	2026-08-03 20:06:07.178
563ec9b7-8846-41ba-885d-e3c06c746f93	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$RIK9xswjPl0YmAda4jR5AuoAZLhpKb1DbF1LCtq94glls2chFBwV2	2026-08-10 20:06:07	2026-08-03 20:06:15.471	2026-08-03 20:06:07.452	2026-08-03 20:06:15.471
ebd837f0-8734-418f-8d0d-b1ab24d31442	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$5jbe0FXW/KbXbtn679o86ubOBgV7p5yWUqZvG99QiIfDA8Wqys9kq	2026-08-10 20:06:15	2026-08-03 20:06:17.312	2026-08-03 20:06:15.748	2026-08-03 20:06:17.312
6f7cded2-47d7-4fdf-8f65-8584df439b13	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$lNWuyf1N2cvMzr/Wr.OI3.jyvUXcUBAzYFvueO3Y6cVOODLxelMZu	2026-08-10 20:06:17	2026-08-03 20:06:18.117	2026-08-03 20:06:17.589	2026-08-03 20:06:18.118
7068277e-c420-4c8c-b3c9-f9fcba1f98c4	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$B.5hoYIcbdRhpEp0JRWzK.47vZq8m.3uaejs6oCdRXn3TSHBemiHK	2026-08-10 20:06:18	2026-08-03 20:06:18.825	2026-08-03 20:06:18.392	2026-08-03 20:06:18.825
cf85497d-45dd-45ab-badd-4704316d369b	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$y.25ZKPKuHZqD6RooMju0eYCXZj7STQEm6KJJ0SYxbV/M3lCueLX.	2026-08-10 20:06:18	2026-08-03 20:06:21.751	2026-08-03 20:06:19.096	2026-08-03 20:06:21.751
7604314f-895a-4fec-a25f-3c01ddc74601	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$cFOhwJJO8nFW/Kg5Y6DXZ.zM0C6QllzVydPTX2QD9SlnBZVUwCsxi	2026-08-10 20:06:21	2026-08-03 20:06:22.603	2026-08-03 20:06:22.031	2026-08-03 20:06:22.603
b4d76f50-b704-4f31-a2fc-f560bb40068e	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$plfaaEGsRjUSgYdYFnSLKOjhb4o6KjaU7SGvb8leBxAyvbqU7c0CO	2026-08-10 20:06:22	2026-08-03 20:06:26.267	2026-08-03 20:06:22.883	2026-08-03 20:06:26.268
8069867a-6443-4aba-9023-0dae98e25fe1	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$ymFc8xDDU3PTpV6lGHa/NuVap1r5XRfM8E8mKscw4pcoLSoyIQMEC	2026-08-10 20:06:26	2026-08-03 20:06:27.915	2026-08-03 20:06:26.54	2026-08-03 20:06:27.916
27b7565f-7146-400f-b37b-59cc7db32e8e	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$jsK95KVfWMm8I9IH.fgzPOB.73fAVkiMsjlOuq622ZmQ/Brg2TBx2	2026-08-10 20:06:27	2026-08-03 20:06:28.996	2026-08-03 20:06:28.189	2026-08-03 20:06:28.997
c400c4e2-d97a-4c2c-bc4d-81b8dee1b7b3	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$xaIFFu5NUScKmouYd/dtjOChm3E1PvBZ4OUh5EHT8A4VVRocVVb/G	2026-08-10 20:06:28	\N	2026-08-03 20:06:29.273	2026-08-03 20:06:29.273
044ad621-dbdf-4820-a48c-409b06983f49	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$Ruacd4ZGyy4p1Gwp7eVwkeQ4sU2nMJPgBAtYcwYqvZUWZMdNyq5C2	2026-08-10 20:23:20	2026-08-03 20:23:33.612	2026-08-03 20:23:20.457	2026-08-03 20:23:33.613
ceef1868-2782-443e-8b7c-6a1164dfdca1	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$vA2JdmuDNH4EyO0wiTmHrOPCiybk82aeddxWrLYPVjsRYsFkeMgMy	2026-08-10 20:23:33	2026-08-03 20:49:09.033	2026-08-03 20:23:33.897	2026-08-03 20:49:09.034
6597a6b0-e86c-4da4-a24e-60d83105eb84	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$pZOYyOnzMmkQgSo7szbT4elvtVF6wATDEjlKDqMXBZLNfXc3wMxCm	2026-08-10 20:49:09	2026-08-03 20:50:14.256	2026-08-03 20:49:09.324	2026-08-03 20:50:14.256
35096595-4a01-4e23-8b92-6d6c51f52d5a	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$8MwWUEUeKga.4PMRSkEHGuR5Smwh5.jVuW2eXJzOc2GYb67LSqIe2	2026-08-10 20:50:14	2026-08-03 20:53:22.041	2026-08-03 20:50:14.533	2026-08-03 20:53:22.041
a57ca134-2d0e-43f3-8fe3-2154f7272af7	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$lUPZKBDu.AFr0bagevpdtup3C6009kfJrVwGXO83nEEjRrh5PHnyW	2026-08-10 20:53:22	2026-08-03 20:53:23.267	2026-08-03 20:53:22.314	2026-08-03 20:53:23.267
25012e6e-78e0-47fa-9735-f05332295841	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$r3Muqgg3eYiUL2bnyJ7A.eVuj9BSe9/JCMintiIu8/qwtwFywGUr6	2026-08-10 20:53:23	2026-08-03 21:01:54.903	2026-08-03 20:53:23.547	2026-08-03 21:01:54.913
8d8fdb95-d13b-4e72-bbc9-2c226d3ed6e6	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$oItlOnt3V3kCzPhNxI9GQ.3VHW2IGiWWC1obeoze0HcdbhPs9KNvO	2026-08-10 21:01:54	2026-08-03 21:03:31.916	2026-08-03 21:01:55.256	2026-08-03 21:03:31.916
1f281f97-8169-453d-ad78-787476fefd86	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$YrkHolV2l8SqDXDdaaCi/uvEN7Iw4CmHHmmf4qkFF9vC9tgYkyyOa	2026-08-10 21:03:31	2026-08-03 21:04:53.832	2026-08-03 21:03:32.259	2026-08-03 21:04:53.833
273a5ee1-2189-4979-b31c-31e6ef5e8224	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$EZma.it.f9y52bKxSD6bSuQpTvME9kpv.3Tv8LqJpc3a2QXwrGnuW	2026-08-10 21:04:53	2026-08-03 21:09:12.529	2026-08-03 21:04:54.18	2026-08-03 21:09:12.538
141ac979-66b1-4090-9d70-d7b3f30aee6b	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$Atx8q8qmbfU/MQ6WNtMCv.zsyw3EUcNbBuIDSF0lNj0BceZBAlFzW	2026-08-10 21:09:12	2026-08-03 21:10:02.003	2026-08-03 21:09:12.84	2026-08-03 21:10:02.003
d53a28d6-81e9-46fb-aed2-dd4d4cf4f172	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$eN2OkUvfFSJMaTs17ZcDvexky253rZtIi8gKqb2j5J7FNR3.tXGAO	2026-08-10 21:10:02	2026-08-03 21:19:45.543	2026-08-03 21:10:02.291	2026-08-03 21:19:45.543
8708bc82-e49e-43db-b79e-c6055c34a878	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$G1JCXEwsYw9SKm7Scrg10ev/vc6iKvgugSAdHg.frnbH.Ulaw6RM2	2026-08-10 21:19:45	2026-08-03 21:21:41.592	2026-08-03 21:19:45.868	2026-08-03 21:21:41.593
552e3e29-ecdf-4d2c-a57e-8f3b3db87851	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$Sbsce2aq3mrXJwrm3rZ/B.js0gjXkvjfHP2FqkwRwOT6Fw1C2XtmS	2026-08-10 21:21:41	2026-08-03 21:21:43.796	2026-08-03 21:21:41.923	2026-08-03 21:21:43.797
2104d5c9-9061-489f-aa47-2a06ed16bfb7	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$y5bHLspQfQmMUHWk/AsFLONSQZWSm1X3Cl9kLF8O28ZPiqZCLvpCi	2026-08-10 21:21:43	2026-08-03 21:21:45.978	2026-08-03 21:21:44.13	2026-08-03 21:21:45.978
a47f9e0d-7ce7-46c0-bbbe-b7414145c803	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$btte1uVVOTMiieCjtDZm4eqOsZOsnhJrmmNfzkFcbxOoG7sBEjA3G	2026-08-10 21:21:45	2026-08-03 21:23:00.849	2026-08-03 21:21:46.326	2026-08-03 21:23:00.856
09fd2948-bed8-4d23-bb6f-234a5e6a5b80	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$K3zv.U2WNc2bWwM/NlU1FO0fL9SdvynI.LzIJVsmQe2dp1E/0kNMS	2026-08-10 21:23:00	2026-08-03 21:29:46.58	2026-08-03 21:23:01.18	2026-08-03 21:29:46.581
2595709c-db3a-4b6f-b200-7e07fdb0bf30	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$L4Oo/elgTD3Fbym3hT3Gje7oTLX8yjejr4P1WzhClGwoFBVNSotty	2026-08-10 21:29:46	2026-08-03 21:37:17.201	2026-08-03 21:29:46.888	2026-08-03 21:37:17.209
8360fcae-9d13-4001-83f3-d109d77dce34	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$etrf4MDR2Sb9tt8f60NNGuLipfRsaqDjEiEba7a.tpVXpWHBDW71a	2026-08-10 21:37:17	\N	2026-08-03 21:37:17.538	2026-08-03 21:37:17.538
77d92b63-5188-4278-bdae-72393f779f53	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$cTf/ToleKeZoU1hR8UuEy.oWXi1Y95vTYLB5JVK4NJtjkt8dWFeGe	2026-08-10 21:37:19	2026-08-03 21:37:24.607	2026-08-03 21:37:20.287	2026-08-03 21:37:24.607
58e430e9-6915-48c0-ae7b-4b84f0bf9160	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$tn03ZaLVbPVIgQbk4f2BPuezNirtzVyQxTVqycYRUtiArvEgrtMsu	2026-08-10 21:37:24	\N	2026-08-03 21:37:24.918	2026-08-03 21:37:24.918
e988ab8a-92e9-4ccc-aa62-2078a57701d4	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$JWRXB.crC8WZUyIxj1N8be4sR6/h2nA5Jvc0xmY1rZ6nzee4gnPay	2026-08-10 21:41:48	2026-08-03 21:41:52.022	2026-08-03 21:41:48.98	2026-08-03 21:41:52.023
7b553dd8-a540-4eca-8a36-efd4d678b75f	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$03oNzSNt14vVSceQCp6So.EH7AECLZ78psE/3JcGBUKBAWBDL3Apq	2026-08-10 21:41:52	2026-08-03 21:41:56.529	2026-08-03 21:41:52.38	2026-08-03 21:41:56.529
dfedbeda-004d-4175-9a38-c3438cd05d9f	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$rX0aIFiioBWcs9kVasUgxOiqAV5ntPRJCdqtShJB3zuiIbvgU7gL6	2026-08-10 21:41:56	2026-08-03 21:42:00.388	2026-08-03 21:41:56.828	2026-08-03 21:42:00.388
d91c9fff-069a-4e70-a9b9-1da2b8ad6fde	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$IYbNdstEUw5C69yF1pYdLuAphVhAp24VDol99LK13Ga8Y6LlRu5G.	2026-08-10 21:42:00	2026-08-03 21:42:02.879	2026-08-03 21:42:00.722	2026-08-03 21:42:02.879
fd10d640-04ec-45da-8d82-009caa6a1cd5	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$nJOjFIBOHyAbMTEM3lyyNe.rl1D2tgi56WmIEewgEOgbfjqsCL61W	2026-08-10 21:42:02	\N	2026-08-03 21:42:03.207	2026-08-03 21:42:03.207
46e0954e-6a20-4e20-ad29-878d0da501df	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$4FIaWxP1pWVT3AKm21wmZuV5A0eHf/J1T5qMzarJv0A9iy7Q53eJu	2026-08-10 21:42:04	2026-08-03 21:42:22.164	2026-08-03 21:42:04.467	2026-08-03 21:42:22.164
71e85487-dd9a-41cd-bd5d-a5f6d5bded92	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$0LYcqlMB63.YB49UUeDfEOqN/ZVNYbtASk2g8.38fR3xNi7Qf99aS	2026-08-10 21:42:22	2026-08-03 21:47:33.659	2026-08-03 21:42:22.475	2026-08-03 21:47:33.665
965c051f-7c8f-4d07-832d-69736d83e263	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$Q6T/0uQSuX0R5tNsqQXEb.XHHMBDwHy1..4gmeC4/ykw4f4hd/r5i	2026-08-10 21:47:33	\N	2026-08-03 21:47:34.023	2026-08-03 21:47:34.023
a2f21062-88e5-4456-9261-6aceba3b7d00	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$hOhsGkpR1lzji068sLYsG.7bWMshZPOTFTktXmTLqYIH0OVt1wGeq	2026-08-10 21:47:34	2026-08-03 21:47:37.078	2026-08-03 21:47:34.842	2026-08-03 21:47:37.079
0bd66c38-2a41-49da-b176-6ac398a4bfd5	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$JCVzxr0JMCc1mT8WIs66HusZhcwp8EbNy6X.ocUnm34.CBDKvSiKC	2026-08-10 21:47:37	\N	2026-08-03 21:47:37.417	2026-08-03 21:47:37.417
8d48574b-ece9-41ce-8c46-633f184ea618	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$cc/XzwsW7bhNlMeD0y8Jce75qDD/YrYfYH0q4MqW2GI/viBWloutm	2026-08-10 21:50:20	2026-08-03 22:01:10.689	2026-08-03 21:50:20.497	2026-08-03 22:01:10.692
6a339873-e8b2-4dbb-81b7-727edc9837a0	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$uGDAorscatQS2q6LZu3.3e1cdzcRb5PNzZVJCKnA2jEv3vm.0y4Uq	2026-08-10 22:01:10	2026-08-03 22:01:49.009	2026-08-03 22:01:11.019	2026-08-03 22:01:49.009
05f0bb6a-3e95-4c45-997d-23c21eca2993	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$bYSnEb.6stO01u8NKzzh.enGl3nFLceJ/dPmuhMfwuz6XK67uB8Ca	2026-08-10 22:01:49	2026-08-03 22:02:06.286	2026-08-03 22:01:49.3	2026-08-03 22:02:06.287
b68618f5-3508-42ed-a63f-cc8872374d70	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$Me2XT/t5X2h3vyZ0WAOvIuXUmmkzN88ybL0rC6fes7vZEYY9AEH32	2026-08-10 22:02:06	2026-08-03 22:02:46.342	2026-08-03 22:02:06.585	2026-08-03 22:02:46.343
43b9975c-6aa1-4c04-a1d7-08dc410b5858	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$gUK7fa.nblZcioncGdBQQOLuZbcheEJjNhHBNcn1zlZLECukike9S	2026-08-10 22:02:46	\N	2026-08-03 22:02:46.648	2026-08-03 22:02:46.648
57275838-88c2-46bc-b9d0-e00a4439608e	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$D1swbrXh1Y1KMKj67cu7guwJKt3Pd0scEUC7LlDJwFsFZxmWpfShO	2026-08-10 22:02:48	2026-08-03 22:17:47.715	2026-08-03 22:02:48.807	2026-08-03 22:17:47.716
9b39c835-b40e-4f43-8522-85e41df37572	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$NrclEVm1hVIJKnCFAYAOfewb9.tjCOegl850DwVnA5F96pfhvWhoW	2026-08-10 22:17:47	2026-08-03 22:24:39.815	2026-08-03 22:17:48.006	2026-08-03 22:24:39.815
27e0e5b8-d2a5-457e-a01b-d44103e159f8	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$QI13lfbTI9p7AP9g7waf4uLpzHodoFDj/Mw8dtgirUeV5xkgpVEcC	2026-08-10 22:24:39	2026-08-03 22:27:23.119	2026-08-03 22:24:40.127	2026-08-03 22:27:23.124
8a85f40b-a3b5-4fd5-bb5d-812c12ed6517	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$.EaA1NF6wsr.3wnbABms6.t/rT0mSHpUN7lkV.frcQfZ6zed/kc9m	2026-08-10 22:28:35	2026-08-03 22:30:16.287	2026-08-03 22:28:35.601	2026-08-03 22:30:16.306
385ef819-cff9-4787-acba-9227cc529dde	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$2qnaHod4Gntrm.7F71DvjO8pyGWhyTnYtm.KI3HVLWHXt4w0esxLS	2026-08-10 22:27:23	2026-08-03 22:28:35.037	2026-08-03 22:27:23.422	2026-08-03 22:28:35.037
e06f6fe3-c1ba-4fdb-aa1c-cc7c28e40747	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$3Ds8hKGpUSYES7UYzIcROOifavGICtHjph5z4G2VW6z4/9yTFVflq	2026-08-10 22:28:34	\N	2026-08-03 22:28:35.403	2026-08-03 22:28:35.403
159deaf7-2e66-4ebe-aa69-677acfd9972f	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$fiKYusRAyl4qP0N4Os3zMOTEuJdu8baJIkmMCOQd0a38.zNSwsLza	2026-08-10 22:30:16	2026-08-03 22:31:53.115	2026-08-03 22:30:16.782	2026-08-03 22:31:53.124
8fd52c7d-6049-403e-ad7c-2c199cfb2e30	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$HEJ3vOUKDefA24RNYf9B3u95kZukmMVXNhzzvGpkRfMpP3bZKAc.y	2026-08-10 22:33:19	2026-08-03 22:37:46.498	2026-08-03 22:33:19.435	2026-08-03 22:37:46.498
02821bef-4981-4e31-a728-7cfb4b8d83c1	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$QFKEF3NAZNW36hH/fFeiZuLUSkd/bcSb9I4gk3mbTPTgZvOel3HVe	2026-08-10 22:37:46	2026-08-03 22:37:48.056	2026-08-03 22:37:46.785	2026-08-03 22:37:48.056
9a8fab11-5f14-4091-9830-c753aad9b2c3	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$UK6N2YDtlm.hcnMEl6iD8.qApBfSlRg/znB4K6efKZiBuhNO5WpTy	2026-08-10 22:37:48	\N	2026-08-03 22:37:48.331	2026-08-03 22:37:48.331
1f31fef5-5527-43a6-ac07-3abbf54aab4f	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$/VGkJnf01i/IZR9mczvwJOHMOnV5XGg4gyzKplh/CCXcBRr78mIQ6	2026-08-10 22:31:53	2026-08-04 16:51:41.302	2026-08-03 22:31:53.474	2026-08-04 16:51:41.308
b396b15c-25eb-4adc-b024-1e08c2a269f0	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$.BKtCZNp8EHXfWdywxggIOLydxBQEPZLg/S/M2jn1TfYbRDl4IeCC	2026-08-11 16:51:41	2026-08-04 16:52:37.522	2026-08-04 16:51:41.605	2026-08-04 16:52:37.522
d26e94bc-c0b5-410a-845a-e4edac21ca85	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$l7TldieqBm.CmGNOT3QsV.HRWRrUddrOclf0XZPg.5uM0DGg1KhU6	2026-08-11 16:52:40	2026-08-04 16:52:50.46	2026-08-04 16:52:40.579	2026-08-04 16:52:50.461
f0589026-b893-4270-a0c3-ce5afe1a20f5	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$gVa2brQ/Skeq6DgboqHE3OpGKg3laTV.aaEm.70gfKNX4HBJ5MPWe	2026-08-11 16:52:50	2026-08-04 16:52:52.572	2026-08-04 16:52:50.743	2026-08-04 16:52:52.572
8a7d9934-d76f-434b-a7c8-d0fc4d8827ec	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$SDU8Lo444xXWivgV0gkv.em0oA3wfXqMtQlOF1lelbUl8uYJ8wF62	2026-08-11 16:52:52	2026-08-04 16:52:53.865	2026-08-04 16:52:52.851	2026-08-04 16:52:53.865
3e3c0c55-b265-4c4d-b664-be72cdc1a02b	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$XIVHaDiT/PIkYKM/LgVUYuCGhErxXDe3M7CEgqxW0DolRp1XctP3u	2026-08-11 16:52:53	2026-08-04 17:07:06.354	2026-08-04 16:52:54.139	2026-08-04 17:07:06.363
6d1e09b2-c9e9-462a-a8e3-99e94a148555	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$OmXQYUfmTQ.fekpidC3pgu9nsWSWILRnFwjTKy50Zr6y2XJwcb8sq	2026-08-11 21:24:50	2026-08-04 21:25:18.477	2026-08-04 21:24:50.538	2026-08-04 21:25:18.478
69c8036d-c9b4-42c3-853d-827f81b19764	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$krN/r.oo3VzvHYn5TcLCXOspPczyo802218CFm6qlV0kOABl1DqMG	2026-08-11 17:25:00	\N	2026-08-04 17:25:00.988	2026-08-04 17:25:00.988
bbf4fefa-03be-4c75-9b1e-6d5332f9c6d6	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$M/W0VUn/Cluro0tuG5l5fOIqdTRXHQN4/R0xZl8zSQ2VIoExKwnh.	2026-08-11 17:25:00	\N	2026-08-04 17:25:01.163	2026-08-04 17:25:01.163
7cfe3e4d-3bbb-4ca6-a75d-8643a3f1b72c	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$/jXJ1pIsR7iwgTSeYLzVsORoXtPPAvMwM6bWuR4i.YAlyP2TAdkqy	2026-08-11 17:07:06	2026-08-04 17:25:00.593	2026-08-04 17:07:06.658	2026-08-04 17:25:00.593
e659a3a1-ffd3-4396-98f9-f736aba9e81c	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$Di9ELE2vhQ29jD6ZVMmuE.qRhkFNI3PvUP3MP3mC6Za7kuBc1jQEa	2026-08-11 17:25:01	2026-08-04 17:25:02.455	2026-08-04 17:25:01.444	2026-08-04 17:25:02.455
fd844192-f37e-475d-a3a8-39758de55375	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$PVnCj0K/XhNjit9bzIr2jufnDa01.hE.6jjbRWgLc06UrBWHHPbXG	2026-08-11 17:25:02	2026-08-04 17:25:06.081	2026-08-04 17:25:02.735	2026-08-04 17:25:06.082
4b503f60-77e8-4619-9ef6-5247c45f368f	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$O6KLGEPiAVGVcX5/ASJwCOIIxZ3cmbSl5M7GBz1h3643EWmBhpDZu	2026-08-11 17:25:06	2026-08-04 17:41:56.377	2026-08-04 17:25:06.355	2026-08-04 17:41:56.377
c4a5439b-2787-4ab0-9d9b-bb7038dae13e	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$F7ITBVrPgFtAHjW6XEvOEeYM8g6rY4G1EKhpwcslaL.NHb0j8Qdtm	2026-08-11 17:41:56	2026-08-04 17:42:25.279	2026-08-04 17:41:56.667	2026-08-04 17:42:25.279
0b9751a6-f25d-41fd-b760-3189d1250c4e	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$rVsasaxprAnZboWH314JKO5DoIMcTiq2d599YXe9nvmx2ndry.Q4m	2026-08-11 17:42:43	2026-08-04 17:45:04.391	2026-08-04 17:42:44.251	2026-08-04 17:45:04.392
6ba43251-e0fb-4f21-b1ee-54b959880ddf	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$BKenASCD89eA3Yo2.1PcT.MngXwtAqrIjOAJJHeuTrT6JnTL4Y/hG	2026-08-11 17:42:25	2026-08-04 17:45:29.764	2026-08-04 17:42:25.556	2026-08-04 17:45:29.764
69fb47fd-9bce-43ad-91b8-a3bce8ab2dd7	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$TsTPRFOYxPqjCnuxX/UQPupATaZDJrViQ/QTsisLhBfp/i4pu76ae	2026-08-11 17:45:29	2026-08-04 17:45:37.23	2026-08-04 17:45:30.042	2026-08-04 17:45:37.23
3229000b-f41c-487f-8966-83c623dc039c	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$CJglGCkf2iIdaBq1XKONruHEj173flGNaecU.N6DB.LgEaLENcxgu	2026-08-11 17:45:37	2026-08-04 17:53:10.884	2026-08-04 17:45:37.514	2026-08-04 17:53:10.884
9d398f1a-ddbf-4412-88b8-0aeee6b6f6ab	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$1ZkrHfCtdU0tuJ6CTwwoPeFodKrXF/6NqTCEzHQmtGtq8csVHB3n6	2026-08-11 17:53:10	2026-08-04 17:57:51.606	2026-08-04 17:53:11.193	2026-08-04 17:57:51.615
a70cbcd2-d971-4164-9264-bd552556611b	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$US9F2ehuErLqtXt3JExKLeXbAMXQXLF64IqMteRSSBfNG.EMFyk0i	2026-08-11 17:45:04	2026-08-04 17:58:05.374	2026-08-04 17:45:04.676	2026-08-04 17:58:05.374
25191725-d599-4196-9116-0641d52613c0	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$dskOULrp1zVFybUWpPs8D.vW7VdaJKmCzCellz/vu9pJhxdYwMF2C	2026-08-11 17:58:05	2026-08-04 19:10:24.32	2026-08-04 17:58:05.665	2026-08-04 19:10:24.322
d01507b4-61b1-4443-afa7-04d003e81a91	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$PESWGXrkSh6DK3f2JDha5OiJKMK/Rsu4LNdYNMEkB7VbIQOrW82p2	2026-08-11 19:10:24	\N	2026-08-04 19:10:24.62	2026-08-04 19:10:24.62
29887ac9-8859-4f7e-a65c-e86750c8f122	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$kyzStxTdrfxKW9tTfH10B.NODksYza6hWY0bzcOUxK3.b9B2drxKK	2026-08-11 17:57:51	2026-08-04 19:11:43.07	2026-08-04 17:57:51.93	2026-08-04 19:11:43.07
7f97d55f-a16b-4e0c-9340-db7bc84855f5	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$mjsvymphP24dgQb4//dYD.ewYaReNNIjOzUe.TvHNXIMA515h7J5u	2026-08-11 19:11:43	2026-08-04 19:12:13.642	2026-08-04 19:11:43.343	2026-08-04 19:12:13.642
bf3139ab-f364-4b69-87f3-6ee0381d768c	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$2bHfiJTI1oBpI1dZ5.eCRugJC8yiX4LnA0Tb657m0Wl3Fgnl4Jawq	2026-08-11 19:56:36	2026-08-04 19:56:39.652	2026-08-04 19:56:37.251	2026-08-04 19:56:39.652
ec65a777-9a43-41a7-b6de-1acebf598bc0	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$gW0.pO0diYPX6JN3fBEpQ.TdiVniEFfBHZr6U21Rzzyg6pJepk78S	2026-08-11 19:12:13	2026-08-04 20:05:01.815	2026-08-04 19:12:13.932	2026-08-04 20:05:01.815
83825d82-5b30-4227-bae4-b9b306ff94b4	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$tUwk2PXcW8Yh.BHpgw50uezZty.U9IgA6eKZzYLu/Ham4jal2ldIS	2026-08-11 20:05:01	2026-08-04 20:05:11.747	2026-08-04 20:05:02.138	2026-08-04 20:05:11.747
c23cfb1c-cb66-4423-9dca-03d18c8613d0	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$ao1wzscshs.uYL8oeswi0.vT2o76OyrJHFSVjiFBDb4k67Nc9AIby	2026-08-11 20:05:11	2026-08-04 20:05:14.647	2026-08-04 20:05:12.043	2026-08-04 20:05:14.647
f4c228b3-6c80-485c-b29a-3960de38aa62	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$0r4Ph9JF27EK1FApl.CEI.Z5QqTGTkpUYS0xJWGv/Fzpe3g0/C7bK	2026-08-11 20:05:14	2026-08-04 20:05:39.397	2026-08-04 20:05:14.957	2026-08-04 20:05:39.397
1bc22f86-c5e9-48a7-98ec-cde62729edc4	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$zD/EsVa9kDLfdX8DyWMuxeu43RWsIoHdngalhkoRKTuNwZ5KxwdEu	2026-08-11 19:56:42	2026-08-04 20:15:17.387	2026-08-04 19:56:42.364	2026-08-04 20:15:17.393
9b64c9d5-e37e-4f9f-ab99-c5528a6fb69f	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$Pbu.Fsk7OleS4YJd7YcijuKqx96T1xHX94P1CE.dOXudmJOPUa5bS	2026-08-11 20:05:39	2026-08-04 21:24:50.234	2026-08-04 20:05:39.734	2026-08-04 21:24:50.235
f3de376a-f271-41b1-b33c-b48ec9463891	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$0YdrH3NgsNUUhoXM6P/ntePIho4fdPrXCez3paSQvrjqApbzoYAp.	2026-08-11 20:15:17	2026-08-04 21:33:57.92	2026-08-04 20:15:17.689	2026-08-04 21:33:57.926
1f5f6950-3f1a-401f-8472-556043d93df4	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$W1u2QK30fy62uKI5oEZoLuLXMx9rzLfKzr5aZH5svZ5za/CmudLDm	2026-08-11 21:25:18	2026-08-04 21:33:58.232	2026-08-04 21:25:18.761	2026-08-04 21:33:58.232
8c58c7cc-e935-46f7-8531-94af17b3d817	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$ygFuOMmQQseOMxMTaBgbLex5MT1FVdPe59JKw9G9KPOCVwjxhUIEK	2026-08-11 21:33:58	2026-08-04 21:38:00.596	2026-08-04 21:33:58.618	2026-08-04 21:38:00.601
5563d677-1a31-42ea-8668-075424ae4c9a	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$zBZLdOoXJPWxo2fVXSDplOVijjNSt7llFtfH2wUjT35kwNfAdti8G	2026-08-11 21:33:58	2026-08-04 21:39:03.982	2026-08-04 21:33:58.83	2026-08-04 21:39:03.982
1e8f66df-3df9-41b7-bf9b-562468314d50	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$x1vK0m0PXbAfikRk3l1OTehppQLWIlj7U7g3BypYAxYm6WQebJ96O	2026-08-11 21:39:03	2026-08-04 21:54:22.066	2026-08-04 21:39:04.263	2026-08-04 21:54:22.072
eb4b4d2f-8a8b-4885-8d68-5db1dc646e61	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$TZ3SJw5VKjAKiIr2RVktge3.rHptkGlaguQjlQCVckmyh1cUNc/wO	2026-08-11 21:54:22	2026-08-04 21:54:28.809	2026-08-04 21:54:22.358	2026-08-04 21:54:28.809
1925a8b9-b1ee-4104-9ca5-ee10abe3c937	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$MV6TJmSwSMTv1pHf6xPHouzn3bvFyjgvw4YJbajoFr/OcAhELLWfK	2026-08-11 21:38:00	2026-08-04 21:54:38.696	2026-08-04 21:38:00.9	2026-08-04 21:54:38.696
86dd25c7-9233-4a6f-ab4d-1c516bd13e96	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$KEKb0jgnFPkO44LjK1yQ0OuBaMPx2f3CSt981E/yTlqtjNTHu53vG	2026-08-11 21:54:28	2026-08-04 21:55:19.159	2026-08-04 21:54:29.084	2026-08-04 21:55:19.159
594ec9d5-5993-40f2-91e9-ed443b413988	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$HFuuL82eFj7LbBB4aUvtPungGxu/tWd493ZVAa5WuJtJd8jMPhdmi	2026-08-11 21:55:19	2026-08-04 21:55:37.934	2026-08-04 21:55:19.437	2026-08-04 21:55:37.935
febd987f-f4f0-4215-99c6-58f895fe73f3	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$iIZaJzQLJBTxX3N3Y2Hcze1pbUUk/5puASLvkT88vEfCJQjCiWCZS	2026-08-11 21:55:37	2026-08-04 22:03:34.998	2026-08-04 21:55:38.207	2026-08-04 22:03:35.005
fae540aa-3039-4cd7-9d58-9ceac2104d93	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$nLxC.U0MWHHDAm3bXk1JCOum118HclwEBYeEVVo3iuUDvMFmdahI2	2026-08-11 22:03:35	2026-08-04 22:04:13.011	2026-08-04 22:03:35.301	2026-08-04 22:04:13.011
eca00545-b892-434f-b59e-6e92eb9cd37a	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$3axBp0ZUCLjy8cX2EpkDo..DbktA56YwxKg8nxp.KwhG5w/RaomvW	2026-08-11 22:04:13	2026-08-04 22:06:15.599	2026-08-04 22:04:13.335	2026-08-04 22:06:15.606
89eb6668-5c78-4fae-a261-96a4a5cb25cc	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$Z/2QC33jUx.EjpN6Fs/qt.2SEZJ6KCvIowKeXIMqnpvMyAkfFEdCO	2026-08-11 22:06:15	2026-08-04 22:07:54.671	2026-08-04 22:06:15.902	2026-08-04 22:07:54.671
056b3bcb-0c3f-4aa1-af2a-b4d7b264d50c	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$PJaqtKIVGPFkZK4HIy3QA.V4Xe5XrD2b3z9RUGPz.cKeHWPbCUl9G	2026-08-11 22:07:54	2026-08-04 22:08:04.231	2026-08-04 22:07:54.948	2026-08-04 22:08:04.231
8a8c3110-b836-4960-a0ce-68415cbdd77e	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$AW9n3R8Yc5MWaesk6EqpkO7XXIAjWDYyP0GvgFKwHtGCTFVaTJ.yq	2026-08-11 21:54:38	2026-08-04 22:08:14.834	2026-08-04 21:54:38.973	2026-08-04 22:08:14.834
479c6a1d-27c6-44ad-9937-bf3f84886fa5	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$ilmTHjAZV91Z24ewQ2nOwOTCgPSSZ96tcshTwQwju2o/Oe2BM37Ba	2026-08-11 22:08:14	2026-08-04 22:11:00.006	2026-08-04 22:08:15.11	2026-08-04 22:11:00.006
fbded96b-603b-4274-98c5-db156a4095ba	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$iVGM1ZrTj8EswsD4HKJQy.dDB1qZZh5nPgqEsTpiFNVMAzG7b4l3K	2026-08-11 22:11:19	2026-08-04 22:11:22.29	2026-08-04 22:11:19.292	2026-08-04 22:11:22.291
b9554092-781d-4871-9add-922237a282c5	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$vgg66oC.04ZQaJkb/XlZZOO56xlegoKp8bVlt77Dp5IpmUQp9V4/e	2026-08-11 22:11:22	2026-08-04 22:15:53.639	2026-08-04 22:11:22.569	2026-08-04 22:15:53.639
596a071e-be22-4b79-bdf2-7c1269f3fbdf	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$3cWsiTYLHtLBC4zsNd/VNulgsDAPfmBqZFkkfsihZtn5SPk3tpuJq	2026-08-11 22:15:53	2026-08-04 22:23:14.615	2026-08-04 22:15:53.938	2026-08-04 22:23:14.615
94fcbcc0-4f6d-4bbc-a14d-92234eee7ef4	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$CIH44ZmEwY2IXckNg0HsH.4bgCr7P6qD3KIvZ3OuA44k6yuz2t/T2	2026-08-11 22:23:14	2026-08-04 22:23:21.766	2026-08-04 22:23:14.89	2026-08-04 22:23:21.766
773ba33e-5e3e-4a3f-82f1-39109442c082	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$JIKIlmfazbAncqX1YtiyDuHQ2ljGGsmpef8NkvPJ.lKztcVV5uqXy	2026-08-11 22:11:00	2026-08-04 22:30:17.457	2026-08-04 22:11:00.285	2026-08-04 22:30:17.457
2e3639b2-a1da-4636-b245-12a1ee397119	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$lyPkwmpHSouPgeLvusRJX.ZHRI1r7fdUYKgU4hALn861NJRVzN9Da	2026-08-11 22:30:17	2026-08-04 22:30:29.12	2026-08-04 22:30:17.744	2026-08-04 22:30:29.12
04b806f9-de6e-47e9-8b84-6c184a0cd621	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$JMdWEJeJLitgA71dPxw/w.GPQZ/08vDcsZcPp.c/F/blm60QDNvBy	2026-08-11 22:30:29	2026-08-04 22:30:35.94	2026-08-04 22:30:29.403	2026-08-04 22:30:35.941
4b2dddf5-b4bd-4e35-aeb2-a998742561a3	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$JQ6z4muHXSbMb/Ujxg2NnemoFFGV1MQacyrAdMJSRtYS0XuMBcxAO	2026-08-11 22:30:35	2026-08-04 22:31:22.09	2026-08-04 22:30:36.215	2026-08-04 22:31:22.09
458986c8-797e-4916-bf1d-505c63e5c424	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$bo2JTHzjtqN/iXZElk/.OeoO2CS57.hN/.zjdsoqFCkpif0pggdLG	2026-08-11 22:23:21	2026-08-04 22:31:33.018	2026-08-04 22:23:22.044	2026-08-04 22:31:33.019
5c033026-1154-40f8-a604-665c4446acaa	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$e0JpPgfMIKyBfWNraOq6hue6YL5laWs5MBDfgJ0JDLjmIPHPRh2vm	2026-08-11 22:31:33	2026-08-04 22:31:47.913	2026-08-04 22:31:33.301	2026-08-04 22:31:47.913
00bd1137-9ea8-404c-b46a-2dc5bdfa28d2	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$wjwKWvJ614E5lwS2WtZim.7X40ycbYwgZE3JV0FwpCSG7XHb/C8mu	2026-08-11 22:31:47	2026-08-04 22:31:53.336	2026-08-04 22:31:48.194	2026-08-04 22:31:53.336
02250375-fc79-482e-bea2-9ff322eab7f3	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$0zm/GmkwTsvBCJ4128bPe.i8X3.Bh8r/MY/oNP3lhsqvKOSQY9enu	2026-08-12 16:10:14	2026-08-05 16:11:21.619	2026-08-05 16:10:14.706	2026-08-05 16:11:21.619
b4fb08c0-30ac-4986-abac-877be1dc91ae	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$xWjepjW4YV8YzNDnrBdpfu.MS5mg9TVv0rB9iQA56mWLDNR6yXMdq	2026-08-11 22:31:53	2026-08-04 22:36:39.78	2026-08-04 22:31:53.613	2026-08-04 22:36:39.78
3f3a0e80-d542-4706-b56b-30e89df555b7	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$y55112Aa9HEqSJNI7iqTW.dWnK45RTKHbrjQEUiWaNeIKUo92XbZ.	2026-08-11 22:36:39	\N	2026-08-04 22:36:39.974	2026-08-04 22:36:39.974
e436deb8-2464-447c-b63f-e2f0ddb53305	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$NuIeI/03.mVFPDckcxvvDeUx1Mjnp9m4zkRdBsztaOxzWZbtlpKpO	2026-08-11 22:36:39	\N	2026-08-04 22:36:40.254	2026-08-04 22:36:40.254
70a50b10-1498-44c5-a563-ced110b59a96	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$KfAOw7aoBGlGaxE7H.7KnuDCMVwtvM1a6eIup4BWwcDNZ8fL7mo7i	2026-08-11 22:31:22	2026-08-05 14:29:01.287	2026-08-04 22:31:22.39	2026-08-05 14:29:01.296
ddf46f49-2a13-42f8-87be-dfe7debe3c3d	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$lVVIpPZewJO7Y2Rz.VBzbu6wFXFngD2R0EK.92pEmBATUi05ISEgS	2026-08-12 14:29:01	2026-08-05 14:29:22.477	2026-08-05 14:29:01.633	2026-08-05 14:29:22.477
93236577-c1d0-42f4-ad5c-cd41ed7ca174	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$cFau8PP4mNaPBW.IiR4kJOoQGHzGLioqpSsIgCp4kHIkhDkPP/ub.	2026-08-11 22:36:42	2026-08-05 14:29:40.707	2026-08-04 22:36:42.293	2026-08-05 14:29:40.708
6d3fe8ca-c008-41b5-9947-2fa236735920	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$uqiIOxM17bkT.4b.9nVbfO0oRxntxhYuoGdjJec8RKiNls1.8tOpO	2026-08-12 14:29:40	2026-08-05 14:29:44.581	2026-08-05 14:29:40.993	2026-08-05 14:29:44.581
51066efd-9d86-4862-8cf9-78280fc164a3	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$S2FZpJUpacR5GHmTifZBGeeoPoEiOo1uvsYssC5e3vxRj2iRDZFPm	2026-08-12 14:29:22	2026-08-05 14:31:34.266	2026-08-05 14:29:22.759	2026-08-05 14:31:34.267
e89fb499-b6d5-4a6a-9e5d-887434acc75b	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$2B//5F9xkr4R9NJNhbgM/.XSyxXqlmr3EUlYDq9nmH0ljXqIrYjP6	2026-08-12 14:31:34	2026-08-05 14:31:49.708	2026-08-05 14:31:34.568	2026-08-05 14:31:49.708
78f2e7a3-ac67-48f3-b4d5-003e3cf622e3	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$C0smdplODUp7GnyctawEqOqDiOd0vZ2s0RfWsh.87znGdq5CKArnO	2026-08-12 14:29:44	2026-08-05 14:31:50.202	2026-08-05 14:29:44.863	2026-08-05 14:31:50.202
128301d3-9326-4064-a5ec-d56113545aff	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$/h7Q8AFT8S0GAdLgktP3wOLajotUbAM0N7uxHbXdeNl0wC.mQx.z2	2026-08-12 14:31:49	2026-08-05 14:31:54.092	2026-08-05 14:31:50.284	2026-08-05 14:31:54.092
0ab0b950-c46e-48b3-ae83-d8dcfa6f3b76	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$GkwEILH/kSFqNmlyxsxxw.FP5fDacM2CgE0eG95w3oMit7et8zmvi	2026-08-12 14:31:54	2026-08-05 14:32:06.425	2026-08-05 14:31:54.374	2026-08-05 14:32:06.425
0ecf74f9-be6c-40fb-a024-5723f11ebd87	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$.LFNofQDQx6Ojabc77kNWOtV3kgT1Z4NdbQ4dBcglW43bSataWd9a	2026-08-12 14:32:06	2026-08-05 14:32:07.999	2026-08-05 14:32:06.709	2026-08-05 14:32:07.999
d8671772-acb0-49e9-a7a1-a16bd1fd522a	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$eUvVJlb/V1ZnAgio4bNq6eAKOgJZi8wMZ1S.JNOADFQVxXHVa8IYe	2026-08-12 14:31:50	2026-08-05 14:34:53.251	2026-08-05 14:31:50.561	2026-08-05 14:34:53.252
a3bf3543-9129-4c17-81f2-736533499582	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$UEauN3.8BgVY5lUSIzBptedzCQRbq3uzgNSWWDqFV8fLfjBsnY4Zy	2026-08-12 14:32:08	2026-08-05 14:36:29.146	2026-08-05 14:32:08.271	2026-08-05 14:36:29.146
b9b4f9a9-9e07-4530-bf71-d57398ce7611	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$OlU0uUy4Z9SGVM4GYkE9lensJnv/1QW.jEp4cCaVBY4qHDcgVoppa	2026-08-12 14:36:29	2026-08-05 14:45:20.337	2026-08-05 14:36:29.433	2026-08-05 14:45:20.338
951f6109-959c-4723-b8a5-d2a8b99e83c8	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$zX4oSrT4lFVyDb.56DpikOZH1IbTZeriM9LohqRJOIn49JB30S8b2	2026-08-12 14:34:53	2026-08-05 14:45:20.33	2026-08-05 14:34:53.544	2026-08-05 14:45:20.337
95807fe5-4c5f-400b-a586-044fdd27e310	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$rmFlkX9gawidMBWstQBRz.A8MMcjqsY7vrKW3eRSymiqEd03Aw8Nm	2026-08-12 14:45:20	2026-08-05 15:29:23.249	2026-08-05 14:45:20.936	2026-08-05 15:29:23.249
b66e69c3-bf52-4150-9130-3cde684ecb60	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$IajWRVB1Uek/0M8NaacZCuO5PdIbWobuSfQK71ib/iLOqvbQ1sfp2	2026-08-12 15:29:23	2026-08-05 15:57:27.246	2026-08-05 15:29:23.551	2026-08-05 15:57:27.246
2e61375f-5f51-461e-af75-54b7865487d0	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$WFNb41McnvCFCtVj7CweKOh5CnyZH4OyRcTgyBOCXc9/S2GN6Epl6	2026-08-12 14:45:20	2026-08-05 15:57:45.776	2026-08-05 14:45:20.935	2026-08-05 15:57:45.776
143bb27b-5a6f-49a2-abc3-0f8d0934b7c7	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$CFq4aoosT1mKHZtQBDh8BO.vL1IrhuN8R6IRvEnfoWyaYP9dMiNVK	2026-08-12 15:57:45	2026-08-05 16:10:08.799	2026-08-05 15:57:46.11	2026-08-05 16:10:08.8
07095a94-3eaa-4553-b65f-ede35544db1f	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$2qwYl9yixacNdiDruec/AeV8DNliFEJ.pm2OSaqdivov.pQdUuS3G	2026-08-12 15:57:27	2026-08-05 16:10:14.421	2026-08-05 15:57:27.565	2026-08-05 16:10:14.422
70acd23d-bd83-4d72-a16b-bd06dd6558ab	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$1lv/c7eB5goYQobDH7pM/.z6GtLFqtfv7hDEZV8PMlwYvf7si0Daa	2026-08-12 16:11:21	2026-08-05 16:14:52.075	2026-08-05 16:11:21.907	2026-08-05 16:14:52.075
3281a476-b64d-4e78-b7b1-6c7aef99e989	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$ih3SMvERZY0B9NviiI8hWebeQnXCOW.EdGpeK83vDkwCpnFVy47M.	2026-08-12 16:14:52	2026-08-05 16:14:53.788	2026-08-05 16:14:52.379	2026-08-05 16:14:53.788
fa05a56b-805c-476f-afee-5e24a394a07c	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$M8rQp0wBfdwduG5fAfuu8OHcQVy6XDFkln0J1ppFs4z7tMeSBVC8e	2026-08-12 16:14:53	2026-08-05 16:14:54.993	2026-08-05 16:14:54.099	2026-08-05 16:14:54.993
ac0d9382-ab36-41ea-add9-b6959d5d56c7	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$gt89QN7K8zTaE4Wu1ErndeYu1EBrIjS07Sm0HuHwUuTuxzLfbGeSa	2026-08-12 16:14:54	2026-08-05 16:43:12.284	2026-08-05 16:14:55.272	2026-08-05 16:43:12.293
d16f1cd2-cdfa-477b-b657-90ee712d899c	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$ZRMTyf8mB0iTrbSOYyAv6uRvJPEEIoRI74bQ5kD1gS3iHrLYtKacq	2026-08-12 16:10:08	2026-08-05 16:44:40.703	2026-08-05 16:10:09.085	2026-08-05 16:44:40.703
baa0e408-acf4-4cef-96ed-76b499f90cd7	11c5fe46-3c98-468f-822b-a481a6d2f439	$2b$12$rRePL.j.3QFPkd6l92PVFeXzXDJ2zkWkLaDhZkkL1tLDGwaDAeNoa	2026-08-12 16:44:40	\N	2026-08-05 16:44:40.983	2026-08-05 16:44:40.983
058034a6-de52-44dd-bd2a-82f2cee3089f	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$ffamOdTzVnvc.ur5CbWfouvVw4KtU65SoYnXDNXJZBXLmepgWIsvm	2026-08-12 16:43:12	2026-08-05 16:45:15.368	2026-08-05 16:43:12.588	2026-08-05 16:45:15.369
b9a845c0-1be8-44fb-a33e-b5c559b48cd3	737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	$2b$12$64ctMnjAow87qqte9isEaetiiQOe8e2Gxbrd3d0B3ghfXdRrKQqsu	2026-08-12 16:45:15	2026-08-05 17:08:13.225	2026-08-05 16:45:15.644	2026-08-05 17:08:13.225
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, "passwordHash", "firstName", "lastName", phone, "createdAt", "updatedAt", "documentType", "documentNumber", "avatarUrl", "emailVerifiedAt", "documentVerifiedAt", status, "lastLoginAt") FROM stdin;
49e65655-a6bb-4f9b-bfcc-a1c57831852f	miguelnc2502@gmail.com	$2b$12$3Y0KPLh1HcMF4O9spKJ/F.HOAgb1lU4bw5H/Kg2kIyJJdrHwWYF6O	Miguel	Nicolas	978290527	2026-07-20 17:54:40.888	2026-07-30 22:22:36.466	DNI	76466972	\N	\N	\N	ACTIVE	2026-07-30 22:22:36.464
11c5fe46-3c98-468f-822b-a481a6d2f439	admin@kapos.local	$2b$12$UHe2sMKaEv1QZGJAXBTo4eqdvW8olf12WspGAK.CcjqzzxTbckSo2	Super	Admin	\N	2026-07-31 17:40:02.861	2026-08-04 21:52:35.342	PASSPORT	ADMIN	\N	\N	\N	ACTIVE	2026-08-04 19:56:42.086
45cdd238-68d7-42b4-bf51-3562ceb7815f	luis@gmail.com	$2b$12$SrOt0TH3zv9iLAPD3W4C6uRaRiOjci083wAlsWzB/A9cq43mAs7a6	Luis	Cachi	923978456	2026-08-05 16:11:03.483	2026-08-05 16:11:03.483	DNI	78456132	\N	\N	\N	ACTIVE	\N
737ec0ae-08d9-4b1b-b3e5-36a3c5f06fe6	diego@gmail.com	$2b$12$Gg3g6F.uuaeNPl7Zo7MtmeZyeGbB5gP4QDVMqUhuTzBsPk1mA7VpC	Diego	Diaz	987654321	2026-08-03 22:32:50.245	2026-08-05 16:45:24.783	DNI	87654321	\N	\N	\N	ACTIVE	2026-08-04 22:36:42.013
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f759c123-0a43-4987-bcce-0baecd88100a	382463591586cb879bdcde83d456ab8430a07ab4a833be21ffc67e277331867f	2026-07-18 10:53:36.48987-05	20260717175000_init_identity	\N	\N	2026-07-18 10:53:36.45693-05	1
61626ab1-0734-4c1a-a836-f863d030d1c0	1949dee8c9ccf75d6929a9217ceadd4cf8544ce7696f129cbb55df892b2f862f	2026-07-18 12:22:35.929328-05	20260718123000_evolve_shared_identity	\N	\N	2026-07-18 12:22:35.895072-05	1
62a26d4b-a87f-40c4-a857-f641d2bbc8c8	68074d0f4294f7f116747bdbcee4fbebe07a203208a1bf2479e8e13ae356bd1c	2026-07-31 12:29:31.700823-05	20260731172931_init_kapos_foundation	\N	\N	2026-07-31 12:29:31.575288-05	1
aab5f718-5e01-4946-a321-9f79a20e6b5d	bec2947d33797b71cbf5139f131173ca5b8a0c587b6adff9dc0cbc5d1a35121e	2026-08-03 16:48:39.350083-05	20260803182000_add_permission_overrides	\N	\N	2026-08-03 16:48:39.317523-05	1
4b2e18fb-99d7-4d95-b009-d7ecaf4262f1	d5e28898d47b225e81060537a8cad26c79e51b5b049e710243122d8a6ec39d0f	2026-08-03 16:49:47.544917-05	20260803214947_sync_permission_overrides	\N	\N	2026-08-03 16:49:47.542851-05	1
99bf437f-b407-41c3-8177-396a45f78e4a	e2512dc8f2c656734d26092e772a97c2ebb5efaf3da680b3dad035a6d1aadc41	2026-08-04 12:07:37.4553-05	20260804103000_add_erp_settings_catalog	\N	\N	2026-08-04 12:07:37.382041-05	1
3f9a020b-665b-4d41-9c4b-a68bdd412926	df9250f64a094a4d1d8eeaca2022da4a8f29cbb1a7cd32d0741b389fa252115f	2026-08-04 16:51:54.821556-05	20260804115000_add_cash_module	\N	\N	2026-08-04 16:51:54.744214-05	1
bf7ded43-23aa-477c-90f1-24fbe3b2d4be	f1cb931434eeb1d488a76eebd597b2ed58c6691d7d67b0a17eeb447e57b2a50c	2026-08-04 17:04:28.565109-05	20260804123000_add_role_status	\N	\N	2026-08-04 17:04:28.526388-05	1
\.


--
-- Name: Branch Branch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_pkey" PRIMARY KEY (id);


--
-- Name: CashMovement CashMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashMovement"
    ADD CONSTRAINT "CashMovement_pkey" PRIMARY KEY (id);


--
-- Name: CashRegister CashRegister_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashRegister"
    ADD CONSTRAINT "CashRegister_pkey" PRIMARY KEY (id);


--
-- Name: CashSession CashSession_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashSession"
    ADD CONSTRAINT "CashSession_pkey" PRIMARY KEY (id);


--
-- Name: CustomerProfile CustomerProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerProfile"
    ADD CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY (id);


--
-- Name: MembershipBranch MembershipBranch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipBranch"
    ADD CONSTRAINT "MembershipBranch_pkey" PRIMARY KEY (id);


--
-- Name: MembershipPermissionOverride MembershipPermissionOverride_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipPermissionOverride"
    ADD CONSTRAINT "MembershipPermissionOverride_pkey" PRIMARY KEY (id);


--
-- Name: MembershipRole MembershipRole_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipRole"
    ADD CONSTRAINT "MembershipRole_pkey" PRIMARY KEY (id);


--
-- Name: Membership Membership_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_pkey" PRIMARY KEY (id);


--
-- Name: OAuthAccount OAuthAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OAuthAccount"
    ADD CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY (id);


--
-- Name: OrganizationModule OrganizationModule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrganizationModule"
    ADD CONSTRAINT "OrganizationModule_pkey" PRIMARY KEY (id);


--
-- Name: OrganizationSetting OrganizationSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrganizationSetting"
    ADD CONSTRAINT "OrganizationSetting_pkey" PRIMARY KEY (id);


--
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);


--
-- Name: PaymentMethod PaymentMethod_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentMethod"
    ADD CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: PlatformAccessPermissionOverride PlatformAccessPermissionOverride_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformAccessPermissionOverride"
    ADD CONSTRAINT "PlatformAccessPermissionOverride_pkey" PRIMARY KEY (id);


--
-- Name: PlatformAccessRole PlatformAccessRole_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformAccessRole"
    ADD CONSTRAINT "PlatformAccessRole_pkey" PRIMARY KEY (id);


--
-- Name: PlatformAccess PlatformAccess_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformAccess"
    ADD CONSTRAINT "PlatformAccess_pkey" PRIMARY KEY (id);


--
-- Name: PlatformModule PlatformModule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformModule"
    ADD CONSTRAINT "PlatformModule_pkey" PRIMARY KEY (id);


--
-- Name: PlatformSubmodule PlatformSubmodule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformSubmodule"
    ADD CONSTRAINT "PlatformSubmodule_pkey" PRIMARY KEY (id);


--
-- Name: ProductCategory ProductCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_pkey" PRIMARY KEY (id);


--
-- Name: ProductStock ProductStock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductStock"
    ADD CONSTRAINT "ProductStock_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Branch_organizationId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Branch_organizationId_code_key" ON public."Branch" USING btree ("organizationId", code);


--
-- Name: Branch_organizationId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Branch_organizationId_status_idx" ON public."Branch" USING btree ("organizationId", status);


--
-- Name: CashMovement_cashSessionId_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CashMovement_cashSessionId_type_idx" ON public."CashMovement" USING btree ("cashSessionId", type);


--
-- Name: CashMovement_createdByUserId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CashMovement_createdByUserId_idx" ON public."CashMovement" USING btree ("createdByUserId");


--
-- Name: CashMovement_paymentMethodId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CashMovement_paymentMethodId_idx" ON public."CashMovement" USING btree ("paymentMethodId");


--
-- Name: CashRegister_branchId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CashRegister_branchId_status_idx" ON public."CashRegister" USING btree ("branchId", status);


--
-- Name: CashRegister_organizationId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CashRegister_organizationId_code_key" ON public."CashRegister" USING btree ("organizationId", code);


--
-- Name: CashRegister_organizationId_status_sortOrder_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CashRegister_organizationId_status_sortOrder_idx" ON public."CashRegister" USING btree ("organizationId", status, "sortOrder");


--
-- Name: CashSession_branchId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CashSession_branchId_status_idx" ON public."CashSession" USING btree ("branchId", status);


--
-- Name: CashSession_cashRegisterId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CashSession_cashRegisterId_status_idx" ON public."CashSession" USING btree ("cashRegisterId", status);


--
-- Name: CashSession_organizationId_status_openedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CashSession_organizationId_status_openedAt_idx" ON public."CashSession" USING btree ("organizationId", status, "openedAt");


--
-- Name: CustomerProfile_organizationId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomerProfile_organizationId_status_idx" ON public."CustomerProfile" USING btree ("organizationId", status);


--
-- Name: CustomerProfile_userId_organizationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CustomerProfile_userId_organizationId_key" ON public."CustomerProfile" USING btree ("userId", "organizationId");


--
-- Name: MembershipBranch_branchId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipBranch_branchId_idx" ON public."MembershipBranch" USING btree ("branchId");


--
-- Name: MembershipBranch_membershipId_branchId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MembershipBranch_membershipId_branchId_key" ON public."MembershipBranch" USING btree ("membershipId", "branchId");


--
-- Name: MembershipPermissionOverride_membershipId_effect_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipPermissionOverride_membershipId_effect_idx" ON public."MembershipPermissionOverride" USING btree ("membershipId", effect);


--
-- Name: MembershipPermissionOverride_membershipId_permissionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MembershipPermissionOverride_membershipId_permissionId_key" ON public."MembershipPermissionOverride" USING btree ("membershipId", "permissionId");


--
-- Name: MembershipPermissionOverride_permissionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipPermissionOverride_permissionId_idx" ON public."MembershipPermissionOverride" USING btree ("permissionId");


--
-- Name: MembershipRole_membershipId_roleId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MembershipRole_membershipId_roleId_key" ON public."MembershipRole" USING btree ("membershipId", "roleId");


--
-- Name: MembershipRole_roleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipRole_roleId_idx" ON public."MembershipRole" USING btree ("roleId");


--
-- Name: Membership_organizationId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Membership_organizationId_status_idx" ON public."Membership" USING btree ("organizationId", status);


--
-- Name: Membership_userId_organizationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON public."Membership" USING btree ("userId", "organizationId");


--
-- Name: Membership_userId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Membership_userId_status_idx" ON public."Membership" USING btree ("userId", status);


--
-- Name: OAuthAccount_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON public."OAuthAccount" USING btree (provider, "providerAccountId");


--
-- Name: OAuthAccount_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OAuthAccount_userId_idx" ON public."OAuthAccount" USING btree ("userId");


--
-- Name: OrganizationModule_organizationId_enabled_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrganizationModule_organizationId_enabled_idx" ON public."OrganizationModule" USING btree ("organizationId", enabled);


--
-- Name: OrganizationModule_organizationId_moduleKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OrganizationModule_organizationId_moduleKey_key" ON public."OrganizationModule" USING btree ("organizationId", "moduleKey");


--
-- Name: OrganizationSetting_organizationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OrganizationSetting_organizationId_key" ON public."OrganizationSetting" USING btree ("organizationId");


--
-- Name: Organization_documentNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Organization_documentNumber_idx" ON public."Organization" USING btree ("documentNumber");


--
-- Name: Organization_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Organization_slug_key" ON public."Organization" USING btree (slug);


--
-- Name: Organization_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Organization_status_idx" ON public."Organization" USING btree (status);


--
-- Name: PaymentMethod_organizationId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PaymentMethod_organizationId_code_key" ON public."PaymentMethod" USING btree ("organizationId", code);


--
-- Name: PaymentMethod_organizationId_enabled_sortOrder_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PaymentMethod_organizationId_enabled_sortOrder_idx" ON public."PaymentMethod" USING btree ("organizationId", enabled, "sortOrder");


--
-- Name: Permission_audience_scope_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Permission_audience_scope_idx" ON public."Permission" USING btree (audience, scope);


--
-- Name: Permission_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Permission_key_key" ON public."Permission" USING btree (key);


--
-- Name: Permission_moduleKey_submoduleKey_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Permission_moduleKey_submoduleKey_idx" ON public."Permission" USING btree ("moduleKey", "submoduleKey");


--
-- Name: PlatformAccessPermissionOverride_permissionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlatformAccessPermissionOverride_permissionId_idx" ON public."PlatformAccessPermissionOverride" USING btree ("permissionId");


--
-- Name: PlatformAccessPermissionOverride_platformAccessId_effect_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlatformAccessPermissionOverride_platformAccessId_effect_idx" ON public."PlatformAccessPermissionOverride" USING btree ("platformAccessId", effect);


--
-- Name: PlatformAccessPermissionOverride_platformAccessId_permissio_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PlatformAccessPermissionOverride_platformAccessId_permissio_key" ON public."PlatformAccessPermissionOverride" USING btree ("platformAccessId", "permissionId");


--
-- Name: PlatformAccessRole_platformAccessId_roleId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PlatformAccessRole_platformAccessId_roleId_key" ON public."PlatformAccessRole" USING btree ("platformAccessId", "roleId");


--
-- Name: PlatformAccessRole_roleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlatformAccessRole_roleId_idx" ON public."PlatformAccessRole" USING btree ("roleId");


--
-- Name: PlatformAccess_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlatformAccess_status_idx" ON public."PlatformAccess" USING btree (status);


--
-- Name: PlatformAccess_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PlatformAccess_userId_key" ON public."PlatformAccess" USING btree ("userId");


--
-- Name: PlatformModule_audience_sortOrder_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlatformModule_audience_sortOrder_idx" ON public."PlatformModule" USING btree (audience, "sortOrder");


--
-- Name: PlatformModule_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PlatformModule_key_key" ON public."PlatformModule" USING btree (key);


--
-- Name: PlatformSubmodule_moduleId_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PlatformSubmodule_moduleId_key_key" ON public."PlatformSubmodule" USING btree ("moduleId", key);


--
-- Name: PlatformSubmodule_permissionKey_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlatformSubmodule_permissionKey_idx" ON public."PlatformSubmodule" USING btree ("permissionKey");


--
-- Name: PlatformSubmodule_route_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PlatformSubmodule_route_key" ON public."PlatformSubmodule" USING btree (route);


--
-- Name: ProductCategory_organizationId_isActive_sortOrder_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductCategory_organizationId_isActive_sortOrder_idx" ON public."ProductCategory" USING btree ("organizationId", "isActive", "sortOrder");


--
-- Name: ProductCategory_organizationId_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductCategory_organizationId_slug_key" ON public."ProductCategory" USING btree ("organizationId", slug);


--
-- Name: ProductCategory_parentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductCategory_parentId_idx" ON public."ProductCategory" USING btree ("parentId");


--
-- Name: ProductStock_branchId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductStock_branchId_status_idx" ON public."ProductStock" USING btree ("branchId", status);


--
-- Name: ProductStock_productId_branchId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductStock_productId_branchId_key" ON public."ProductStock" USING btree ("productId", "branchId");


--
-- Name: Product_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_categoryId_idx" ON public."Product" USING btree ("categoryId");


--
-- Name: Product_organizationId_sku_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Product_organizationId_sku_key" ON public."Product" USING btree ("organizationId", sku);


--
-- Name: Product_organizationId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_organizationId_status_idx" ON public."Product" USING btree ("organizationId", status);


--
-- Name: RolePermission_permissionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RolePermission_permissionId_idx" ON public."RolePermission" USING btree ("permissionId");


--
-- Name: RolePermission_roleId_permissionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON public."RolePermission" USING btree ("roleId", "permissionId");


--
-- Name: Role_context_organizationId_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Role_context_organizationId_key_key" ON public."Role" USING btree (context, "organizationId", key);


--
-- Name: Role_context_organizationId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Role_context_organizationId_status_idx" ON public."Role" USING btree (context, "organizationId", status);


--
-- Name: Role_scopeKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Role_scopeKey_key" ON public."Role" USING btree ("scopeKey");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: User_documentNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_documentNumber_key" ON public."User" USING btree ("documentNumber");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Branch Branch_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CashMovement CashMovement_cashSessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashMovement"
    ADD CONSTRAINT "CashMovement_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES public."CashSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CashMovement CashMovement_createdByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashMovement"
    ADD CONSTRAINT "CashMovement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashMovement CashMovement_paymentMethodId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashMovement"
    ADD CONSTRAINT "CashMovement_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES public."PaymentMethod"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CashRegister CashRegister_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashRegister"
    ADD CONSTRAINT "CashRegister_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CashRegister CashRegister_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashRegister"
    ADD CONSTRAINT "CashRegister_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CashSession CashSession_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashSession"
    ADD CONSTRAINT "CashSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CashSession CashSession_cashRegisterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashSession"
    ADD CONSTRAINT "CashSession_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES public."CashRegister"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CashSession CashSession_closedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashSession"
    ADD CONSTRAINT "CashSession_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashSession CashSession_openedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashSession"
    ADD CONSTRAINT "CashSession_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashSession CashSession_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CashSession"
    ADD CONSTRAINT "CashSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomerProfile CustomerProfile_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerProfile"
    ADD CONSTRAINT "CustomerProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomerProfile CustomerProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerProfile"
    ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MembershipBranch MembershipBranch_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipBranch"
    ADD CONSTRAINT "MembershipBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MembershipBranch MembershipBranch_membershipId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipBranch"
    ADD CONSTRAINT "MembershipBranch_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES public."Membership"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MembershipPermissionOverride MembershipPermissionOverride_membershipId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipPermissionOverride"
    ADD CONSTRAINT "MembershipPermissionOverride_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES public."Membership"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MembershipPermissionOverride MembershipPermissionOverride_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipPermissionOverride"
    ADD CONSTRAINT "MembershipPermissionOverride_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MembershipRole MembershipRole_membershipId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipRole"
    ADD CONSTRAINT "MembershipRole_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES public."Membership"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MembershipRole MembershipRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipRole"
    ADD CONSTRAINT "MembershipRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Membership Membership_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Membership Membership_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OAuthAccount OAuthAccount_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OAuthAccount"
    ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrganizationModule OrganizationModule_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrganizationModule"
    ADD CONSTRAINT "OrganizationModule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrganizationSetting OrganizationSetting_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrganizationSetting"
    ADD CONSTRAINT "OrganizationSetting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PaymentMethod PaymentMethod_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentMethod"
    ADD CONSTRAINT "PaymentMethod_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlatformAccessPermissionOverride PlatformAccessPermissionOverride_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformAccessPermissionOverride"
    ADD CONSTRAINT "PlatformAccessPermissionOverride_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlatformAccessPermissionOverride PlatformAccessPermissionOverride_platformAccessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformAccessPermissionOverride"
    ADD CONSTRAINT "PlatformAccessPermissionOverride_platformAccessId_fkey" FOREIGN KEY ("platformAccessId") REFERENCES public."PlatformAccess"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlatformAccessRole PlatformAccessRole_platformAccessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformAccessRole"
    ADD CONSTRAINT "PlatformAccessRole_platformAccessId_fkey" FOREIGN KEY ("platformAccessId") REFERENCES public."PlatformAccess"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlatformAccessRole PlatformAccessRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformAccessRole"
    ADD CONSTRAINT "PlatformAccessRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlatformAccess PlatformAccess_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformAccess"
    ADD CONSTRAINT "PlatformAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlatformSubmodule PlatformSubmodule_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformSubmodule"
    ADD CONSTRAINT "PlatformSubmodule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public."PlatformModule"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductCategory ProductCategory_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductCategory ProductCategory_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."ProductCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductStock ProductStock_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductStock"
    ADD CONSTRAINT "ProductStock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductStock ProductStock_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductStock"
    ADD CONSTRAINT "ProductStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ProductCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Role Role_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Jft1taOnTomCkO8i4iORZM69I5oYO9V6pOr9oBRmSoIE8P8Xeqse1098elhWdvw

