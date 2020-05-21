import { MongoModel } from 'common/types';
import { ModelDef, ModelField } from '@daihere1993/dsp';
import {
  Schema as MongoSchema,
  connection as mongoConnection,
  connect as mongoConnect,
  model as mongoModel,
} from 'mongoose';
import Logger from '../logger';

const logger = Logger.forModule('Mongo');

export default class Mongo {
  public models: MongoModel[] = [];

  private url: string;

  private modelDefs: ModelDef[];

  constructor(args: { url: string; modelDefs: ModelDef[] }) {
    this.url = args.url;
    this.modelDefs = args.modelDefs;
  }

  public startup(): void {
    this.toConnect();
    this.toInitModels();
  }

  private toConnect(): void {
    if (this.url) {
      mongoConnect(this.url);
      mongoConnection.on(
        'error',
        console.error.bind(console, 'connection error:'),
      );
      mongoConnection.on('open', () => {
        logger.info('Connect mongo server: %s', this.url);
      });
    } else {
      throw new Error("Couldn't find mongdo url to connect.");
    }
  }

  private toInitModels(): void {
    this.models = this.modelDefs.flatMap(modelDef => {
      const models = modelDef.submodels.map(item =>
        this.createModel(item.name, item.fields),
      );
      models.push(this.createModel(modelDef.name, modelDef.fields));
      return models;
    });
  }

  private createModel(name: string, fields: ModelField[]): MongoModel {
    const schema = this.createSchema(fields);
    logger.info(`[Model Create]: ${name}`);
    return {
      name,
      instance: mongoModel(name, schema),
    };
  }

  private createSchema(fields: ModelField[]): MongoSchema {
    const schemaParamsMap = {};
    fields.forEach(item => {
      schemaParamsMap[item.name] = {
        type: item.mongoProperties.schemaType,
      };
      if (item.mongoProperties.ref) {
        schemaParamsMap[item.name].ref = item.mongoProperties.ref;
      }
    });

    return new MongoSchema(schemaParamsMap, { timestamps: true });
  }
}
