import { MongoModel } from 'src/common/types';
import { Controller, Post, Body } from '@nestjs/common';
import { InjectModels } from '@app/database/mongo.decorators';

export enum QuestionType {
    // Word + Audio => choose right translation
    NORMAL = 'normal',
    // Audio => choose right translation
    AUDIO_ONLY = 'audio'
}

export interface QuestionParams {
    // A group id
    group: string;
    list: [string];
    type: QuestionType;
}

@Controller('reviewService')
export class ReviewController {
    public constructor(
        @InjectModels()
        public models: MongoModel[]
    ) {}

    @Post('getQuestion')
    public async getQuestion(@Body() body) {}
}
