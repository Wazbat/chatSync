
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');


class SecretService {
    constructor() {
        this.secretClient = new SecretManagerServiceClient();
    }
    async getSecret(name) {
        const [version] = await this.secretClient.accessSecretVersion({
            name,
        });
        return version.payload.data.toString('utf8');
    }
}

module.exports = new SecretService();
