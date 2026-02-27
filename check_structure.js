
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://idankzm:idankzm2468@cluster0.purdk.mongodb.net/beanlens";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const database = client.db('beanlens');
        const collection = database.collection('Scans');
        const scan = await collection.findOne({ userEmail: 'idankzm@gmail.com' });
        console.log("Full scan structure sample:");
        console.log(JSON.stringify(scan, null, 2));
    } finally {
        await client.close();
    }
}
run().catch(console.dir);
