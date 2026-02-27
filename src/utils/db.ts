import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.DATABASE_URL || '';
let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
    if (client && db) {
        return { client, db };
    }

    client = new MongoClient(uri);
    await client.connect();

    // Extract DB name from URI or use default
    const dbName = uri.split('/').pop()?.split('?')[0] || 'beanlens';
    db = client.db(dbName);

    console.log(`Successfully connected to MongoDB database: ${dbName}`);

    return { client, db };
}

export function getDb(): Db {
    if (!db) {
        throw new Error('Database not initialized. Call connectToDatabase first.');
    }
    return db;
}
