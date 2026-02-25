import { AppDataSource } from './data-source';
import { seed } from './seed';

async function run() {
  try {
    console.log('🚀 Initializing Data Source...');
    await AppDataSource.initialize();
    console.log('✅ Data Source initialized!');

    await seed(AppDataSource);

    console.log('👋 Seeding finished, closing connection...');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

run();
