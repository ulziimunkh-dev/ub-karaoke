import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, map } from 'rxjs';

interface QpayTokenResponse {
    token_type: string;
    refresh_expires_in: number;
    refresh_token: string;
    access_token: string;
    expires_in: number;
}

interface QpayInvoiceResponse {
    invoice_id: string;
    qr_text: string;
    qr_image: string;
    urls: Array<{
        name: string;
        description: string;
        link: string;
    }>;
}

interface QpayPaymentCheckResponse {
    count: number;
    paid_amount: number;
    rows: Array<{
        payment_id: string;
        payment_status: string;
        payment_date: string;
        payment_fee: string;
        payment_amount: string;
        payment_currency: string;
        payment_wallet: string;
        transaction_type: string;
    }>;
}

@Injectable()
export class QpayService {
    private readonly logger = new Logger(QpayService.name);
    private accessToken: string = '';
    private refreshToken: string = '';
    private tokenExpiresAt: number = 0;

    private readonly baseUrl: string;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly invoiceCode: string;
    private readonly callbackUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.baseUrl = this.configService.get<string>('QPAY_BASE_URL', 'https://merchant-sandbox.qpay.mn');
        this.clientId = this.configService.get<string>('QPAY_CLIENT_ID', '');
        this.clientSecret = this.configService.get<string>('QPAY_CLIENT_SECRET', '');
        this.invoiceCode = this.configService.get<string>('QPAY_INVOICE_CODE', '');
        this.callbackUrl = this.configService.get<string>('QPAY_CALLBACK_URL', 'http://localhost:3001/payments/qpay/callback');
    }

    /**
     * Get a valid access token, refreshing if needed
     */
    private async getAccessToken(): Promise<string> {
        const now = Date.now();

        // If token is still valid (with 30s buffer), reuse it
        if (this.accessToken && this.tokenExpiresAt > now + 30000) {
            return this.accessToken;
        }

        // Try to refresh if we have a refresh token
        if (this.refreshToken) {
            try {
                return await this.doRefreshToken();
            } catch (err) {
                this.logger.warn('Token refresh failed, will re-authenticate', err.message);
            }
        }

        // Otherwise, authenticate from scratch
        return await this.doAuthenticate();
    }

    /**
     * Authenticate with QPay using client credentials (Basic Auth)
     */
    private async doAuthenticate(): Promise<string> {
        this.logger.log(`Authenticating with QPay... (clientId: ${this.clientId}, baseUrl: ${this.baseUrl})`);

        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        try {
            const { data } = await firstValueFrom(
                this.httpService.post<QpayTokenResponse>(
                    `${this.baseUrl}/v2/auth/token`,
                    {},
                    {
                        headers: {
                            'Authorization': `Basic ${credentials}`,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );

            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);

            this.logger.log('QPay authentication successful');
            return this.accessToken;
        } catch (error) {
            const responseData = error.response?.data || error.response || 'No response body';
            this.logger.error(`QPay authentication failed - clientId: ${this.clientId}, url: ${this.baseUrl}/v2/auth/token`);
            this.logger.error(`QPay auth error response: ${JSON.stringify(responseData)}`);
            throw error;
        }
    }

    /**
     * Refresh the access token using the refresh token
     */
    private async doRefreshToken(): Promise<string> {
        this.logger.log('Refreshing QPay token...');

        const { data } = await firstValueFrom(
            this.httpService.post<QpayTokenResponse>(
                `${this.baseUrl}/v2/auth/refresh`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${this.refreshToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            ),
        );

        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);

        this.logger.log('QPay token refreshed successfully');
        return this.accessToken;
    }

    /**
     * Create a QPay invoice for a booking payment
     */
    async createInvoice(
        senderInvoiceNo: string,
        amount: number,
        description: string,
        callbackParam?: string,
    ): Promise<QpayInvoiceResponse> {
        const token = await this.getAccessToken();

        const body = {
            invoice_code: this.invoiceCode,
            sender_invoice_no: senderInvoiceNo,
            invoice_receiver_code: 'terminal',
            invoice_description: description,
            invoice_due_date: null,
            allow_partial: false,
            minimum_amount: null,
            allow_exceed: false,
            maximum_amount: null,
            callback_url: `${this.callbackUrl}${callbackParam ? '?payment_id=' + callbackParam : ''}`,
            lines: [
                {
                    line_description: description,
                    line_quantity: '1.00',
                    line_unit_price: amount.toFixed(2),
                    note: '',
                },
            ],
        };

        this.logger.log(`Creating QPay invoice: ${senderInvoiceNo}, amount: ${amount}`);

        const { data } = await firstValueFrom(
            this.httpService.post<QpayInvoiceResponse>(
                `${this.baseUrl}/v2/invoice`,
                body,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                },
            ),
        );

        this.logger.log(`QPay invoice created: ${data.invoice_id}`);
        return data;
    }

    /**
     * Check payment status for an invoice
     */
    async checkPayment(invoiceId: string): Promise<QpayPaymentCheckResponse> {
        const token = await this.getAccessToken();

        const body = {
            object_type: 'INVOICE',
            object_id: invoiceId,
            offset: {
                page_number: 1,
                page_limit: 100,
            },
        };

        const { data } = await firstValueFrom(
            this.httpService.post<QpayPaymentCheckResponse>(
                `${this.baseUrl}/v2/payment/check`,
                body,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                },
            ),
        );

        return data;
    }

    /**
     * Get invoice details
     */
    async getInvoice(invoiceId: string): Promise<any> {
        const token = await this.getAccessToken();

        const { data } = await firstValueFrom(
            this.httpService.get(
                `${this.baseUrl}/v2/invoice/${invoiceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                },
            ),
        );

        return data;
    }

    /**
     * Cancel an invoice
     */
    async cancelInvoice(invoiceId: string): Promise<any> {
        const token = await this.getAccessToken();

        const { data } = await firstValueFrom(
            this.httpService.delete(
                `${this.baseUrl}/v2/invoice/${invoiceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                },
            ),
        );

        return data;
    }
}
