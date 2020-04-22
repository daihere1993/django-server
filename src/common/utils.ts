import * as util from 'util';
import * as fs from 'fs';
import * as config from 'config';
import { ModelDef } from 'src/common/types';

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const defPath = config.get('Path.distModelDef') as string;

export function firstUpperCase(str: string): string {
  return str.toLowerCase().replace(/( |^)[a-z]/g, L => L.toUpperCase());
}

export const defUtiles = {
  getModelName(def: ModelDef): string {
    return def.declaration.attributes.name;
  },
  async getModelDef$(modelName: string): Promise<ModelDef> {
    const fileName = modelName.includes('.json')
      ? modelName
      : `${modelName}.json`;
    return JSON.parse((await readFile(`${defPath}/${fileName}`)).toString());
  },
  async getEntireDef$(): Promise<ModelDef[]> {
    const fileNames = await readdir(defPath);
    const defs: Promise<ModelDef>[] = fileNames.map(async name =>
      defUtiles.getModelDef$(name),
    );
    return Promise.all(defs);
  },
};
