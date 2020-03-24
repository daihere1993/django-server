import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtStrategy } from './jwt.strtegy';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import * as config from 'config';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secretOrPrivateKey: config.get('Mongo.JWT_CERT')
        })
    ],
    controllers: [UserController],
    providers: [UserService, AuthService, JwtStrategy]
})
export class AuthModule {}
