import { Module, Inject, Global } from '@nestjs/common';
import { ModelDef } from '@daihere1993/dsp';
import { config } from 'node-config-ts';
import * as path from 'path';
import Mongo from './mongo';
import Logger from '../logger';

import requireDir = require('require-dir');
const allDefinitions = requireDir(
  path.join(process.cwd(), config.Path.distModelDef),
  { extensions: ['.json'] },
);

const logger = Logger.forModule('Mongo');

function getModelDefs(content: { [key: string]: string }): ModelDef[] {
  return Object.entries(content).map(item => {
    return new ModelDef(JSON.stringify(item[1]));
  });
}

export function getModelToken(model: string): string {
  return `${model}Model`;
}

@Global()
@Module({})
export class DynamicMongoModule {
  public static forRoot(url: string): any {
    const modelDefs = getModelDefs(allDefinitions);
    const mongo = new Mongo({ url, modelDefs });
    logger.info('startup mongo');
    mongo.startup();
    const providers = [
      {
        provide: 'MongoModels',
        useValue: mongo.models,
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
