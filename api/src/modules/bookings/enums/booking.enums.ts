export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    REJECTED = 'REJECTED',
    CHECKED_IN = 'CHECKED_IN',
    COMPLETED = 'COMPLETED',
}

export enum BookingPaymentStatus {
    UNPAID = 'UNPAID',
    PAID = 'PAID',
    PARTIAL = 'PARTIAL',
    REFUNDED = 'REFUNDED',
}
