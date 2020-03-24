import { MongoModel } from '../common/types';
import { Injectable } from '@nestjs/common';
import { InjectModels } from '../database/mongo.decorators';

@Injectable()
export class UserService {
    private model: MongoModel;

    public constructor(
        @InjectModels()
        models: MongoModel[]
    ) {
        this.model = models.find((model) => model.name === 'user');
    }

    public async findOneByID(id: string): Promise<any> {
        return await this.model.instance.findById(id);
    }
}
