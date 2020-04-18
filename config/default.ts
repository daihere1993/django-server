export default {
    Path: {
        modelDef: process.cwd() + '/definition',
        distModelDef: process.cwd() + '/dist/definition'
    },
    Mongo: {
        server: 'mongodb://localhost/test',
        SALT_ROUNDS: 10,
        JWT_CERT: 'JWT_CERT'
    }
};
