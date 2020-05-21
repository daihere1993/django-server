import { MongoModel } from 'common/types';
import { Controller } from '@nestjs/common';
import { InjectModels } from 'mongo/mongo.decorators';

export enum QuestionType {
  // Word + Audio => choose right translation
  NORMAL = 'normal',
  // Audio => choose right translation
  AUDIO_ONLY = 'audio',
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
    public models: MongoModel[],
  ) {}
}
