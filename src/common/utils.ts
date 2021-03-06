import * as util from 'util';
import * as fs from 'fs';
import * as config from 'config';
import { ModelDef, DefElement } from 'src/common/types';

import Logger from '@app/logger';

const logger = Logger.forModule('Utils');
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const defPath = config.get('Path.distModelDef') as string;

export function firstUpperCase(str: string): string {
    return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

export const defUtiles = {
    getModelName(def: ModelDef): string {
        return def.declaration.attributes.name;
    },
    getDefByTagname(def: DefElement, tagname: string): DefElement {
        return def.elements.filter((ele) => {
            return ele.name === tagname;
        })[0];
    },
    async getRefFieldsInfo$(modelName: string): Promise<{ refModel: string; field: string }[]> {
        const fields = [] as { refModel: string; field: string }[];
        const def = await defUtiles.getModelDef$(modelName);
        const fieldsDef = defUtiles.getDefByTagname(def, 'fields');
        for (const fieldDef of fieldsDef.elements) {
            if (fieldDef.attributes.type.split('.')[0] === 'model') {
                fields.push({ refModel: fieldDef.attributes.type.split('.')[1], field: fieldDef.name });
            }
        }
        return fields;
    },
    async getModelDef$(modelName: string): Promise<ModelDef> {
        try {
            const fileName = modelName.includes('.json') ? modelName : `${modelName}.json`;
            return JSON.parse((await readFile(defPath + '/' + fileName)).toString());
        } catch (error) {
            throw error;
        }
    },
    async getEntireDef$(): Promise<ModelDef[]> {
        const defs: ModelDef[] = [];
        try {
            const fileNames = await readdir(defPath);
            for (const name of fileNames) {
                defs.push(await defUtiles.getModelDef$(name));
            }
            return defs;
        } catch (error) {
            throw error;
        }
    }
};
