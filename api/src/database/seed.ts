import { DataSource } from 'typeorm';
import { Plan } from '../modules/plans/entities/plan.entity';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { Staff, StaffRole } from '../modules/staff/entities/staff.entity';
import { User, UserRole } from '../modules/auth/entities/user.entity';
import { Venue } from '../modules/venues/entities/venue.entity';
import {
  VenueOperatingHours,
  DayOfWeek,
} from '../modules/venues/entities/venue-operating-hours.entity';
import { Room } from '../modules/rooms/entities/room.entity';
import { RoomType } from '../modules/rooms/entities/room-type.entity';
import { RoomFeature } from '../modules/rooms/entities/room-feature.entity';
import { RoomStatus } from '../modules/bookings/enums/booking.enums';
import * as bcrypt from 'bcrypt';
import { SystemSetting } from '../modules/app-settings/entities/system-setting.entity';

export const seed = async (dataSource: DataSource) => {
  console.log('🌱 Starting TypeORM Seed...');

  const planRepo = dataSource.getRepository(Plan);
  const orgRepo = dataSource.getRepository(Organization);
  const staffRepo = dataSource.getRepository(Staff);
  const userRepo = dataSource.getRepository(User);
  const venueRepo = dataSource.getRepository(Venue);
  const opHoursRepo = dataSource.getRepository(VenueOperatingHours);
  const roomRepo = dataSource.getRepository(Room);
  const roomTypeRepo = dataSource.getRepository(RoomType);
  const roomFeatureRepo = dataSource.getRepository(RoomFeature);

  console.log('🗑️ Clearing existing data...');
  // Use raw query with CASCADE to handle foreign key constraints efficiently
  const tables = [
    'payments',
    'bookings',
    'reviews',
    'audit_logs',
    'room_features_rooms',
    'venue_operating_hours',
    'rooms',
    'venues',
    'staff',
    'organizations',
    'users',
    'plans',
    'room_types',
    'room_features',
    'system_settings',
  ];

  // We wrap table names in double quotes to handle case-sensitivity in Postgres
  await dataSource.query(
    `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
  );
  console.log('  ✅ Database wiped (CASCADE)');

  // 1. Sysadmin
  console.log('👤 Creating Sysadmin...');
  const hashedSysadminPassword = await bcrypt.hash('sysadmin', 10);
  const sysadmin = staffRepo.create({
    email: 'sysadmin@ubkaraoke.mn',
    username: 'sysadmin',
    password: hashedSysadminPassword,
    name: 'Global Admin',
    role: StaffRole.SYSADMIN,
  });
  await staffRepo.save(sysadmin);
  const adminId = sysadmin.id;

  // 2. Plans
  console.log('🌱 Seeding Plans...');
  const plansData = [
    {
      code: 'STARTER',
      name: 'Starter',
      monthlyFee: 25000,
      commissionRate: 5.0,
      maxBranches: 1,
      maxRooms: 5,
      features: {
        description: 'First-time digital users',
        bestFor: 'Small karaoke',
      },
    },
    {
      code: 'GROWTH',
      name: 'Growth',
      monthlyFee: 75000,
      commissionRate: 3.0,
      maxBranches: 3,
      maxRooms: 15,
      features: { description: 'Serious operators', bestFor: 'Medium karaoke' },
    },
    {
      code: 'FRANCHISE',
      name: 'Franchise',
      monthlyFee: 0,
      commissionRate: 1.5,
      maxBranches: null,
      maxRooms: null,
      features: {
        description: 'Franchise / premium relationship',
        bestFor: 'Large / chain',
      },
    },
  ];

  const plans: Record<string, Plan> = {};
  for (const p of plansData) {
    const plan = planRepo.create({
      code: p.code,
      name: p.name,
      monthlyFee: p.monthlyFee,
      commissionRate: p.commissionRate,
      maxBranches: p.maxBranches ?? undefined,
      maxRooms: p.maxRooms ?? undefined,
      features: p.features,
      isActive: true,
    });
    await planRepo.save(plan);
    plans[p.code] = plan;
    console.log(`  ➕ Plan: ${p.name}`);
  }

  // 3. Organizations
  console.log('🏢 Seeding Organizations...');
  const orgs = [
    {
      code: 'UBK-EXP',
      name: 'Expired Org',
      plan: plans['GROWTH'],
      status: 'active',
      startedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    { code: 'UBK-NOP', name: 'No Plan Org', plan: undefined, status: 'active' },
    {
      code: 'UBK-ACT',
      name: 'Active Org',
      plan: plans['GROWTH'],
      status: 'active',
      startedAt: new Date(),
    },
  ];

  const savedOrgs: Record<string, Organization> = {};
  for (const o of orgs) {
    const org = orgRepo.create({
      code: o.code,
      name: o.name,
      plan: o.plan,
      status: o.status,
      planStartedAt: o.startedAt,
      planEndsAt: o.endsAt,
      createdBy: adminId,
      updatedBy: adminId,
      isActive: true,
    });
    await orgRepo.save(org);
    savedOrgs[o.code] = org;
    console.log(`  🏢 Org: ${o.name}`);
  }

  // 4. Staff
  console.log('👥 Seeding Staff...');
  const managerPass = await bcrypt.hash('manager', 10);
  const staffPass = await bcrypt.hash('staff', 10);

  const staffData = [
    {
      email: 'manager1@ubkaraoke.mn',
      username: 'manager1',
      password: managerPass,
      name: 'UBK Manager',
      role: StaffRole.MANAGER,
      org: savedOrgs['UBK-EXP'],
    },
    {
      email: 'staff1@ubkaraoke.mn',
      username: 'staff1',
      password: staffPass,
      name: 'UBK Front Desk',
      role: StaffRole.STAFF,
      org: savedOrgs['UBK-EXP'],
    },
    {
      email: 'manager2@ubkaraoke.mn',
      username: 'manager2',
      password: managerPass,
      name: 'Star Manager',
      role: StaffRole.MANAGER,
      org: savedOrgs['UBK-NOP'],
    },
    {
      email: 'staff2@ubkaraoke.mn',
      username: 'staff2',
      password: staffPass,
      name: 'Star Assistant',
      role: StaffRole.STAFF,
      org: savedOrgs['UBK-NOP'],
    },
    {
      email: 'manager3@ubkaraoke.mn',
      username: 'manager3',
      password: managerPass,
      name: 'Active Manager',
      role: StaffRole.MANAGER,
      org: savedOrgs['UBK-ACT'],
    },
    {
      email: 'staff3@ubkaraoke.mn',
      username: 'staff3',
      password: staffPass,
      name: 'Active Staff',
      role: StaffRole.STAFF,
      org: savedOrgs['UBK-ACT'],
    },
  ];

  for (const s of staffData) {
    const { org, ...sData } = s;
    const staff = staffRepo.create({
      ...sData,
      organizationId: org.id,
      createdBy: adminId,
      updatedBy: adminId,
    });
    await staffRepo.save(staff);
  }

  // 5. Customers
  console.log('👤 Seeding Customers...');
  const custPass = await bcrypt.hash('123', 10);
  const customers = [
    {
      email: 'bat@gmail.com',
      username: 'customer',
      password: custPass,
      name: 'Bat-Erdene',
      phone: '99998888',
      role: UserRole.CUSTOMER,
    },
    {
      email: 'saraa@gmail.com',
      username: 'saraa',
      password: custPass,
      name: 'Saranduya',
      phone: '88887777',
      role: UserRole.CUSTOMER,
    },
  ];

  for (const c of customers) {
    const user = userRepo.create({
      ...c,
      createdBy: adminId,
      updatedBy: adminId,
    });
    await userRepo.save(user);
  }

  // 6. Venues & Rooms
  console.log('📍 Seeding Venues & Rooms...');
  const venuesData = [
    {
      org: savedOrgs['UBK-EXP'],
      name: 'Neon Nights (Seoul St)',
      district: 'Sukhbaatar',
      address: 'Seoul Street 12, Ulaanbaatar',
      description: 'Vibrant neon atmosphere with premium acoustics',
      phone: '+976 99001122',
      email: 'seoul@neonnights.mn',
      priceRange: '$$',
      rating: 4.8,
      totalReviews: 124,
      amenities: ['WiFi', 'Valet Parking', 'Full Bar', 'Catering'],
      openingHours: { Daily: '12:00-04:00' },
      images: ['/assets/defaults/karaoke_standard.png'],
      featuredImage: '/assets/defaults/karaoke_standard.png',
      isBookingEnabled: false,
      gmapLocation: "47.9188, 106.9176",
      rooms: [
        {
          name: 'Standard Alpha',
          type: 'Standard',
          capacity: 6,
          hourlyRate: 45000,
          condition: 'Excellent',
          amenities: ['Wireless Mics'],
          images: [
            '/assets/defaults/karaoke_standard.png',
            '/assets/defaults/karaoke_minimal.png',
          ],
          specs: {
            microphones: 2,
            screen: 55,
            seating: 'U-Shaped Sofa',
            ac: 'Central',
          },
          partySupport: { birthday: true },
          view360Url: 'https://oculus.com/experiences/quest/',
          bufferMinutes: 15,
          status: RoomStatus.AVAILABLE,
        },
        {
          name: 'Neon VIP Suite',
          type: 'VIP',
          capacity: 15,
          hourlyRate: 95000,
          isVIP: true,
          condition: 'Mint',
          amenities: ['Champagne Service'],
          images: [
            '/assets/defaults/karaoke_vip.png',
            '/assets/defaults/karaoke_lux.png',
          ],
          specs: {
            microphones: 4,
            screen: 120,
            seating: 'Luxury Leather',
            ac: 'Independent Control',
            sound: 'Bose Surround',
          },
          partySupport: { birthday: true, decoration: true },
          view360Url: 'https://v-tour.com/tour/neon-nights-vip',
          bufferMinutes: 25,
          status: RoomStatus.AVAILABLE,
        },
      ],
    },
    {
      org: savedOrgs['UBK-NOP'],
      name: 'Neon Nights (Zaisan)',
      district: 'Khan-Uul',
      address: 'Zaisan Hill Complex, 5th Floor',
      description: 'Luxury karaoke with panoramic city views',
      phone: '+976 99001133',
      email: 'zaisan@neonnights.mn',
      priceRange: '$$$',
      rating: 4.9,
      totalReviews: 86,
      amenities: ['VIP Parking', 'Sky Bar', 'Private Servers'],
      openingHours: { Daily: '14:00-06:00' },
      images: ['/assets/defaults/karaoke_lux.png'],
      featuredImage: '/assets/defaults/karaoke_lux.png',
      gmapLocation: "47.8960, 106.9100",
      rooms: [
        {
          name: 'Sky Room 1',
          type: 'Premium',
          capacity: 10,
          hourlyRate: 75000,
          condition: 'Excellent',
          amenities: ['iPad Ordering'],
          images: ['/assets/defaults/karaoke_lux.png'],
          specs: { microphones: 3 },
          partySupport: { birthday: true },
          isBookingEnabled: false,
          bufferMinutes: 15,
          status: RoomStatus.AVAILABLE,
        },
      ],
    },
  ];

  for (const vData of venuesData) {
    const { org, rooms: roomsData, ...restVData } = vData;
    const venue = venueRepo.create({
      ...restVData,
      organizationId: org.id,
      createdBy: adminId,
      updatedBy: adminId,
      isActive: true,
    });
    await venueRepo.save(venue);
    console.log(`  📍 Venue: ${venue.name}`);

    // Operating Hours
    if (restVData.openingHours && restVData.openingHours['Daily']) {
      const [start, end] = restVData.openingHours['Daily'].split('-');
      const days = Object.values(DayOfWeek);
      for (const day of days) {
        const oh = opHoursRepo.create({
          venueId: venue.id,
          dayOfWeek: day,
          openTime: start,
          closeTime: end,
        });
        await opHoursRepo.save(oh);
      }
    }

    // Rooms
    for (const rData of roomsData) {
      const room = roomRepo.create({
        ...rData,
        venueId: venue.id,
        organizationId: org.id,
        createdBy: adminId,
        updatedBy: adminId,
        isActive: true,
      });
      await roomRepo.save(room);
      console.log(`    🚪 Room: ${room.name}`);
    }
  }

  // 7. Global Types & Features
  console.log('🛠️ Seeding Global Types & Features...');
  const roomTypes = ['Standard', 'Premium', 'VIP', 'Large'];
  for (const name of roomTypes) {
    const rt = roomTypeRepo.create({
      name,
      createdBy: adminId,
      updatedBy: adminId,
    });
    await roomTypeRepo.save(rt);
  }

  const features = [
    { name: 'HD Screen', icon: '📺' },
    { name: '4K Projector', icon: '🎥' },
    { name: 'Dynamic Lighting', icon: '💡' },
    { name: 'Wireless Mics', icon: '🎤' },
  ];
  for (const f of features) {
    const rf = roomFeatureRepo.create({
      ...f,
      createdBy: adminId,
      updatedBy: adminId,
    });
    await roomFeatureRepo.save(rf);
  }

  // 8. System Settings
  console.log('⚙️ Seeding System Settings...');
  // Seed Default System Settings
  console.log('Seeding system settings...');
  const settingsRepo = dataSource.getRepository(SystemSetting);

  const defaultSettings = [
    { key: 'payout_min_limit', value: '100000', description: 'Minimum amount required to request a payout' },
    { key: 'ADMIN_EMAILS', value: '', description: 'Comma-separated list of admin emails for notifications' },
    { key: 'taxRate', value: '10', description: 'Default tax rate percentage' },
    { key: 'serviceCharge', value: '10', description: 'Default service charge percentage' },
    { key: 'currency', value: 'MNT', description: 'Default system currency' },
    { key: 'refund_tier1_hours', value: '24', description: 'Hours before booking for 0% cancellation fee' },
    { key: 'refund_tier1_fee_percent', value: '0', description: 'Fee percentage for Tier 1 cancellation' },
    { key: 'refund_tier2_hours', value: '4', description: 'Hours before booking for partial cancellation fee' },
    { key: 'refund_tier2_fee_percent', value: '50', description: 'Fee percentage for Tier 2 cancellation' },
    { key: 'refund_tier3_fee_percent', value: '100', description: 'Fee percentage for late cancellation (Tier 3)' },
  ];

  for (const s of defaultSettings) {
    const setting = settingsRepo.create(s);
    await settingsRepo.save(setting);
  }

  console.log('✨ TypeORM Seed Completed!');
};
