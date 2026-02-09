// clients/account-client.service.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AccountServiceClient,
  CreateAccountRequest,
  CompensateAccountRequest,
  GetAccountRequest,
  AccountResponse,
} from '../../../proto/generated/account';

@Injectable()
export class AccountClientService implements OnModuleInit {
  private accountService: AccountServiceClient;

  constructor(@Inject('ACCOUNT_GRPC') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.accountService = this.client.getService<AccountServiceClient>('AccountService');
  }

  async createAccount(data: { email: string; name: string; password: string; phoneNumber?: string; postalCode?: string }): Promise<AccountResponse> {
    const request: CreateAccountRequest = {
      email: data.email,
      name: data.name,
      password: data.password,
      phoneNumber: data.phoneNumber,
      postalCode: data.postalCode,
    };
    return firstValueFrom(this.accountService.CreateAccount(request));
  }

  async compensateAccount(accountId: string): Promise<AccountResponse> {
    const request: CompensateAccountRequest = { accountId };
    return firstValueFrom(this.accountService.CompensateAccount(request));
  }

  async getAccount(accountId: string): Promise<AccountResponse> {
    const request: GetAccountRequest = { accountId };
    return firstValueFrom(this.accountService.GetAccount(request));
  }
}