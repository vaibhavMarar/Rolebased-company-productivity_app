# Quick Start Guide - MongoDB Integration

## Quick Setup (5 minutes)

### 1. Install MongoDB
- Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- Install [MongoDB Compass](https://www.mongodb.com/products/compass) (GUI tool)

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Create .env File
Create `.env` file in `backend` directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/calendar_app
JWT_SECRET=your-secret-key-change-in-production
```

### 4. Start MongoDB
- **Windows**: MongoDB starts automatically as a service
- **macOS**: `brew services start mongodb-community`
- **Linux**: `sudo systemctl start mongod`

### 5. Verify MongoDB is Running
- Open MongoDB Compass
- Connect to: `mongodb://localhost:27017`
- If connected successfully, you're good to go!

### 6. Seed Sample Data (Optional)
```bash
npm run seed
```

### 7. Start Backend Server
```bash
npm start
```

You should see:
```
MongoDB Connected: localhost
Database: calendar_app
Server running on http://localhost:3000
```

### 8. Verify in MongoDB Compass
- Refresh MongoDB Compass
- Navigate to `calendar_app` database
- Check `tasks` and `meetings` collections

## That's it! 🎉

Your backend is now using MongoDB for persistent data storage.

For detailed setup instructions, see [MONGODB_SETUP.md](./MONGODB_SETUP.md)

