import { Expose } from "class-transformer";
import { IsEmpty, IsNotEmpty } from "class-validator";

export class UserDto {
    @Expose()
    Id: number;
    
    @Expose()
    @IsNotEmpty()
    Username: string;

    @Expose()
    @IsEmpty()
    Email: string;

    @Expose()
    @IsNotEmpty()
    Password: string; 
}

export class UserLoginReqDto {
    @Expose()
    @IsEmpty()
    Email: string;

    @Expose()
    @IsNotEmpty()
    Password: string; 
}

export class UserLoginResDto {
    @Expose()
    Id: number;
    
    @Expose()
    @IsNotEmpty()
    Username: string;
    
    @Expose()
    @IsEmpty()
    Email: string;
}