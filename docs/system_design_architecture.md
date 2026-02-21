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
- **`RoomsModule`**: Booking units within venues, including pricing and availability logic.
- **`BookingsModule`**: Transactional flow, conflict detection, and status management.
- **`AccountsModule`**: Double-entry bookkeeping system (Assets, Liabilities, Revenue, Expenses).
- **`PaymentsModule`**: Payment processing (QPay, Cards), refunds, and transaction logging.
- **`PromotionsModule`**: Management of discount codes and validity.
- **`NotificationsModule`**: Handling email/SMS alerts for bookings and system events.
- **`PlansModule`**: Configuration of subscription tiers for organizations.
- **`AuditModule`**: Centralized logging for entity changes.

## 2. Database Schema
The system uses **UUIDs** for all primary keys to ensure scalability and security. The core entities include:

- **User**: Stores registered users, including customers, staff, and admins. Includes role-based access control (RBAC).
- **Organization**: Business entities that own and manage venues. Includes subscription plan tracking.
- **Venue**: Represents a karaoke establishment, including metadata like district, address, and operating hours.
- **Room**: Individual karaoke rooms with specific capacities, rates, types, and features.
- **Booking**: Records of room reservations with status history.
- **Account & LedgerEntry**: Financial records implementing double-entry accounting for auditability.
- **Payment & Transaction**: Records of monetary exchanges and gateway responses.
- **Promotion**: Discount codes with specific values and validity periods.
- **Review**: Customer-generated feedback and ratings.

### Common Metadata (Auditing & Status)
All major entities include standardized columns for tracking and status management:
- **`id` (UUID)**: Universally unique identifier.
- **`isActive` (Boolean)**: Replaces legacy `status` string for soft deactivation.
- **`createdBy` (UUID)**: ID of the user who created the record.
- **`updatedBy` (UUID)**: ID of the user who last modified the record.
- **`createdAt` (Timestamp)**: Automated record creation time.
- **`updatedAt` (Timestamp)**: Automated record last update time.

### Entity Relationships
- A **Venue** has many **Rooms**.
- A **Venue** has many **Reviews**.
- A **User** (Customer) can have many **Bookings**.
- A **Room** can have many **Bookings**.
- A **Booking** has many **Payments**.
- An **Organization** has many **Accounts** (Financial).

## 3. Core Modules & API Design
The backend is organized into functional modules:

| Module | Responsibility |
| :--- | :--- |
| **Auth** | Handles JWT-based authentication and authorization. |
| **Users** | User profile management and role assignments. |
| **Venues** | CRUD operations for venue details and management. |
| **Rooms** | Management of room specifications, **pricing**, and **availability**. |
| **Bookings** | Core booking flow, status transitions, and conflict checks. |
| **Accounts** | Financial ledger, balance tracking, and detailed transaction history. |
| **Payments** | Payment gateway integration, transaction recording, and refunds. |
| **Promotions** | Management of discount codes and validation logic. |
| **Reviews** | Handling user feedback and calculating venue ratings. |
| **Notifications** | System alerts and user communications. |

## 4. Security & Authentication
- **Authentication**: JWT (JSON Web Tokens) are used for secure session management. Supports both password-based and **OTP (One-Time Password)** flows.
- **Authorization**: Role-based access control (RBAC) ensures users can only access endpoints and features appropriate for their role (`sysadmin`, `admin`, `manager`, `staff`, `customer`).
- **Role-Based Login Paths**:
    - Administrative users (Sysadmin, Admin) log in through the `/admin` entry point.
    - Operational users (Manager, Staff) use the `/staff/login` entry point.
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

---

# 8. Detailed System Architecture

This section provides comprehensive diagrams of the UB Karaoke App's data model and operational flows. All keys use **UUIDs**.

## 8.1. High-Level Conceptual ERD

```mermaid
erDiagram
    ORGANIZATION ||--o{ VENUE : owns
    ORGANIZATION ||--o{ STAFF : employs
    ORGANIZATION }|--|| PLAN : subscribed_to

    VENUE ||--o{ ROOM : contains
    VENUE ||--o{ REVIEW : receives
    
    ROOM }|--|| ROOM_TYPE : categorized_as
    ROOM }|--o{ ROOM_FEATURE : equipped_with
    ROOM ||--o{ BOOKING : reserved_in

    BOOKING ||--o{ PAYMENT : paid_by
    BOOKING }|--|| USER : booked_by
```

## 8.2. Exhaustive Technical ERD

Includes all entities, columns, data types, and relationships.

```mermaid
erDiagram
    PLAN ||--o{ ORGANIZATION : "defined for"
    ORGANIZATION ||--o{ STAFF : "employs"
    ORGANIZATION ||--o{ VENUE : "owns"
    ORGANIZATION ||--o{ PROMOTION : "manages"
    ORGANIZATION ||--o{ ACCOUNT : "owns"
    ORGANIZATION ||--o{ ORGANIZATION_PAYOUT : "processes"
    ORGANIZATION ||--o{ ORGANIZATION_EARNING : "receives"
    
    VENUE ||--o{ ROOM : "contains"
    VENUE ||--o{ REVIEW : "reviews"
    VENUE ||--o{ VENUE_OPERATING_HOURS : "opening_times"
    VENUE ||--o{ ROOM_PRICING : "default_pricing"
    
    ROOM ||--o{ BOOKING : "reserved_in"
    ROOM }|--|| ROOM_TYPE : "typed as"
    ROOM }|--o{ ROOM_FEATURE : "featured with"
    ROOM ||--o{ ROOM_PRICING : "specific pricing"
    ROOM ||--o{ ROOM_IMAGE : "images"
    ROOM ||--o{ ROOM_AVAILABILITY : "availability"

    USER ||--o{ BOOKING : "books"
    USER ||--o{ REVIEW : "writes"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AUDIT_LOG : "triggers"

    BOOKING ||--o{ PAYMENT : "paid with"
    BOOKING ||--o{ BOOKING_STATUS_HISTORY : "status logs"
    BOOKING ||--o{ BOOKING_PROMOTION : "discounts"
    
    PAYMENT ||--o{ PAYMENT_TRANSACTION : "transactions"
    PAYMENT ||--o{ REFUND : "refunds"

    ACCOUNT ||--o{ LEDGER_ENTRY : "entries"

    ORGANIZATION_PAYOUT ||--o{ ORGANIZATION_PAYOUT_ITEM : "items"
    ORGANIZATION_PAYOUT_ITEM }|--|| ORGANIZATION_EARNING : "pays"

    PLAN {
        uuid id PK
        string code
        string name
        int monthly_fee
        decimal commission_rate
        int max_branches
        int max_rooms
        jsonb features
        boolean is_active
        timestamp created_at
    }

    PROMOTION {
        uuid id PK
        string code
        enum type
        decimal value
        timestamp start_date
        timestamp end_date
        int usage_limit
        boolean is_active
        uuid organization_id FK
    }

    ORGANIZATION {
        uuid id PK
        string code
        string name
        string description
        string logoUrl
        string address
        string phone
        string email
        boolean is_active
        uuid plan_id FK
        timestamp plan_started_at
        timestamp plan_ends_at
        string status
        timestamp created_at
        timestamp updated_at
        uuid created_by
        uuid updated_by
    }

    STAFF {
        uuid id PK
        string email
        string username
        string password
        string name
        enum role
        uuid organization_id FK
        boolean is_active
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }

    USER {
        uuid id PK
        string email
        string username
        string name
        string phone
        enum role
        int loyalty_points
        boolean is_active
        boolean is_verified
        string verification_code
        timestamp verification_code_expiry
        timestamp created_at
        timestamp updated_at
    }

    VENUE {
        uuid id PK
        string name
        text description
        string address
        string district
        string phone
        string email
        decimal rating
        jsonb amenities
        jsonb openingHours
        boolean isBookingEnabled
        uuid organization_id FK
        timestamp created_at
        timestamp updated_at
    }

    VENUE_OPERATING_HOURS {
        uuid id PK
        uuid venue_id FK
        enum day_of_week
        string open_time
        string close_time
        boolean is_closed
    }

    ROOM {
        uuid id PK
        uuid venueId FK
        string name
        uuid roomTypeId FK
        int capacity
        decimal hourlyRate
        boolean isVIP
        string condition
        jsonb amenities
        boolean is_active
        int sort_order
        uuid organization_id FK
    }

    ROOM_TYPE {
        uuid id PK
        string name
        string description
    }

    ROOM_FEATURE {
        uuid id PK
        string name
        string icon
    }

    ROOM_PRICING {
        uuid id PK
        uuid organization_id FK
        uuid venue_id FK
        uuid room_id FK
        enum day_type
        time start_time
        time end_time
        decimal price_per_hour
        int priority
    }

    ROOM_IMAGE {
        uuid id PK
        uuid roomId FK
        string url
        string altText
        int sort_order
    }

    BOOKING {
        uuid id PK
        uuid userId FK
        uuid roomId FK
        uuid venueId FK
        timestamp startTime
        timestamp endTime
        decimal totalPrice
        enum status
        string customerName
        string customerPhone
        uuid organization_id FK
    }

    BOOKING_STATUS_HISTORY {
        uuid id PK
        uuid bookingId FK
        enum status
        string reason
        uuid changedBy FK
        timestamp created_at
    }

    PAYMENT {
        uuid id PK
        decimal amount
        string currency
        enum status
        enum method
        uuid bookingId FK
        uuid organization_id FK
    }

    PAYMENT_TRANSACTION {
        uuid id PK
        uuid paymentId FK
        enum provider
        string providerTxId
        decimal amount
        enum status
        jsonb rawResponse
    }

    REFUND {
        uuid id PK
        uuid paymentId FK
        decimal amount
        string reason
        enum status
    }

    ACCOUNT {
        uuid id PK
        string code
        string name
        enum type
        enum ownerType
        uuid ownerId FK
    }

    LEDGER_ENTRY {
        uuid id PK
        uuid account_id FK
        enum referenceType
        uuid referenceId FK
        decimal debit
        decimal credit
    }

    ORGANIZATION_EARNING {
        uuid id PK
        uuid organization_id FK
        uuid bookingId FK
        decimal amount
        decimal commission
        decimal net_amount
    }

    ORGANIZATION_PAYOUT {
        uuid id PK
        uuid organization_id FK
        decimal amount
        enum status
        timestamp processed_at
    }

    ORGANIZATION_PAYOUT_ITEM {
        uuid id PK
        uuid payoutId FK
        uuid earningId FK
        decimal amount
    }

    BOOKING_PROMOTION {
        uuid id PK
        uuid bookingId FK
        uuid promotionId FK
        decimal discountAmount
        uuid organization_id FK
    }

    AUDIT_LOG {
        uuid id PK
        string action
        string resource
        uuid resourceId
        jsonb details
        uuid userId FK
        uuid organization_id FK
        timestamp created_at
    }

    NOTIFICATION {
        uuid id PK
        uuid userId FK
        string title
        text message
        boolean isRead
        timestamp created_at
    }
```

## 8.3. Class Diagram: Core Services Flow

```mermaid
classDiagram
    class AuthController {
        +signup()
        +login()
    }
    class AuthService {
        +validateUser()
        +login()
    }
    AuthController --> AuthService

    class BookingsController {
        +create()
        +approve()
        +reject()
    }
    class BookingsService {
        +create()
        +updateStatus()
        +checkConflicts()
    }
    BookingsController --> BookingsService
    BookingsService --> AuditService
    BookingsService --> RoomsService
    BookingsService --> AccountsService

    class FinanceController {
        +getEarnings()
        +getPayouts()
    }
    FinanceController --> OrganizationsService
    OrganizationsService --> AccountsService
```

## 8.4. Operational Diagrams

### 8.4.1. Sequence Diagram: Online Booking Flow

```mermaid
sequenceDiagram
    actor Customer
    participant API as BookingController
    participant Service as BookingsService
    participant DB as Database
    participant Notify as NotificationService

    Customer->>API: POST /bookings (roomId, slot)
    activate API
    API->>Service: create(dto)
    activate Service
    Service->>DB: Check Availability(roomId, time)
    
    alt is unavailable
        DB-->>Service: Room Taken
        Service-->>API: ConflictException
        API-->>Customer: Error: Slot unavailable
    else is available
        Service->>DB: INSERT Booking (PENDING)
        DB-->>Service: bookingId
        Service-->>API: BookingCreated
        API-->>Customer: 201 Created (Booking Details)
        
        par Async Notifications
            Service->>Notify: Send Email/SMS to Customer
            Service->>Notify: Notify Venue Staff
        end
    end
    deactivate Service
    deactivate API
```

### 8.4.2. Activity Diagram: Booking Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Searching
    Searching --> AvailabilityCheck: Select Room & Time
    
    state AvailabilityCheck <<choice>>
    AvailabilityCheck --> Searching: Not Available
    AvailabilityCheck --> Creation: Available
    
    state Creation {
        Draft --> Pending: User Confirms
    }
    
    Creation --> PaymentProcess: If Paid Booking
    Creation --> StaffApproval: If Walk-in/Pay-later
    
    state PaymentProcess {
        AwaitingPayment --> PaymentSuccess: Card/QPay OK
        AwaitingPayment --> PaymentFailed: Error/Timeout
    }
    
    PaymentSuccess --> Confirmed
    PaymentFailed --> Cancelled
    
    StaffApproval --> Confirmed: Manager Approves
    StaffApproval --> Rejected: Manager Rejects
    
    Confirmed --> CheckedIn: Customer Arrives
    Confirmed --> Cancelled: No Show / User Cancellation
    
    CheckedIn --> Completed: Session Ends
    
    Completed --> [*]
    Cancelled --> [*]
    Rejected --> [*]
```

### 8.4.3. Entity State Diagram: Booking Status

```mermaid
stateDiagram-v2
    [*] --> PENDING
    
    PENDING --> CONFIRMED: Payment Success / Staff Approve
    PENDING --> REJECTED: Staff Reject
    PENDING --> CANCELLED: User Cancel / Timeout
    
    CONFIRMED --> CHECKED_IN: Staff Check-in
    CONFIRMED --> CANCELLED: User/Staff Cancel
    
    CHECKED_IN --> COMPLETED: Service Finished
    
    CANCELLED --> [*]
    REJECTED --> [*]
    COMPLETED --> [*]
```

### 8.4.4. Use Case Diagram

```mermaid
graph TD
    User((Guest/Customer))
    Staff((Staff))
    Manager((Venue Manager))
    Admin((System Admin))

    subgraph "Booking System"
        UC1[Search Venues]
        UC2[View Room Details]
        UC3[Create Booking]
        UC4[Cancel Booking]
        UC5[Leave Review]
    end

    subgraph "Management Portal"
        UC6[Process Check-in/out]
        UC7[Manage Availability]
        UC8[Edit Venue/Room Info]
        UC9[View Reports]
    end

    subgraph "Admin Console"
        UC10[Manage Organizations]
        UC11[Manage Plans/Billing]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5

    Staff --> UC6
    Staff --> UC7
    
    Manager --> UC6
    Manager --> UC7
    Manager --> UC8
    Manager --> UC9

    Admin --> UC10
    Admin --> UC11
```

## 8.5. Loyalty Program Workflows

The loyalty system incentivizes repeat customers with a simple earn-and-burn mechanism.

**Rules:**
- **Earn**: 1 Point for every 10,000 MNT spent on COMPLETED bookings.
- **Redeem**: 1 Point = 100 MNT discount.
- **Limit**: Max 50% of total booking price can be paid with points.

### 8.5.1. Sequence Diagram: Point Redemption (Booking Creation)

```mermaid
sequenceDiagram
    actor Customer
    participant API as BookingController
    participant Service as BookingsService
    participant UserRepo as UserRepository
    participant DB as BookingRepository

    Customer->>API: POST /bookings (pointsToUse=50)
    activate API
    API->>Service: create(dto, userId)
    activate Service
    
    Service->>UserRepo: findOne(userId)
    UserRepo-->>Service: User(loyaltyPoints: 100)
    
    Service->>Service: Validate Points (50 <= 100)
    Service->>Service: Validate Max Discount (5000 MNT <= 50% Price)
    
    Service->>UserRepo: Update Points (100 - 50 = 50)
    Service->>DB: Save Booking (loyaltyPointsUsed=50)
    
    DB-->>Service: Booking Created
    Service-->>API: 201 Created
    API-->>Customer: Success
    deactivate Service
    deactivate API
```

### 8.5.2. Sequence Diagram: Point Earning (Booking Completion)

```mermaid
sequenceDiagram
    participant System/Staff
    participant Service as BookingsService
    participant UserRepo as UserRepository

    System/Staff->>Service: update(status=COMPLETED)
    activate Service
    
    Service->>Service: Check if status changed to COMPLETED
    Service->>Service: Calculate Points (TotalPrice / 10000)
    
    Service->>UserRepo: Increment User Points
    UserRepo-->>Service: Updated User
    
    Service->>System/Staff: Success
    deactivate Service
```

## 8.6. Mobile UX Design

The UB Karaoke App follows a **mobile-first** design philosophy, specifically optimized for the customer portal to ensure a premium, native-app-like experience.

### Key UX Features:
- **Sticky Navigation**: Context-aware headers and action bars that stay accessible during scroll.
- **Segmented Control Tabs**: Intuitive switching between active bookings, history, rewards, and settings.
- **Micro-Animations**: Use of CSS transitions and PrimeReact animations to enhance interactivity (e.g., hover scaling, smooth tab transitions).
- **Native Components**: Custom-styled UI elements using Vanilla CSS to achieve a high-end, dark-mode focused aesthetic.
- **Deferred Authentication**: Allowing users to browse and select rooms before requiring login, reducing friction in the booking funnel.
