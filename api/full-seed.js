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
        // We will try to truncate only the tables that exist.
        console.log('🗑️ Clearing existing data...');
        const tables = ['organizations', 'staff', 'users', 'venues', 'rooms', 'bookings', 'payments', 'reviews', 'audit_logs'];

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
                    await client.query(`TRUNCATE TABLE ${table} CASCADE`);
                    console.log(`  ✅ Cleared: ${table}`);
                } else {
                    console.warn(`  ⏩ Skipping: ${table} (Table does not exist yet)`);
                }
            } catch (err) {
                console.error(`  ❌ Error clearing ${table}:`, err.message);
            }
        }

        // 1. Organizations
        const orgRes1 = await client.query("INSERT INTO organizations (code, name) VALUES ('UBK-GRP', 'UB Karaoke Group') RETURNING id");
        const orgId1 = orgRes1.rows[0].id;
        const orgRes2 = await client.query("INSERT INTO organizations (code, name) VALUES ('STAR-K', 'Star Karaoke Management') RETURNING id");
        const orgId2 = orgRes2.rows[0].id;

        // 2. Staff
        const sPass = await bcrypt.hash('sysadmin', 10);
        const mPass = await bcrypt.hash('manager', 10);
        const stPass = await bcrypt.hash('staff', 10);

        // Global Sysadmin
        await client.query("INSERT INTO staff (email, username, password, name, role, organization_id) VALUES ('sysadmin@ubkaraoke.mn', 'sysadmin', $1, 'Global Admin', 'sysadmin', null)", [sPass]);

        // Org 1 Staff
        await client.query("INSERT INTO staff (email, username, password, name, role, organization_id) VALUES ('manager1@ubkaraoke.mn', 'manager1', $1, 'UBK Manager', 'manager', $2)", [mPass, orgId1]);
        await client.query("INSERT INTO staff (email, username, password, name, role, organization_id) VALUES ('staff1@ubkaraoke.mn', 'staff1', $1, 'UBK Front Desk', 'staff', $2)", [stPass, orgId1]);

        // Org 2 Staff
        await client.query("INSERT INTO staff (email, username, password, name, role, organization_id) VALUES ('manager2@ubkaraoke.mn', 'manager2', $1, 'Star Manager', 'manager', $2)", [mPass, orgId2]);
        await client.query("INSERT INTO staff (email, username, password, name, role, organization_id) VALUES ('staff2@ubkaraoke.mn', 'staff2', $1, 'Star Assistant', 'staff', $2)", [stPass, orgId2]);

        // 3. Customer
        const cPass = await bcrypt.hash('123', 10);
        await client.query("INSERT INTO users (email, username, password, name, phone, role) VALUES ('bat@gmail.com', 'customer', $1, 'Bat-Erdene', '99998888', 'customer')", [cPass]);
        await client.query("INSERT INTO users (email, username, password, name, phone, role) VALUES ('saraa@gmail.com', 'saraa', $1, 'Saranduya', '88887777', 'customer')", [cPass]);

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
                `INSERT INTO venues (organization_id, name, district, address, description, phone, email, "priceRange", rating, "totalReviews", amenities, "openingHours", images, "featuredImage", latitude, longitude)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
                [venue.orgId, venue.name, venue.district, venue.address, venue.description, venue.phone, venue.email, venue.priceRange, venue.rating, venue.totalReviews, JSON.stringify(venue.amenities), JSON.stringify(venue.openingHours), JSON.stringify(venue.images), venue.featuredImage, venue.latitude, venue.longitude]
            );
            const venueId = vRes.rows[0].id;
            console.log(`✅ Created venue: ${venue.name} (Org: ${venue.orgId})`);

            for (const room of venue.rooms) {
                await client.query(
                    `INSERT INTO rooms (organization_id, "venueId", name, type, capacity, "hourlyRate", "isVIP", condition, amenities, features, images, specs, "partySupport")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [venue.orgId, venueId, room.name, room.type, room.capacity, room.hourlyRate, room.isVIP || false, room.condition, JSON.stringify(room.amenities), JSON.stringify(room.features), JSON.stringify(room.images), JSON.stringify(room.specs), JSON.stringify(room.partySupport)]
                );
                console.log(`  ➕ Created room: ${room.name}`);
            }
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
