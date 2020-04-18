import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { deleteByID } from './utils';

describe('Entity API (e2e)', () => {
    let server: any;
    const model = 'user';
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
        server = app.getHttpServer();
    });

    describe('/entityService/addEntity', () => {
        const url = '/entityService/addEntity';

        it('Case: Normal', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({
                    model,
                    entity: { name: 'admin' }
                })
                .expect(201)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body._id).toBeDefined();
                    deleteByID(server, res.body._id, model);
                    done();
                });
        });
    });

    describe('/entityService/addEntities', () => {
        const url = '/entityService/addEntities';

        it('Case: Normal', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({
                    model,
                    entities: [
                        {
                            name: 'Curry'
                        },
                        {
                            name: 'Irving'
                        }
                    ]
                })
                .expect(201)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body._ids).toBeDefined();
                    expect(res.body._ids.length).toBe(2);

                    deleteByID(server, res.body._ids, model);
                    done();
                });
        });
    });

    describe('/entityService/getEntity', () => {
        let id: string;
        const url = '/entityService/getEntity';

        beforeAll(async () => {
            return request(server)
                .post('/entityService/addEntity')
                .set('Accept', 'application/json')
                .send({ model, entity: { name: 'T-Mac', account: 'tmac520' } })
                .then((res) => {
                    id = res.body._id;
                });
        });

        afterAll(async () => {
            return deleteByID(server, id, model);
        });

        it('Case: Normal', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, id })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entity).toBeDefined();
                    expect(res.body.entity.name).toBe('T-Mac');
                    expect(res.body.entity.createdAt).toBeDefined();
                    expect(res.body.entity.updatedAt).toBeDefined();
                    done();
                });
        });

        it('Case: Return specific fields', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, id, retFields: ['account'] })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entity._id).toBeDefined();
                    expect(res.body.entity.account).toBeDefined();
                    expect(res.body.entity.name).toBeUndefined();
                    done();
                });
        });
    });

    describe('/entityService/getEntities', () => {
        let ids: string[] = [];
        const url = '/entityService/getEntities';
        const entities = [
            { name: 'Lebron', account: 'lebron520', age: 34 },
            { name: 'Wade', account: 'wade520', age: 37 },
            { name: 'Bosh', account: 'bosh520', age: 34 },
            { name: 'Luka', account: 'luka520', age: 19 }
        ];

        beforeAll(async () => {
            return request(server)
                .post('/entityService/addEntities')
                .set('Accept', 'application/json')
                .send({ model, entities })
                .then((res) => {
                    ids = res.body._ids;
                });
        });

        afterAll(async () => {
            return deleteByID(server, ids, model);
        });

        it('Case: Get entities by ids - Normal', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, ids })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entities.length).toBe(entities.length);
                    done();
                });
        });

        it('Case: Get entities by ids - Return specific fields', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, ids, retFields: ['account'] })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entities.length).toBe(entities.length);
                    expect(res.body.entities[0]._id).toBeDefined();
                    expect(res.body.entities[0].account).toBeDefined();
                    expect(res.body.entities[0].name).toBeUndefined();
                    done();
                });
        });

        it('Case: Get entities by ids - Sortable - asc', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, ids, sort: { age: 'asc' } })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entities[0].name).toBe('Luka');
                    expect(res.body.entities[3].name).toBe('Wade');
                    done();
                });
        });

        it('Case: Get entities by ids - Sortable - desc', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, ids, sort: { age: 'desc' } })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entities[0].name).toBe('Wade');
                    expect(res.body.entities[3].name).toBe('Luka');
                    done();
                });
        });

        it('Case: Get entities by filter - Return specific fields', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, retFields: ['account'], filter: { field: 'age', match: 'GT', value: 35 } })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entities.length).toBe(1);
                    expect(res.body.entities[0]._id).toBeDefined();
                    expect(res.body.entities[0].account).toBeDefined();
                    expect(res.body.entities[0].name).toBeUndefined();
                    done();
                });
        });

        it('Case: Get entities by filter - Sortable - asc', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, filter: { field: 'age', match: 'LT', value: 40 }, sort: { age: 'asc' } })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entities[0].name).toBe('Luka');
                    expect(res.body.entities[3].name).toBe('Wade');
                    done();
                });
        });

        it('Case: Get entities by filter - Sortable - desc', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, filter: { field: 'age', match: 'LT', value: 40 }, sort: { age: 'desc' } })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entities[0].name).toBe('Wade');
                    expect(res.body.entities[3].name).toBe('Luka');
                    done();
                });
        });

        it('Case: Get entities by filter - With EQ', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, filter: { field: 'age', match: 'EQ', value: 34 } })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entities.length).toBe(2);
                    done();
                });
        });

        it('Case: Get entities by filter - With LT', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, filter: { field: 'age', match: 'LT', value: 40 } })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entities.length).toBe(4);
                    done();
                });
        });

        it('Case: Get entities by filter - With GT', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, filter: { field: 'age', match: 'GT', value: 34 } })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entities.length).toBe(1);
                    expect(res.body.entities[0].name).toBe('Wade');
                    done();
                });
        });

        it('Case: Get entities by filter - With LTE', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, filter: { field: 'age', match: 'LTE', value: 34 } })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.entities.length).toBe(3);
                    done();
                });
        });

        it('Case: Get entities by filter - With GTE', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, filter: { field: 'age', match: 'GTE', value: 36 } })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.entities.length).toBe(1);
                    expect(res.body.entities[0].name).toBe('Wade');
                    done();
                });
        });
    });

    describe('/entityService/updateEntity', () => {
        let id: string;
        const url = '/entityService/updateEntity';

        beforeAll(async () => {
            return request(server)
                .post('/entityService/addEntity')
                .set('Accept', 'application/json')
                .send({ model, entity: { name: 'Westbrook', account: 'westbrook520' } })
                .then((res) => {
                    id = res.body._id;
                });
        });

        afterAll(async () => {
            return deleteByID(server, id, model);
        });

        it('Case: Normal', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, id, value: { account: 'westbrook521' } })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.value.account).toBe('westbrook521');
                    done();
                });
        });
    });

    describe('/entityService/updateEntities', () => {
        let ids: string[] = [];
        const url = '/entityService/updateEntities';
        const entities = [
            { name: 'Lebron', account: 'lebron520', age: 34 },
            { name: 'Wade', account: 'wade520', age: 37 },
            { name: 'Bosh', account: 'bosh520', age: 34 },
            { name: 'Luka', account: 'luka520', age: 19 }
        ];

        beforeAll(async () => {
            return request(server)
                .post('/entityService/addEntities')
                .set('Accept', 'application/json')
                .send({ model, entities })
                .then((res) => {
                    ids = res.body._ids;
                });
        });

        afterAll(async () => {
            return deleteByID(server, ids, model);
        });

        it('Case: Normal', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, filter: { field: 'age', match: 'LTE', value: 34 }, value: { evaluation: 'Old' } })
                .expect(200)
                .end((err, res) => {
                    // Will return: {"n":3,"nModified":3,"ok":1}
                    expect(res.body.ok).toBe(1);
                    // n means how many items satisfy the filter
                    expect(res.body.n).toBe(3);
                    // nModified means how many items has been modified
                    expect(res.body.nModified).toBe(3);
                    done();
                });
        });
    });

    describe('/entityService/deleteEntity', () => {
        let id: string;
        const url = '/entityService/deleteEntity';

        beforeAll(async () => {
            return request(server)
                .post('/entityService/addEntity')
                .set('Accept', 'application/json')
                .send({ model, entity: { name: 'Westbrook', account: 'westbrook520' } })
                .then((res) => {
                    id = res.body._id;
                });
        });

        it('Case: Normal', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, id })
                .expect(200)
                .end((err, res) => {
                    // Will return { ok: 1 }
                    expect(res.body.ok).toBe(1);
                    done();
                });
        });
    });

    describe('/entityService/deleteEntities', () => {
        let ids: string[] = [];
        const url = '/entityService/deleteEntities';
        const entities = [
            { name: 'Lebron', account: 'lebron520', age: 34 },
            { name: 'Wade', account: 'wade520', age: 37 },
            { name: 'Bosh', account: 'bosh520', age: 34 },
            { name: 'Luka', account: 'luka520', age: 19 }
        ];

        beforeEach(async () => {
            return request(server)
                .post('/entityService/addEntities')
                .set('Accept', 'application/json')
                .send({ model, entities })
                .then((res) => {
                    ids = res.body._ids;
                });
        });

        afterEach(async () => {
            if (ids) {
                return deleteByID(server, ids, model);
            }
        });

        it('Case: Delete entities by IDs', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, ids })
                .expect(200)
                .end((err, res) => {
                    // Will return { n: 4, ok: 1 }
                    expect(res.body.ok).toBe(1);
                    expect(res.body.n).toBe(4);
                    done();
                });
        });

        it('Case: Delete entities by filter', (done) => {
            return request(server)
                .post(url)
                .set('Accept', 'application/json')
                .send({ model, filter: { field: 'age', match: 'EQ', value: 34 } })
                .expect(200)
                .end((err, res) => {
                    // Will return { n: 2, ok: 1 }
                    expect(res.body.ok).toBe(1);
                    expect(res.body.n).toBe(2);
                    done();
                });
        });
    });
});
