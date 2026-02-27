import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../utils/db.js';
import { sendEmail } from '../utils/mailer.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = registerSchema.parse(req.body);
        const db = getDb();

        const existingUser = await db.collection('User').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'משתמש עם אימייל זה כבר קיים' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            email,
            password: hashedPassword,
            name,
            role: 'USER',
            rank: 'טירון קפה',
            scans: 0,
            points: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('User').insertOne(newUser);
        const token = jwt.sign({ userId: result.insertedId }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                id: result.insertedId,
                email,
                name,
                role: 'USER',
                rank: 'טירון קפה'
            }
        });

        // Send welcome email in background
        sendEmail(
            email,
            'ברוכים הבאים ל-BeanLens! ☕',
            `
            <p>שלום <strong>${name}</strong>!</p>
            <p>תודה שהצטרפת לקהילת חובבי הקפה שלנו. מעכשיו תוכל לסרוק ולנהל את היסטוריית הקפה שלך בצורה חכמה.</p>
            <p>אנחנו כאן כדי לעזור לך למצוא את כוס הקפה המושלמת בכל פעם מחדש.</p>
            <center><a href="#" class="button">התחל לסרוק עכשיו</a></center>
            `,
            'ברוכים הבאים למשפחה!'
        ).catch(err => console.error('Failed to send welcome email:', err));

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues[0].message });
        }
        res.status(500).json({ error: 'נכשלה ההרשמה למערכת' });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const db = getDb();

        const user = await db.collection('User').findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'אימייל או סיסמה שגויים' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ error: 'אימייל או סיסמה שגויים' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                rank: user.rank,
                scans: user.scans,
                points: user.points
            }
        });

        // Send login notification email in background
        const now = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
        sendEmail(
            user.email,
            'התחברות חדשה לחשבון ה-BeanLens שלך ☕',
            `
            <p>זיהינו התחברות חדשה לחשבון שלך ב-BeanLens.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>זמן:</strong> ${now}</p>
                <p style="margin: 5px 0;"><strong>משתמש:</strong> ${user.name}</p>
            </div>
            <p>אם זה היית אתה, הכל מצוין! אפשר להמשיך לסרוק פולי קפה בכיף.</p>
            <p style="font-size: 13px; color: #666;">אם לא ביצעת את הפעולה הזו, מומלץ לאפס את הסיסמה שלך בהקדם כדי לשמור על אבטחת החשבון.</p>
            `,
            'זיהינו התחברות חדשה'
        ).catch(err => console.error('Failed to send login notification email:', err));
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'קלט לא תקין' });
        }
        res.status(500).json({ error: 'נכשלה ההתחברות למערכת' });
    }
});

export default router;
