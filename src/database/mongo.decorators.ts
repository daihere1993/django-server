import { Module, Inject, Global } from '@nestjs/common';
import { ModelDef } from 'src/common/types';
import { defUtiles } from '@app/common/utils';
import Mongo from './mongo';
import Logger from '../logger';

const logger = Logger.forModule('Mongo');

export function getModelToken(model: string): string {
  return `${model}Model`;
}

@Global()
@Module({})
export class DynamicMongoModule {
  public static async forRoot(
    uri: string,
    defCb?: () => Promise<ModelDef[]>,
  ): Promise<any> {
    const mongoInstance = new Mongo(uri);
    const defs = defCb ? await defCb() : await defUtiles.getEntireDef$();
    logger.info('startup mongo');
    mongoInstance.startup(defs);
    const providers = [
      {
        provide: 'MongoModels',
        useValue: mongoInstance.models,
      },
    ];
    return {
      module: DynamicMongoModule,
      providers,
      exports: providers,
    };
  }
}

export const InjectModels = (): any => Inject('MongoModels');
