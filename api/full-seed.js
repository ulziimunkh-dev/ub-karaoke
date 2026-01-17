const { Client } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

async function run() {
    const client = new Client({
        host: '127.0.0.1',
        port: process.env.DATABASE_PORT || 5432,
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'karaoke_db',
    });

    try {
        await client.connect();
        const pidRes = await client.query('SELECT pg_backend_pid()');
        console.log('✅ Connected to:', client.database, 'PID:', pidRes.rows[0].pg_backend_pid);

        // Note: With TypeORM synchronize: true, tables are created automatically by the backend.
        // However, since we can't easily restart the backend to sync, we ensure table exists here.
        await client.query(`
            CREATE TABLE IF NOT EXISTS plans (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                code character varying NOT NULL,
                name character varying NOT NULL,
                monthly_fee integer NOT NULL,
                commission_rate numeric(4,2) NOT NULL,
                max_branches integer,
                max_rooms integer,
                features jsonb,
                is_active boolean DEFAULT true NOT NULL,
                created_at timestamp without time zone DEFAULT now() NOT NULL,
                CONSTRAINT "PK_plans_id" PRIMARY KEY (id),
                CONSTRAINT "UQ_plans_code" UNIQUE (code)
            );
        `);

        // Manually update organizations table schema if needed
        await client.query(`
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "plan_id" uuid;
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "plan_started_at" timestamptz;
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "plan_ends_at" timestamptz;
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "status" text;
        `);

        // We will try to truncate only the tables that exist.
        console.log('🗑️ Clearing existing data...');
        const tables = ['organizations', 'staff', 'users', 'venues', 'rooms', 'bookings', 'payments', 'reviews', 'audit_logs', 'plans', 'room_types', 'room_features'];

        for (const table of tables) {
            try {
                // Check if table exists before truncating
                const checkRes = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    );
                `, [table]);

                if (checkRes.rows[0].exists) {
                    await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
                    console.log(`  ✅ Cleared & Reset: ${table}`);
                } else {
                    console.warn(`  ⏩ Skipping: ${table} (Table does not exist yet)`);
                }
            } catch (err) {
                console.error(`  ❌ Error clearing ${table}:`, err.message);
            }
        }

        // 1. Global Sysadmin
        const sPass = await bcrypt.hash('sysadmin', 10);
        const adminRes = await client.query("INSERT INTO staff (email, username, password, name, role, organization_id) VALUES ('sysadmin@ubkaraoke.mn', 'sysadmin', $1, 'Global Admin', 'sysadmin', null) RETURNING id", [sPass]);
        const adminId = adminRes.rows[0].id;

        // Self-audit for sysadmin
        await client.query("UPDATE staff SET created_by = $1, updated_by = $1 WHERE id = $1", [adminId]);
        console.log(`✅ Created Sysadmin (ID: ${adminId})`);

        // 5. Plans
        console.log('🌱 Seeding Plans...');
        const plansData = [
            { code: 'STARTER', name: 'Starter', monthlyFee: 25000, commissionRate: 5.00, maxBranches: 1, maxRooms: 5, features: { description: 'First-time digital users', bestFor: 'Small karaoke' } },
            { code: 'GROWTH', name: 'Growth', monthlyFee: 75000, commissionRate: 3.00, maxBranches: 3, maxRooms: 15, features: { description: 'Serious operators', bestFor: 'Medium karaoke' } },
            { code: 'FRANCHISE', name: 'Franchise', monthlyFee: 0, commissionRate: 1.50, maxBranches: null, maxRooms: null, features: { description: 'Franchise / premium relationship', bestFor: 'Large / chain' } }
        ];

        const planIds = {};
        for (const p of plansData) {
            const res = await client.query(
                `INSERT INTO plans (code, name, monthly_fee, commission_rate, max_branches, max_rooms, features, is_active) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id`,
                [p.code, p.name, p.monthlyFee, p.commissionRate, p.maxBranches, p.maxRooms, JSON.stringify(p.features)]
            );
            planIds[p.code] = res.rows[0].id;
            console.log(`  ➕ Plan: ${p.name}`);
        }

        // 2. Organizations (Updated with Plans)
        const orgRes1 = await client.query("INSERT INTO organizations (code, name, created_by, updated_by, is_active, plan_id, status, plan_started_at) VALUES ('UBK-GRP', 'UB Karaoke Group', $1, $1, true, $2, 'active', NOW()) RETURNING id", [adminId, planIds['GROWTH']]);
        const orgId1 = orgRes1.rows[0].id;
        const orgRes2 = await client.query("INSERT INTO organizations (code, name, created_by, updated_by, is_active, plan_id, status, plan_started_at) VALUES ('STAR-K', 'Star Karaoke Management', $1, $1, true, $2, 'active', NOW()) RETURNING id", [adminId, planIds['STARTER']]);
        const orgId2 = orgRes2.rows[0].id;

        // 3. Other Staff
        const mPass = await bcrypt.hash('manager', 10);
        const stPass = await bcrypt.hash('staff', 10);

        // Org 1 Staff
        await client.query("INSERT INTO staff (email, username, password, name, role, organization_id, created_by, updated_by) VALUES ('manager1@ubkaraoke.mn', 'manager1', $1, 'UBK Manager', 'manager', $2, $3, $3)", [mPass, orgId1, adminId]);
        await client.query("INSERT INTO staff (email, username, password, name, role, organization_id, created_by, updated_by) VALUES ('staff1@ubkaraoke.mn', 'staff1', $1, 'UBK Front Desk', 'staff', $2, $3, $3)", [stPass, orgId1, adminId]);

        // Org 2 Staff
        await client.query("INSERT INTO staff (email, username, password, name, role, organization_id, created_by, updated_by) VALUES ('manager2@ubkaraoke.mn', 'manager2', $1, 'Star Manager', 'manager', $2, $3, $3)", [mPass, orgId2, adminId]);
        await client.query("INSERT INTO staff (email, username, password, name, role, organization_id, created_by, updated_by) VALUES ('staff2@ubkaraoke.mn', 'staff2', $1, 'Star Assistant', 'staff', $2, $3, $3)", [stPass, orgId2, adminId]);

        // 4. Customer
        const cPass = await bcrypt.hash('123', 10);
        await client.query("INSERT INTO users (email, username, password, name, phone, role, created_by, updated_by) VALUES ('bat@gmail.com', 'customer', $1, 'Bat-Erdene', '99998888', 'customer', $2, $2)", [cPass, adminId]);
        await client.query("INSERT INTO users (email, username, password, name, phone, role, created_by, updated_by) VALUES ('saraa@gmail.com', 'saraa', $1, 'Saranduya', '88887777', 'customer', $2, $2)", [cPass, adminId]);

        // 4. Venues & Rooms
        const venues = [
            // Org 1 Venues
            {
                orgId: orgId1,
                name: "Neon Nights (Seoul St)",
                district: "Sukhbaatar",
                address: "Seoul Street 12, Ulaanbaatar",
                description: "Vibrant neon atmosphere with premium acoustics",
                phone: "+976 99001122",
                email: "seoul@neonnights.mn",
                priceRange: "$$",
                rating: 4.8,
                totalReviews: 124,
                amenities: ["WiFi", "Valet Parking", "Full Bar", "Catering"],
                openingHours: { "Daily": "12:00-04:00" },
                images: ["/assets/defaults/karaoke_standard.png"],
                featuredImage: "/assets/defaults/karaoke_standard.png",
                latitude: 47.9188,
                longitude: 106.9176,
                rooms: [
                    { name: 'Standard Alpha', type: 'Standard', capacity: 6, hourlyRate: 45000, condition: 'Excellent', features: ['HD Screen', 'Dynamic Lighting'], amenities: ['Wireless Mics'], images: ["/assets/defaults/karaoke_standard.png"], specs: { microphones: 2 }, partySupport: { birthday: true } },
                    { name: 'Neon VIP Suite', type: 'VIP', capacity: 15, hourlyRate: 95000, isVIP: true, condition: 'Mint', features: ['4K Projector', 'Stage'], amenities: ['Champagne Service'], images: ["/assets/defaults/karaoke_vip.png"], specs: { microphones: 4 }, partySupport: { birthday: true, catering: true } }
                ]
            },
            {
                orgId: orgId1,
                name: "Neon Nights (Zaisan)",
                district: "Khan-Uul",
                address: "Zaisan Hill Complex, 5th Floor",
                description: "Luxury karaoke with panoramic city views",
                phone: "+976 99001133",
                email: "zaisan@neonnights.mn",
                priceRange: "$$$",
                rating: 4.9,
                totalReviews: 86,
                amenities: ["VIP Parking", "Sky Bar", "Private Servers"],
                openingHours: { "Daily": "14:00-06:00" },
                images: ["/assets/defaults/karaoke_lux.png"],
                featuredImage: "/assets/defaults/karaoke_lux.png",
                latitude: 47.8864,
                longitude: 106.9114,
                rooms: [
                    { name: 'Sky Room 1', type: 'Premium', capacity: 10, hourlyRate: 75000, condition: 'Excellent', features: ['Floor Window', 'Pro Audio'], amenities: ['iPad Ordering'], images: ["/assets/defaults/karaoke_lux.png"], specs: { microphones: 3 }, partySupport: { birthday: true } },
                    { name: 'Imperial VIP', type: 'VIP', capacity: 25, hourlyRate: 150000, isVIP: true, condition: 'Mint', features: ['8K Screen', 'Dance Floor'], amenities: ['Top Shelf Bar'], images: ["/assets/defaults/karaoke_vip.png"], specs: { microphones: 6 }, partySupport: { largeGroups: true } }
                ]
            },
            // Org 2 Venues
            {
                orgId: orgId2,
                name: "Star Voice Academy",
                district: "Bayangol",
                address: "Peace Avenue 45, 3rd Khoroo",
                description: "The best vocal training and leisure spot in BG district",
                phone: "+976 88112233",
                email: "hello@starvoice.mn",
                priceRange: "$",
                rating: 4.5,
                totalReviews: 210,
                amenities: ["Recording Studio", "Youth Discount", "Snack Bar"],
                openingHours: { "Daily": "10:00-02:00" },
                images: ["/assets/defaults/karaoke_standard.png"],
                featuredImage: "/assets/defaults/karaoke_standard.png",
                latitude: 47.9133,
                longitude: 106.8833,
                rooms: [
                    { name: 'Melody Room', type: 'Standard', capacity: 4, hourlyRate: 25000, condition: 'Good', features: ['Vocal Effects'], amenities: ['Snacks'], images: ["/assets/defaults/karaoke_standard.png"], specs: { microphones: 2 }, partySupport: { birthday: true } },
                    { name: 'Harmony Suite', type: 'Large', capacity: 12, hourlyRate: 55000, condition: 'Good', features: ['Wide Screen'], amenities: ['Bottomless Tea'], images: ["/assets/defaults/karaoke_standard.png"], specs: { microphones: 3 }, partySupport: { birthday: true } }
                ]
            }
        ];

        for (const venue of venues) {
            const vRes = await client.query(
                `INSERT INTO venues (organization_id, name, district, address, description, phone, email, "priceRange", rating, "totalReviews", amenities, "openingHours", images, "featuredImage", latitude, longitude, created_by, updated_by, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17, true) RETURNING id`,
                [venue.orgId, venue.name, venue.district, venue.address, venue.description, venue.phone, venue.email, venue.priceRange, venue.rating, venue.totalReviews, JSON.stringify(venue.amenities), JSON.stringify(venue.openingHours), JSON.stringify(venue.images), venue.featuredImage, venue.latitude, venue.longitude, adminId]
            );
            const venueId = vRes.rows[0].id;
            console.log(`✅ Created venue: ${venue.name} (Org: ${venue.orgId})`);

            for (const room of venue.rooms) {
                await client.query(
                    `INSERT INTO rooms (organization_id, "venueId", name, type, capacity, "hourlyRate", "isVIP", condition, amenities, images, specs, "partySupport", created_by, updated_by, is_active)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13, true)`,
                    [venue.orgId, venueId, room.name, room.type, room.capacity, room.hourlyRate, room.isVIP || false, room.condition, JSON.stringify(room.amenities), JSON.stringify(room.images), JSON.stringify(room.specs), JSON.stringify(room.partySupport), adminId]
                );
                console.log(`  ➕ Created room: ${room.name}`);
            }
        }

        // 6. Seed Room Types and Features (Global - not org-specific)
        console.log('🌱 Seeding Global Room Types and Features...');

        const roomTypesData = [
            { name: 'Standard', description: 'Basic karaoke room' },
            { name: 'Premium', description: 'Enhanced experience' },
            { name: 'VIP', description: 'Luxury suite' },
            { name: 'Large', description: 'Group room' },
        ];

        const roomFeaturesData = [
            { name: 'HD Screen', icon: '📺' },
            { name: '4K Projector', icon: '🎥' },
            { name: 'Dynamic Lighting', icon: '💡' },
            { name: 'Professional Audio', icon: '🔊' },
            { name: 'Stage', icon: '🎭' },
            { name: 'Dance Floor', icon: '🕺' },
            { name: 'Recording', icon: '🎙️' },
            { name: 'Wireless Mics', icon: '🎤' },
            { name: 'Air Conditioning', icon: '❄️' },
            { name: 'Sound System (High-End)', icon: '🔈' },
            { name: 'Premium Sound Insulation', icon: '🧱' },
            { name: 'Smoke Machine', icon: '💨' },
            { name: 'Tambourines', icon: '🪇' },
            { name: 'Smart Ordering Tablet', icon: '📱' },
            { name: 'Quality Acoustic Foam', icon: '🧽' },
            { name: 'VIP Amenities', icon: '💎' },
        ];

        // Create global types and features (no organization_id)
        for (const type of roomTypesData) {
            await client.query(
                `INSERT INTO room_types (name, description, created_by, updated_by)
                 VALUES ($1, $2, $3, $3)`,
                [type.name, type.description, adminId]
            );
        }
        console.log(`  ➕ Created ${roomTypesData.length} global room types`);

        for (const feature of roomFeaturesData) {
            await client.query(
                `INSERT INTO room_features (name, icon, created_by, updated_by)
                 VALUES ($1, $2, $3, $3)`,
                [feature.name, feature.icon, adminId]
            );
        }
        console.log(`  ➕ Created ${roomFeaturesData.length} global room features`);

        // 7. Seed Sample Customers (Users)
        console.log('🌱 Seeding Sample Customers...');
        const customerPass = await bcrypt.hash('password123', 10);
        const customers = [
            { username: 'customer1', email: 'customer1@gmail.com', name: 'Bat-Erdene P.', phone: '99112233', role: 'customer' },
            { username: 'customer2', email: 'customer2@yahoo.com', name: 'Sarnai B.', phone: '88005544', role: 'customer' },
            { username: 'testuser', email: 'test@example.com', name: 'Test User', phone: '90001122', role: 'customer' }
        ];

        for (const c of customers) {
            await client.query(
                `INSERT INTO users (username, email, password, name, phone, role, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, true)`,
                [c.username, c.email, customerPass, c.name, c.phone, c.role]
            );
            console.log(`  ➕ Customer: ${c.name}`);
        }

        console.log('✨ Seeded!');

        const sCnt = await client.query('SELECT count(*) FROM staff');
        const uCnt = await client.query('SELECT count(*) FROM users');
        const vCnt = await client.query('SELECT count(*) FROM venues');
        console.log(`📊 INTERNAL COUNTS -> Staff: ${sCnt.rows[0].count}, Users: ${uCnt.rows[0].count}, Venues: ${vCnt.rows[0].count}`);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run().catch(console.error);
