import { Injectable } from '@nestjs/common';
import { MongoModel } from '../common/types';
import { InjectModels } from '../database/mongo.decorators';

@Injectable()
export default class UserService {
  private model: MongoModel;

  public constructor(
    @InjectModels()
    models: MongoModel[],
  ) {
    this.model = models.find(model => model.name === 'user');
  }

  public async findOneByID(id: string): Promise<any> {
    return this.model.instance.findById(id);
  }
}
