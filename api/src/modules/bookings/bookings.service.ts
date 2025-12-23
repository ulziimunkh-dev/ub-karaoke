import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(Booking)
        private bookingsRepository: Repository<Booking>,
        private readonly auditService: AuditService,
    ) { }

    async create(createBookingDto: CreateBookingDto, userId?: number): Promise<Booking> {
        // Check for conflicts
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

        const booking = this.bookingsRepository.create({
            ...createBookingDto,
            userId,
            status: BookingStatus.PENDING, // Default to PENDING
        });
        const savedBooking = await this.bookingsRepository.save(booking);

        if (userId) {
            await this.auditService.log({
                action: 'BOOKING_CREATED',
                resource: 'Booking',
                resourceId: savedBooking.id.toString(),
                details: { ...createBookingDto },
                userId,
            });
        }

        return savedBooking;
    }

    // Manual booking for Admin/Staff - Auto confirms
    async createManual(createBookingDto: CreateBookingDto, adminId: number): Promise<Booking> {
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
            status: BookingStatus.CONFIRMED,
        });

        const savedBooking = await this.bookingsRepository.save(booking);

        await this.auditService.log({
            action: 'BOOKING_MANUAL_CREATED',
            resource: 'Booking',
            resourceId: savedBooking.id.toString(),
            details: { ...createBookingDto },
            userId: adminId,
        });

        return savedBooking;
    }

    async approve(id: number, adminId: number): Promise<Booking> {
        const booking = await this.findOne(id);
        booking.status = BookingStatus.CONFIRMED;
        const saved = await this.bookingsRepository.save(booking);

        await this.auditService.log({
            action: 'BOOKING_APPROVED',
            resource: 'Booking',
            resourceId: id.toString(),
            userId: adminId,
        });
        return saved;
    }

    async reject(id: number, adminId: number): Promise<Booking> {
        const booking = await this.findOne(id);
        booking.status = BookingStatus.REJECTED;
        const saved = await this.bookingsRepository.save(booking);

        await this.auditService.log({
            action: 'BOOKING_REJECTED',
            resource: 'Booking',
            resourceId: id.toString(),
            userId: adminId,
        });
        return saved;
    }


    async findAll(filters?: {
        userId?: number;
        venueId?: number;
        roomId?: number;
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

        return query.orderBy('booking.date', 'DESC').getMany();
    }

    async findOne(id: number): Promise<Booking> {
        const booking = await this.bookingsRepository.findOne({
            where: { id },
            relations: ['room', 'venue'],
        });

        if (!booking) {
            throw new NotFoundException(`Booking with ID ${id} not found`);
        }

        return booking;
    }

    async update(id: number, updateBookingDto: UpdateBookingDto): Promise<Booking> {
        const booking = await this.findOne(id);
        Object.assign(booking, updateBookingDto);
        return this.bookingsRepository.save(booking);
    }

    async remove(id: number): Promise<void> {
        const booking = await this.findOne(id);
        await this.bookingsRepository.remove(booking);
    }

    private async checkTimeConflicts(
        roomId: number,
        date: string,
        startTime: string,
        endTime: string,
        excludeId?: number,
    ): Promise<Booking[]> {
        const query = this.bookingsRepository
            .createQueryBuilder('booking')
            .where('booking.roomId = :roomId', { roomId })
            .andWhere('booking.date = :date', { date })
            .andWhere('booking.status != :status', { status: 'CANCELLED' }) // Check against CANCELLED enum string
            .andWhere('booking.status != :rejected', { rejected: 'REJECTED' })
            .andWhere(
                '(booking.startTime < :endTime AND booking.endTime > :startTime)',
                { startTime, endTime },
            );

        if (excludeId) {
            query.andWhere('booking.id != :excludeId', { excludeId });
        }

        return query.getMany();
    }
}
