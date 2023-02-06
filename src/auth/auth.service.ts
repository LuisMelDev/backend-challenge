import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { hashSync, compareSync } from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import {
  ChangePasswordDto,
  CreateUserDto,
  ForgotPasswordDto,
  SignInUserDto,
} from './dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: this.hashPassword(password),
      });

      await this.userRepository.save(user);

      delete user.password;

      return {
        ...user,
        token: this.getJwtToken({ id: user.id }),
      };
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async signInUser(signInUserDto: SignInUserDto) {
    const { email, password } = signInUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true },
    });

    if (!user || !compareSync(password, user.password))
      throw new UnauthorizedException('Credentias are not valid');

    delete user.password;

    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  async forgotPasword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new BadRequestException('something went wrong');
    }

    const resetToken = this.jwtService.sign(
      {
        id: user.id,
        email: user.name,
      },
      { expiresIn: '10m' },
    );

    user.resetToken = resetToken;

    this.userRepository.save(user);

    const subject = 'Forgotten Password';
    const message = `
      Hi! <br><br> If you requested to reset your password<br><br>

      <a href="${this.configService.get(
        'HOST_API',
      )}/auth/change-password?t=${resetToken}">Click here</a>
    `;

    try {
      await this.mailService.sendMail({
        message,
        subject,
        to: email,
      });

      return {
        message: `Message sent to ${email}`,
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto, token: string) {
    const { newPassword, newPasswordRepeat } = changePasswordDto;

    if (newPassword !== newPasswordRepeat) {
      throw new BadRequestException('Passwords are not identical');
    }

    if (!token) {
      throw new BadRequestException('token not found');
    }

    let data;

    try {
      data = this.jwtService.decode(token);
    } catch (error) {
      throw new BadRequestException('Token not valid');
    }

    try {
      const user = await this.userRepository.findOneBy({ id: data['id'] });

      if (!(user.resetToken === token)) {
        throw new BadRequestException('Token not valid');
      }

      user.password = this.hashPassword(newPassword);
      user.resetToken = null;

      await this.userRepository.save(user);

      return {
        message: 'Password updated',
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async authStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  hashPassword(password: string) {
    return hashSync(password, 10);
  }

  private getJwtToken(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  private handleErrors(error) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    console.log(error);

    throw new InternalServerErrorException('Please check server logs');
  }
}
