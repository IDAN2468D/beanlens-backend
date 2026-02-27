
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://idankzm:idankzm2468@cluster0.purdk.mongodb.net/beanlens";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const database = client.db('beanlens');
        const collection = database.collection('Scans');
        const scans = await collection.find({}).toArray();
        console.log(`Found ${scans.length} scans in total.`);
        scans.forEach((s, i) => {
            console.log(`${i + 1}. User: ${s.userEmail}, Brand: ${s.brand}, Intensities: ${s.intensities ? 'YES' : 'NO'}`);
        });
    } finally {
        await client.close();
    }
}
run().catch(console.dir);
