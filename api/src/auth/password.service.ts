import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";

@Injectable()
export class PasswordService {
    constructor(private configService: ConfigService) {}

    async hash(password: string): Promise<string> {
        const saltRounds = Number(this.configService.get<number>('BCRYPT_SALT_ROUNDS')) || 10;
        return await bcrypt.hash(password, saltRounds);
    }

    async verify(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }
}