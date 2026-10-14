import {
  Body, ConflictException, Controller, ForbiddenException, Get,
  NotFoundException, Param, ParseIntPipe, Patch, Post, Req, UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { PasswordService } from '../auth/password.service.js';
import { JwtAuthGuard } from '../guard/jwt-auth.guard.js';
import { CreateUserDto, JwtUserPayload, UpdateUserDto } from '../common/dto/user.dto.js';

@Controller('auth/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
  ) {}

  // Pubblico: registrazione
  @Post()
  async create(@Body() dto: CreateUserDto) {
    if (await this.userService.findByEmail(dto.Email))
      throw new ConflictException('Email already in use');
    if (await this.userService.findByUsername(dto.Username))
      throw new ConflictException('Username already in use');

    const user = await this.userService.create({
      Username: dto.Username,
      Email: dto.Email,
      Password: await this.passwordService.hash(dto.Password),
    });
    return { Id: user.id, Username: user.Username, Email: user.Email };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const { Password, RefreshToken, ...publicUser } = user;
    return publicUser;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req: { user: JwtUserPayload },
  ) {
    // Ognuno può modificare solo se stesso
    if (req.user.sub !== id) throw new ForbiddenException();

    const data = { ...dto };
    if (data.Password) data.Password = await this.passwordService.hash(data.Password);

    await this.userService.update(id, data);
    return this.findById(id);
  }
}