require('@google-cloud/debug-agent').start();

const syncService = require('./services/mainService');

syncService.init();

// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })

// Declare a route
fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
});

fastify.get('/_ah/warmup', (req, res) => {
    console.log('Got warmup request');
    return { message: 'Warmup got' }
})

// Run the server!
const start = async () => {
    try {
        await fastify.listen(process.env.PORT || 8080);
        fastify.log.info(`server listening on ${fastify.server.address().port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1)
    }
};
start();
