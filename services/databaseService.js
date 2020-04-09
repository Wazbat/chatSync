const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();

class DatabaseService {
    async getGroups(source, chatId) {
        try {
            const docs = await firestore.collection('channelMaps').where(source, 'array-contains', chatId.toString()).get();
            const groups = [];
            // For some reason I can't use .map on these documents
            console.log(`Got ${docs.size} groups for chat source ${source} ID: ${chatId}`);
            docs.forEach(doc =>{
                    const group = doc.data();
                    console.log(`Pushing group ${JSON.stringify(group)}`);
                    groups.push(group)
            });
            return groups;
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
            let channels = [];
            // For some reason I can't use .map on these documents
            docs.forEach(doc => {
                const data = doc.data();
                const cytubeChannels = Array.isArray(data.cytube) ? data.cytube : [];
                channels = channels.concat(cytubeChannels);
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
