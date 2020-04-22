import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import AppModule from '../src/app.module';
import deleteByID from './utils';

describe('Entity API (e2e)', () => {
  let server: any;
  const model = 'user';
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  describe('/entityService/addEntity', () => {
    const url = '/entityService/addEntity';

    it('Case: Normal', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({
            model,
            entity: { name: 'admin' },
          })
          .expect(201)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body._id).toBeDefined();
            deleteByID(server, res.body._id, model);
            resolve();
          });
      });
    });
  });

  describe('/entityService/addEntities', () => {
    const url = '/entityService/addEntities';

    it('Case: Normal', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({
            model,
            entities: [
              {
                name: 'Curry',
              },
              {
                name: 'Irving',
              },
            ],
          })
          .expect(201)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body._ids).toBeDefined();
            expect(res.body._ids.length).toBe(2);

            deleteByID(server, res.body._ids, model);
            resolve();
          });
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
        .then(res => {
          id = res.body._id;
          return 0;
        });
    });

    afterAll(async () => {
      return deleteByID(server, id, model);
    });

    it('Case: Normal', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, id })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entity).toBeDefined();
            expect(res.body.entity.name).toBe('T-Mac');
            expect(res.body.entity.createdAt).toBeDefined();
            expect(res.body.entity.updatedAt).toBeDefined();
            resolve();
          });
      });
    });

    it('Case: Return specific fields', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, id, retFields: ['account'] })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entity._id).toBeDefined();
            expect(res.body.entity.account).toBeDefined();
            expect(res.body.entity.name).toBeUndefined();
            resolve();
          });
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
      { name: 'Luka', account: 'luka520', age: 19 },
    ];

    beforeAll(async () => {
      return request(server)
        .post('/entityService/addEntities')
        .set('Accept', 'application/json')
        .send({ model, entities })
        .then(res => {
          ids = res.body._ids;
          return 0;
        });
    });

    afterAll(async () => {
      return deleteByID(server, ids, model);
    });

    it('Case: Get entities by ids - Normal', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, ids })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entities.length).toBe(entities.length);
            resolve();
          });
      });
    });

    it('Case: Get entities by ids - Return specific fields', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, ids, retFields: ['account'] })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entities.length).toBe(entities.length);
            expect(res.body.entities[0]._id).toBeDefined();
            expect(res.body.entities[0].account).toBeDefined();
            expect(res.body.entities[0].name).toBeUndefined();
            resolve();
          });
      });
    });

    it('Case: Get entities by ids - Sortable - asc', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, ids, sort: { age: 'asc' } })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entities[0].name).toBe('Luka');
            expect(res.body.entities[3].name).toBe('Wade');
            resolve();
          });
      });
    });

    it('Case: Get entities by ids - Sortable - desc', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, ids, sort: { age: 'desc' } })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entities[0].name).toBe('Wade');
            expect(res.body.entities[3].name).toBe('Luka');
            resolve();
          });
      });
    });

    it('Case: Get entities by filter - Return specific fields', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({
            model,
            retFields: ['account'],
            filter: { field: 'age', match: 'GT', value: 35 },
          })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entities.length).toBe(1);
            expect(res.body.entities[0]._id).toBeDefined();
            expect(res.body.entities[0].account).toBeDefined();
            expect(res.body.entities[0].name).toBeUndefined();
            resolve();
          });
      });
    });

    it('Case: Get entities by filter - Sortable - asc', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({
            model,
            filter: { field: 'age', match: 'LT', value: 40 },
            sort: { age: 'asc' },
          })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entities[0].name).toBe('Luka');
            expect(res.body.entities[3].name).toBe('Wade');
            resolve();
          });
      });
    });

    it('Case: Get entities by filter - Sortable - desc', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({
            model,
            filter: { field: 'age', match: 'LT', value: 40 },
            sort: { age: 'desc' },
          })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entities[0].name).toBe('Wade');
            expect(res.body.entities[3].name).toBe('Luka');
            resolve();
          });
      });
    });

    it('Case: Get entities by filter - With EQ', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, filter: { field: 'age', match: 'EQ', value: 34 } })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entities.length).toBe(2);
            resolve();
          });
      });
    });

    it('Case: Get entities by filter - With LT', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, filter: { field: 'age', match: 'LT', value: 40 } })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entities.length).toBe(4);
            resolve();
          });
      });
    });

    it('Case: Get entities by filter - With GT', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, filter: { field: 'age', match: 'GT', value: 34 } })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entities.length).toBe(1);
            expect(res.body.entities[0].name).toBe('Wade');
            resolve();
          });
      });
    });

    it('Case: Get entities by filter - With LTE', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, filter: { field: 'age', match: 'LTE', value: 34 } })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.entities.length).toBe(3);
            resolve();
          });
      });
    });

    it('Case: Get entities by filter - With GTE', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, filter: { field: 'age', match: 'GTE', value: 36 } })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.entities.length).toBe(1);
            expect(res.body.entities[0].name).toBe('Wade');
            resolve();
          });
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
        .then(res => {
          id = res.body._id;
          return 0;
        });
    });

    afterAll(async () => {
      return deleteByID(server, id, model);
    });

    it('Case: Normal', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, id, value: { account: 'westbrook521' } })
          .expect(200)
          .end((_err, res) => {
            expect(res.body.ok).toBe(1);
            expect(res.body.value.account).toBe('westbrook521');
            resolve();
          });
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
      { name: 'Luka', account: 'luka520', age: 19 },
    ];

    beforeAll(async () => {
      return request(server)
        .post('/entityService/addEntities')
        .set('Accept', 'application/json')
        .send({ model, entities })
        .then(res => {
          ids = res.body._ids;
          return 0;
        });
    });

    afterAll(async () => {
      return deleteByID(server, ids, model);
    });

    it('Case: Normal', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({
            model,
            filter: { field: 'age', match: 'LTE', value: 34 },
            value: { evaluation: 'Old' },
          })
          .expect(200)
          .end((_err, res) => {
            // Will return: {"n":3,"nModified":3,"ok":1}
            expect(res.body.ok).toBe(1);
            // n means how many items satisfy the filter
            expect(res.body.n).toBe(3);
            // nModified means how many items has been modified
            expect(res.body.nModified).toBe(3);
            resolve();
          });
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
        .then(res => {
          id = res.body._id;
          return 0;
        });
    });

    it('Case: Normal', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, id })
          .expect(200)
          .end((_err, res) => {
            // Will return { ok: 1 }
            expect(res.body.ok).toBe(1);
            resolve();
          });
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
      { name: 'Luka', account: 'luka520', age: 19 },
    ];

    beforeEach(async () => {
      return request(server)
        .post('/entityService/addEntities')
        .set('Accept', 'application/json')
        .send({ model, entities })
        .then(res => {
          ids = res.body._ids;
          return 0;
        });
    });

    afterEach(() => {
      if (ids) {
        return deleteByID(server, ids, model);
      }
      return null;
    });

    it('Case: Delete entities by IDs', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, ids })
          .expect(200)
          .end((_err, res) => {
            // Will return { n: 4, ok: 1 }
            expect(res.body.ok).toBe(1);
            expect(res.body.n).toBe(4);
            resolve();
          });
      });
    });

    it('Case: Delete entities by filter', () => {
      return new Promise(resolve => {
        return request(server)
          .post(url)
          .set('Accept', 'application/json')
          .send({ model, filter: { field: 'age', match: 'EQ', value: 34 } })
          .expect(200)
          .end((_err, res) => {
            // Will return { n: 2, ok: 1 }
            expect(res.body.ok).toBe(1);
            expect(res.body.n).toBe(2);
            resolve();
          });
      });
    });
  });
});
