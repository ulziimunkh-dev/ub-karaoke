# Requirement Documentation - UB Karaoke

## 1. Functional Requirements

### 1.1 User Authentication & Profile
- **Login/Register**: Users must be able to create accounts and log in securely.
- **Profile Management**: Users can update their profile information (name, phone, email).
- **Loyalty Program**: Customers earn points based on their bookings.

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
- **Venue Management**: Admins can add, edit, or remove venues and configure their booking rules.
- **Room Management**: Staff/Admins can manage room details and features.
- **Booking Tracking**: Real-time tracking of bookings for staff to manage venue operations.

### 1.5 Reviews & Ratings
- **Submit Reviews**: Customers can rate and review venues after their visit.
- **View Feedback**: Reviews are displayed on venue pages to help other users.

## 2. Non-Functional Requirements

- **Performance**: The UI should be responsive, with fast loading times for venue listings and search results.
- **Usability**: The application must be fully responsive and provide a consistent user experience across desktop and mobile devices. Modern UI components from **PrimeReact** are used to ensure high usability and accessibility.
- **Scalability**: The backend architecture (NestJS + Redis) should support a growing number of users and venues.
- **Reliability**: Secure handling of bookings and user data is critical.

## 3. User Personas

| Persona | Description | Primary Goals |
| :--- | :--- | :--- |
| **Customer** | Casual or frequent karaoke lovers. | Quick discovery of venues, easy booking, and tracking loyalty points. |
| **Staff Member** | Front desk or venue managers. | Efficiently managing room check-ins and tracking bookings for their venue. |
| **System Admin** | Platform operators. | Oversight of all venues, user management, and system-wide configuration. |
