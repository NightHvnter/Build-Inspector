import { Expose } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Regole condivise
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

// Uso interno (service): NON restituirlo mai nelle risposte HTTP
export class UserDto {
  @Expose()
  @IsInt()
  id: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  Username: string;

  // Null for Steam accounts, which have no email.
  @Expose()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  Email: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  RefreshToken: string | null;

  // Null for accounts created through Google or Discord: they can't sign in with a password.
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  Password: string | null;
}

export class UserLoginReqDto {
  @Expose()
  @IsEmail()
  @MaxLength(255)
  Email: string;

  // Nessun controllo di complessità al login: solo che sia presente
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  Password: string;
}

export class UserLoginResDto {
  @Expose()
  id: number;

  @Expose()
  Username: string;

  @Expose()
  Email: string | null; // null for Steam accounts

  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;
}

export class JwtUserPayload {
  @Expose()
  sub: number;

  @Expose()
  Username: string;

  @Expose()
  Email: string | null; // null for Steam accounts

  @Expose()
  iat?: number;

  @Expose()
  exp?: number;
}

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(USERNAME_REGEX, {
    message: 'Username può contenere solo lettere, numeri, ".", "_" e "-"',
  })
  Username: string;

  @IsEmail()
  @MaxLength(255)
  Email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, {
    message: 'La password deve contenere una maiuscola, una minuscola e un numero',
  })
  Password: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(USERNAME_REGEX, {
    message: 'Username può contenere solo lettere, numeri, ".", "_" e "-"',
  })
  Username?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  Email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, {
    message: 'La password deve contenere una maiuscola, una minuscola e un numero',
  })
  Password?: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  refreshToken: string;
}