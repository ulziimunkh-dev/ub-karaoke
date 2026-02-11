import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Venue } from './modules/venues/entities/venue.entity';
import { Organization } from './modules/organizations/entities/organization.entity';
import { Room } from './modules/rooms/entities/room.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const orgRepo = app.get<Repository<Organization>>(getRepositoryToken(Organization));
    const roomRepo = app.get<Repository<Room>>(getRepositoryToken(Room));
    const venueRepo = app.get<Repository<Venue>>(getRepositoryToken(Venue));

    console.log('--- RAW DB STATE ---');
    const orgs = await orgRepo.find();
    console.log(`\nOrganizations: ${orgs.length}`);
    orgs.forEach(o => console.log(`  - ${o.name} (isActive: ${o.isActive}, status: ${o.status})`));

    const venues = await venueRepo.find({ relations: ['organization'] });
    console.log(`\nVenues: ${venues.length}`);
    venues.forEach(v => console.log(`  - ${v.name} (isActive: ${v.isActive}, orgActive: ${v.organization?.isActive})`));

    const rooms = await roomRepo.find({ relations: ['venue'] });
    console.log(`\nRooms: ${rooms.length}`);
    rooms.forEach(r => console.log(`  - ${r.name} (isActive: ${r.isActive}) -> Venue: ${r.venue?.name}`));

    await app.close();
}

bootstrap();
