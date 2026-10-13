import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "./user.entity.js";
import { Repository } from "typeorm";
import { UserDto } from "../common/dto/user.dto.js";
import { plainToInstance } from "class-transformer";

@Injectable()
export class UserService {
    constructor(@InjectRepository(UserEntity) private users: Repository<UserEntity>)
    {}

    async findByEmail(email: string): Promise<UserDto | null> {
        const user = await this.users.findOneBy({Email: email})
        if(!user) return null;
        return plainToInstance(UserDto, user, { excludeExtraneousValues: true })
    }
    
    async findByUsername(username: string): Promise<UserDto | null> {
        const user = await this.users.findOneBy({Username: username})
        if(!user) return null;
        return plainToInstance(UserDto, user, { excludeExtraneousValues: true })
    }

    async create(user: UserDto) {
        const entity = plainToInstance(UserEntity, user);
        this.users.save(entity);
    }

    async update(user: UserDto) {
        const entity = plainToInstance(UserEntity, user);
        this.users.save(entity);
    }

}