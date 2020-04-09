const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();

class DatabaseService {
    async getGroups(source, chatId) {
        try {
            const docs = await firestore.collection('channelMaps').where(source, 'array-contains', chatId).get();
            return docs.map(doc => doc.data());
        } catch (e) {
            console.error(`Unable to get channel maps for source: ${source} with id: ${chatId}`);
            console.error(e);
            return [];
        }
    }
    async getCytubeChannels() {
        try {
            // Figure out how to filter by non empty arrays so I don't have to query every single group
            const docs =  await firestore.collection('channelMaps').get();

            const flattened =  docs.map(doc => doc.data()).map(data => data.cytube && Array.isArray(data.cytube) ? data.cytube : []).flat();
            const uniqueSet = new Set(flattened);
            return [...uniqueSet];
        } catch (e) {
            console.error('Error mapping cytube channels');
            console.error(e);
            return [];
        }
    }
}

module.exports = new DatabaseService();
