import { MongoModel } from '../common/types';
import { Controller, Post, Body, HttpException, HttpStatus, HttpCode } from '@nestjs/common';
import { InjectModels } from '../database/mongo.decorators';
import * as jwt from 'jsonwebtoken';
import * as config from 'config';

export interface UserParams {
    account: string;
    password: string;
    [propName: string]: any;
}

@Controller('user')
export class UserController {
    private model: MongoModel;

    public constructor(
        @InjectModels()
        models: MongoModel[]
    ) {
        this.model = models.find((model) => model.name === 'user');
    }

    @Post('register')
    public async register(@Body() body: UserParams) {
        const ret = await this.model.instance.create(body);
        return { ok: 1, _id: ret._id };
    }

    @Post('login')
    @HttpCode(200)
    public async login(@Body() body: UserParams) {
        const user = await this.model.instance.findOne({
            account: body.account
        });
        if (!user) {
            throw new HttpException("Couldn't find this account.", HttpStatus.UNAUTHORIZED);
        }

        if (await user['comparePassword'](body.password)) {
            const token = jwt.sign(
                {
                    uuid: user['_id'],
                    name: user['name'],
                    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
                },
                config.get('Mongo.JWT_CERT')
            );

            return { ok: 1, _id: user._id, token };
        } else {
            throw new HttpException('Wrong password.', HttpStatus.UNAUTHORIZED);
        }
    }
}
