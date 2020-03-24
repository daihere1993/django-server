export default {
    Path: {
        rootDef: process.cwd() + '/definition',
        modelDef: process.cwd() + '/definition/models',
        distModelDef: process.cwd() + '/dist/definition/models'
    },
    Mongo: {
        server: 'mongodb://localhost/test',
        SALT_ROUNDS: 10,
        JWT_CERT: 'JWT_CERT'
    }
};
