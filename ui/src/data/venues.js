import imgMinimal from '../assets/defaults/karaoke_minimal.png';
import imgStandard from '../assets/defaults/karaoke_standard.png';
import imgVIP from '../assets/defaults/karaoke_vip.png';
import imgParty from '../assets/defaults/karaoke_party.png';

export const districts = [
    "Sukhbaatar",
    "Chingeltei",
    "Bayangol",
    "Bayanzurkh",
    "Songinokhairkhan",
    "Khan-Uul",
    "Nalaikh",
    "Bagakhangai",
    "Baganuur"
];

export const venues = [
    {
        id: 1,
        name: "Neon Nights Karaoke",
        district: "Sukhbaatar",
        address: "Seoul Street, Near Circus",
        rating: 4.8,
        reviews: [
            { id: 1, user: "Bold", comment: "Amazing sound system!", rating: 5 },
            { id: 2, user: "Sara", comment: "A bit pricey but worth it.", rating: 4 }
        ],
        coordinates: { lat: 47.9188, lng: 106.9176 },
        image: imgStandard,
        openHours: { start: "14:00", end: "04:00" },
        rooms: [
            {
                id: 'r1', name: 'Standard Room 1', type: 'Standard', capacity: 6, pricePerHour: 40000,
                features: ['HD Screen', 'AC'],
                images: [imgStandard, imgMinimal],
                specs: { microphones: 2, speaker: 'Standard', screen: 55, seating: 'Sofa', ac: 'Manual', sound: 'Medium', lighting: ['Normal'], cleaning: 15 },
                partySupport: { birthday: true, decoration: false },
                view360: imgStandard
            },
            {
                id: 'r2', name: 'VIP Lounge', type: 'VIP', capacity: 12, pricePerHour: 80000,
                features: ['4K Screen', 'Private Bath', 'Premium Sound'],
                images: [imgVIP, imgStandard],
                specs: { microphones: 4, speaker: 'Premium', screen: 75, seating: 'Luxury couch', ac: 'Auto', sound: 'High', lighting: ['Normal', 'Disco', 'Neon'], cleaning: 20 },
                partySupport: { birthday: true, decoration: true },
                view360: imgVIP
            },
            {
                id: 'r3', name: 'Party Hall', type: 'Party', capacity: 25, pricePerHour: 150000,
                features: ['Stage', 'Lighting System', 'Bar'],
                images: [imgParty, imgVIP],
                specs: { microphones: 6, speaker: 'Concert', screen: 100, seating: 'Booth', ac: 'Auto', sound: 'High', lighting: ['Club', 'RGB', 'Strobe'], cleaning: 30 },
                partySupport: { birthday: true, decoration: true },
                view360: imgParty
            }
        ]
    },
    {
        id: 2,
        name: "Galaxy VIP Lounge",
        district: "Khan-Uul",
        address: "Zaisan Hill Complex",
        rating: 4.9,
        reviews: [
            { id: 1, user: "Tuya", comment: "Best view in town", rating: 5 }
        ],
        coordinates: { lat: 47.8960, lng: 106.9100 },
        image: imgVIP,
        openHours: { start: "10:00", end: "02:00" },
        rooms: [
            {
                id: 'r1', name: 'Couple Room', type: 'Small', capacity: 4, pricePerHour: 50000,
                features: ['City View'],
                images: [imgMinimal, imgStandard],
                specs: { microphones: 2, speaker: 'Standard', screen: 50, seating: 'Sofa', ac: 'Manual', sound: 'Medium', lighting: ['Normal'], cleaning: 15 },
                partySupport: { birthday: false, decoration: false },
                view360: imgMinimal
            },
            {
                id: 'r2', name: 'Luxury VIP', type: 'VIP', capacity: 15, pricePerHour: 120000,
                features: ['Panorama View', 'Leather Seats'],
                images: [imgVIP, imgParty],
                specs: { microphones: 4, speaker: 'Premium', screen: 85, seating: 'Luxury couch', ac: 'Auto', sound: 'High', lighting: ['Mood', 'Disco'], cleaning: 25 },
                partySupport: { birthday: true, decoration: true },
                view360: imgVIP
            }
        ]
    },
    {
        id: 3,
        name: "Melody KTV",
        district: "Bayangol",
        address: "3rd Microdistrict",
        rating: 3.5,
        reviews: [
            { id: 1, user: "Bat", comment: "Microphone was glitchy", rating: 3 }
        ],
        coordinates: { lat: 47.9200, lng: 106.8800 },
        image: imgStandard,
        openHours: { start: "12:00", end: "03:00" },
        rooms: [
            {
                id: 'r1', name: 'Room 101', type: 'Standard', capacity: 6, pricePerHour: 25000,
                features: [],
                images: [imgStandard, imgMinimal],
                specs: { microphones: 2, speaker: 'Standard', screen: 42, seating: 'Sofa', ac: 'Manual', sound: 'Low', lighting: ['Normal'], cleaning: 10 },
                partySupport: { birthday: false, decoration: false },
                view360: imgStandard
            },
            {
                id: 'r2', name: 'Room 102', type: 'Standard', capacity: 8, pricePerHour: 30000,
                features: [],
                images: [imgStandard, imgMinimal],
                specs: { microphones: 2, speaker: 'Standard', screen: 50, seating: 'Booth', ac: 'Manual', sound: 'Medium', lighting: ['Normal'], cleaning: 15 },
                partySupport: { birthday: true, decoration: false },
                view360: imgStandard
            }
        ]
    },
    {
        id: 4,
        name: "Blue Sky Karaoke",
        district: "Sukhbaatar",
        address: "Blue Sky Tower, 3rd Floor",
        rating: 4.5,
        reviews: [],
        coordinates: { lat: 47.9170, lng: 106.9190 },
        image: imgVIP,
        openHours: { start: "16:00", end: "05:00" },
        rooms: [
            {
                id: 'r1', name: 'Sky Room', type: 'VIP', capacity: 10, pricePerHour: 60000,
                features: ['View'],
                images: [imgVIP, imgStandard],
                specs: { microphones: 4, speaker: 'Premium', screen: 65, seating: 'Luxury couch', ac: 'Auto', sound: 'High', lighting: ['Mood', 'Neon'], cleaning: 20 },
                partySupport: { birthday: true, decoration: true },
                view360: imgVIP
            }
        ]
    },
    {
        id: 5,
        name: "Rock & Roll Club",
        district: "Bayanzurkh",
        address: "13th Microdistrict",
        rating: 4.0,
        reviews: [],
        coordinates: { lat: 47.9150, lng: 106.9500 },
        image: imgParty,
        openHours: { start: "18:00", end: "06:00" },
        rooms: [
            {
                id: 'r1', name: 'Rock Room', type: 'Themed', capacity: 10, pricePerHour: 35000,
                features: ['Rock Decor'],
                images: [imgParty, imgStandard],
                specs: { microphones: 3, speaker: 'Concert', screen: 60, seating: 'Sofa', ac: 'Manual', sound: 'High', lighting: ['Rock', 'Strobe'], cleaning: 20 },
                partySupport: { birthday: true, decoration: false },
                view360: imgParty
            }
        ]
    }
];
