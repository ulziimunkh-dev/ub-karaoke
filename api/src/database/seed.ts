import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// Mock data from frontend
const venues = [
    {
        name: "Neon Nights Karaoke",
        district: "Sukhbaatar",
        address: "Seoul Street, Near Circus",
        description: "Premium karaoke venue with state-of-the-art sound system",
        phone: "+976 99887766",
        email: "info@neonnights.mn",
        priceRange: "$$",
        rating: 4.8,
        totalReviews: 2,
        amenities: ["WiFi", "Parking", "Bar"],
        openingHours: { "Monday": "14:00-04:00", "Tuesday": "14:00-04:00", "Wednesday": "14:00-04:00", "Thursday": "14:00-04:00", "Friday": "14:00-04:00", "Saturday": "14:00-04:00", "Sunday": "14:00-04:00" },
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
                features: ['HD Screen', 'AC'],
                amenities: ['Microphone', 'Screen'],
                images: ["/assets/defaults/karaoke_standard.png", "/assets/defaults/karaoke_minimal.png"],
                specs: { microphones: 2, speaker: 'Standard', screen: 55, seating: 'Sofa', ac: 'Manual', sound: 'Medium', lighting: ['Normal'], cleaning: 15 },
                partySupport: { birthday: true, decoration: false },
                view360Url: "/assets/defaults/karaoke_standard.png"
            },
            {
                name: 'VIP Lounge',
                type: 'VIP',
                capacity: 12,
                hourlyRate: 80000,
                isVIP: true,
                condition: 'Excellent',
                features: ['4K Screen', 'Private Bath', 'Premium Sound'],
                amenities: ['Premium Microphone', '4K Screen', 'Mini Bar'],
                images: ["/assets/defaults/karaoke_vip.png", "/assets/defaults/karaoke_standard.png"],
                specs: { microphones: 4, speaker: 'Premium', screen: 75, seating: 'Luxury couch', ac: 'Auto', sound: 'High', lighting: ['Normal', 'Disco', 'Neon'], cleaning: 20 },
                partySupport: { birthday: true, decoration: true },
                view360Url: "/assets/defaults/karaoke_vip.png"
            },
            {
                name: 'Party Hall',
                type: 'Party',
                capacity: 25,
                hourlyRate: 150000,
                condition: 'Excellent',
                features: ['Stage', 'Lighting System', 'Bar'],
                amenities: ['Stage', 'DJ Equipment', 'Bar'],
                images: ["/assets/defaults/karaoke_party.png", "/assets/defaults/karaoke_vip.png"],
                specs: { microphones: 6, speaker: 'Concert', screen: 100, seating: 'Booth', ac: 'Auto', sound: 'High', lighting: ['Club', 'RGB', 'Strobe'], cleaning: 30 },
                partySupport: { birthday: true, decoration: true },
                view360Url: "/assets/defaults/karaoke_party.png"
            }
        ]
    },
    {
        name: "Galaxy VIP Lounge",
        district: "Khan-Uul",
        address: "Zaisan Hill Complex",
        description: "Luxury karaoke with panoramic city views",
        phone: "+976 88776655",
        priceRange: "$$$",
        rating: 4.9,
        totalReviews: 1,
        amenities: ["Valet Parking", "Private Rooms", "Restaurant"],
        openingHours: { "Monday": "10:00-02:00", "Tuesday": "10:00-02:00", "Wednesday": "10:00-02:00", "Thursday": "10:00-02:00", "Friday": "10:00-02:00", "Saturday": "10:00-02:00", "Sunday": "10:00-02:00" },
        images: ["/assets/defaults/karaoke_vip.png"],
        featuredImage: "/assets/defaults/karaoke_vip.png",
        latitude: 47.8960,
        longitude: 106.9100,
        rooms: [
            {
                name: 'Couple Room',
                type: 'Small',
                capacity: 4,
                hourlyRate: 50000,
                condition: 'Good',
                features: ['City View'],
                amenities: ['Microphone', 'Screen'],
                images: ["/assets/defaults/karaoke_minimal.png", "/assets/defaults/karaoke_standard.png"],
                specs: { microphones: 2, speaker: 'Standard', screen: 50, seating: 'Sofa', ac: 'Manual', sound: 'Medium', lighting: ['Normal'], cleaning: 15 },
                partySupport: { birthday: false, decoration: false }
            },
            {
                name: 'Luxury VIP',
                type: 'VIP',
                capacity: 15,
                hourlyRate: 120000,
                isVIP: true,
                condition: 'Excellent',
                features: ['Panorama View', 'Leather Seats'],
                amenities: ['Premium Equipment', 'Mini Bar', 'Leather Seats'],
                images: ["/assets/defaults/karaoke_vip.png", "/assets/defaults/karaoke_party.png"],
                specs: { microphones: 4, speaker: 'Premium', screen: 85, seating: 'Luxury couch', ac: 'Auto', sound: 'High', lighting: ['Mood', 'Disco'], cleaning: 25 },
                partySupport: { birthday: true, decoration: true },
                view360Url: "/assets/defaults/karaoke_vip.png"
            }
        ]
    },
    {
        name: "Melody KTV",
        district: "Bayangol",
        address: "3rd Microdistrict",
        description: "Affordable karaoke for everyone",
        phone: "+976 77665544",
        priceRange: "$",
        rating: 3.5,
        totalReviews: 1,
        amenities: ["Parking", "Snacks"],
        openingHours: { "Monday": "12:00-03:00", "Tuesday": "12:00-03:00", "Wednesday": "12:00-03:00", "Thursday": "12:00-03:00", "Friday": "12:00-03:00", "Saturday": "12:00-03:00", "Sunday": "12:00-03:00" },
        images: ["/assets/defaults/karaoke_standard.png"],
        featuredImage: "/assets/defaults/karaoke_standard.png",
        latitude: 47.9200,
        longitude: 106.8800,
        rooms: [
            {
                name: 'Room 101',
                type: 'Standard',
                capacity: 6,
                hourlyRate: 25000,
                condition: 'Fair',
                features: [],
                amenities: ['Basic Equipment'],
                images: ["/assets/defaults/karaoke_standard.png", "/assets/defaults/karaoke_minimal.png"],
                specs: { microphones: 2, speaker: 'Standard', screen: 42, seating: 'Sofa', ac: 'Manual', sound: 'Low', lighting: ['Normal'], cleaning: 10 },
                partySupport: { birthday: false, decoration: false }
            }
        ]
    }
];

export async function seed() {
    const AppDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 5432,
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'karaoke_db',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false,
    });

    await AppDataSource.initialize();
    console.log('📦 Database connected for seeding...');

    // Clear existing data
    await AppDataSource.query('DELETE FROM reviews');
    await AppDataSource.query('DELETE FROM bookings');
    await AppDataSource.query('DELETE FROM rooms');
    await AppDataSource.query('DELETE FROM venues');
    await AppDataSource.query('DELETE FROM users');
    console.log('🗑️  Cleared existing data');

    // Create venues and rooms
    for (const venueData of venues) {
        const { rooms: roomsData, ...venueInfo } = venueData;

        const venueResult = await AppDataSource.query(
            `INSERT INTO venues (name, district, address, description, phone, email, "priceRange", rating, "totalReviews", amenities, "openingHours", images, "featuredImage", latitude, longitude, "isBookingEnabled", "bookingWindowStart", "bookingWindowEnd", "advanceBookingDays")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
             RETURNING id`,
            [
                venueInfo.name,
                venueInfo.district,
                venueInfo.address,
                venueInfo.description,
                venueInfo.phone,
                venueInfo.email || null,
                venueInfo.priceRange,
                venueInfo.rating,
                venueInfo.totalReviews,
                JSON.stringify(venueInfo.amenities),
                JSON.stringify(venueInfo.openingHours),
                JSON.stringify(venueInfo.images),
                venueInfo.featuredImage,
                venueInfo.latitude,
                venueInfo.longitude,
                true, // isBookingEnabled
                venueInfo.name === "Neon Nights Karaoke" ? "16:00" : null,
                venueInfo.name === "Neon Nights Karaoke" ? "22:00" : null,
                3 // advanceBookingDays default
            ]
        );

        const venueId = venueResult[0].id;
        console.log(`✅ Created venue: ${venueInfo.name}`);

        // Create rooms for this venue
        for (const room of roomsData) {
            await AppDataSource.query(
                `INSERT INTO rooms ("venueId", name, type, capacity, "hourlyRate", "isVIP", condition, amenities, features, images, specs, "partySupport", "view360Url")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    venueId,
                    room.name,
                    room.type,
                    room.capacity,
                    room.hourlyRate,
                    room.isVIP || false,
                    room.condition,
                    JSON.stringify(room.amenities),
                    JSON.stringify(room.features),
                    JSON.stringify(room.images),
                    JSON.stringify(room.specs),
                    JSON.stringify(room.partySupport),
                    room.view360Url || null
                ]
            );
            console.log(`  ➕ Created room: ${room.name}`);
        }
    }

    // Create demo users
    const hashedPassword = await bcrypt.hash('admin', 10);
    const hashedStaffPassword = await bcrypt.hash('staff', 10);
    const hashedCustomerPassword = await bcrypt.hash('123', 10);

    await AppDataSource.query(
        `INSERT INTO users (email, username, password, name, phone, role, "loyaltyPoints")
         VALUES 
         ($1, $2, $3, $4, $5, $6, $7),
         ($8, $9, $10, $11, $12, $13, $14),
         ($15, $16, $17, $18, $19, $20, $21)`,
        [
            'admin@ubkaraoke.mn', 'admin', hashedPassword, 'System Admin', '99111111', 'admin', 0,
            'staff@ubkaraoke.mn', 'staff', hashedStaffPassword, 'Front Desk', '88111111', 'staff', 0,
            'bat@gmail.com', 'customer', hashedCustomerPassword, 'Bat-Erdene', '99998888', 'customer', 150
        ]
    );
    console.log('👥 Created demo users (admin/admin, staff/staff, customer/123)');

    await AppDataSource.destroy();
    console.log('✨ Seeding completed!');
}

seed().catch(console.error);
