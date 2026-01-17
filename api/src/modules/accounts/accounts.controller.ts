import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new account' })
    create(@Body() createAccountDto: any, @Req() req: any) {
        return this.accountsService.create(createAccountDto, req.user.id);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all accounts' })
    findAll(@Query() filters: any) {
        return this.accountsService.findAll(filters);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get an account by ID' })
    findOne(@Param('id') id: string) {
        return this.accountsService.findOne(+id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update an account' })
    update(@Param('id') id: string, @Body() updateAccountDto: any, @Req() req: any) {
        return this.accountsService.update(+id, updateAccountDto, req.user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete an account' })
    remove(@Param('id') id: string) {
        return this.accountsService.remove(+id);
    }
}
