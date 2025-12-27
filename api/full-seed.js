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

        // Clear existing data
        console.log('🗑️ Clearing data...');
        await client.query('TRUNCATE TABLE organizations, staff, users, venues, rooms, bookings, payments, reviews, audit_logs CASCADE');
        console.log('✅ Data cleared');

        // 1. Organization
        const orgRes = await client.query("INSERT INTO organizations (code, name) VALUES ('DEFAULT', 'Default Org') RETURNING id");
        const orgId = orgRes.rows[0].id;

        // 2. Staff
        const sPass = await bcrypt.hash('sysadmin', 10);
        const mPass = await bcrypt.hash('manager', 10);
        const stPass = await bcrypt.hash('staff', 10);

        await client.query("INSERT INTO staff (email, username, password, name, role, organization_id) VALUES ('sysadmin@ubkaraoke.mn', 'sysadmin', $1, 'System Admin', 'sysadmin', null)", [sPass]);
        await client.query("INSERT INTO staff (email, username, password, name, role, organization_id) VALUES ('manager@ubkaraoke.mn', 'manager', $1, 'Manager', 'manager', $2)", [mPass, orgId]);
        await client.query("INSERT INTO staff (email, username, password, name, role, organization_id) VALUES ('staff@ubkaraoke.mn', 'staff', $1, 'Front Desk', 'staff', $2)", [stPass, orgId]);

        // 3. Customer
        const cPass = await bcrypt.hash('123', 10);
        await client.query("INSERT INTO users (email, username, password, name, phone, role) VALUES ('bat@gmail.com', 'customer', $1, 'Bat', '99998888', 'customer')", [cPass]);

        // 4. Venues & Rooms
        const venues = [
            {
                name: "Neon Nights Karaoke",
                district: "Sukhbaatar",
                address: "Seoul Street, Near Circus",
                description: "Premium karaoke venue",
                phone: "+976 99887766",
                email: "info@neonnights.mn",
                priceRange: "$$",
                rating: 4.8,
                totalReviews: 2,
                amenities: ["WiFi", "Parking", "Bar"],
                openingHours: { "Monday": "14:00-04:00" },
                images: ["/assets/defaults/karaoke_standard.png"],
                featuredImage: "/assets/defaults/karaoke_standard.png",
                latitude: 47.9188,
                longitude: 106.9176,
                rooms: [
                    {
                        name: 'Standard Room 1',
                        type: 'Standard',
                        capacity: 6,
                        hourlyRate: 40000,
                        condition: 'Good',
                        features: ['HD Screen'],
                        amenities: ['Microphone'],
                        images: ["/assets/defaults/karaoke_standard.png"],
                        specs: { microphones: 2 },
                        partySupport: { birthday: true }
                    },
                    {
                        name: 'VIP Lounge',
                        type: 'VIP',
                        capacity: 12,
                        hourlyRate: 80000,
                        isVIP: true,
                        condition: 'Excellent',
                        features: ['4K Screen'],
                        amenities: ['Mini Bar'],
                        images: ["/assets/defaults/karaoke_vip.png"],
                        specs: { microphones: 4 },
                        partySupport: { birthday: true }
                    }
                ]
            }
        ];

        for (const venue of venues) {
            const vRes = await client.query(
                `INSERT INTO venues (organization_id, name, district, address, description, phone, email, "priceRange", rating, "totalReviews", amenities, "openingHours", images, "featuredImage", latitude, longitude)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
                [orgId, venue.name, venue.district, venue.address, venue.description, venue.phone, venue.email, venue.priceRange, venue.rating, venue.totalReviews, JSON.stringify(venue.amenities), JSON.stringify(venue.openingHours), JSON.stringify(venue.images), venue.featuredImage, venue.latitude, venue.longitude]
            );
            const venueId = vRes.rows[0].id;
            console.log(`✅ Created venue: ${venue.name}`);

            for (const room of venue.rooms) {
                await client.query(
                    `INSERT INTO rooms (organization_id, "venueId", name, type, capacity, "hourlyRate", "isVIP", condition, amenities, features, images, specs, "partySupport")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [orgId, venueId, room.name, room.type, room.capacity, room.hourlyRate, room.isVIP || false, room.condition, JSON.stringify(room.amenities), JSON.stringify(room.features), JSON.stringify(room.images), JSON.stringify(room.specs), JSON.stringify(room.partySupport)]
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
