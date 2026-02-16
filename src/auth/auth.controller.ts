import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthClientService } from '../clients/auth-client.service';
import {
  SignupManualDto,
  LoginManualDto,
  SignupGoogleDto,
  LoginGoogleDto,
  RefreshTokenDto,
  ValidateTokenDto,
  LogoutDto,
  GetUserInfoDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authClient: AuthClientService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignupManualDto) {
    return this.authClient.signupManual(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginManualDto) {
    return this.authClient.loginManual(dto);
  }

  @Post('signup/google')
  @HttpCode(HttpStatus.CREATED)
  async signupGoogle(@Body() dto: SignupGoogleDto) {
    return this.authClient.signupGoogle(dto);
  }

  @Post('login/google')
  @HttpCode(HttpStatus.OK)
  async loginGoogle(@Body() dto: LoginGoogleDto) {
    return this.authClient.loginGoogle(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authClient.refreshToken(dto.refreshToken);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Body() dto: ValidateTokenDto) {
    return this.authClient.validateToken(dto.accessToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto) {
    return this.authClient.logout(dto);
  }

  @Post('user-info')
  @HttpCode(HttpStatus.OK)
  async getUserInfo(@Body() dto: GetUserInfoDto) {
    return this.authClient.getUserInfo(dto.accessToken);
  }
}
