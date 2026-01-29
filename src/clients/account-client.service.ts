// clients/account-client.service.ts
import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AccountClientService {
  private readonly accountServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.accountServiceUrl = 
      this.configService.get('ACCOUNT_SERVICE_URL') || 'http://localhost:3003';
  }

  async createAccount(data: { email: string; name: string; password: string }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.accountServiceUrl}/accounts`, data)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to create account',
        error.response?.status || 500,
      );
    }
  }

  async compensateAccount(accountId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.accountServiceUrl}/accounts/${accountId}/compensate`
        )
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to compensate account',
        error.response?.status || 500,
      );
    }
  }

  async getAccount(accountId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountServiceUrl}/accounts/${accountId}`)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to get account',
        error.response?.status || 500,
      );
    }
  }
}