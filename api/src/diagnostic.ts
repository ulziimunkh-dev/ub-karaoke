import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VenuesService } from './modules/venues/venues.service';
import { StaffService } from './modules/staff/staff.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const venuesService = app.get(VenuesService);
  const staffService = app.get(StaffService);

  console.log('--- Diagnostic Report ---');

  // 1. Check all staff to find a manager
  const staff = await staffService.findAll();
  const managers = staff.filter((s) => s.role === 'manager');
  console.log(`Found ${managers.length} managers`);

  for (const manager of managers) {
    console.log(`Manager: ${manager.name}, Org ID: ${manager.organizationId}`);

    // 2. Fetch venues for this org without any filters (diagnostic)
    const allVenues = await venuesService.findAll({
      organizationId: manager.organizationId,
      includeInactive: true,
    });
    console.log(
      `Venues for Org ${manager.organizationId}: ${allVenues.length}`,
    );
    allVenues.forEach((v) => {
      console.log(
        ` - [${v.isActive ? 'ACTIVE' : 'INACTIVE'}] ID: ${v.id}, Name: ${v.name}, Rooms: ${v.rooms?.length || 0}`,
      );
    });

    // 3. Fetch venues with ONLY active filter (to see if it hides some)
    const activeVenues = await venuesService.findAll({
      organizationId: manager.organizationId,
      includeInactive: false,
    });
    console.log(`Active Venues for Org: ${activeVenues.length}`);
  }

  await app.close();
}

bootstrap();
