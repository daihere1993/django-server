import { MongoModel, ModelDef, DefElement } from 'src/common/types';
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
            const rootDef = { elements: def.elements };
            const modelName = defUtiles.getModelName(def);
            const schemaParamsMap = this.createSchemaParamsMap(rootDef, modelName);
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

    private isSubmode(type: string): boolean {
        return type.includes('submodel');
    }

    private getRealType(type: string): string {
        return type.split('.')[0];
    }

    private getSchemaType(fieldDef: DefElement, modelName: string): SchemaTypeUnion | { type: string; ref: string } {
        let schemaType: any;
        const type = SCHEMA_TYPES[this.getRealType(fieldDef.attributes.type)];
        switch (type) {
            case ExtendSchemaType.MODEL:
            case ExtendSchemaType.SUBMODEL:
                let refModel = fieldDef.attributes.type.split('.')[1];
                if (this.isSubmode(fieldDef.attributes.type)) {
                    refModel = `${modelName}_${refModel}`;
                }
                if (!refModel) {
                    const error = new Error(`There\'s no refered model of field: ${fieldDef.name}`);
                    throw error;
                }
                schemaType = { type: mongoose.Types.ObjectId, ref: refModel };
                break;
            case ExtendSchemaType.MAP:
                schemaType = {};
                for (const element of fieldDef.elements) {
                    schemaType[element.name] = this.getSchemaType(element, modelName);
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

    private createSchemaParamsMap(def: DefElement, modelName: string): SchemaParamsMap {
        const schemaParamsMap = {};
        const fieldsDef = defUtiles.getDefByTagname(def, 'fields').elements;
        const schemaParams = {};

        for (const fieldDef of fieldsDef) {
            const type = this.getRealType(fieldDef.attributes.type);
            switch (type) {
                case ExtendSchemaType.SUBMODEL:
                    // Needs create new model for this submodel
                    let targetModelDef: DefElement;
                    const _submodelName = fieldDef.attributes.type.split('.')[1];
                    const submodelDef = defUtiles.getDefByTagname(def, 'submodels');
                    for (const element of submodelDef.elements) {
                        if (element.attributes.name === _submodelName) {
                            targetModelDef = element;
                            break;
                        }
                    }
                    if (targetModelDef) {
                        const submodelName = `${modelName}_${_submodelName}`;
                        _.extend(schemaParamsMap, this.createSchemaParamsMap(targetModelDef, submodelName));
                    }
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
            const instance = new mongoose.Schema();
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
