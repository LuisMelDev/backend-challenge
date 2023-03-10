import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CreateUserDto,
  SignInUserDto,
  ForgotPasswordDto,
  ChangePasswordDto,
} from './dto';
import { Auth, GetUser } from './decorators';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authorization')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign_up')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @Post('sign_in')
  signInUser(@Body() signInUserDto: SignInUserDto) {
    return this.authService.signInUser(signInUserDto);
  }

  @Get('user/me')
  @Auth()
  authStatus(@GetUser() user: any) {
    return this.authService.authStatus(user);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPasword(forgotPasswordDto);
  }

  @Post('change-password')
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Query('t') token: string,
  ) {
    return this.authService.changePassword(changePasswordDto, token);
  }
}
