import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/beanlens';
const client = new MongoClient(uri);

async function seed() {
    try {
        await client.connect();
        const db = client.db();

        // Clear existing users
        await db.collection('User').deleteMany({});

        // Add a demo user
        const result = await db.collection('User').insertOne({
            email: 'aharon@coffee-expert.com',
            name: 'אהרון כהן',
            password: 'hashed-password-here',
            role: 'USER',
            rank: 'מומחה קפה (Q Grader)',
            scans: 128,
            points: 4850,
            avatarUrl: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('✅ Base user seeded with ID:', result.insertedId);

        // Add some mock coffee sessions
        await db.collection('CoffeeSession').deleteMany({});
        await db.collection('CoffeeSession').insertMany([
            {
                brand: 'Lavazza Qualità Oro',
                notes: 'שוקולד ודבש, קלייה בינונית',
                description: 'קפה קלאסי עם גוף מלא וסיומת מתוקה.',
                createdAt: new Date()
            },
            {
                brand: 'Nespresso Arpeggio',
                notes: 'פירות יער וקקאו, קלייה כהה',
                description: 'אספרסו עוצמתי עם ארומה דומיננטית.',
                createdAt: new Date()
            }
        ]);

        console.log('✅ Mock data seeded successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

seed();
