export enum BookingSource {
    ONLINE = 'ONLINE',
    WALK_IN = 'WALK_IN',
    PHONE = 'PHONE',
}

export enum BookingStatus {
    RESERVED = 'RESERVED',      // New: Temporary hold (15min)
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED',        // New: Reservation timeout
    CHECKED_IN = 'CHECKED_IN',
    COMPLETED = 'COMPLETED',
}

export enum BookingPaymentStatus {
    UNPAID = 'UNPAID',
    PAID = 'PAID',
    PARTIAL = 'PARTIAL',
    REFUNDED = 'REFUNDED',
}
