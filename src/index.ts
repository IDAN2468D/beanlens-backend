import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase, getDb } from './utils/db.js';
import authRoutes from './routes/auth.js';
import mailRoutes from './routes/mail.js';
import { sendEmail } from './utils/mailer.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/mail', mailRoutes);

// Initialize DB connection
connectToDatabase().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'BeanLens Backend is running with Native MongoDB' });
});

app.get('/users/profile', async (req: Request, res: Response) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const db = getDb();
        const user = await db.collection('User').findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            rank: user.rank,
            scans: user.scans || 0,
            points: user.points || 0,
            avatarUrl: user.avatarUrl
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.post('/users/update-stats', async (req: Request, res: Response) => {
    try {
        const { email, scans, points } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const db = getDb();

        // Atomically increment stats and get the updated user
        const result = await db.collection('User').findOneAndUpdate(
            { email },
            {
                $inc: {
                    scans: scans || 0,
                    points: points || 0
                },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result;
        let newRank = user.rank || 'טירון קפה';
        const totalScans = user.scans || 0;

        // Calculate Rank based on milestones
        if (totalScans >= 30) newRank = 'מאסטר BeanLens';
        else if (totalScans >= 15) newRank = 'מומחה קפה';
        else if (totalScans >= 5) newRank = 'חובב קפה';
        else newRank = 'טירון קפה';

        // Update rank if it changed
        if (newRank !== user.rank) {
            await db.collection('User').updateOne(
                { email },
                { $set: { rank: newRank } }
            );
        }

        res.json({
            message: 'Stats updated successfully',
            scans: user.scans,
            points: user.points,
            rank: newRank
        });
    } catch (error) {
        console.error('Update Stats Error:', error);
        res.status(500).json({ error: 'Failed to update stats' });
    }
});

app.get('/users', async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const users = await db.collection('User').find({}, {
            projection: { _id: 1, email: 1, name: 1, role: 1 }
        }).toArray();

        // Map _id to id for consistency if needed
        const formattedUsers = users.map(u => ({ ...u, id: u._id }));
        res.json(formattedUsers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Coffee History Endpoints
app.post('/users/history', async (req: Request, res: Response) => {
    console.log('--- Received POST /users/history ---');
    try {
        const { email, coffee } = req.body;
        console.log('Email:', email);
        console.log('Coffee:', coffee?.brand);

        if (!email || !coffee) {
            console.log('Validation failed: Missing email or coffee');
            return res.status(400).json({ error: 'Email and coffee data are required' });
        }

        const db = getDb();
        const scanData = {
            ...coffee,
            userEmail: email,
            createdAt: new Date()
        };

        const result = await db.collection('Scans').insertOne(scanData);
        console.log('Insert Result:', result.acknowledged);

        res.json({ message: 'Scan history saved successfully', scan: scanData });

        // Send scan profile email in background
        sendEmail(
            email,
            `פרופיל קפה חדש זוהה: ${coffee.brand} ☕`,
            `
            <p>היי, הנה סיכום הסריקה האחרונה שלך המערכת זיהתה את הקפה שלך בהצלחה!</p>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; border-right: 5px solid #6F4E37;">
                <p><strong>☕ מותג:</strong> ${coffee.brand}</p>
                <p><strong>🌍 ארץ מקור:</strong> ${coffee.originCountry}</p>
                <p><strong>👅 פרופיל טעמים:</strong> ${coffee.notes}</p>
            </div>
            <p>המשך חלייה מהנה! תוכל לראות את הפירוט המלא בהיסטוריה באפליקציה.</p>
            <center><a href="#" class="button">צפה בפרטים המלאים</a></center>
            `,
            'ניתוח קפה הושלם!'
        ).catch(err => console.error('Failed to send scan email:', err));

    } catch (error) {
        console.error('Save History Error:', error);
        res.status(500).json({ error: 'Failed to save history' });
    }
});

app.get('/users/history', async (req: Request, res: Response) => {
    console.log('--- Received GET /users/history ---');
    try {
        const { email } = req.query;
        console.log('Email:', email);

        if (!email) {
            console.log('Validation failed: Missing email');
            return res.status(400).json({ error: 'Email is required' });
        }

        const db = getDb();
        const history = await db.collection('Scans')
            .find({ userEmail: email })
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();

        console.log(`Found ${history.length} scans`);

        res.json(history);
    } catch (error) {
        console.error('Fetch History Error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.delete('/users/history/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { email } = req.query;
        if (!id || !email) return res.status(400).json({ error: 'ID and Email are required' });

        const db = getDb();
        // In a real app, we'd use ObjectId if it's the mongo _id
        // But here we use our custom id
        await db.collection('Scans').deleteOne({ id: id, userEmail: email });

        res.json({ message: 'Scan deleted successfully' });

        // Send deletion notification
        sendEmail(
            email as string,
            'פריט נמחק מהיסטוריית הקפה שלך 🗑️',
            `
            <p>רצינו לעדכן שבוצעה מחיקה של סריקת קפה מהחשבון שלך.</p>
            <p>שם לב: פעולה זו היא סופית ולא ניתן לשחזר את נתוני הסריקה שנמחקו.</p>
            <p>אם המחיקה בוצעה על ידך, אפשר פשוט להתעלם מהמייל הזה.</p>
            `,
            'עדכון על מחיקת סריקה'
        ).catch(err => console.error('Failed to send deletion notification:', err));
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete history item' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (Listening on all interfaces)`);
});
