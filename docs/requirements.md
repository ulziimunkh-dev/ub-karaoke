# Requirement Documentation - UB Karaoke

## 1. Functional Requirements

### 1.1 User Authentication & Profile
- **Login/Register**: Users must be able to create accounts and log in securely. Supports **OTP (One-Time Password)** login via email/phone for customers.
- **Profile Management**: Users can update their profile information (name, phone, email).
- **Loyalty Program**:
    - **Earning**: Customers earn **1 Point for every 10,000 MNT** spent on completed bookings.
    - **Redemption**: Points can be redeemed at a rate of **1 Point = 100 MNT**.
    - **Usage Limit**: Points can cover up to **50%** of the total booking value.
    - **Expiration**: Points expire after 12 months of inactivity.
- **Deferred Login**: Customers can browse venues and rooms without logging in, only requiring authentication at the final booking step.

### 1.2 Venue Discovery
- **List Venues**: Display a list of available karaoke venues with key information (rating, price range).
- **Search & Filter**: Users can search for venues by name and filter by district, price range, or amenities.
- **Venue Details**: View comprehensive venue information, including photos, location (GPS), and opening hours.

### 1.3 Booking Management
- **Room Selection**: View available rooms in a specific venue with rates and capacity.
- **Real-time Booking**: Check room availability and make instant reservations.
- **Booking Rules**: Venues can configure booking windows (e.g., 16:00-22:00) and advance booking limits.
- **My Bookings**: Customers can view their booking history and upcoming reservations.

### 1.4 Admin & Staff Portals
- **Role-Based Login Separatio  n**:
    - **System Admins & Admins**: Log in via `/admin`.
    - **Managers & Staff**: Log in via `/staff/login`.
- **Venue Management**: Admins can add, edit, or remove venues and configure their booking rules. Includes the ability to toggle venue visibility and booking availability.
- **Room Management**: Staff/Admins can manage room details, features, and pricing.
- **Organization Management**: System Admins can manage organizations, including manual overrides for **Subscription Plan Dates** (Start/End).
- **Promo Code Management**: Admins can create and manage promotional codes (percentage or fixed discounts) with validity periods.
- **Booking Tracking**: Real-time tracking of bookings for staff to manage venue operations.
- **Finance & Payouts**: Management of venue earnings and withdrawal/payout requests for organization owners.
- **Financial Accounting**: Implementation of a **Double-Entry Ledger System** (Assets, Liabilities, Equity, Revenue, Expense) to track all financial transactions with full audit capability.

### 1.5 Payments & Transactions
- **Payment Gateway**: Integration with **QPay** and card payments for secure transaction processing.
- **Refunds**: Staff can process partial or full refunds with reason tracking.
- **Transaction Logs**: detailed history of all payment attempts and gateway responses.

### 1.6 Notifications
- **System Alerts**: Automated Email/SMS notifications for booking confirmations, cancellations, and status updates.
- **Staff Alerts**: Real-time notifications for new bookings or check-in requests.

### 1.7 Reviews & Ratings
- **Submit Reviews**: Only **logged-in customers** with a valid booking history can rate and review venues.
- **View Feedback**: Reviews are displayed on venue pages to help other users.

## 2. Non-Functional Requirements

- **Performance**: The UI should be responsive, with fast loading times for venue listings and search results.
- **Usability**: The application must be fully responsive and provide a consistent user experience across desktop and mobile devices. Modern UI components from **PrimeReact** are used to ensure high usability and accessibility.
- **Scalability**: The backend architecture (NestJS + Redis) should support a growing number of users and venues. **All database primary keys use UUIDs** to ensure global uniqueness and prevent enumeration attacks.
- **Reliability**: Secure handling of bookings and user data is critical.
- **Data Integrity & Auditing**: All system entities must maintain strictly standardized audit trails (`createdBy`, `updatedBy`) and use unified boolean flags (`isActive`) for status management to ensure data consistency and simplified hierarchical filtering.

## 3. User Personas

| Persona | Description | Primary Goals |
| :--- | :--- | :--- |
| **Customer** | Casual or frequent karaoke lovers. | Quick discovery of venues, easy booking, and tracking loyalty points. |
| **Staff Member** | Front desk or venue managers. | Efficiently managing room check-ins and tracking bookings for their venue. |
| **System Admin** | Platform operators. | Oversight of all venues, user management, and system-wide configuration. |
