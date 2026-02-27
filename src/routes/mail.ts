import { Router, Request, Response } from 'express';
import { sendEmail } from '../utils/mailer.js';

const router = Router();

// נתיב בדיקה רשמי: GET /mail/test
router.get('/test', async (req: Request, res: Response) => {
    try {
        const targetEmail = (req.query.email as string) || (process.env.SMTP_USER as string);
        console.log(`[Mail Router] Sending test to: ${targetEmail}`);

        await sendEmail(
            targetEmail,
            'בדיקת מערכת BeanLens - Router ☕',
            '<h1>אם קיבלת את זה, ה-Mail Router עובד!</h1>'
        );

        res.json({ success: true, message: `Test email sent to ${targetEmail}` });
    } catch (error) {
        console.error('[Mail Router] Error:', error);
        res.status(500).json({ success: false, error: (error as any).message });
    }
});

export default router;
