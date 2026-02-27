# ☕ BeanLens Backend - AI Coffee Scanner API

The powerhouse behind BeanLens, an advanced AI coffee analysis and tracking application. Built with Node.js, TypeScript, and Native MongoDB.

## 🚀 Features
- **User Authentication**: Secure JWT-based registration and login system.
- **Coffee History**: Full CRUD for tracking scanned coffees.
- **AI Stats**: Automated tracking of coffee scans, points, and user ranks (from "Coffee Rookie" to "BeanLens Master").
- **Caffeine Tracking**: Real-time calculation of daily caffeine intake.
- **Smart Notifications**: Automated email notifications via Nodemailer for new scans and profile changes.
- **Health Check**: Native integrated health monitoring endpoint.

## 🛠️ Tech Stack
- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Native Driver)
- **Security**: JWT (JSON Web Tokens), Bcrypt.js
- **Validation**: Zod
- **Email**: Nodemailer

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/IDAN2468D/beanlens-backend.git
   cd beanlens-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   DATABASE_URL="your_mongodb_atlas_url"
   JWT_SECRET="your_secret_key"
   
   # Email Config (Gmail example)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM="BeanLens <your_email@gmail.com>"
   ```

4. **Run in development mode**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## 🌐 API Endpoints

### Auth
- `POST /auth/register` - Create new account
- `POST /auth/login` - Authenticate user

### Profile & Stats
- `GET /users/profile?email=...` - Get user stats and rank
- `POST /users/update-stats` - Increment scan counts and points

### History
- `GET /users/history?email=...` - Retrieve past scans
- `POST /users/history` - Save a new coffee scan
- `DELETE /users/history/:id` - Remove a scan from history

## 🚢 Deployment (Render.com)
1. **Build Command**: `npm install && npm run build`
2. **Start Command**: `npm start`
3. **Environment**: Ensure all `.env` variables are added in the Render dashboard.

---
Developed by **IDAN2468D** & **Antigravity AI**
