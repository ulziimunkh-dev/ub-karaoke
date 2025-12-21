import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(Booking)
        private bookingsRepository: Repository<Booking>,
    ) { }

    async create(createBookingDto: CreateBookingDto): Promise<Booking> {
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

        const booking = this.bookingsRepository.create(createBookingDto);
        return this.bookingsRepository.save(booking);
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
            .andWhere('booking.status != :status', { status: 'cancelled' })
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
