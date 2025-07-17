# Supabase Schema and Development Rules

This document serves as the source of truth for the application's database schema and the rules developers must follow when interacting with it.

## 1. The Golden Rule of Supabase Security

**All new tables or views created in the `public` schema that contain user-specific data MUST have a Row Level Security (RLS) policy created for them.**

By default, Supabase blocks all access to new tables. Forgetting to add a policy will result in `403 Forbidden` errors in the application.

### Standard RLS Policy Template

This policy ensures that users can only select (read) their own data.

```sql
CREATE POLICY "Enable read access for authenticated users"
ON public.your_table_or_view_name
FOR SELECT
USING (auth.uid() = user_id);
```

For actions like `INSERT`, `UPDATE`, and `DELETE`, similar policies must be created with the appropriate `WITH CHECK` clause.

## 2. Data Consistency: `snake_case`

The database schema uses `snake_case` for all table and column names (e.g., `invoice_number`, `due_date`).

**Rule:** All corresponding types and interfaces in the frontend code (primarily in `src/types/index.ts`) and all property names used in API calls MUST match this `snake_case` convention.

## 3. Public Table Schemas

### `clients`
```sql
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  company text,
  created_at timestamp with time zone DEFAULT now(),
  history jsonb,
  notes text
);
```
**Note:** This table does NOT contain a `gst_number` column. Client GST information should not be stored here.

### `invoices`
```sql
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  client_id uuid,
  invoice_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  issue_date date NOT NULL,
  due_date date,
  subtotal numeric NOT NULL,
  discount numeric,
  tax numeric,
  total numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### `invoice_items`
```sql
CREATE TABLE public.invoice_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  invoice_id uuid,
  description text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total numeric NOT NULL
);
```

### `settings`
```sql
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  business_legal_name text NOT NULL,
  trade_name text,
  province text NOT NULL,
  city text NOT NULL,
  address_extra_type text,
  address_extra_value text,
  street_number text NOT NULL,
  street_name text NOT NULL,
  county text,
  postal_code text NOT NULL,
  is_service_provider boolean NOT NULL DEFAULT true,
  service_area text,
  service_type text,
  gst_number text,
  business_number text,
  has_completed_setup boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  company_name text,
  email text,
  phone_number text,
  primary_color text,
  secondary_color text,
  invoice_prefix text,
  invoice_start_number integer,
  payment_details jsonb
);
