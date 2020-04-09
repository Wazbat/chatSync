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
            const channels = [];
            // For some reason I can't use .map on these documents
            docs.forEach(doc => {
                const data = doc.data();
                const cytubeChannels = Array.isArray(data.cytube) ? data.cytube : [];
                channels.concat(cytubeChannels);
            });
            const uniqueSet = new Set(channels);
            return [...uniqueSet];
        } catch (e) {
            console.error('Error mapping cytube channels');
            console.error(e);
            return [];
        }
    }
}

module.exports = new DatabaseService();
