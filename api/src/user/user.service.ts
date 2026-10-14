import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { UserEntity } from './user.entity.js';
import { UserDto } from '../common/dto/user.dto.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toDto(user: UserEntity): UserDto {
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const user = await this.userRepository.findOneBy({
      Email: this.normalizeEmail(email),
    });
    return user ? this.toDto(user) : null;
  }

  async findByUsername(username: string): Promise<UserDto | null> {
    const user = await this.userRepository.findOneBy({ Username: username });
    return user ? this.toDto(user) : null;
  }

  async findById(id: number): Promise<UserDto | null> {
    const user = await this.userRepository.findOneBy({ id });
    return user ? this.toDto(user) : null;
  }

  async create(
    data: Pick<UserEntity, 'Username' | 'Email' | 'Password'>,
  ): Promise<UserEntity> {
    const entity = this.userRepository.create({
      ...data,
      Email: this.normalizeEmail(data.Email),
      RefreshToken: null,
    });
    return this.userRepository.save(entity);
  }

  async update(
    id: number,
    data: Partial<Pick<UserEntity, 'Username' | 'Email' | 'Password'>>,
  ): Promise<void> {
    const values = { ...data };
    if (values.Email) values.Email = this.normalizeEmail(values.Email);
    if (Object.keys(values).length === 0) return;
    await this.userRepository.update(id, values);
  }

  async updateRefreshToken(id: number, hash: string | null): Promise<void> {
    await this.userRepository.update(id, { RefreshToken: hash });
  }
}