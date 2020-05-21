import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import * as _ from 'underscore';
import * as mongoose from 'mongoose';
import { MongoModel, EntityParams, Filter } from '../common/types';
import { InjectModels } from '../mongo/mongo.decorators';
import Logger from '../logger';

const logger = Logger.forModule('EntityService');

export enum GeneralOperations {
  DATABASE_GET = 'All GET operations from database',
}

export interface RetFieldsMap {
  common: string[];
  ref: { model: string; field: string }[];
}

export interface OperationOts {
  modelName?: string;
  dbQeury?: mongoose.Query<any>;
  retFields?: any[];
}

@Controller('entityService')
/** Just for test */
export class EntityController {
  public constructor(
    @InjectModels()
    public models: MongoModel[],
  ) {}

  @Post('addEntity')
  public async addEntity(@Body() body: EntityParams): Promise<any> {
    const retFields = body.retFields || [];
    const model = this.getModelByBody(body);
    const ret = await model.instance.create(body.entity);
    const value = {};
    if (retFields) {
      const entity = await model.instance
        .findById(ret._id)
        .select(retFields.join(''));
      retFields.forEach(field => {
        value[field] = entity[field];
      });
    }
    return { ok: 1, _id: ret._id, value };
  }

  @Post('addEntities')
  public async addEntities(@Body() body: EntityParams): Promise<any> {
    const model = this.getModelByBody(body);
    const ret = await model.instance.create(body.entities);
    const _ids: string[] = ret.map(item => item._id);
    return { ok: 1, _ids };
  }

  @Post('getEntity')
  @HttpCode(200)
  public async getEntity(@Body() body: EntityParams): Promise<any> {
    const model = this.getModelByBody(body);
    const retFields = body.retFields || [];
    const entity = await model.instance
      .findById(body.id)
      .select(retFields.join(''))
      .sort(body.sort);
    return { ok: 1, entity };
  }

  @Post('getEntities')
  @HttpCode(200)
  public async getEntities(@Body() body: EntityParams): Promise<any> {
    let entities: any[];
    const model = this.getModelByBody(body);
    const retFields = body.retFields || [];
    if (body.ids) {
      const ids = this.turnID2ObjectIDs(body.ids);
      entities = await model.instance
        .find({ _id: { $in: ids } })
        .select(retFields.join(''))
        .sort(body.sort);
    } else if (body.filter) {
      const filter = this.formatFilter(body.filter);
      entities = await model.instance
        .find(filter)
        .select(retFields.join(''))
        .sort(body.sort);
    } else {
      entities = await model.instance
        .find()
        .select(retFields.join(''))
        .sort(body.sort);
    }
    return { ok: 1, entities };
  }

  @Post('updateEntity')
  @HttpCode(200)
  public async updateEntity(@Body() body: EntityParams): Promise<any> {
    const model = this.getModelByBody(body);
    const ret = await model.instance.findByIdAndUpdate(body.id, body.value, {
      new: true,
    });
    return { ok: 1, value: ret };
  }

  @Post('updateEntities')
  @HttpCode(200)
  public async updateEntities(@Body() body: EntityParams): Promise<any> {
    const model = this.getModelByBody(body);
    const filter = this.formatFilter(body.filter);
    const ret = await model.instance.updateMany(filter, body.value);
    return ret;
  }

  @Post('deleteEntity')
  public async deleteEntity(@Body() body: EntityParams): Promise<any> {
    const model = this.getModelByBody(body);
    if (!body.id) {
      const error = new Error("ID couldn' be empty");
      throw error;
    } else {
      await model.instance.findByIdAndDelete(body.id);
      return { ok: 1 };
    }
  }

  @Post('deleteEntities')
  public async deleteEntities(@Body() body: EntityParams): Promise<any> {
    let condition: any;
    const model = this.getModelByBody(body);
    if (body.ids) {
      const ids = this.turnID2ObjectIDs(body.ids);
      condition = { _id: { $in: ids } };
    } else if (body.filter) {
      condition = this.formatFilter(body.filter);
    } else {
      throw new Error('No filter and ids');
    }
    const ret = await model.instance.deleteMany(condition);
    return ret;
  }

  private getModelByBody(body: EntityParams): MongoModel {
    const model = this.models.find(item => item.name === body.model);
    if (!model) {
      const err = new Error(`Not find ${body.model} model`);
      logger.error(err.message);
      throw err;
    } else {
      return model;
    }
  }

  private turnID2ObjectIDs(id: string | string[]): mongoose.Types.ObjectId[] {
    const ids = _.isArray(id) ? id : [id];
    return ids.map(item => mongoose.Types.ObjectId(item));
  }

  private formatFilter(filter: Filter | Filter[]): object {
    const ret = {};
    if (_.isArray(filter)) {
      filter.forEach(f => {
        _.extend(ret, this.formatFilter(f));
      });
    } else if (!_.isUndefined(filter.value)) {
      switch (filter.match) {
        case 'EQ':
          ret[filter.field] = filter.value;
          break;
        case 'LT':
          ret[filter.field] = { $lt: filter.value };
          break;
        case 'GT':
          ret[filter.field] = { $gt: filter.value };
          break;
        case 'LTE':
          ret[filter.field] = { $lte: filter.value };
          break;
        case 'GTE':
          ret[filter.field] = { $gte: filter.value };
          break;
        default:
          break;
      }
    }
    return ret;
  }
}
