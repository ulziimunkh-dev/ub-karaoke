# UB Karaoke API

Backend API service for the UB Karaoke booking application built with NestJS, PostgreSQL, and Redis.

## Tech Stack

- ⭐ **NestJS** - Progressive Node.js framework
- 🐘 **PostgreSQL** - Relational database
- 🔴 **Redis** - Caching layer
- 📝 **TypeORM** - ORM for database management
- 🔍 **Swagger** - API documentation

## Features

- ✅ Full CRUD operations for Venues, Rooms, Bookings, and Reviews
- ✅ Redis caching for improved performance
- ✅ Request validation with class-validator
- ✅ Swagger API documentation
- ✅ Time conflict detection for bookings
- ✅ Automatic venue rating calculation
- ✅ CORS enabled for frontend integration

## Prerequisites

- Node.js (v18 or higher)
- Docker & Docker Compose (for PostgreSQL and Redis)
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Database & Cache

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

Check containers are running:

```bash
docker-compose ps
```

### 3. Configure Environment

Environment variables are already set in `.env` file. Modify if needed:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=karaoke_db

REDIS_HOST=localhost
REDIS_PORT=6379

PORT=3001
NODE_ENV=development

FRONTEND_URL=http://localhost:5173
```

### 4. Run the Application

Development mode:

```bash
npm run start:dev
```

Production mode:

```bash
npm run build
npm run start:prod
```

### 5. Access API Documentation

Once the application is running, visit:

- **API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api

## API Endpoints

### Venues

- `GET /venues` - Get all venues (with filters: district, priceRange, search)
- `GET /venues/:id` - Get single venue
- `POST /venues` - Create venue
- `PATCH /venues/:id` - Update venue
- `DELETE /venues/:id` - Delete venue

### Rooms

- `GET /rooms` - Get all rooms (with filters: venueId, isVIP, minCapacity)
- `GET /rooms/:id` - Get single room
- `POST /rooms` - Create room
- `PATCH /rooms/:id` - Update room
- `DELETE /rooms/:id` - Delete room

### Bookings

- `GET /bookings` - Get all bookings (with filters: userId, venueId, roomId, status)
- `GET /bookings/:id` - Get single booking
- `POST /bookings` - Create booking (with conflict detection)
- `PATCH /bookings/:id` - Update booking
- `DELETE /bookings/:id` - Cancel booking

### Reviews

- `GET /reviews` - Get all reviews (with filter: venueId)
- `GET /reviews/:id` - Get single review
- `POST /reviews` - Create review (auto-updates venue rating)
- `PATCH /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review

## Project Structure

```
api/
├── src/
│   ├── modules/
│   │   ├── venues/        # Venues CRUD
│   │   ├── rooms/         # Rooms CRUD
│   │   ├── bookings/      # Booking system
│   │   └── reviews/       # Reviews system
│   ├── app.module.ts      # Main app module
│   └── main.ts            # Application entry point
├── docker-compose.yml     # Docker services
├── .env                   # Environment variables
└── package.json
```

## Database Schema

The application uses TypeORM with automatic synchronization (development only). Main entities:

- **Venue**: Karaoke venues with details, amenities, and operating hours
- **Room**: Individual rooms within venues (many-to-one with Venue)
- **Booking**: Reservations with time conflict detection
- **Review**: User reviews with automatic rating aggregation

## Development

### Stop Docker Services

```bash
docker-compose down
```

### View Logs

```bash
docker-compose logs -f
```

### Reset Database

```bash
docker-compose down -v
docker-compose up -d
```

## Notes

- Database synchronization is set to `true` in development for quick iteration
- For production, set `synchronize: false` and use migrations
- Redis caching TTL is set to 5 minutes for venue data
- CORS is configured to accept requests from the frontend (port 5173)

## Frontend Integration

The API is configured to work with the frontend running on `http://localhost:5173`. Update the `FRONTEND_URL` in `.env` if your frontend runs on a different port.

Example fetch call from frontend:

```javascript
// Get all venues
const response = await fetch('http://localhost:3001/venues');
const venues = await response.json();

// Create a booking
const booking = await fetch('http://localhost:3001/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomId: 1,
    venueId: 1,
    date: '2025-12-20',
    startTime: '18:00',
    endTime: '20:00',
    duration: 2,
    totalPrice: 50000,
    customerName: 'John Doe',
    customerPhone: '+976 99887766'
  })
});
```

## License

MIT
