// TODO Fix cloud debug so I can actually use it instead of relying on logging
require('@google-cloud/debug-agent').start();
console.log('Starting new instance!');
const syncService = require('./services/mainService');
const discordService = require('./services/chats/discordService');

syncService.init().catch(err => {
    console.error('Error starting sync service');
    console.error(err);
});


const fastify = require('fastify')();

// Declare a route
fastify.get('/', async (request, reply) => {
    return { status: 'ok' }
});
fastify.get('/server/:id', async (request, reply) => {
    if (!discordService.client.readyAt) return {error: 'discord service not live'};
    let data;
    try {
      data = discordService.getGuildData(request.params.id);
    } catch (e) {
        console.error(e);
        // Rework this to work with different codes and errors
        return {error: e.message || e};
    }
    return data;
});

fastify.get('/_ah/warmup', (req, res) => {
    console.log('Got warmup request');
    res.code(200).send({status: 'ok'});
});

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
