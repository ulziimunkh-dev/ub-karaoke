# System Design - UB Karaoke

## 1. Architecture Overview
UB Karaoke is a web-based platform for karaoke venue discovery and booking management. It follows a client-server architecture:

- **Frontend**: A modern, responsive Single Page Application (SPA) built with **React** and **Vite**. It uses **Vanilla CSS** for custom styling and **PrimeReact** for professional UI components (DataTables, Dialogs, Forms). It employs the **Context API** for state management.
- **Backend**: A robust RESTful API built with **NestJS**, following a modular architecture.
- **Database**: **PostgreSQL** for relational data storage, managed via **TypeORM**.
- **Caching**: **Redis** is used for caching and performance optimization.

```mermaid
graph TD
    subgraph Client
        UI[React SPA]
    end

    subgraph "Backend (NestJS)"
        API[REST Controller]
        Services[Business Logic Layer]
        Auth[Auth & Guard Layer]
    end

    subgraph "Storage & Cache"
        DB[(PostgreSQL)]
        Cache[(Redis)]
    end

    UI <--> Auth
    Auth <--> API
    API <--> Services
    Services <--> DB
    Services <--> Cache
```

### Backend Module Structure
The API is split into domain-specific modules, each following the NestJS pattern of Controller-Service-Repository:
- **`AuthModule`**: Passport/JWT strategy for multi-role support.
- **`OrganizationsModule`**: Root of the business hierarchy.
- **`VenuesModule`**: Branches managed by organizations.
- **`RoomsModule`**: Booking units within venues.
- **`BookingsModule`**: Transactional flow and availability.
- **`AuditModule`**: Centralized logging for entity changes.

## 2. Database Schema
The system uses the following core entities:

- **User**: Stores registered users, including customers, staff, and admins. Includes role-based access control (RBAC).
- **Organization**: Business entities that own and manage venues.
- **Venue**: Represents a karaoke establishment, including metadata like district, address, price range, and booking rules.
- **Room**: Individual karaoke rooms within a venue, each with specific capacities, rates, and features.
- **Booking**: Records of room reservations made by customers.
- **Review**: Customer-generated feedback and ratings for venues.

### Common Metadata (Auditing & Status)
All major entities include standardized columns for tracking and status management:
- **`isActive` (Boolean)**: Replaces the legacy `status` string. Used for soft deactivation.
- **`createdBy` (Integer)**: ID of the user who created the record.
- **`updatedBy` (Integer)**: ID of the user who last modified the record.
- **`createdAt` (Timestamp)**: Automated record creation time.
- **`updatedAt` (Timestamp)**: Automated record last update time.

### Entity Relationships
- A **Venue** has many **Rooms**.
- A **Venue** has many **Reviews**.
- A **User** (Customer) can have many **Bookings**.
- A **Room** can have many **Bookings**.
- A **User** (Customer) can write many **Reviews**.

## 3. Core Modules & API Design
The backend is organized into functional modules:

| Module | Responsibility |
| :--- | :--- |
| **Auth** | Handles JWT-based authentication and authorization. |
| **Users** | User profile management and role assignments. |
| **Venues** | CRUD operations for venue details and management. |
| **Rooms** | Management of room availability and specifications. |
| **Bookings** | Core logic for creating, viewing, and cancelling reservations. |
| **Reviews** | Handling user feedback and calculating venue ratings. |

## 4. Security & Authentication
- **Authentication**: JWT (JSON Web Tokens) are used for secure session management.
- **Authorization**: Role-based access control (RBAC) ensures users can only access endpoints and features appropriate for their role (`admin`, `staff`, `customer`).
- **Data Protection**: Passwords are hashed using `bcrypt` before storage.

## 6. Logical Flows

### 6.1 Hierarchical Deactivation Flow
The system enforces hierarchy via the Service layer. When a parent entity is deactivated (`isActive: false`), child entities are implicitly filtered out from public lookups.

```mermaid
sequenceDiagram
    participant Admin
    participant OrgService
    participant VenueService
    participant Cache

    Admin->>OrgService: Update Organization (isActive=false)
    OrgService->>DB: UPDATE organizations SET is_active=false
    OrgService->>Cache: Invalidate Organization Cache
    Note over OrgService,Cache: Venues/Rooms remain active in DB
    
    Customer->>VenueService: findAll()
    VenueService->>DB: JOIN organizations ON organization.id = venue.organization_id
    VenueService-->>DB: WHERE organization.is_active=true AND venue.is_active=true
    DB-->>VenueService: Filtered Result
    VenueService-->>Customer: Returns only globally active branches
```

### 6.2 Booking Flow
The booking process involves real-time availability checks and role-based confirmation.

```mermaid
graph TD
    Start[Customer selects Room/Time] --> Check{Availability Check}
    Check -- Conflict --> Fail[Notify Conflict]
    Check -- Available --> Create[Create Pending Booking]
    Create --> Payment{Payment Process}
    Payment -- Success --> Confirm[Update to Confirmed]
    Payment -- Failure/Timeout --> Cancel[Release Room]
    Confirm --> Notify[Notify Venue Staff]
```

## 7. Deployment & DevOps
- **Containerization**: The system supports **Docker** for consistent development and deployment environments (`docker-compose.yml`).
- **Configuration**: Environment variables (`.env`) manage sensitive credentials and environment-specific settings.
