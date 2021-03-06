import { EntityParams } from './../common/types';
import { Injectable, NestMiddleware, HttpService } from '@nestjs/common';
import { Request, Response } from 'express';
import * as cheerio from 'cheerio';
import * as _ from 'underscore';

import Logger from '../logger';

const logger = Logger.forModule('dic.middleware');

@Injectable()
export class DicMiddleware implements NestMiddleware {
    public constructor(private readonly httpService: HttpService) {}

    public use(req: Request, res: Response, next: Function) {
        const body: EntityParams = req.body;
        if (body.model === 'word' && req.url.includes('addEntity')) {
            const isVocabulary = body.entity.name.split(' ').length === 1;
            if (isVocabulary) {
                this.httpService.get('http://dict.youdao.com/w/eng/' + body.entity.name + '/').subscribe((_res) => {
                    const html = _res.data;
                    const $ = cheerio.load(html);
                    let symbols: string[] = [];
                    const audio = [`http://dict.youdao.com/dictvoice?audio=${body.entity.name}&type=1`, `http://dict.youdao.com/dictvoice?audio=${body.entity.name}&type=2`];
                    $('.pronounce > .phonetic').each(function(i) {
                        symbols.push($(this).text());
                    });
                    body.entity.phonetic = {
                        symbols,
                        audio
                    };
                    next();
                });
            } else {
                next();
            }
        } else {
            next();
        }
    }
}
