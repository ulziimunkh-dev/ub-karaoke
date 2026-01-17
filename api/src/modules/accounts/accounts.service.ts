import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';

@Injectable()
export class AccountsService {
    constructor(
        @InjectRepository(Account)
        private accountsRepository: Repository<Account>,
        @InjectRepository(LedgerEntry)
        private ledgerRepository: Repository<LedgerEntry>,
    ) { }

    async create(createAccountDto: any, userId?: number) {
        const account = this.accountsRepository.create({
            ...createAccountDto,
            createdBy: userId,
        });
        return this.accountsRepository.save(account);
    }

    async findAll(filters?: { ownerType?: string; ownerId?: number; type?: string; isActive?: boolean }) {
        const where: any = {};

        if (filters?.ownerType) {
            where.ownerType = filters.ownerType;
        }

        if (filters?.ownerId !== undefined) {
            where.ownerId = filters.ownerId;
        }

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        return this.accountsRepository.find({
            where,
            order: { code: 'ASC' },
        });
    }

    async findOne(id: number) {
        const account = await this.accountsRepository.findOne({ where: { id } });
        if (!account) {
            throw new NotFoundException(`Account #${id} not found`);
        }
        return account;
    }

    async findByCode(code: string) {
        const account = await this.accountsRepository.findOne({ where: { code } });
        if (!account) {
            throw new NotFoundException(`Account with code ${code} not found`);
        }
        return account;
    }

    async update(id: number, updateAccountDto: any, userId?: number) {
        const account = await this.findOne(id);
        Object.assign(account, updateAccountDto);
        if (userId) {
            account.updatedBy = userId;
        }
        return this.accountsRepository.save(account);
    }

    async remove(id: number) {
        const account = await this.findOne(id);
        return this.accountsRepository.remove(account);
    }

    async postJournalEntry(entries: Array<{ accountId: number; debit?: number; credit?: number; referenceType?: string; referenceId?: number }>) {
        // Validate balanced entry
        const totalDebits = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
        const totalCredits = entries.reduce((sum, e) => sum + (e.credit || 0), 0);

        if (Math.abs(totalDebits - totalCredits) > 0.01) {
            throw new Error('Journal entry is not balanced');
        }

        const ledgerEntries = entries.map(entry =>
            this.ledgerRepository.create({
                accountId: entry.accountId,
                debit: entry.debit || 0,
                credit: entry.credit || 0,
                referenceType: entry.referenceType as any,
                referenceId: entry.referenceId,
            })
        );

        return this.ledgerRepository.save(ledgerEntries);
    }

    async getLedgerEntries(filters?: { accountId?: number; referenceType?: string; referenceId?: number }) {
        const where: any = {};

        if (filters?.accountId) {
            where.accountId = filters.accountId;
        }

        if (filters?.referenceType) {
            where.referenceType = filters.referenceType;
        }

        if (filters?.referenceId !== undefined) {
            where.referenceId = filters.referenceId;
        }

        return this.ledgerRepository.find({
            where,
            relations: ['account'],
            order: { createdAt: 'DESC' },
        });
    }

    async getAccountBalance(accountId: number) {
        const entries = await this.ledgerRepository.find({ where: { accountId } });
        const balance = entries.reduce((sum, entry) => {
            return sum + parseFloat(entry.debit.toString()) - parseFloat(entry.credit.toString());
        }, 0);
        return balance;
    }
}
