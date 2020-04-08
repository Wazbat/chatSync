require('@google-cloud/debug-agent').start();
console.log('Starting new instance!');
const syncService = require('./services/mainService');
const discordService = require('./services/chats/discordService');

syncService.init();


const fastify = require('fastify')();

// Declare a route
fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
});
fastify.get('/server/:id', async (request, reply) => {
    await discordService.ready;
    let data;
    try {
      data = discordService.getGuildData(request.params.id);
    } catch (e) {
        console.error(e);
        return e.message || e;
    }
    return data;
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
