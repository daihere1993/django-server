import * as mongoose from 'mongoose';

export enum ExtendSchemaType {
    SUBMODEL = 'submodel',
    PASSWORD = 'password',
    MODEL = 'model',
    MAP = 'map'
}
export type SchemaTypeUnion =
    | StringConstructor
    | NumberConstructor
    | BooleanConstructor
    | ArrayConstructor
    | DateConstructor
    | ExtendSchemaType;
export interface SchemaParamsMap {
    [schemaName: string]: {
        [field: string]: SchemaTypeUnion | any;
        includePassword?: boolean;
        passwordField?: string;
    };
}

export const SCHEMA_TYPES: { [key: string]: SchemaTypeUnion } = {
    text: String,
    number: Number,
    boolean: Boolean,
    textarea: String,
    array: Array,
    date: Date,
    submodel: ExtendSchemaType.SUBMODEL,
    password: ExtendSchemaType.PASSWORD,
    map: ExtendSchemaType.MAP,
    model: ExtendSchemaType.MODEL
};

export interface SchemaObj {
    name: string;
    instance: mongoose.Schema;
}
