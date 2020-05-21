import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { config } from 'node-config-ts';
import UserService from './user.service';
import { UserController } from './user.controller';
import JwtStrategy from './jwt.strtegy';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secretOrPrivateKey: config.Mongo.JWT_CERT,
    }),
  ],
  controllers: [UserController],
  providers: [UserService, AuthService, JwtStrategy],
})
export default class AuthModule {}
