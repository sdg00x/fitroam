-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clerk_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "training_style" TEXT NOT NULL,
    "equipment_needs" TEXT[],
    "budget_range" TEXT NOT NULL,
    "max_distance_minutes" INTEGER NOT NULL DEFAULT 20,
    "environment_pref" TEXT NOT NULL DEFAULT 'both',
    "stay_length_pref" TEXT NOT NULL DEFAULT 'flexible',
    "theme_preference" TEXT NOT NULL DEFAULT 'dark',
    "training_pattern" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gyms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "places_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "opening_hours" JSONB,
    "equipment_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "website_url" TEXT,
    "rating" DOUBLE PRECISION,
    "rating_count" INTEGER,
    "last_fetched_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "reported_by" UUID NOT NULL,
    "day_pass_pence" INTEGER,
    "weekly_pence" INTEGER,
    "monthly_pence" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "visited_at" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_gyms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "saved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_gyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gym_access" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "city_slug" TEXT NOT NULL,
    "access_type" TEXT NOT NULL,
    "price_paid_pence" INTEGER,
    "activated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_end_date" DATE NOT NULL,
    "reminder_sent_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gym_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "city_slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "distance_km" DOUBLE PRECISION NOT NULL,
    "terrain_type" TEXT NOT NULL,
    "surface_type" TEXT NOT NULL,
    "safety_rating" TEXT NOT NULL,
    "elevation_gain_m" INTEGER NOT NULL DEFAULT 0,
    "gpx_url" TEXT,
    "source" TEXT NOT NULL,
    "source_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "osm_id" TEXT NOT NULL,
    "name" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "equipment_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "surface" TEXT,
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "city_slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "meetup_id" TEXT,
    "external_url" TEXT,
    "visitors_welcome" BOOLEAN NOT NULL DEFAULT false,
    "next_event_at" TIMESTAMPTZ,
    "next_event_location" TEXT,
    "member_count" INTEGER,
    "cache_expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_legs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "city" TEXT NOT NULL,
    "city_slug" TEXT NOT NULL,
    "country" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "arrive_on" DATE NOT NULL,
    "depart_on" DATE NOT NULL,
    "leg_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_legs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_gyms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "leg_id" UUID,
    "gym_id" UUID NOT NULL,
    "match_score" INTEGER NOT NULL,
    "notes" TEXT,
    "saved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_gyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_routes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,

    CONSTRAINT "trip_routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gyms_places_id_key" ON "gyms"("places_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_gyms_user_id_gym_id_key" ON "saved_gyms"("user_id", "gym_id");

-- CreateIndex
CREATE INDEX "gym_access_user_id_idx" ON "gym_access"("user_id");

-- CreateIndex
CREATE INDEX "gym_access_expected_end_date_idx" ON "gym_access"("expected_end_date");

-- CreateIndex
CREATE UNIQUE INDEX "parks_osm_id_key" ON "parks"("osm_id");

-- CreateIndex
CREATE INDEX "trips_user_id_idx" ON "trips"("user_id");

-- CreateIndex
CREATE INDEX "trip_legs_trip_id_idx" ON "trip_legs"("trip_id");

-- CreateIndex
CREATE INDEX "trip_gyms_trip_id_idx" ON "trip_gyms"("trip_id");

-- CreateIndex
CREATE INDEX "trip_gyms_leg_id_idx" ON "trip_gyms"("leg_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_reports" ADD CONSTRAINT "price_reports_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_reports" ADD CONSTRAINT "price_reports_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_gyms" ADD CONSTRAINT "saved_gyms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_gyms" ADD CONSTRAINT "saved_gyms_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_access" ADD CONSTRAINT "gym_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_access" ADD CONSTRAINT "gym_access_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_legs" ADD CONSTRAINT "trip_legs_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_gyms" ADD CONSTRAINT "trip_gyms_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_gyms" ADD CONSTRAINT "trip_gyms_leg_id_fkey" FOREIGN KEY ("leg_id") REFERENCES "trip_legs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_gyms" ADD CONSTRAINT "trip_gyms_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_routes" ADD CONSTRAINT "trip_routes_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_routes" ADD CONSTRAINT "trip_routes_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
