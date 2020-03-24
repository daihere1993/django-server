import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import Logger from './logger';
import * as config from 'config';

const logger = Logger.forModule('Mongo');

async function bootstrap() {
    const port = 3200;
    const app = await NestFactory.create(AppModule);

    app.enableCors();
    app.listen(port as number);
    logger.info(`[SYS] On listening port ${port}`);
}

bootstrap();
