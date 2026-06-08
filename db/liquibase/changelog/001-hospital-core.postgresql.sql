--liquibase formatted sql

--changeset pawit:001-hospital-core labels:postgres,hospital
--comment Initial PawIt VetCare hospital PostgreSQL schema.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenants_status_check CHECK (status IN ('active', 'suspended', 'archived'))
);

CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  code text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Chicago',
  phone text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT locations_status_check CHECK (status IN ('active', 'inactive', 'archived')),
  CONSTRAINT locations_tenant_code_unique UNIQUE (tenant_id, code)
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  default_location_id uuid REFERENCES locations(id),
  name text NOT NULL,
  email citext NOT NULL,
  role text NOT NULL,
  specialty text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_role_check CHECK (
    role IN ('SuperAdmin', 'ClinicAdmin', 'Veterinarian', 'Receptionist', 'VetTechnician', 'LabTechnician', 'PetParent')
  ),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'pending', 'inactive', 'archived')),
  CONSTRAINT users_tenant_email_unique UNIQUE (tenant_id, email)
);

CREATE TABLE pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  location_id uuid REFERENCES locations(id),
  name text NOT NULL,
  species text NOT NULL,
  breed text,
  sex text,
  estimated_age text,
  date_of_birth date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  archived_reason text,
  CONSTRAINT pets_species_check CHECK (species IN ('dog', 'cat')),
  CONSTRAINT pets_status_check CHECK (status IN ('active', 'archived', 'deceased'))
);

CREATE TABLE pet_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  pet_id uuid NOT NULL REFERENCES pets(id),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  email citext,
  phone text,
  relationship text NOT NULL DEFAULT 'owner',
  primary_guardian boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX pet_guardians_one_primary_per_pet
  ON pet_guardians (tenant_id, pet_id)
  WHERE primary_guardian;

CREATE TABLE pet_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  pet_id uuid NOT NULL REFERENCES pets(id),
  title text NOT NULL,
  document_type text NOT NULL,
  object_path text NOT NULL,
  content_type text NOT NULL,
  size_bytes bigint NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  archived_reason text,
  CONSTRAINT pet_documents_size_check CHECK (size_bytes > 0),
  CONSTRAINT pet_documents_status_check CHECK (status IN ('active', 'archived')),
  CONSTRAINT pet_documents_object_path_unique UNIQUE (tenant_id, object_path)
);

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  location_id uuid NOT NULL REFERENCES locations(id),
  pet_id uuid NOT NULL REFERENCES pets(id),
  requested_by_user_id uuid REFERENCES users(id),
  primary_veterinarian_id uuid REFERENCES users(id),
  type text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  reason text NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  meeting_url text,
  cancelled_at timestamptz,
  cancelled_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_type_check CHECK (
    type IN ('in_clinic', 'telemedicine', 'walk_in', 'follow_up', 'vaccination', 'lab_diagnostic', 'procedure_consult')
  ),
  CONSTRAINT appointments_status_check CHECK (
    status IN (
      'requested', 'scheduled', 'confirmed', 'checked_in', 'waiting', 'in_progress',
      'completed', 'cancelled', 'no_show', 'needs_reschedule', 'rejected'
    )
  )
);

CREATE TABLE appointment_veterinarians (
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  veterinarian_id uuid NOT NULL REFERENCES users(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (appointment_id, veterinarian_id)
);

CREATE TABLE queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  location_id uuid NOT NULL REFERENCES locations(id),
  pet_id uuid NOT NULL REFERENCES pets(id),
  appointment_id uuid REFERENCES appointments(id),
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'waiting',
  reason text NOT NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  called_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT queue_entries_priority_check CHECK (priority IN ('normal', 'urgent', 'emergency')),
  CONSTRAINT queue_entries_status_check CHECK (status IN ('waiting', 'called', 'in_progress', 'completed', 'cancelled'))
);

CREATE TABLE clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  location_id uuid REFERENCES locations(id),
  pet_id uuid NOT NULL REFERENCES pets(id),
  appointment_id uuid REFERENCES appointments(id),
  author_user_id uuid REFERENCES users(id),
  subject text NOT NULL,
  soap jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  shared_with_pet_parent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_notes_status_check CHECK (status IN ('draft', 'signed', 'amended', 'archived'))
);

CREATE TABLE prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  location_id uuid NOT NULL REFERENCES locations(id),
  pet_id uuid NOT NULL REFERENCES pets(id),
  appointment_id uuid REFERENCES appointments(id),
  prescribing_veterinarian_id uuid REFERENCES users(id),
  instructions text,
  status text NOT NULL DEFAULT 'draft',
  shared_with_pet_parent boolean NOT NULL DEFAULT false,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prescriptions_status_check CHECK (status IN ('draft', 'finalized'))
);

CREATE TABLE prescription_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  medication_name text NOT NULL,
  strength text,
  dosage text,
  frequency text,
  duration text,
  route text,
  instructions text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE prescription_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  condition text NOT NULL,
  category text NOT NULL,
  medications jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lab_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  lab_type text NOT NULL DEFAULT 'internal',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lab_centers_status_check CHECK (status IN ('active', 'inactive', 'archived'))
);

CREATE TABLE lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  location_id uuid NOT NULL REFERENCES locations(id),
  pet_id uuid NOT NULL REFERENCES pets(id),
  appointment_id uuid REFERENCES appointments(id),
  lab_center_id uuid REFERENCES lab_centers(id),
  ordered_by_user_id uuid REFERENCES users(id),
  test_type text NOT NULL,
  sample_type text,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'ordered',
  result_notes text,
  report_object_path text,
  shared_with_pet_parent boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lab_orders_priority_check CHECK (priority IN ('normal', 'urgent', 'stat')),
  CONSTRAINT lab_orders_status_check CHECK (status IN ('ordered', 'sample_collected', 'sent_out', 'in_progress', 'completed', 'cancelled'))
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  location_id uuid NOT NULL REFERENCES locations(id),
  pet_id uuid REFERENCES pets(id),
  status text NOT NULL DEFAULT 'draft',
  tax_cents bigint NOT NULL DEFAULT 0,
  discount_cents bigint NOT NULL DEFAULT 0,
  due_at timestamptz,
  issued_at timestamptz,
  paid_at timestamptz,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'issued', 'pending', 'paid', 'void', 'refunded')),
  CONSTRAINT invoices_amounts_check CHECK (tax_cents >= 0 AND discount_cents >= 0)
);

CREATE TABLE invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  description text NOT NULL,
  quantity numeric(12, 2) NOT NULL DEFAULT 1,
  unit_amount_cents bigint NOT NULL,
  related_resource_type text,
  related_resource_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoice_line_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT invoice_line_items_unit_amount_check CHECK (unit_amount_cents >= 0)
);

CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  pet_id uuid REFERENCES pets(id),
  appointment_id uuid REFERENCES appointments(id),
  guardian_user_id uuid REFERENCES users(id),
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_rating_check CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  key text NOT NULL,
  request_hash text NOT NULL,
  response_body jsonb,
  status_code integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CONSTRAINT idempotency_keys_tenant_key_unique UNIQUE (tenant_id, key)
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  actor_user_id uuid REFERENCES users(id),
  actor_role text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX locations_tenant_status_idx ON locations (tenant_id, status);
CREATE INDEX users_tenant_role_status_idx ON users (tenant_id, role, status);
CREATE INDEX pets_tenant_status_idx ON pets (tenant_id, status);
CREATE INDEX pet_guardians_pet_idx ON pet_guardians (tenant_id, pet_id);
CREATE INDEX pet_documents_pet_status_idx ON pet_documents (tenant_id, pet_id, status);
CREATE INDEX appointments_tenant_location_starts_idx ON appointments (tenant_id, location_id, starts_at);
CREATE INDEX appointments_pet_idx ON appointments (tenant_id, pet_id);
CREATE INDEX queue_entries_tenant_location_status_idx ON queue_entries (tenant_id, location_id, status, checked_in_at);
CREATE INDEX clinical_notes_pet_updated_idx ON clinical_notes (tenant_id, pet_id, updated_at DESC);
CREATE INDEX prescriptions_pet_updated_idx ON prescriptions (tenant_id, pet_id, updated_at DESC);
CREATE INDEX lab_orders_pet_status_idx ON lab_orders (tenant_id, pet_id, status);
CREATE INDEX invoices_tenant_status_due_idx ON invoices (tenant_id, status, due_at);
CREATE INDEX invoice_line_items_invoice_idx ON invoice_line_items (invoice_id);
CREATE INDEX feedback_tenant_created_idx ON feedback (tenant_id, created_at DESC);
CREATE INDEX audit_logs_tenant_created_idx ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX audit_logs_resource_idx ON audit_logs (tenant_id, resource_type, resource_id);
CREATE INDEX idempotency_keys_expires_idx ON idempotency_keys (expires_at);

--rollback DROP TABLE IF EXISTS audit_logs, idempotency_keys, feedback, invoice_line_items, invoices, lab_orders, lab_centers, prescription_templates, prescription_medications, prescriptions, clinical_notes, queue_entries, appointment_veterinarians, appointments, pet_documents, pet_guardians, pets, users, locations, tenants CASCADE;
--rollback DROP EXTENSION IF EXISTS citext;
--rollback DROP EXTENSION IF EXISTS pgcrypto;
