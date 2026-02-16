// clients/auth-client.service.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AuthServiceClient,
  SignupManualRequest,
  LoginManualRequest,
  SignupGoogleRequest,
  LoginGoogleRequest,
  RefreshTokenRequest,
  ValidateTokenRequest,
  LogoutRequest,
  GetUserInfoRequest,
  DeleteKeycloakUserRequest,
  DeleteTokensRequest,
  AuthResponse,
  TokenResponse,
  ValidateTokenResponse,
  LogoutResponse,
  UserInfoResponse,
} from '../../../proto/generated/auth';

@Injectable()
export class AuthClientService implements OnModuleInit {
  private authService: AuthServiceClient;

  constructor(@Inject('AUTH_GRPC') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthServiceClient>('AuthService');
  }

  async signupManual(data: SignupManualRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.SignupManual(data));
  }

  async loginManual(data: LoginManualRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.LoginManual(data));
  }

  async signupGoogle(data: SignupGoogleRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.SignupGoogle(data));
  }

  async loginGoogle(data: LoginGoogleRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.LoginGoogle(data));
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const request: RefreshTokenRequest = { refreshToken };
    return firstValueFrom(this.authService.RefreshToken(request));
  }

  async validateToken(accessToken: string): Promise<ValidateTokenResponse> {
    const request: ValidateTokenRequest = { accessToken };
    return firstValueFrom(this.authService.ValidateToken(request));
  }

  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    return firstValueFrom(this.authService.Logout(data));
  }

  async getUserInfo(accessToken: string): Promise<UserInfoResponse> {
    const request: GetUserInfoRequest = { accessToken };
    return firstValueFrom(this.authService.GetUserInfo(request));
  }

  async deleteKeycloakUser(keycloakUserId: string): Promise<void> {
    const request: DeleteKeycloakUserRequest = { keycloakUserId };
    await firstValueFrom(this.authService.DeleteKeycloakUser(request));
  }

  async deleteTokens(identifier: {
    keycloakUserId?: string;
    accountId?: string;
  }): Promise<void> {
    const request: DeleteTokensRequest = identifier;
    await firstValueFrom(this.authService.DeleteTokens(request));
  }
}

