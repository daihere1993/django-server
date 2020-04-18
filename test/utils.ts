import * as _ from 'underscore';
import * as request from 'supertest';

export async function deleteByID(server: any, id: string | string[], model: string) {
    const ids = _.isArray(id) ? id : [id];
    return request(server)
        .post('/entityService/deleteEntities')
        .set('Accept', 'application/json')
        .send({ model, ids });
}
