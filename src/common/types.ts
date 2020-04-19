import { Model, Document } from 'mongoose';

/**
 * Mongo types
 */
export interface MongoModel {
    name: string;
    instance: Model<Document>;
}

export interface ModelElDef {
    // Tag name
    name: string;
    attributes: {
        type?: string;
        name?: string;
        submodel?: ModelElDef;
    };
    children: ModelElDef[];
}

export interface ModelDef {
    declaration: {
        attributes: {
            version: string;
            encoding: string;
            name: string;
        };
    };
    content: {
        fields: ModelElDef[];
    };
}

export interface AnyObject {
    [key: string]: any;
}

/**
 * EntityService types
 */
export type FilterMater = 'EQ' | 'GT' | 'GTE' | 'LT' | 'LTE';

export interface Filter {
    field: string;
    match: FilterMater;
    value: any;
}

export interface EntityParams {
    model: string;
    id?: string;
    ids?: string[];
    value?: AnyObject;
    sort?: AnyObject;
    entity?: AnyObject;
    entities?: AnyObject[];
    filter?: Filter;
    retFields?: string[];
}
