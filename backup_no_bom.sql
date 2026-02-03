--
-- PostgreSQL database dump
--

\restrict 9uAKIFKPtPeCHF8ZTvNmWgFaXRc4bmYjrX3QBQduNchrQdRzZgncN0rgJEBZscT

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "users_userStatusId_fkey";
ALTER TABLE IF EXISTS ONLY public.sales DROP CONSTRAINT IF EXISTS "sales_soldBy_fkey";
ALTER TABLE IF EXISTS ONLY public.sales DROP CONSTRAINT IF EXISTS "sales_productId_fkey";
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS "returns_returnedBy_fkey";
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS "returns_productId_fkey";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "products_warehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "products_transactionTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "products_committeeId_fkey";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "products_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS "categories_parentId_fkey";
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
DROP INDEX IF EXISTS public.users_username_key;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.user_statuses_code_key;
DROP INDEX IF EXISTS public.products_sku_key;
ALTER TABLE IF EXISTS ONLY public.warehouses DROP CONSTRAINT IF EXISTS warehouses_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_statuses DROP CONSTRAINT IF EXISTS user_statuses_pkey;
ALTER TABLE IF EXISTS ONLY public.transaction_type DROP CONSTRAINT IF EXISTS transaction_type_pkey;
ALTER TABLE IF EXISTS ONLY public.sales DROP CONSTRAINT IF EXISTS sales_pkey;
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS returns_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.committees DROP CONSTRAINT IF EXISTS committees_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS public.warehouses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_statuses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.transaction_type ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.returns ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.products ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.committees ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.warehouses_id_seq;
DROP TABLE IF EXISTS public.warehouses;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.user_statuses_id_seq;
DROP TABLE IF EXISTS public.user_statuses;
DROP SEQUENCE IF EXISTS public.transaction_type_id_seq;
DROP TABLE IF EXISTS public.transaction_type;
DROP SEQUENCE IF EXISTS public.sales_id_seq;
DROP TABLE IF EXISTS public.sales;
DROP SEQUENCE IF EXISTS public.returns_id_seq;
DROP TABLE IF EXISTS public.returns;
DROP SEQUENCE IF EXISTS public.products_id_seq;
DROP TABLE IF EXISTS public.products;
DROP SEQUENCE IF EXISTS public.committees_id_seq;
DROP TABLE IF EXISTS public.committees;
DROP SEQUENCE IF EXISTS public.categories_id_seq;
DROP TABLE IF EXISTS public.categories;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public._prisma_migrations;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: antiquar
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO antiquar;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: antiquar
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: antiquar
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


ALTER TABLE public._prisma_migrations OWNER TO antiquar;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: antiquar
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    "userId" integer,
    action text NOT NULL,
    "entityType" text,
    "entityId" integer,
    "oldValues" jsonb,
    "newValues" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ipAddress" text,
    success boolean,
    "userAgent" text
);


ALTER TABLE public.audit_logs OWNER TO antiquar;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: antiquar
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_logs_id_seq OWNER TO antiquar;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: antiquar
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: antiquar
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "parentId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO antiquar;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: antiquar
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO antiquar;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: antiquar
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: committees; Type: TABLE; Schema: public; Owner: antiquar
--

CREATE TABLE public.committees (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "contactInfo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.committees OWNER TO antiquar;

--
-- Name: committees_id_seq; Type: SEQUENCE; Schema: public; Owner: antiquar
--

CREATE SEQUENCE public.committees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.committees_id_seq OWNER TO antiquar;

--
-- Name: committees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: antiquar
--

ALTER SEQUENCE public.committees_id_seq OWNED BY public.committees.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: antiquar
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    description text,
    "purchasePrice" numeric(10,2) NOT NULL,
    "salePrice" numeric(10,2) NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    "minStockLevel" integer DEFAULT 0 NOT NULL,
    "categoryId" integer,
    images text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "arrivalDate" timestamp(3) without time zone,
    "committeeId" integer,
    "warehouseId" integer,
    "transactionTypeId" integer
);


ALTER TABLE public.products OWNER TO antiquar;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: antiquar
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO antiquar;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: antiquar
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: returns; Type: TABLE; Schema: public; Owner: antiquar
--

CREATE TABLE public.returns (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    reason text,
    "returnedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "returnedBy" integer NOT NULL
);


ALTER TABLE public.returns OWNER TO antiquar;

--
-- Name: returns_id_seq; Type: SEQUENCE; Schema: public; Owner: antiquar
--

CREATE SEQUENCE public.returns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.returns_id_seq OWNER TO antiquar;

--
-- Name: returns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: antiquar
--

ALTER SEQUENCE public.returns_id_seq OWNED BY public.returns.id;


--
-- Name: sales; Type: TABLE; Schema: public; Owner: antiquar
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    "salePrice" numeric(10,2) NOT NULL,
    "soldAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "soldBy" integer NOT NULL
);


ALTER TABLE public.sales OWNER TO antiquar;

--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: antiquar
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sales_id_seq OWNER TO antiquar;

--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: antiquar
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- Name: transaction_type; Type: TABLE; Schema: public; Owner: antiquar
--

CREATE TABLE public.transaction_type (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.transaction_type OWNER TO antiquar;

--
-- Name: transaction_type_id_seq; Type: SEQUENCE; Schema: public; Owner: antiquar
--

CREATE SEQUENCE public.transaction_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transaction_type_id_seq OWNER TO antiquar;

--
-- Name: transaction_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: antiquar
--

ALTER SEQUENCE public.transaction_type_id_seq OWNED BY public.transaction_type.id;


--
-- Name: user_statuses; Type: TABLE; Schema: public; Owner: antiquar
--

CREATE TABLE public.user_statuses (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_statuses OWNER TO antiquar;

--
-- Name: user_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: antiquar
--

CREATE SEQUENCE public.user_statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_statuses_id_seq OWNER TO antiquar;

--
-- Name: user_statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: antiquar
--

ALTER SEQUENCE public.user_statuses_id_seq OWNED BY public.user_statuses.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: antiquar
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    "fullName" text NOT NULL,
    role text DEFAULT 'GUEST'::text NOT NULL,
    "isSuperAdmin" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userStatusId" integer,
    "sessionsRevokeAt" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO antiquar;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: antiquar
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO antiquar;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: antiquar
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: antiquar
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    address text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.warehouses OWNER TO antiquar;

--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: antiquar
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.warehouses_id_seq OWNER TO antiquar;

--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: antiquar
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: committees id; Type: DEFAULT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.committees ALTER COLUMN id SET DEFAULT nextval('public.committees_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: returns id; Type: DEFAULT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.returns ALTER COLUMN id SET DEFAULT nextval('public.returns_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- Name: transaction_type id; Type: DEFAULT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.transaction_type ALTER COLUMN id SET DEFAULT nextval('public.transaction_type_id_seq'::regclass);


--
-- Name: user_statuses id; Type: DEFAULT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.user_statuses ALTER COLUMN id SET DEFAULT nextval('public.user_statuses_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: antiquar
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d0e382c3-2bfe-49fd-a255-d7ef1dde3e10	e8b532f92fd1d754c3f406e34955f52c182f5de94006524e4b227d2f038ae7db	2026-01-07 23:56:01.902663+00	20251221223854_init	\N	\N	2026-01-07 23:56:01.814403+00	1
faf2f2bb-f382-416b-b37e-9cf7998c4ee2	ae7464c96f4c49e89904ff32de61634da7bdf4c0105815c7135025a444242849	2026-01-07 23:56:01.937094+00	20260102151231_add_warehouse_comittee_and_product_fields	\N	\N	2026-01-07 23:56:01.905877+00	1
ad0d5811-32e5-4550-bf56-373d0ae76c82	bb4b372ae5f5d2b05df3c22201becf0cb7a50fc51ef2e4e508f483eb7e84bc17	2026-01-07 23:56:01.958929+00	20260107100823_add_transaction_type	\N	\N	2026-01-07 23:56:01.940364+00	1
e7d29ed1-94aa-4c4b-b940-aa6bad1b734b	15c779f380c024f39e3790184ef08716e4d3999441d609a17e4fa4a9398e2f25	2026-01-07 23:56:01.981235+00	20260107221939_add_return_products	\N	\N	2026-01-07 23:56:01.961717+00	1
f0a4e20f-c3f7-4762-a760-4820834c41df	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2026-01-07 23:56:13.153867+00	20260107235602_add_return_products_pc	\N	\N	2026-01-07 23:56:13.137434+00	1
fa7ee9e7-7c15-4aab-83b0-ad38ed30bc4d	c8a1bc23350b7dbec9fb26de8181e444f073a25ba0bbd7e187bf751dfdca9f18	2026-01-14 03:30:19.994102+00	20260114025309_add_user_status	\N	\N	2026-01-14 03:30:19.92906+00	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: antiquar
--

COPY public.audit_logs (id, "userId", action, "entityType", "entityId", "oldValues", "newValues", "createdAt", "ipAddress", success, "userAgent") FROM stdin;
1	2	login	Auth	\N	\N	\N	2026-01-08 02:28:58.985	127.0.0.1	t	seed-script
2	2	product.create	Product	6	\N	{"name": "?????????????? Dell XPS 13"}	2026-01-08 02:28:58.99	\N	t	\N
3	2	sale.create	Sale	1	\N	{"quantity": 2, "productId": 6}	2026-01-08 02:28:58.994	\N	t	\N
4	2	return.create	Return	1	\N	{"quantity": 1, "productId": 7}	2026-01-08 02:28:58.997	\N	t	\N
5	1	product.update	Product	10	{"quantity": 84, "salePrice": "50", "purchasePrice": "35"}	{"quantity": 5, "salePrice": 50, "purchasePrice": 35}	2026-01-09 08:08:17.586	\N	\N	\N
6	1	product.update	Product	11	{"images": ["products/c774d78a-a7ca-4de7-aed5-4909930137f3.webp", "products/2d540a85-2a73-4573-9f53-4479cf2ab153.webp"], "salePrice": "12500", "purchasePrice": "10000"}	{"images": ["http://localhost:9000/antiquar-products/products/c774d78a-a7ca-4de7-aed5-4909930137f3.webp", "http://localhost:9000/antiquar-products/products/2d540a85-2a73-4573-9f53-4479cf2ab153.webp"], "salePrice": 10000, "purchasePrice": 10000}	2026-01-10 20:25:40.974	\N	\N	\N
7	1	product.update	Product	11	{"images": ["http://localhost:9000/antiquar-products/products/c774d78a-a7ca-4de7-aed5-4909930137f3.webp", "http://localhost:9000/antiquar-products/products/2d540a85-2a73-4573-9f53-4479cf2ab153.webp"], "salePrice": "10000", "purchasePrice": "10000"}	{"images": ["http://localhost:9000/antiquar-products/http://localhost:9000/antiquar-products/products/c774d78a-a7ca-4de7-aed5-4909930137f3.webp", "http://localhost:9000/antiquar-products/http://localhost:9000/antiquar-products/products/2d540a85-2a73-4573-9f53-4479cf2ab153.webp"], "salePrice": 12500, "purchasePrice": 10000}	2026-01-10 20:25:46.703	\N	\N	\N
8	1	product.update	Product	5	{"images": ["https://example.com/images/pen-blue.jpg"], "quantity": 200, "salePrice": "250", "minStockLevel": 50, "purchasePrice": "120"}	{"images": ["http://localhost:9000/antiquar-products/https://example.com/images/pen-blue.jpg"], "quantity": 2, "salePrice": 250, "minStockLevel": 1, "purchasePrice": 120}	2026-01-11 12:22:02.261	\N	\N	\N
9	1	product.update	Product	4	{"images": ["https://example.com/images/paper-a4.jpg"], "quantity": 100, "salePrice": "450", "minStockLevel": 30, "purchasePrice": "250"}	{"images": ["http://localhost:9000/antiquar-products/https://example.com/images/paper-a4.jpg"], "quantity": 1, "salePrice": 450, "minStockLevel": 1, "purchasePrice": 250}	2026-01-11 12:22:08.777	\N	\N	\N
10	1	product.update	Product	4	{"images": ["http://localhost:9000/antiquar-products/https://example.com/images/paper-a4.jpg"], "salePrice": "450", "minStockLevel": 1, "purchasePrice": "250"}	{"images": ["http://localhost:9000/antiquar-products/http://localhost:9000/antiquar-products/https://example.com/images/paper-a4.jpg"], "salePrice": 450, "minStockLevel": 2, "purchasePrice": 250}	2026-01-11 12:22:18.38	\N	\N	\N
11	1	product.update	Product	3	{"images": ["https://example.com/images/keyboard-keychron-k2.jpg"], "quantity": 15, "salePrice": "9500", "minStockLevel": 5, "purchasePrice": "6500"}	{"images": ["http://localhost:9000/antiquar-products/https://example.com/images/keyboard-keychron-k2.jpg"], "quantity": 1, "salePrice": 9500, "minStockLevel": 2, "purchasePrice": 6500}	2026-01-11 12:22:26.345	\N	\N	\N
12	1	product.update	Product	2	{"images": ["https://example.com/images/mouse-logitech-mx3.jpg"], "quantity": 25, "salePrice": "5500", "minStockLevel": 10, "purchasePrice": "3500"}	{"images": ["http://localhost:9000/antiquar-products/https://example.com/images/mouse-logitech-mx3.jpg"], "quantity": 1, "salePrice": 5500, "minStockLevel": 0, "purchasePrice": 3500}	2026-01-11 12:22:32.464	\N	\N	\N
13	1	product.update	Product	9	{"images": ["a4-paper.jpg"], "quantity": 189, "salePrice": "150", "purchasePrice": "120"}	{"images": ["http://localhost:9000/antiquar-products/a4-paper.jpg"], "quantity": 2, "salePrice": 150, "purchasePrice": 120}	2026-01-11 12:22:41.056	\N	\N	\N
14	1	product.update	Product	8	{"images": ["mechanical-keyboard.jpg"], "quantity": 31, "salePrice": "9500", "purchasePrice": "8000"}	{"images": ["http://localhost:9000/antiquar-products/mechanical-keyboard.jpg"], "quantity": 1, "salePrice": 9500, "purchasePrice": 8000}	2026-01-11 12:22:47.037	\N	\N	\N
15	1	product.update	Product	7	{"images": ["wireless-mouse.jpg"], "quantity": 50, "salePrice": "2500", "purchasePrice": "2000"}	{"images": ["http://localhost:9000/antiquar-products/wireless-mouse.jpg"], "quantity": 1, "salePrice": 2500, "purchasePrice": 2000}	2026-01-11 12:22:50.522	\N	\N	\N
16	1	product.update	Product	6	{"images": ["dell-xps.jpg"], "quantity": 12, "salePrice": "120000", "purchasePrice": "95000"}	{"images": ["http://localhost:9000/antiquar-products/dell-xps.jpg"], "quantity": 1, "salePrice": 120000, "purchasePrice": 95000}	2026-01-11 12:22:56.882	\N	\N	\N
17	1	product.update	Product	9	{"images": ["http://localhost:9000/antiquar-products/a4-paper.jpg"], "salePrice": "150", "committeeId": null, "purchasePrice": "120"}	{"images": ["http://localhost:9000/antiquar-products/http://localhost:9000/antiquar-products/a4-paper.jpg"], "salePrice": 150, "committeeId": 2, "purchasePrice": 120}	2026-01-12 11:29:46.514	\N	\N	\N
18	1	product.update	Product	10	{"salePrice": "50", "committeeId": null, "purchasePrice": "35"}	{"salePrice": 50, "committeeId": 1, "purchasePrice": 35}	2026-01-12 11:31:24.908	\N	\N	\N
19	1	user_status.create	UserStatus	1	null	{"id": 1, "code": "active", "name": "????????????????", "createdAt": "2026-01-14T04:15:29.979Z", "updatedAt": "2026-01-14T04:15:29.979Z", "description": "???????????????????????? ?????????? ???????????? ?? ??????????????"}	2026-01-14 04:15:30	\N	t	\N
20	1	user_status.create	UserStatus	2	null	{"id": 2, "code": "blocked", "name": "??????????????????????????????", "createdAt": "2026-01-14T04:16:05.227Z", "updatedAt": "2026-01-14T04:16:05.227Z", "description": "???????????? ?? ?????????????? ??????????????????"}	2026-01-14 04:16:05.234	\N	t	\N
21	1	sale.create	Sale	7	null	{"quantity": 1, "productId": 10, "salePrice": "50"}	2026-01-14 05:38:33.877	\N	t	\N
22	1	user.update	User	2	{"password": "$2a$10$SDNmICWL6ore43QaNvjm/esJ5BTmv39RfU7SMIsBavQmxDN.30W36", "userStatusId": null}	{"userStatusId": 1}	2026-01-14 05:43:21.645	\N	t	\N
23	1	user.update	User	2	{"password": "$2a$10$SDNmICWL6ore43QaNvjm/esJ5BTmv39RfU7SMIsBavQmxDN.30W36", "userStatusId": 1}	{"userStatusId": 2}	2026-01-14 05:43:38.185	\N	t	\N
24	1	user.update	User	2	{"password": "$2a$10$SDNmICWL6ore43QaNvjm/esJ5BTmv39RfU7SMIsBavQmxDN.30W36", "userStatusId": 2}	{"userStatusId": 1}	2026-01-14 05:43:41.293	\N	t	\N
25	1	product.update	Product	13	{"images": ["products/fa1d988c-b412-46db-8635-3b60c03cf747.webp"], "quantity": 0, "salePrice": "3750", "purchasePrice": "3000"}	{"images": ["http://localhost:9000/antiquar-products/products/fa1d988c-b412-46db-8635-3b60c03cf747.webp"], "quantity": 2, "salePrice": 3750, "purchasePrice": 3000}	2026-01-15 20:54:55.188	\N	t	\N
26	1	sale.create	Sale	8	null	{"quantity": 1, "productId": 13, "salePrice": "3750"}	2026-01-15 20:55:48.454	\N	t	\N
27	1	return.create	Return	8	null	{"reason": "???????????????? ????????????", "quantity": 1, "productId": 13}	2026-01-15 20:56:00.605	\N	t	\N
28	1	user.update	User	1	{"userStatusId": null}	{"userStatusId": 1}	2026-01-15 20:58:06.644	\N	t	\N
29	1	user.update	User	2	{"email": "admin@company.com"}	{"email": "admin1@company.com"}	2026-01-16 00:34:34.505	\N	t	\N
30	1	user.update	User	2	{"userStatusId": 1}	{"userStatusId": 2}	2026-01-16 00:34:37.721	\N	t	\N
31	1	user.update	User	1	{"email": "admin@warehouse.com"}	{"email": "admin1@warehouse.com"}	2026-01-16 00:49:28.909	\N	t	\N
32	1	login_attempt	Auth	\N	null	null	2026-01-16 02:39:51.142	172.22.0.1	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
33	1	login	Auth	\N	null	null	2026-01-16 02:39:51.161	172.22.0.1	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
34	1	login_attempt	User	1	null	null	2026-01-16 03:18:24.37	172.22.0.1	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
35	1	login	User	1	null	null	2026-01-16 03:18:24.381	172.22.0.1	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
36	1	product.update	Product	4	{"images": ["http://localhost:9000/antiquar-products/http://localhost:9000/antiquar-products/https://example.com/images/paper-a4.jpg"], "salePrice": "450", "arrivalDate": null, "purchasePrice": "250"}	{"images": ["http://localhost:9000/antiquar-products/http://localhost:9000/antiquar-products/http://localhost:9000/antiquar-products/https://example.com/images/paper-a4.jpg"], "salePrice": 450, "arrivalDate": "2025-05-04T09:18:00.000Z", "purchasePrice": 250}	2026-01-16 03:19:13.072	\N	t	\N
37	1	login_attempt	User	1	null	null	2026-01-16 03:20:23.19	172.22.0.1	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
38	1	login_attempt	User	1	null	null	2026-01-16 03:20:27.626	172.22.0.1	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
39	1	login	User	1	null	null	2026-01-16 03:20:27.634	172.22.0.1	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
40	1	login_attempt	User	1	null	null	2026-01-16 08:16:27.868	172.22.0.1	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0
41	1	login	User	1	null	null	2026-01-16 08:16:27.876	172.22.0.1	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0
42	1	user.update	User	2	{"userStatusId": 2}	{"userStatusId": 1}	2026-01-16 08:16:57.416	172.22.0.1	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0
43	1	login_attempt	User	1	null	null	2026-01-27 10:52:09.003	172.22.0.1	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
44	1	login	User	1	null	null	2026-01-27 10:52:09.019	172.22.0.1	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
45	1	product.image_add	Product	13	null	{"image": "http://localhost:9000/antiquar-products/products/ca1bf669-1e8e-46d6-ab09-fb64bfa2ba57.webp"}	2026-01-27 10:56:57.333	\N	t	\N
46	1	product.update	Product	13	{"images": ["products/1316ca49-896a-4aff-a231-e1594d4727dc.webp", "http://localhost:9000/antiquar-products/products/fa1d988c-b412-46db-8635-3b60c03cf747.webp", "products/c1fcf2d7-3389-4b2d-b163-90ac5d58d1ef.webp", "products/ca1bf669-1e8e-46d6-ab09-fb64bfa2ba57.webp"], "salePrice": "3750", "purchasePrice": "3000"}	{"images": ["http://localhost:9000/antiquar-products/products/1316ca49-896a-4aff-a231-e1594d4727dc.webp", "http://localhost:9000/antiquar-products/http://localhost:9000/antiquar-products/products/fa1d988c-b412-46db-8635-3b60c03cf747.webp", "http://localhost:9000/antiquar-products/products/c1fcf2d7-3389-4b2d-b163-90ac5d58d1ef.webp", "http://localhost:9000/antiquar-products/products/ca1bf669-1e8e-46d6-ab09-fb64bfa2ba57.webp"], "salePrice": 3750, "purchasePrice": 3000}	2026-01-27 10:57:01.804	\N	t	\N
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: antiquar
--

COPY public.categories (id, name, description, "parentId", "createdAt", "updatedAt") FROM stdin;
1	??????????????????????	?????????????????????? ???????????????????? ?? ????????????????????	\N	2026-01-08 00:05:58.447	2026-01-08 00:05:58.447
2	?????????????? ????????????????????????????	???????????????????????? ???????????? ?? ?????????????? ????????????????????????	\N	2026-01-08 00:05:58.453	2026-01-08 00:05:58.453
4	??????????????		\N	2026-01-08 02:28:58.904	2026-01-10 20:04:48.544
5	?????????????? ????????????	?????? ?????????????? ?? ??????????????????	4	2026-01-10 20:05:00.867	2026-01-10 20:05:00.867
3	????????????		\N	2026-01-08 02:28:58.899	2026-01-12 11:46:23.17
\.


--
-- Data for Name: committees; Type: TABLE DATA; Schema: public; Owner: antiquar
--

COPY public.committees (id, name, description, "contactInfo", "createdAt", "updatedAt") FROM stdin;
1	?????? ??????????????????????	?????????????????? ??????????????????????	contact@technoservice.ru, +7 (495) 123-45-67	2026-01-08 02:28:58.954	2026-01-08 02:28:58.954
2	?????? ????????????????	?????????????????? ???????????????????????? ??????????????	info@kantorg.ru, +7 (495) 987-65-43	2026-01-08 02:28:58.959	2026-01-12 11:31:07.158
3	?????? ??	???????????? ???????? ?????? ???? 0	-	2026-01-12 11:34:26.682	2026-01-12 11:34:26.682
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: antiquar
--

COPY public.products (id, name, sku, description, "purchasePrice", "salePrice", quantity, "minStockLevel", "categoryId", images, "createdAt", "updatedAt", "arrivalDate", "committeeId", "warehouseId", "transactionTypeId") FROM stdin;
1	?????????????? Dell XPS 15	LAP-DELL-XPS15-001	15-???????????????? ?????????????? ?? ?????????????????????? Intel i7, 16GB RAM, 512GB SSD	85000.00	120000.00	5	2	1	{https://example.com/images/laptop-dell-xps15-1.jpg,https://example.com/images/laptop-dell-xps15-2.jpg}	2026-01-08 00:05:58.48	2026-01-08 00:05:58.48	\N	\N	\N	\N
6	?????????????? Dell XPS 13	SKU-DELL-XPS-13	???????????? ?????????????? ?? ?????????????? ??????????????????????	95000.00	120000.00	1	0	3	{http://localhost:9000/antiquar-products/dell-xps.jpg}	2026-01-08 02:28:58.917	2026-01-11 12:22:56.872	\N	\N	\N	3
9	???????????? A4	SKU-A4-PAPER-80G	???????????? ?????????????? A4, 80 ??/????	120.00	150.00	2	0	4	{http://localhost:9000/antiquar-products/http://localhost:9000/antiquar-products/a4-paper.jpg}	2026-01-08 02:28:58.938	2026-01-12 11:29:46.483	\N	2	\N	4
11	?????????????? "??????????????"	0005	??????????????	10000.00	12500.00	1	0	4	{products/22f21f16-0004-44d2-8d1c-e29d4694ab69.webp,products/86bbd8ae-d29b-4e6e-876b-96798436a78c.webp}	2026-01-10 11:42:56.552	2026-01-10 21:51:59.014	2026-01-10 11:41:09.874	2	2	4
4	???????????? ?????????????? ??4	PAP-A4-500-001	?????????????? ???????????? ??4, 500 ????????????, ?????????????????? 80??/????	250.00	450.00	1	2	2	{http://localhost:9000/antiquar-products/http://localhost:9000/antiquar-products/http://localhost:9000/antiquar-products/https://example.com/images/paper-a4.jpg}	2026-01-08 00:05:58.502	2026-01-16 03:19:13.054	2025-05-04 09:18:00	\N	\N	\N
5	?????????? ?????????????????? ??????????	PEN-BLUE-001	?????????????????? ?????????? ???????????? ??????????, ???????????????? 12 ????????	120.00	250.00	2	1	2	{http://localhost:9000/antiquar-products/https://example.com/images/pen-blue.jpg}	2026-01-08 00:05:58.508	2026-01-11 12:22:02.237	\N	\N	\N	\N
10	?????????? ??????????????????	SKU-BALL-PEN-BLUE	?????????????????? ?????????? ?? ?????????? ????????????	35.00	50.00	4	0	4	{products/b50d4ed7-e726-4116-966c-c66ed0983571.webp}	2026-01-08 02:28:58.942	2026-01-14 05:42:12.059	\N	1	\N	4
3	???????????????????? ???????????????????????? Keychron K2	KEY-KEY-K2-001	???????????????????????? ???????????????????? ?? ????????????????????, Bluetooth	6500.00	9500.00	1	2	1	{http://localhost:9000/antiquar-products/https://example.com/images/keyboard-keychron-k2.jpg}	2026-01-08 00:05:58.496	2026-01-11 12:22:26.333	\N	\N	\N	\N
2	???????? Logitech MX Master 3	MOU-LOG-MX3-001	???????????????????????? ???????? ?????? ???????????????????????? ????????????	3500.00	5500.00	1	0	1	{http://localhost:9000/antiquar-products/https://example.com/images/mouse-logitech-mx3.jpg}	2026-01-08 00:05:58.491	2026-01-11 12:22:32.455	\N	\N	\N	\N
8	???????????????????? ????????????????????????	SKU-MECH-KEYBOARD	???????????????????????? ???????????????????? ?? RGB ????????????????????	8000.00	9500.00	1	0	3	{http://localhost:9000/antiquar-products/mechanical-keyboard.jpg}	2026-01-08 02:28:58.932	2026-01-11 12:22:47.028	\N	\N	\N	3
13	???????? ????????????	0007	????????, ????????????, ????????????????, ?????? 60-70 ????????, ???????????? 20 ???? ???????????????? ?????????????? ?? ?????????????????? ????????????, ?? ?????? ???? ???????????? ???????????????????????? ?????? ?????????????? ???????????? ???? ????????????????: +7 (913) 645-19-60 +7 (923) 671-65-66	3000.00	3750.00	0	0	3	{http://localhost:9000/antiquar-products/products/1316ca49-896a-4aff-a231-e1594d4727dc.webp,http://localhost:9000/antiquar-products/http://localhost:9000/antiquar-products/products/fa1d988c-b412-46db-8635-3b60c03cf747.webp,http://localhost:9000/antiquar-products/products/c1fcf2d7-3389-4b2d-b163-90ac5d58d1ef.webp,http://localhost:9000/antiquar-products/products/ca1bf669-1e8e-46d6-ab09-fb64bfa2ba57.webp}	2026-01-12 12:02:28.376	2026-01-27 10:57:01.797	2026-01-12 12:01:42.187	3	2	4
7	???????? ????????????????????????	SKU-WIRELESS-MOUSE	???????????????????????? ???????? ?? ?????????????? ??????????????????????????????????	2000.00	2500.00	1	0	3	{http://localhost:9000/antiquar-products/wireless-mouse.jpg}	2026-01-08 02:28:58.926	2026-01-11 12:22:50.516	\N	\N	\N	3
12	???????????????? ???????????? ?????????????? T.LIMOGES	0006	???????????????? ?????????????????????????? ???????????? ?????????????? T.LIMOGES 13,5??9??4 ????	3000.00	4800.00	0	0	3	{products/8a362ac6-c883-4744-9dc4-cf388372ac7d.webp,products/c4d62e89-7cee-43c7-a692-9aab63218dfc.webp,products/d5b7dca2-11d8-4c70-bf34-399d2d7bdbe1.webp}	2026-01-12 11:44:58.943	2026-01-12 14:50:38.248	2026-01-12 11:43:07.017	3	1	4
\.


--
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: antiquar
--

COPY public.returns (id, "productId", quantity, reason, "returnedAt", "returnedBy") FROM stdin;
3	10	1	?????????? ???? ??????????????????	2026-01-08 04:01:45.766	1
2	9	10	?????????????????? ????????????	2026-01-07 02:28:00	2
4	10	5	?????????? ??????????????????!!!!!	2026-01-08 05:19:38.269	1
1	7	1	?????????????????????? ??????????	2026-01-06 00:28:00	2
6	9	10		2026-01-09 08:45:15.007	1
7	12	1	???? ??????????????????	2026-01-11 14:50:00	1
8	13	1	???????????????? ????????????	2026-01-15 20:55:49.432	1
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: antiquar
--

COPY public.sales (id, "productId", quantity, "salePrice", "soldAt", "soldBy") FROM stdin;
4	10	10	50.00	2026-01-08 05:19:14.787	1
5	9	1	160.00	2026-01-07 18:38:00	1
6	13	1	3750.00	2026-01-12 12:16:15.744	1
7	10	1	50.00	2026-01-14 05:38:30.005	1
8	13	1	3750.00	2026-01-15 20:55:45.647	1
\.


--
-- Data for Name: transaction_type; Type: TABLE DATA; Schema: public; Owner: antiquar
--

COPY public.transaction_type (id, name, "createdAt", "updatedAt") FROM stdin;
3	??????????	2026-01-08 02:28:58.907	2026-01-08 02:28:58.907
4	????????????????	2026-01-08 02:28:58.912	2026-01-08 02:28:58.912
\.


--
-- Data for Name: user_statuses; Type: TABLE DATA; Schema: public; Owner: antiquar
--

COPY public.user_statuses (id, code, name, description, "createdAt", "updatedAt") FROM stdin;
1	active	????????????????	???????????????????????? ?????????? ???????????? ?? ??????????????	2026-01-14 04:15:29.979	2026-01-14 04:15:29.979
2	blocked	??????????????????????????????	???????????? ?? ?????????????? ??????????????????	2026-01-14 04:16:05.227	2026-01-14 04:16:05.227
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: antiquar
--

COPY public.users (id, email, username, password, "fullName", role, "isSuperAdmin", "createdAt", "updatedAt", "userStatusId", "sessionsRevokeAt") FROM stdin;
1	admin1@warehouse.com	admin	$2a$10$dVq68u2MLoUbhjaisRwZjeYzoMUlDSnJlKvZCIA4pldCXDY8dYoWa	Super Administrator	ADMIN	t	2026-01-08 00:05:58.425	2026-01-16 00:49:28.903	1	\N
2	admin1@company.com	superadmin	$2a$10$SDNmICWL6ore43QaNvjm/esJ5BTmv39RfU7SMIsBavQmxDN.30W36	Super Admin	ADMIN	t	2026-01-08 02:28:58.883	2026-01-16 08:16:57.165	1	\N
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: antiquar
--

COPY public.warehouses (id, name, description, address, "createdAt", "updatedAt") FROM stdin;
1	??????????	???????????????? ?????????? ?????? ???????????????? ??????????????	????. ??????????????????, ??. 1	2026-01-08 02:28:58.947	2026-01-08 02:28:58.947
2	????????????	?????????????????? ?????????? ?????? ???????????????? ??????????????	????. ??????????????????, ??. 2	2026-01-08 02:28:58.951	2026-01-08 02:28:58.951
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: antiquar
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 46, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: antiquar
--

SELECT pg_catalog.setval('public.categories_id_seq', 5, true);


--
-- Name: committees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: antiquar
--

SELECT pg_catalog.setval('public.committees_id_seq', 3, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: antiquar
--

SELECT pg_catalog.setval('public.products_id_seq', 13, true);


--
-- Name: returns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: antiquar
--

SELECT pg_catalog.setval('public.returns_id_seq', 8, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: antiquar
--

SELECT pg_catalog.setval('public.sales_id_seq', 8, true);


--
-- Name: transaction_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: antiquar
--

SELECT pg_catalog.setval('public.transaction_type_id_seq', 4, true);


--
-- Name: user_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: antiquar
--

SELECT pg_catalog.setval('public.user_statuses_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: antiquar
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: warehouses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: antiquar
--

SELECT pg_catalog.setval('public.warehouses_id_seq', 2, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: committees committees_pkey; Type: CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT committees_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: transaction_type transaction_type_pkey; Type: CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.transaction_type
    ADD CONSTRAINT transaction_type_pkey PRIMARY KEY (id);


--
-- Name: user_statuses user_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.user_statuses
    ADD CONSTRAINT user_statuses_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: products_sku_key; Type: INDEX; Schema: public; Owner: antiquar
--

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);


--
-- Name: user_statuses_code_key; Type: INDEX; Schema: public; Owner: antiquar
--

CREATE UNIQUE INDEX user_statuses_code_key ON public.user_statuses USING btree (code);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: antiquar
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: antiquar
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_committeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES public.committees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_transactionTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_transactionTypeId_fkey" FOREIGN KEY ("transactionTypeId") REFERENCES public.transaction_type(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: returns returns_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT "returns_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: returns returns_returnedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT "returns_returnedBy_fkey" FOREIGN KEY ("returnedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales sales_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT "sales_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales sales_soldBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT "sales_soldBy_fkey" FOREIGN KEY ("soldBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_userStatusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: antiquar
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_userStatusId_fkey" FOREIGN KEY ("userStatusId") REFERENCES public.user_statuses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: antiquar
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 9uAKIFKPtPeCHF8ZTvNmWgFaXRc4bmYjrX3QBQduNchrQdRzZgncN0rgJEBZscT

