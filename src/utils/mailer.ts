import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false // Helps with some network restrictions
    },
    // Enforcement of IPv4 to avoid common Node.js/Windows connection delays
    connectionTimeout: 10000,
    greetingTimeout: 5000,
});

console.log(`[Mailer] Initializing with host: ${process.env.SMTP_HOST}, port: ${process.env.SMTP_PORT}, user: ${process.env.SMTP_USER}`);

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('--- MAILER CONNECTION ERROR ---');
        console.error('Error Code:', (error as any).code);
        console.error('Error Message:', error.message);
        console.error(error);
    } else {
        console.log('--- MAILER IS READY TO SEND EMAILS ---');
    }
});

const getEmailTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }
        .header { background: linear-gradient(135deg, #6F4E37 0%, #3C2A21 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
        .content { padding: 40px; line-height: 1.6; color: #333; text-align: right; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
        .button { display: inline-block; padding: 12px 25px; background-color: #6F4E37; color: white !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        .icon { font-size: 40px; margin-bottom: 10px; display: block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="icon">☕</span>
            <h1>BeanLens</h1>
        </div>
        <div class="content">
            <h2 style="color: #6F4E37; border-bottom: 2px solid #6F4E37; padding-bottom: 10px;">${title}</h2>
            ${content}
        </div>
        <div class="footer">
            © ${new Date().getFullYear()} BeanLens App - כל הזכויות שמורות לחובבי הקפה
        </div>
    </div>
</body>
</html>
`;

export const sendEmail = async (to: string, subject: string, htmlContent: string, title?: string) => {
    try {
        const finalHtml = getEmailTemplate(title || subject, htmlContent);
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            html: finalHtml,
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
