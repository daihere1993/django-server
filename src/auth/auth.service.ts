import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import UserService from './user.service';

export interface JwtPayload {
  id: string;
}

@Injectable()
export class AuthService {
  public constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  public signIn(user: JwtPayload): string {
    return this.jwtService.sign(user);
  }

  public async validateUser(payload: JwtPayload): Promise<any> {
    return this.userService.findOneByID(payload.id);
  }
}
