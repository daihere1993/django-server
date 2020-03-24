import { Model, Document } from 'mongoose';

/**
 * Mongo types
 */
export interface MongoModel {
    name: string;
    instance: Model<Document>;
}

/**
 * Field types
 */
export type FieldType = 'text' | 'number' | 'boolean' | 'textarea' | 'data';

/**
 * Definition types
 */
export interface FieldDef {
    name: string;
    type: FieldType;
}

export interface DefElement {
    name?: string;
    type?: 'element' | 'text';
    attributes?: { type?: string; name?: string };
    text?: string;
    elements?: DefElement[];
}

export interface ModelDef {
    declaration: {
        attributes: {
            version: string;
            encoding: string;
            name: string;
        };
    };
    elements: DefElement[];
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
