
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { Throttle } from '@nestjs/throttler';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  
@Throttle({ default: { limit: 3, ttl: 60_000 } })
@Post('register')

  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }


@Throttle({ default: { limit: 5, ttl: 60_000 } })
@Post('login')

@HttpCode(HttpStatus.OK)
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}

}
