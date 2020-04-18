import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { deleteByID } from './utils';

describe('User API (e2e)', () => {
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

    describe('/user/register', () => {
        it('Case: Normal', (done) => {
            return request(server)
                .post('/user/register')
                .set('Accept', 'application/json')
                .send({ account: 'admin', password: 'admin' })
                .expect(201)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body._id).toBeDefined();
                    deleteByID(server, res.body._id, model);
                    done();
                });
        });
    });

    describe('/user/login', () => {
        let id: string;

        beforeAll(async () => {
            return request(server)
                .post('/user/register')
                .set('Accept', 'application/json')
                .send({ account: 'admin', password: 'admin' })
                .then((res) => {
                    id = res.body._id;
                });
        });

        afterAll(async () => {
            return deleteByID(server, id, model);
        });

        it('Case: Login success', (done) => {
            return request(server)
                .post('/user/login')
                .set('Accept', 'application/json')
                .send({ account: 'admin', password: 'admin' })
                .expect(200)
                .end((err, res) => {
                    expect(res.body.ok).toBe(1);
                    expect(res.body.token).toBeDefined();
                    done();
                });
        });

        it('Case: Login fail - Wrong password', (done) => {
            return request(server)
                .post('/user/login')
                .set('Accept', 'application/json')
                .send({ account: 'admin', password: 'aaa' })
                .expect(401)
                .end((err, res) => {
                    expect(res.body.message).toBe('Wrong password.');
                    done();
                });
        });

        it('Case: Login fail - Account not find', (done) => {
            return request(server)
                .post('/user/login')
                .set('Accept', 'application/json')
                .send({ account: 'aaa', password: 'aaa' })
                .expect(401)
                .end((err, res) => {
                    expect(res.body.message).toBe("Couldn't find this account.");
                    done();
                });
        });
    });
});
