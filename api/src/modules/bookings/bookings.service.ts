import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, Between, LessThan, Brackets } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { BookingStatus, BookingSource } from './enums/booking.enums';
import { BookingStatusHistory } from './entities/booking-status-history.entity';
import { BookingPromotion } from './entities/booking-promotion.entity';
import { Room } from '../rooms/entities/room.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AuditService } from '../audit/audit.service';
import { RoomAvailability } from '../rooms/entities/room-availability.entity';
import { Venue } from '../venues/entities/venue.entity';
import { VenueOperatingHours, DayOfWeek } from '../venues/entities/venue-operating-hours.entity';
import { User } from '../auth/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(Booking)
        private bookingsRepository: Repository<Booking>,
        @InjectRepository(BookingStatusHistory)
        private historyRepository: Repository<BookingStatusHistory>,
        @InjectRepository(BookingPromotion)
        private bookingPromotionsRepository: Repository<BookingPromotion>,
        @InjectRepository(Room)
        private roomsRepository: Repository<Room>,
        @InjectRepository(RoomAvailability)
        private availabilityRepository: Repository<RoomAvailability>,
        @InjectRepository(Venue)
        private venuesRepository: Repository<Venue>,
        @InjectRepository(VenueOperatingHours)
        private hoursRepository: Repository<VenueOperatingHours>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private readonly auditService: AuditService,
        private readonly notificationsService: NotificationsService,
        private readonly notificationsGateway: NotificationsGateway,
    ) { }

    async create(createBookingDto: CreateBookingDto, userId?: string): Promise<Booking> {
        return await this.bookingsRepository.manager.transaction(async (transactionalEntityManager) => {
            const roomIds = createBookingDto.roomIds || [createBookingDto.roomId];
            const bookings: Booking[] = [];
            const groupId = Math.random().toString(36).substring(2, 15);

            // 1. Lock the rooms to prevent concurrent booking attempts for these specific rooms
            // This ensures that if two users try to book the same room, one will wait for the other.
            await transactionalEntityManager.getRepository(Room).createQueryBuilder('room')
                .setLock('pessimistic_write')
                .where('room.id IN (:...roomIds)', { roomIds })
                .getMany();

            // Loyalty Logic: REDEMPTION (Apply once for the whole group)
            let loyaltyDiscount = 0;
            let pointsUsed = 0;

            if (createBookingDto.pointsToUse && createBookingDto.pointsToUse > 0) {
                if (!userId) {
                    throw new BadRequestException('Must be logged in to use loyalty points');
                }
                const userRepo = transactionalEntityManager.getRepository(User);
                const user = await userRepo.findOne({ where: { id: userId } });
                if (!user) throw new NotFoundException('User not found');

                if (user.loyaltyPoints < createBookingDto.pointsToUse) {
                    throw new BadRequestException('Insufficient loyalty points');
                }

                // 1 Point = 100 MNT
                const discountValue = createBookingDto.pointsToUse * 100;
                const maxAllowedDiscount = createBookingDto.totalPrice * 0.50; // Max 50%

                if (discountValue > maxAllowedDiscount) {
                    throw new BadRequestException(`Loyalty points can only cover up to 50% of the total price (Max: ${maxAllowedDiscount} MNT)`);
                }

                // Deduct points
                user.loyaltyPoints -= createBookingDto.pointsToUse;
                await userRepo.save(user);

                loyaltyDiscount = discountValue;
                pointsUsed = createBookingDto.pointsToUse;
            }

            // Distribute discount across rooms (simple division for now)
            const discountPerRoom = loyaltyDiscount / roomIds.length;
            const pointsPerRoom = Math.round(pointsUsed / roomIds.length);

            for (const roomId of roomIds) {
                const room = await transactionalEntityManager.getRepository(Room).findOne({
                    where: { id: roomId },
                    relations: ['venue'],
                });
                if (!room) throw new NotFoundException(`Room ${roomId} not found`);

                const venue = room.venue;
                const startDate = createBookingDto.date;
                const startTime = new Date(`${startDate}T${createBookingDto.startTime}`);
                let endTime = new Date(`${startDate}T${createBookingDto.endTime}`);

                // Handle overnight bookings
                if (endTime <= startTime) {
                    endTime.setDate(endTime.getDate() + 1);
                }

                const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

                if (durationHours < Number(venue.minBookingHours || 1)) {
                    throw new BadRequestException(`Minimum booking duration is ${venue.minBookingHours || 1} hours`);
                }
                if (durationHours > Number(venue.maxBookingHours || 6)) {
                    throw new BadRequestException(`Maximum booking duration is ${venue.maxBookingHours || 6} hours`);
                }

                const conflicts = await this.checkTimeConflicts(
                    roomId,
                    startTime,
                    endTime,
                    undefined,
                    transactionalEntityManager // Pass transactional manager to use the same lock
                );

                if (conflicts.length > 0) {
                    throw new BadRequestException(
                        `Room ${room.name} is already booked for the selected time`,
                    );
                }

                const basePricePerRoom = createBookingDto.totalPrice / roomIds.length;
                const finalPricePerRoom = basePricePerRoom - discountPerRoom;

                const booking = transactionalEntityManager.getRepository(Booking).create({
                    ...createBookingDto,
                    roomId,
                    userId,
                    groupId,
                    totalPrice: finalPricePerRoom,
                    loyaltyPointsUsed: pointsPerRoom,
                    loyaltyDiscount: discountPerRoom,
                    startTime,
                    endTime,
                    createdBy: userId,
                    status: BookingStatus.RESERVED,
                    reservedAt: new Date(),
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
                    source: (createBookingDto.source as BookingSource) || BookingSource.ONLINE,
                    organizationId: venue.organizationId,
                });

                const savedBooking = await transactionalEntityManager.getRepository(Booking).save(booking);
                bookings.push(savedBooking);

                // Status history inside transaction
                const history = transactionalEntityManager.getRepository(BookingStatusHistory).create({
                    bookingId: savedBooking.id,
                    oldStatus: BookingStatus.RESERVED,
                    newStatus: BookingStatus.RESERVED,
                    changedBy: userId,
                    organization: { id: venue.organizationId } as any,
                });
                await transactionalEntityManager.getRepository(BookingStatusHistory).save(history);

                if (userId) {
                    await this.auditService.log({
                        action: 'BOOKING_CREATED',
                        resource: 'Booking',
                        resourceId: savedBooking.id,
                        userId: userId || undefined,
                        staffId: undefined,
                        details: { ...createBookingDto, roomId },
                    }, transactionalEntityManager); // Assuming audit service can take a manager
                }
            }

            // Post-transaction actions (Notifications, WebSocket)
            // We use the first booking to trigger global notifications
            if (bookings.length > 0) {
                const first = bookings[0];
                if (userId) {
                    this.notificationsService.sendBookingNotification(
                        first.id,
                        'reserved',
                        userId,
                        first.organizationId
                    ).catch(err => console.error('Notification failed', err));

                    this.notificationsGateway.emitToUser(userId, 'booking:reserved', first);
                }
                this.notificationsGateway.emitToOrganization(first.organizationId, 'booking:new_reservation', first);

                // Notify staff of the new online reservation
                this.notificationsService.sendOrgNotification(
                    first.organizationId,
                    'New Online Reservation',
                    'A customer reserved a room online. Review and confirm payment.',
                    first.id
                ).catch(err => console.error('Org notification failed', err));
            }

            return bookings[0];
        });
    }

    // Manual booking for Admin/Staff - Auto confirms
    async createManual(createBookingDto: CreateBookingDto, user: any): Promise<Booking> {
        return await this.bookingsRepository.manager.transaction(async (transactionalEntityManager) => {
            // 1. Lock the room to prevent concurrent booking attempts
            await transactionalEntityManager.getRepository(Room).createQueryBuilder('room')
                .setLock('pessimistic_write')
                .where('room.id = :roomId', { roomId: createBookingDto.roomId })
                .getOne();

            const room = await transactionalEntityManager.getRepository(Room).findOne({
                where: { id: createBookingDto.roomId },
                relations: ['venue'],
            });
            if (!room) throw new NotFoundException('Room not found');

            const venue = room.venue;
            const startDate = createBookingDto.date;
            const startTime = new Date(`${startDate}T${createBookingDto.startTime}`);
            let endTime = new Date(`${startDate}T${createBookingDto.endTime}`);

            // Handle overnight bookings
            if (endTime <= startTime) {
                endTime.setDate(endTime.getDate() + 1);
            }

            const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

            if (durationHours < Number(venue.minBookingHours || 1)) {
                throw new BadRequestException(`Minimum booking duration is ${venue.minBookingHours || 1} hours`);
            }
            if (durationHours > Number(venue.maxBookingHours || 6)) {
                throw new BadRequestException(`Maximum booking duration is ${venue.maxBookingHours || 6} hours`);
            }

            const conflicts = await this.checkTimeConflicts(
                createBookingDto.roomId,
                startTime,
                endTime,
                undefined,
                transactionalEntityManager
            );

            if (conflicts.length > 0) {
                throw new BadRequestException('Room is already booked.');
            }

            const booking = transactionalEntityManager.getRepository(Booking).create({
                ...createBookingDto,
                startTime,
                endTime,
                status: BookingStatus.CONFIRMED,
                source: BookingSource.WALK_IN,
                createdBy: user.id,
                updatedBy: user.id,
                organizationId: user.organizationId,
            });

            const savedBooking = await transactionalEntityManager.getRepository(Booking).save(booking);

            // Status history inside transaction
            const history = transactionalEntityManager.getRepository(BookingStatusHistory).create({
                bookingId: savedBooking.id,
                oldStatus: BookingStatus.CONFIRMED,
                newStatus: BookingStatus.CONFIRMED,
                changedBy: user.id,
                organization: { id: user.organizationId } as any,
            });
            await transactionalEntityManager.getRepository(BookingStatusHistory).save(history);

            await this.auditService.log({
                action: 'BOOKING_MANUAL_CREATED',
                resource: 'Booking',
                resourceId: savedBooking.id,
                details: { ...createBookingDto },
                userId: undefined,
                staffId: user.id,
            }, transactionalEntityManager);

            return savedBooking;
        });
    }

    async approve(id: string, adminId: string): Promise<Booking> {
        const booking = await this.findOne(id);
        booking.status = BookingStatus.CONFIRMED;
        booking.updatedBy = adminId;
        const saved = await this.bookingsRepository.save(booking);

        await this.logStatusChange(
            id,
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            adminId,
            booking.organizationId,
            true,
        );

        await this.auditService.log({
            action: 'BOOKING_APPROVED',
            resource: 'Booking',
            resourceId: id,
            userId: undefined,
            staffId: adminId,
        });

        // Send notifications
        if (booking.userId) {
            await this.notificationsService.sendBookingNotification(
                id,
                'approved',
                booking.userId,
                booking.organizationId
            );

            this.notificationsGateway.emitToUser(booking.userId, 'booking:approved', saved);
        }

        // Notify organization
        this.notificationsGateway.emitToOrganization(booking.organizationId, 'booking:status_updated', saved);

        // Notify staff
        this.notificationsService.sendOrgNotification(
            booking.organizationId,
            'Booking Confirmed',
            `Booking #${id.slice(0, 8)} has been approved and confirmed.`,
            id
        ).catch(() => { });

        return saved;
    }

    async reject(id: string, adminId: string): Promise<Booking> {
        const booking = await this.findOne(id);
        booking.status = BookingStatus.REJECTED;
        booking.updatedBy = adminId;
        const saved = await this.bookingsRepository.save(booking);

        await this.logStatusChange(
            id,
            BookingStatus.PENDING,
            BookingStatus.REJECTED,
            adminId,
            booking.organizationId,
            true,
        );

        await this.auditService.log({
            action: 'BOOKING_REJECTED',
            resource: 'Booking',
            resourceId: id,
            userId: undefined,
            staffId: adminId,
        });

        // Send notifications
        if (booking.userId) {
            await this.notificationsService.sendBookingNotification(
                id,
                'rejected',
                booking.userId,
                booking.organizationId
            );

            this.notificationsGateway.emitToUser(booking.userId, 'booking:rejected', saved);
        }

        // Notify organization
        this.notificationsGateway.emitToOrganization(booking.organizationId, 'booking:status_updated', saved);

        // Notify staff
        this.notificationsService.sendOrgNotification(
            booking.organizationId,
            'Booking Rejected',
            `Booking #${id.slice(0, 8)} has been rejected.`,
            id
        ).catch(() => { });

        return saved;
    }


    async findAll(filters?: {
        userId?: string;
        venueId?: string;
        roomId?: string;
        status?: string;
    }): Promise<Booking[]> {
        const where: any = {};
        if (filters?.userId) where.userId = filters.userId;
        if (filters?.venueId) where.venueId = filters.venueId;
        if (filters?.roomId) where.roomId = filters.roomId;
        if (filters?.status) where.status = filters.status;

        return this.bookingsRepository.find({
            where,
            relations: ['room', 'room.venue', 'venue'],
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<Booking> {
        const booking = await this.bookingsRepository.findOne({
            where: { id },
            relations: ['room', 'venue'],
        });

        if (!booking) {
            throw new NotFoundException(`Booking with ID ${id} not found`);
        }

        return booking;
    }

    async update(id: string, updateBookingDto: Partial<UpdateBookingDto>, updatedBy?: string): Promise<Booking> {
        const booking = await this.findOne(id);

        // Loyalty Logic: EARNING (on completion)
        if (booking.status !== BookingStatus.COMPLETED && updateBookingDto.status === BookingStatus.COMPLETED) {
            // Calculate points: 1 per 10,000 MNT
            // Use original totalPrice + discount? Or just valid paid price?
            // Requirement: "1 Point for every 10,000 MNT spent". Usually implies net pay.
            // But if they used points, do they earn on the remainder? Typically yes.
            // booking.totalPrice is the net price after discount (per my logic above).

            const pointsToEarn = Math.floor(booking.totalPrice / 10000);

            if (pointsToEarn > 0 && booking.userId) {
                const user = await this.usersRepository.findOne({ where: { id: booking.userId } });
                if (user) {
                    user.loyaltyPoints += pointsToEarn;
                    await this.usersRepository.save(user);
                    // Could log this action via AuditService
                }
            }
        }

        const oldStatus = booking.status;
        Object.assign(booking, updateBookingDto);
        if (updatedBy) {
            booking.updatedBy = updatedBy;
        }
        const saved = await this.bookingsRepository.save(booking);

        if (updateBookingDto.status && updateBookingDto.status !== oldStatus) {
            await this.logStatusChange(
                id,
                oldStatus,
                updateBookingDto.status,
                updatedBy,
                booking.organizationId,
                true, // Most updates are by staff
            );
        }

        return saved;
    }

    async remove(id: string): Promise<void> {
        const booking = await this.findOne(id);
        await this.bookingsRepository.remove(booking);
    }

    private async checkTimeConflicts(
        roomId: string,
        startMoment: Date,
        endMoment: Date,
        excludeId?: string,
        manager?: any,
    ): Promise<Booking[]> {
        const repo = manager ? manager.getRepository(Booking) : this.bookingsRepository;
        const roomRepo = manager ? manager.getRepository(Room) : this.roomsRepository;
        const room = await roomRepo.findOne({ where: { id: roomId } });
        if (!room) return [];

        let bufferMinutes = 15;
        if (room.partySupport?.birthday || room.partySupport?.decoration) {
            bufferMinutes = 30;
        }
        if (room.specs?.cleaning) {
            bufferMinutes = room.specs.cleaning;
        }


        // A conflict occurs if:
        // NewBooking.Start < ExistingBooking.End + Buffer
        // AND
        // NewBooking.End > ExistingBooking.Start - Buffer

        const query = repo.createQueryBuilder('booking')
            .where('booking.roomId = :roomId', { roomId })
            .andWhere('booking.status NOT IN (:...statuses)', {
                statuses: [
                    BookingStatus.CANCELLED,
                    BookingStatus.REJECTED,
                    BookingStatus.EXPIRED
                ]
            })
            .andWhere(
                new Brackets(qb => {
                    qb.where('booking.status != :reserved', { reserved: BookingStatus.RESERVED })
                        .orWhere('booking.expiresAt > :now', { now: new Date() })
                })
            )
            .andWhere(
                // Use logic that accounts for the buffer between bookings
                // (ExistingStart - Buffer) < RequestedEnd AND (ExistingEnd + Buffer) > RequestedStart
                `booking.startTime - (:buffer * INTERVAL '1 minute') < :requestEnd 
                 AND booking.endTime + (:buffer * INTERVAL '1 minute') > :requestStart`,
                {
                    requestStart: startMoment,
                    requestEnd: endMoment,
                    buffer: bufferMinutes
                }
            );

        if (excludeId) {
            query.andWhere('booking.id != :excludeId', { excludeId });
        }

        return query.getMany();
    }

    async logStatusChange(
        bookingId: string,
        oldStatus: BookingStatus,
        newStatus: BookingStatus,
        actorId: string | undefined,
        organizationId: string | undefined,
        isStaff: boolean = false
    ) {
        const history = this.historyRepository.create({
            bookingId,
            oldStatus,
            newStatus,
            changedBy: isStaff ? undefined : actorId,
            changedByStaffId: isStaff ? actorId : undefined,
            organization: { id: organizationId } as any,
        });
        return this.historyRepository.save(history);
    }

    async addPromotion(bookingId: string, promotionId: string, organizationId: string) {
        const link = this.bookingPromotionsRepository.create({
            bookingId,
            promotionId,
            organizationId,
        });
        return this.bookingPromotionsRepository.save(link);
    }

    async getAvailableSlots(roomId: string, date: string): Promise<any[]> {
        const room = await this.roomsRepository.findOne({
            where: { id: roomId },
            relations: ['venue']
        });

        if (!room) {
            throw new NotFoundException(`Room with ID ${roomId} not found`);
        }

        const venue = room.venue;
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() as DayOfWeek;

        // 1. Determine Operating Hours / Booking Window
        let startH = 10, startM = 0;
        let endH = 2, endM = 0; // Default 10:00 to 02:00
        const interval = Number(venue.minBookingHours) || 1;

        const opHours = await this.hoursRepository.findOne({
            where: { venueId: venue.id, dayOfWeek: dayOfWeek }
        });

        if (opHours) {
            [startH, startM] = opHours.openTime.split(':').map(Number);
            [endH, endM] = opHours.closeTime.split(':').map(Number);
        }

        // Apply Venue Booking Window if exists
        if (venue.bookingWindowStart && venue.bookingWindowEnd) {
            const [wsH, wsM] = venue.bookingWindowStart.split(':').map(Number);
            const [weH, weM] = venue.bookingWindowEnd.split(':').map(Number);
            startH = wsH; startM = wsM;
            endH = weH; endM = weM;
        }

        // 2. Fetch manual whitelist from RoomAvailability
        const manualSlots = await this.availabilityRepository.find({
            where: { roomId, date, isAvailable: true }
        });

        const blockedSlots = await this.availabilityRepository.find({
            where: { roomId, date, isAvailable: false }
        });

        // 3. Fetch existing bookings for this date
        const startDate = new Date(`${date}T00:00:00`);
        const endDate = new Date(`${date}T23:59:59`);

        const existingBookings = await this.bookingsRepository.find({
            where: {
                roomId,
                startTime: Between(startDate, endDate),
                status: Not(In([BookingStatus.CANCELLED, BookingStatus.REJECTED]))
            }
        });

        // 4. Generate candidate slots
        let slots: string[] = [];
        if (manualSlots.length > 0) {
            // Whitelisting mode
            slots = manualSlots.map(s => s.startTime.substring(0, 5));
        } else {
            // Standard window mode
            let current = startH + (startM / 60);
            const closing = (endH <= startH ? endH + 24 : endH) + (endM / 60);

            while (current < closing) {
                const h = Math.floor(current % 24);
                const m = Math.round((current % 1) * 60);
                const hourStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                slots.push(hourStr);
                current += interval;
            }
        }

        // 5. Determine Cleaning Buffer
        let bufferMinutes = 15;
        if (room.partySupport?.birthday || room.partySupport?.decoration) {
            bufferMinutes = 30;
        }
        if (room.specs?.cleaning) {
            bufferMinutes = room.specs.cleaning;
        }

        // 6. Filter slots
        const now = new Date();
        const isToday = date === now.toISOString().split('T')[0];

        return slots.filter(time => {
            // A. Filter past times
            if (isToday) {
                const [h, m] = time.split(':').map(Number);
                const slotTime = new Date(now);
                slotTime.setHours(h, m, 0, 0);
                if (slotTime < now) return false;
            }

            // B. Filter explicitly blocked slots
            const isBlocked = blockedSlots.some(b => {
                const bStart = b.startTime.substring(0, 5);
                const bEnd = b.endTime.substring(0, 5);
                return time >= bStart && time < bEnd;
            });
            if (isBlocked) return false;

            // C. Filter existing bookings + cleaning buffer
            const overlaps = existingBookings.some(booking => {
                const bStart = new Date(booking.startTime);
                const bEnd = new Date(booking.endTime);
                const effectiveStart = new Date(bStart.getTime() - bufferMinutes * 60000);
                const effectiveEnd = new Date(bEnd.getTime() + bufferMinutes * 60000);

                const slotStart = new Date(`${date}T${time}`);
                const slotEnd = new Date(slotStart.getTime() + Number(venue.minBookingHours || 1) * 60 * 60000);

                return (slotStart < effectiveEnd && slotEnd > effectiveStart);
            });

            return !overlaps;
        }).map(time => {
            // Calculate max duration for this slot
            const slotStart = new Date(`${date}T${time}`);
            const maxVenueHours = Number(venue.maxBookingHours || 6);

            // 1. Cap by venue closing time
            const closing = (endH <= startH ? endH + 24 : endH) + (endM / 60);
            const venueClosingTime = new Date(new Date(`${date}T00:00:00`).getTime() + closing * 3600000);
            let maxHours = (venueClosingTime.getTime() - slotStart.getTime()) / 3600000;

            // 2. Cap by next booking/manual block
            const allConflicts = [
                ...existingBookings.map(b => new Date(new Date(b.startTime).getTime() - bufferMinutes * 60000)),
                ...blockedSlots.map(b => new Date(`${date}T${b.startTime}`))
            ].filter(d => d > slotStart).sort((a, b) => a.getTime() - b.getTime());

            if (allConflicts.length > 0) {
                const nextConflict = allConflicts[0];
                const hoursToNext = (nextConflict.getTime() - slotStart.getTime()) / 3600000;
                maxHours = Math.min(maxHours, hoursToNext);
            }

            // 3. Absolute cap by venue setting
            maxHours = Math.min(maxHours, maxVenueHours);

            return { time, maxHours };
        });
    }

    /**
     * Confirm payment for a RESERVED booking
     */
    async confirmPayment(bookingId: string, paymentData: any): Promise<Booking> {
        const booking = await this.findOne(bookingId);

        // Idempotency: If already confirmed, just return it
        if (booking.status === BookingStatus.CONFIRMED) {
            return booking;
        }

        if (booking.status !== BookingStatus.RESERVED) {
            throw new BadRequestException(`Booking cannot be confirmed. Current status: ${booking.status}`);
        }

        if (booking.expiresAt && new Date() > booking.expiresAt) {
            booking.status = BookingStatus.EXPIRED;
            this.bookingsRepository.save(booking); // Update status to expired
            throw new BadRequestException('Booking reservation has expired');
        }

        booking.status = BookingStatus.CONFIRMED;
        booking.paymentCompletedAt = new Date();
        booking.expiresAt = null as any; // Clear expiration

        const saved = await this.bookingsRepository.save(booking);

        await this.logStatusChange(
            bookingId,
            BookingStatus.RESERVED,
            BookingStatus.CONFIRMED,
            booking.userId,
            booking.organizationId
        );

        // Send notifications
        if (this.notificationsService && booking.userId) {
            await this.notificationsService.sendBookingNotification(
                bookingId,
                'approved',
                booking.userId,
                booking.organizationId
            );
        }

        if (this.notificationsGateway && booking.userId) {
            this.notificationsGateway.emitToUser(booking.userId, 'booking:confirmed', saved);
        }

        // Notify staff of payment received
        this.notificationsService.sendOrgNotification(
            booking.organizationId,
            'Payment Received',
            `Payment confirmed for booking #${bookingId.slice(0, 8)}.`,
            bookingId
        ).catch(() => { });

        return saved;
    }

    /**
     * Extend reservation time by 5 minutes (max 3 extensions)
     */
    async extendReservation(bookingId: string, userId: string): Promise<Booking> {
        throw new BadRequestException('Reservation extension is currently disabled.');
    }

    /**
     * Auto-expire bookings past their expiration time
     * Called by cron job every minute
     */
    async expireReservations(): Promise<number> {
        const now = new Date();

        const expiredBookings = await this.bookingsRepository.find({
            where: {
                status: BookingStatus.RESERVED,
                expiresAt: LessThan(now),
            },
        });

        for (const booking of expiredBookings) {
            booking.status = BookingStatus.EXPIRED;
            await this.bookingsRepository.save(booking);

            await this.logStatusChange(
                booking.id,
                BookingStatus.RESERVED,
                BookingStatus.EXPIRED,
                undefined, // SYSTEM
                booking.organizationId
            );

            // Send notification
            if (this.notificationsService && booking.userId) {
                await this.notificationsService.sendBookingNotification(
                    booking.id,
                    'expired',
                    booking.userId,
                    booking.organizationId
                );
            }

            // Emit real-time update
            if (this.notificationsGateway && booking.userId) {
                this.notificationsGateway.emitToUser(booking.userId, 'booking:expired', booking);
            }
        }

        return expiredBookings.length;
    }

    /**
     * Send expiration reminders (5 minutes before expiration)
     */
    async sendExpirationReminders(): Promise<number> {
        const now = new Date();
        const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
        const oneMinuteLater = new Date(now.getTime() + 1 * 60 * 1000);

        // Find bookings expiring in the next minute that have 5 minutes remaining
        const expiringBooks = await this.bookingsRepository
            .createQueryBuilder('booking')
            .where('booking.status = :status', { status: BookingStatus.RESERVED })
            .andWhere('booking.expiresAt BETWEEN :now AND :oneMin', { now, oneMin: oneMinuteLater })
            .andWhere('booking.expiresAt <= :fiveMin', { fiveMin: fiveMinutesLater })
            .getMany();

        for (const booking of expiringBooks) {
            const minutesRemaining = Math.floor((booking.expiresAt.getTime() - now.getTime()) / (60 * 1000));

            if (minutesRemaining === 5 || minutesRemaining === 1) {
                // Send notification
                if (this.notificationsService && booking.userId) {
                    await this.notificationsService.sendBookingNotification(
                        booking.id,
                        'reminder',
                        booking.userId,
                        booking.organizationId
                    );
                }

                // Emit real-time update
                if (this.notificationsGateway && booking.userId) {
                    this.notificationsGateway.emitToUser(booking.userId, 'booking:reminder', {
                        ...booking,
                        minutesRemaining
                    });
                }
            }
        }

        return expiringBooks.length;
    }
}
