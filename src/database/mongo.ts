import { MongoModel, ModelDef, ModelElDef } from 'src/common/types';
import { defUtiles } from '@app/common/utils';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as config from 'config';
import * as _ from 'underscore';
import Logger from '../logger';
import {
  SCHEMA_TYPES,
  SchemaParamsMap,
  ExtendSchemaType,
  SchemaObj,
  SchemaTypeUnion,
} from './types';

const logger = Logger.forModule('Mongo');

function comparePassword(candidatePassword: string): any {
  if (this.password) {
    return this.password === candidatePassword;
    // return bcrypt.compare(candidatePassword, this.password);
  }

  return null;
}

export default class Mongo {
  public models: MongoModel[] = [];

  public constructor(uri: string) {
    if (uri) {
      const db = mongoose.connection;
      // Connect to mongo server
      mongoose.connect(uri);
      db.on('error', console.error.bind(console, 'connection error:'));
      db.on('open', () => {
        logger.info('Connect mongo server: %s', uri);
      });
    }
  }

  public startup(defs: ModelDef[]): void {
    // Initialize mongo models
    this.models = this.createModels(defs);
  }

  private createModels(defs: ModelDef[]): MongoModel[] {
    const models: MongoModel[] = [];
    defs
      .map(def => {
        const modelName = defUtiles.getModelName(def);
        return this.createSchemaParamsMap(def.content.fields, modelName);
      })
      .forEach(schemaParamsMap => {
        this.createSchemas(schemaParamsMap).forEach((schema: any) => {
          models.push({
            name: schema.name,
            instance: mongoose.model(schema.name, schema.instance),
          });
          logger.info('[Mongo] %s has been created', schema.name);
        });
      });
    return models;
  }

  private autoPopulateAllFields(schema): void {
    let paths = '';
    schema.eachPath(function process(pathname, schemaType) {
      if (pathname === '_id') return;
      if (schemaType.options.ref) paths += ` ${pathname}`;
    });

    function handler(next: any): void {
      this.populate(paths);
      next();
    }
    schema.pre('find', handler);
    schema.pre('findOne', handler);
  }

  private getSchemaType(
    fieldDef: ModelElDef,
    modelName: string,
  ): SchemaTypeUnion | { type: string; ref: string } {
    let schemaType: any;
    const type = SCHEMA_TYPES[fieldDef.attributes.type];
    switch (type) {
      case ExtendSchemaType.MODEL:
      case ExtendSchemaType.SUBMODEL: {
        const submodelDef = fieldDef.attributes.submodel;
        if (!submodelDef) {
          throw new Error(
            `Not define corresponding submodel of field "${fieldDef.name}"`,
          );
        }
        schemaType = { type: mongoose.Types.ObjectId, ref: submodelDef.name };
        break;
      }
      case ExtendSchemaType.MAP: {
        schemaType = {};
        fieldDef.children.forEach(child => {
          schemaType[child.name] = this.getSchemaType(child, modelName);
        });
        break;
      }
      case ExtendSchemaType.PASSWORD:
        schemaType = String;
        break;
      default:
        if (!type) {
          const error = new Error(`No such type: ${fieldDef.attributes.type}`);
          logger.error(error.message);
          throw error;
        }
        schemaType = type;
        break;
    }
    return schemaType;
  }

  private createSchemaParamsMap(
    fieldsDef: ModelElDef[],
    modelName: string,
  ): SchemaParamsMap {
    const schemaParams: any = {};
    const schemaParamsMap: any = {};

    fieldsDef.forEach(fieldDef => {
      const { type } = fieldDef.attributes;
      switch (type) {
        case ExtendSchemaType.SUBMODEL: {
          const submodelDef = fieldDef.attributes.submodel;
          if (!submodelDef) {
            throw new Error(
              `Not define corresponding submodel of field "${fieldDef.name}"`,
            );
          }
          // Needs create new model for this submodel
          _.extend(
            schemaParamsMap,
            this.createSchemaParamsMap(
              submodelDef.children[0].children,
              submodelDef.name,
            ),
          );
          break;
        }
        case ExtendSchemaType.PASSWORD: {
          schemaParams.includePassword = true;
          schemaParams.passwordField = fieldDef.name;
          break;
        }
        default: {
          if (!type) {
            const error = new Error(
              `No such type: ${fieldDef.attributes.type}`,
            );
            logger.error(error.message);
            throw error;
          }
          break;
        }
      }
      schemaParams[fieldDef.name] = this.getSchemaType(fieldDef, modelName);
    });
    schemaParamsMap[modelName] = schemaParams;

    return schemaParamsMap;
  }

  private createSchemas(paramsMap: SchemaParamsMap): SchemaObj[] {
    const shcemas = [] as SchemaObj[];
    Object.entries(paramsMap).forEach(([name, params]) => {
      const params_ = { ...params };
      // timestamps: will add a createdAt and updatedAt fields automatically
      const instance = new mongoose.Schema(null, { timestamps: true });
      if (params_.includePassword) {
        const _field = params_.passwordField;
        instance.pre('save', async next => {
          if (this[_field]) {
            logger.warn(
              'Password: %s, SALT: %s',
              (this as any).password,
              config.get('Mongo.SALT_ROUNDS'),
            );
            this[_field] = await bcrypt.hash(
              this[_field],
              config.get('Mongo.SALT_ROUNDS'),
            );
          }
          next();
        });
        instance.methods.comparePassword = comparePassword;
        delete params_.includePassword;
        delete params_.passwordField;
      }
      instance.add(params_);
      // Populate all field by default
      instance.plugin(this.autoPopulateAllFields);
      shcemas.push({ name, instance });
    });
    return shcemas;
  }
}
