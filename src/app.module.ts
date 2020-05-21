import {
  Module,
  HttpModule,
  Global,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import { config } from 'node-config-ts';
import { EntityController } from './entity/entity.controller';
import AuthModule from './auth/auth.module';
import DynamicMongoModule from './mongo';
import DicMiddleware from './middlewares/dic.middleware';
import LoggerMiddleware from './middlewares/logger.middleware';

@Global()
@Module({
  imports: [
    AuthModule,
    HttpModule,
    // Initialize mongo models by model definition
    DynamicMongoModule.forRoot(config.Mongo.server),
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
