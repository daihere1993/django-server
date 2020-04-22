import {
  Module,
  HttpModule,
  Global,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import * as config from 'config';
import AuthModule from './auth/auth.module';
import DynamicMongoModule from './database';
import { EntityController } from './entity/entity.controller';
import DicMiddleware from './middlewares/dic.middleware';
import LoggerMiddleware from './middlewares/logger.middleware';

@Global()
@Module({
  imports: [
    // Initialize mongo models by model definition
    DynamicMongoModule.forRoot(config.get('Mongo.server')),
    AuthModule,
    HttpModule,
  ],
  controllers: [EntityController],
  providers: [],
})
export default class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(...[LoggerMiddleware, DicMiddleware])
      .forRoutes('entityService');
  }
}
