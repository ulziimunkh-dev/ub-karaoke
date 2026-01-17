import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';

@Injectable()
export class PlansService {
    constructor(
        @InjectRepository(Plan)
        private plansRepository: Repository<Plan>,
    ) { }

    create(createPlanDto: any) {
        const plan = this.plansRepository.create(createPlanDto);
        return this.plansRepository.save(plan);
    }

    findAll() {
        return this.plansRepository.find({ order: { monthlyFee: 'ASC' } });
    }

    async findOne(id: string) {
        const plan = await this.plansRepository.findOne({ where: { id } });
        if (!plan) throw new NotFoundException(`Plan with ID ${id} not found`);
        return plan;
    }

    async update(id: string, updatePlanDto: any) {
        const plan = await this.findOne(id);
        Object.assign(plan, updatePlanDto);
        return this.plansRepository.save(plan);
    }

    async remove(id: string) {
        const plan = await this.findOne(id);
        return this.plansRepository.remove(plan);
    }
}
