import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

@Injectable()
export class PasswordService {
    
    constructor(
        private configService: ConfigService,
        private jwtService: JwtService,
        private readonly accessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        private readonly accessExpire = this.configService.get<string>('JWT_ACCESS_EXPIRES', '15m'),
        private readonly refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        private readonly refreshExpire = this.configService.get<string>('JWT_REFRESH_EXPIRES', '7d')
    ) {}

    async hash(password: string): Promise<string> {
        const saltRounds = Number(this.configService.get<number>('BCRYPT_SALT_ROUNDS')) || 10;
        return await bcrypt.hash(password, saltRounds);
    }

    async verify(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    async issueToken(payload: any){

    type Expires = JwtSignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([

        this.jwtService.signAsync(payload, {
            secret: this.accessSecret,
            expiresIn: this.accessExpire as Expires,
        }),

        this.jwtService.signAsync(payload, {
            secret: this.refreshSecret,
            expiresIn: this.refreshExpire as Expires,
        }),
    ]);

    return [accessToken, refreshToken];

    }
}