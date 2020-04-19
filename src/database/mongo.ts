import { MongoModel, ModelDef, ModelElDef } from 'src/common/types';
import { SCHEMA_TYPES, SchemaParamsMap, ExtendSchemaType, SchemaObj, SchemaTypeUnion } from './types';
import { defUtiles } from '@app/common/utils';
import Logger from '../logger';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as config from 'config';
import * as _ from 'underscore';

const logger = Logger.forModule('Mongo');

function comparePassword(candidatePassword: string) {
    if (this.password) {
        return bcrypt.compare(candidatePassword, this.password);
    }
}

export class Mongo {
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
        for (const def of defs) {
            const modelName = defUtiles.getModelName(def);
            const schemaParamsMap = this.createSchemaParamsMap(def.content.fields, modelName);
            const schemas = this.createSchemas(schemaParamsMap);
            for (const schema of schemas) {
                models.push({
                    name: schema.name,
                    instance: mongoose.model(schema.name, schema.instance)
                });
                logger.info('[Mongo] %s has been created', schema.name);
            }
        }
        return models;
    }

    private autoPopulateAllFields(schema) {
        let paths = '';
        schema.eachPath(function process(pathname, schemaType) {
            if (pathname === '_id') return;
            if (schemaType.options.ref) paths += ' ' + pathname;
        });

        function handler(next: any) {
            this.populate(paths);
            next();
        }
        schema.pre('find', handler);
        schema.pre('findOne', handler);
    }

    private getSchemaType(fieldDef: ModelElDef, modelName: string): SchemaTypeUnion | { type: string; ref: string } {
        let schemaType: any;
        const type = SCHEMA_TYPES[fieldDef.attributes.type];
        switch (type) {
            case ExtendSchemaType.MODEL:
            case ExtendSchemaType.SUBMODEL:
                const submodelDef = fieldDef.attributes.submodel;
                if (!submodelDef) {
                    throw new Error(`Not define corresponding submodel of field "${fieldDef.name}"`);
                }
                schemaType = { type: mongoose.Types.ObjectId, ref: submodelDef.name };
                break;
            case ExtendSchemaType.MAP:
                schemaType = {};
                for (const child of fieldDef.children) {
                    schemaType[child.name] = this.getSchemaType(child, modelName);
                }
                break;
            case ExtendSchemaType.PASSWORD:
                schemaType = String;
                break;
            default:
                if (!type) {
                    const error = new Error('No such type: ' + fieldDef.attributes.type);
                    logger.error(error);
                    throw error;
                }
                schemaType = type;
                break;
        }
        return schemaType;
    }

    private createSchemaParamsMap(fieldsDef: ModelElDef[], modelName: string): SchemaParamsMap {
        const schemaParams = {};
        const schemaParamsMap = {};

        for (const fieldDef of fieldsDef) {
            const type = fieldDef.attributes.type;
            switch (type) {
                case ExtendSchemaType.SUBMODEL:
                    const submodelDef = fieldDef.attributes.submodel;
                    if (!submodelDef) {
                        throw new Error(`Not define corresponding submodel of field "${fieldDef.name}"`);
                    }
                    // Needs create new model for this submodel
                    _.extend(
                        schemaParamsMap,
                        this.createSchemaParamsMap(submodelDef.children[0].children, submodelDef.name)
                    );
                    break;
                case ExtendSchemaType.PASSWORD:
                    schemaParams['includePassword'] = true;
                    schemaParams['passwordField'] = fieldDef.name;
                    break;
                default:
                    if (!type) {
                        const error = new Error('No such type: ' + fieldDef.attributes.type);
                        logger.error(error);
                        throw error;
                    }
                    break;
            }
            schemaParams[fieldDef.name] = this.getSchemaType(fieldDef, modelName);
        }
        schemaParamsMap[modelName] = schemaParams;

        return schemaParamsMap;
    }

    private createSchemas(paramsMap: SchemaParamsMap): SchemaObj[] {
        const shcemas = [] as SchemaObj[];
        for (const [name, params] of Object.entries(paramsMap)) {
            // timestamps: will add a createdAt and updatedAt fields automatically
            const instance = new mongoose.Schema(null, { timestamps: true });
            if (params.includePassword) {
                const _field = params.passwordField;
                instance.pre('save', async function(next) {
                    if (this[_field]) {
                        logger.warn('Password: %s, SALT: %s', this['password'], config.get('Mongo.SALT_ROUNDS'));
                        this[_field] = await bcrypt.hash(this[_field], config.get('Mongo.SALT_ROUNDS'));
                    }
                    next();
                });
                instance.methods.comparePassword = comparePassword;
                delete params.includePassword;
                delete params.passwordField;
            }
            instance.add(params);
            // Populate all field by default
            instance.plugin(this.autoPopulateAllFields);
            shcemas.push({ name, instance });
        }
        return shcemas;
    }
}
