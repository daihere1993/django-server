export default {
    Path: {
        rootDef: process.cwd() + '/test/mock/definition',
        modelDef: process.cwd() + '/test/mock/definition/models',
        distModelDef: process.cwd() + '/dist/definition/models'
    },
    Mongo: {
        server: 'mongodb://localhost/e2e'
    }
};
