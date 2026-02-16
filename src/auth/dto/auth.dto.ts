export class SignupManualDto {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  postalCode?: string;
}

export class LoginManualDto {
  email: string;
  password: string;
}

export class SignupGoogleDto {
  googleIdToken: string;
  phoneNumber?: string;
  postalCode?: string;
}

export class LoginGoogleDto {
  googleIdToken: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}

export class ValidateTokenDto {
  accessToken: string;
}

export class LogoutDto {
  accessToken: string;
  refreshToken?: string;
}

export class GetUserInfoDto {
  accessToken: string;
}

