/* eslint-disable @typescript-eslint/ban-ts-ignore */

import { ModelDef } from '@daihere1993/dsp';
import Mongo from './mongo';

import mockedContent = require('@test/mock/word.json');

describe('Mongo', () => {
  let mongo: Mongo;
  let modelDef: ModelDef;

  beforeAll(() => {
    const json = JSON.stringify(mockedContent);
    modelDef = new ModelDef(json);

    mongo = new Mongo({ url: '', modelDefs: [modelDef] });
  });

  it('Property: models', () => {
    // @ts-ignore
    mongo.toInitModels();

    const { models } = mongo;
    const [groupM, listM, wordM] = models;

    expect(models.length).toBe(3);

    expect(groupM.name).toBe('word_group');
    expect(groupM.instance).toBeDefined();

    expect(listM.name).toBe('word_list');
    expect(listM.instance).toBeDefined();

    expect(wordM.name).toBe('word');
    expect(wordM.instance).toBeDefined();
  });
});
