export const schemaSql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('planning', 'ongoing', 'completed', 'upcoming');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE section_type AS ENUM ('hotel', 'transport', 'activity', 'food', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_category AS ENUM ('sightseeing', 'food', 'adventure', 'shopping', 'culture', 'nature');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE packing_category AS ENUM ('clothing', 'documents', 'electronics', 'toiletries', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM ('hotel', 'flight', 'food', 'activity', 'transport', 'shopping', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(40),
  city VARCHAR(120),
  country VARCHAR(120),
  profile_photo_url VARCHAR(500),
  additional_info TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  cover_photo_url VARCHAR(500),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status trip_status NOT NULL DEFAULT 'planning',
  is_public BOOLEAN NOT NULL DEFAULT false,
  public_slug VARCHAR(120) UNIQUE,
  total_budget NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS trip_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  city_name VARCHAR(140) NOT NULL,
  country VARCHAR(120),
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (departure_date >= arrival_date)
);

CREATE TABLE IF NOT EXISTS itinerary_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_id UUID REFERENCES trip_stops(id) ON DELETE SET NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  section_type section_type NOT NULL DEFAULT 'other',
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  budget_estimate NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (date_to >= date_from)
);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  city VARCHAR(140) NOT NULL,
  country VARCHAR(120) NOT NULL,
  category activity_category NOT NULL,
  estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration_hours NUMERIC(4, 1) NOT NULL DEFAULT 1,
  image_url VARCHAR(500),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_id UUID REFERENCES trip_stops(id) ON DELETE SET NULL,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  scheduled_date DATE,
  actual_cost NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  category packing_category NOT NULL DEFAULT 'other',
  is_packed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_id UUID REFERENCES trip_stops(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180),
  content TEXT NOT NULL,
  note_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_id UUID REFERENCES trip_stops(id) ON DELETE SET NULL,
  category expense_category NOT NULL DEFAULT 'other',
  description VARCHAR(220) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  qty INTEGER NOT NULL DEFAULT 1,
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  tags VARCHAR[],
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(140) NOT NULL,
  country VARCHAR(120) NOT NULL,
  region VARCHAR(80) NOT NULL,
  cost_index NUMERIC(4, 1) NOT NULL,
  popularity_score NUMERIC(4, 1) NOT NULL,
  image_url VARCHAR(500),
  description TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (name, country)
);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_public_slug ON trips(public_slug);
CREATE INDEX IF NOT EXISTS idx_trip_stops_trip_order ON trip_stops(trip_id, order_index);
CREATE INDEX IF NOT EXISTS idx_sections_trip_stop ON itinerary_sections(trip_id, stop_id);
CREATE INDEX IF NOT EXISTS idx_trip_activities_trip ON trip_activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_packing_trip ON packing_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_notes_trip ON trip_notes(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_community_trip ON community_posts(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_search ON activities(city, category);
CREATE INDEX IF NOT EXISTS idx_cities_search ON cities(region, popularity_score);
`;
