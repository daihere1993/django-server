import { UserService } from './user.service';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
    id: string;
}

@Injectable()
export class AuthService {
    public constructor(private readonly userService: UserService, private readonly jwtService: JwtService) {}

    public signIn(user: JwtPayload): string {
        return this.jwtService.sign(user);
    }

    public async validateUser(payload: JwtPayload): Promise<any> {
        return await this.userService.findOneByID(payload.id);
    }
}
