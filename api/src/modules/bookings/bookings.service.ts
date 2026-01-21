import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, Between } from 'typeorm';
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
    ) { }

    async create(createBookingDto: CreateBookingDto, userId?: string): Promise<Booking> {
        // Fetch room and venue for constraints
        const room = await this.roomsRepository.findOne({
            where: { id: createBookingDto.roomId },
            relations: ['venue'],
        });
        if (!room) throw new NotFoundException('Room not found');

        const venue = room.venue;
        const startTime = new Date(`${createBookingDto.date}T${createBookingDto.startTime}`);
        const endTime = new Date(`${createBookingDto.date}T${createBookingDto.endTime}`);
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

        if (durationHours < Number(venue.minBookingHours || 1)) {
            throw new BadRequestException(`Minimum booking duration is ${venue.minBookingHours || 1} hours`);
        }
        if (durationHours > Number(venue.maxBookingHours || 6)) {
            throw new BadRequestException(`Maximum booking duration is ${venue.maxBookingHours || 6} hours`);
        }

        const conflicts = await this.checkTimeConflicts(
            createBookingDto.roomId,
            createBookingDto.date,
            createBookingDto.startTime,
            createBookingDto.endTime,
        );

        if (conflicts.length > 0) {
            throw new BadRequestException(
                'Room is already booked for the selected time',
            );
        }

        // Loyalty Logic: REDEMPTION
        let loyaltyDiscount = 0;
        let pointsUsed = 0;

        if (createBookingDto.pointsToUse && createBookingDto.pointsToUse > 0) {
            if (!userId) {
                throw new BadRequestException('Must be logged in to use loyalty points');
            }
            const user = await this.usersRepository.findOne({ where: { id: userId } });
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
            await this.usersRepository.save(user);

            loyaltyDiscount = discountValue;
            pointsUsed = createBookingDto.pointsToUse;
        }

        const finalPrice = createBookingDto.totalPrice - loyaltyDiscount;

        const booking = this.bookingsRepository.create({
            ...createBookingDto,
            userId,
            totalPrice: finalPrice, // Update price with discount
            loyaltyPointsUsed: pointsUsed,
            loyaltyDiscount: loyaltyDiscount,
            startTime: new Date(`${createBookingDto.date}T${createBookingDto.startTime}`),
            endTime: new Date(`${createBookingDto.date}T${createBookingDto.endTime}`),
            createdBy: userId, // For external bookings, user is the creator
            status: BookingStatus.PENDING, // Default to PENDING
            source: (createBookingDto.source as BookingSource) || BookingSource.ONLINE,
            organizationId: venue.organizationId,
        });
        const savedBooking = await this.bookingsRepository.save(booking);

        await this.logStatusChange(
            savedBooking.id,
            BookingStatus.PENDING,
            BookingStatus.PENDING,
            userId,
            venue.organizationId,
        );

        if (userId) {
            await this.auditService.log({
                action: 'BOOKING_CREATED',
                resource: 'Booking',
                resourceId: savedBooking.id,
                userId: userId || undefined,
                staffId: undefined, // Create is usually by customer here, or if admin uses it, we should handle it
                details: { ...createBookingDto },
            });
        }

        return savedBooking;
    }

    // Manual booking for Admin/Staff - Auto confirms
    async createManual(createBookingDto: CreateBookingDto, user: any): Promise<Booking> {
        const room = await this.roomsRepository.findOne({
            where: { id: createBookingDto.roomId },
            relations: ['venue'],
        });
        if (!room) throw new NotFoundException('Room not found');

        const venue = room.venue;
        const startTime = new Date(`${createBookingDto.date}T${createBookingDto.startTime}`);
        const endTime = new Date(`${createBookingDto.date}T${createBookingDto.endTime}`);
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

        if (durationHours < Number(venue.minBookingHours || 1)) {
            throw new BadRequestException(`Minimum booking duration is ${venue.minBookingHours || 1} hours`);
        }
        if (durationHours > Number(venue.maxBookingHours || 6)) {
            throw new BadRequestException(`Maximum booking duration is ${venue.maxBookingHours || 6} hours`);
        }

        const conflicts = await this.checkTimeConflicts(
            createBookingDto.roomId,
            createBookingDto.date,
            createBookingDto.startTime,
            createBookingDto.endTime,
        );

        if (conflicts.length > 0) {
            throw new BadRequestException('Room is already booked.');
        }

        const booking = this.bookingsRepository.create({
            ...createBookingDto,
            startTime: new Date(`${createBookingDto.date}T${createBookingDto.startTime}`),
            endTime: new Date(`${createBookingDto.date}T${createBookingDto.endTime}`),
            status: BookingStatus.CONFIRMED,
            source: BookingSource.WALK_IN,
            createdBy: user.id,
            updatedBy: user.id,
            organizationId: user.organizationId,
        });

        const savedBooking = await this.bookingsRepository.save(booking);

        await this.logStatusChange(
            savedBooking.id,
            BookingStatus.CONFIRMED,
            BookingStatus.CONFIRMED,
            user.id,
            user.organizationId,
            true, // isStaff
        );

        await this.auditService.log({
            action: 'BOOKING_MANUAL_CREATED',
            resource: 'Booking',
            resourceId: savedBooking.id,
            details: { ...createBookingDto },
            userId: undefined,
            staffId: user.id,
        });

        return savedBooking;
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
        return saved;
    }


    async findAll(filters?: {
        userId?: string;
        venueId?: string;
        roomId?: string;
        status?: string;
    }): Promise<Booking[]> {
        const query = this.bookingsRepository.createQueryBuilder('booking');

        if (filters?.userId) {
            query.andWhere('booking.userId = :userId', { userId: filters.userId });
        }

        if (filters?.venueId) {
            query.andWhere('booking.venueId = :venueId', {
                venueId: filters.venueId,
            });
        }

        if (filters?.roomId) {
            query.andWhere('booking.roomId = :roomId', { roomId: filters.roomId });
        }

        if (filters?.status) {
            query.andWhere('booking.status = :status', { status: filters.status });
        }

        return query.orderBy('booking.created_at', 'DESC').getMany();
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
        date: string,
        startTime: string,
        endTime: string,
        excludeId?: string,
    ): Promise<Booking[]> {
        const room = await this.roomsRepository.findOne({ where: { id: roomId } });
        if (!room) return [];

        let bufferMinutes = 15;
        if (room.partySupport?.birthday || room.partySupport?.decoration) {
            bufferMinutes = 30;
        }
        if (room.specs?.cleaning) {
            bufferMinutes = room.specs.cleaning;
        }

        const startMoment = new Date(`${date}T${startTime}`);
        const endMoment = new Date(`${date}T${endTime}`);

        // A conflict occurs if:
        // NewBooking.Start < ExistingBooking.End + Buffer
        // AND
        // NewBooking.End > ExistingBooking.Start - Buffer

        const query = this.bookingsRepository
            .createQueryBuilder('booking')
            .where('booking.roomId = :roomId', { roomId })
            .andWhere('booking.status NOT IN (:...statuses)', { statuses: ['CANCELLED', 'REJECTED'] })
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
}
