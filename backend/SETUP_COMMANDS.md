# MongoDB Setup - Command Reference

## Step-by-Step Commands

### 1. Install MongoDB (Choose your OS)

#### Windows:
- Download from: https://www.mongodb.com/try/download/community
- Run installer and follow wizard
- MongoDB will start automatically as a Windows Service

#### macOS:
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update packages
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Install MongoDB Compass (GUI Tool)
- Download from: https://www.mongodb.com/products/compass
- Install and open
- Connect to: `mongodb://localhost:27017`

### 3. Navigate to Backend Directory
```bash
cd Calendar_app/backend
```

### 4. Install Node.js Dependencies
```bash
npm install
```

### 5. Create .env File

#### Windows (PowerShell):
```powershell
# Create .env file
@"
PORT=3000
MONGODB_URI=mongodb://localhost:27017/calendar_app
JWT_SECRET=your-secret-key-change-in-production
"@ | Out-File -FilePath .env -Encoding utf8
```

#### macOS/Linux:
```bash
# Create .env file
cat > .env << EOF
PORT=3000
MONGODB_URI=mongodb://localhost:27017/calendar_app
JWT_SECRET=your-secret-key-change-in-production
EOF
```

Or manually create `.env` file with:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/calendar_app
JWT_SECRET=your-secret-key-change-in-production
```

### 6. Verify MongoDB is Running

#### Check MongoDB Status:

**Windows:**
```powershell
# Check MongoDB service
Get-Service MongoDB
```

**macOS:**
```bash
brew services list | grep mongodb
```

**Linux:**
```bash
sudo systemctl status mongod
```

#### Test MongoDB Connection:
```bash
# Open MongoDB Compass and connect to:
mongodb://localhost:27017
```

### 7. Seed Sample Data (Optional)
```bash
npm run seed
```

Expected output:
```
Connected to MongoDB
Cleared existing data
Inserted 8 tasks
Inserted 8 meetings
Data seeded successfully!
```

### 8. Start Backend Server
```bash
npm start
```

Expected output:
```
MongoDB Connected: localhost
Database: calendar_app
Server running on http://localhost:3000
```

### 9. Verify in MongoDB Compass

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Click on `calendar_app` database
4. Check `tasks` and `meetings` collections
5. View documents in each collection

## Troubleshooting Commands

### Check MongoDB Port
```bash
# Windows
netstat -ano | findstr :27017

# macOS/Linux
lsof -i :27017
```

### Restart MongoDB

**Windows:**
```powershell
# Restart MongoDB service
Restart-Service MongoDB
```

**macOS:**
```bash
brew services restart mongodb-community
```

**Linux:**
```bash
sudo systemctl restart mongod
```

### Stop MongoDB

**Windows:**
```powershell
Stop-Service MongoDB
```

**macOS:**
```bash
brew services stop mongodb-community
```

**Linux:**
```bash
sudo systemctl stop mongod
```

### View MongoDB Logs

**Windows:**
```powershell
# MongoDB logs are usually in:
# C:\Program Files\MongoDB\Server\<version>\log\mongod.log
```

**macOS:**
```bash
# View logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

**Linux:**
```bash
sudo tail -f /var/log/mongodb/mongod.log
```

### Clear Database (Development Only)
```bash
# Connect to MongoDB shell
mongosh

# Use calendar_app database
use calendar_app

# Drop collections
db.tasks.drop()
db.meetings.drop()

# Exit
exit
```

Or use MongoDB Compass:
1. Connect to database
2. Right-click on collection
3. Select "Drop Collection"

## Quick Test

### Test API Endpoints

```bash
# 1. Login (get token)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# 2. Get tasks (replace TOKEN with actual token)
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer TOKEN"

# 3. Get meetings (replace TOKEN with actual token)
curl http://localhost:3000/api/meetings \
  -H "Authorization: Bearer TOKEN"
```

## Environment Variables Reference

```env
# Server Configuration
PORT=3000

# MongoDB Connection
# Local: mongodb://localhost:27017/calendar_app
# With Auth: mongodb://user:pass@localhost:27017/calendar_app?authSource=admin
# Atlas: mongodb+srv://user:pass@cluster.mongodb.net/calendar_app
MONGODB_URI=mongodb://localhost:27017/calendar_app

# JWT Secret (Change in production!)
JWT_SECRET=your-secret-key-change-in-production
```

## Common Issues

### Issue: MongoDB connection refused
```bash
# Solution: Start MongoDB service
# Windows: Start-Service MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Issue: Port already in use
```bash
# Solution: Check what's using port 27017
# Windows: netstat -ano | findstr :27017
# macOS/Linux: lsof -i :27017
```

### Issue: Module not found
```bash
# Solution: Reinstall dependencies
npm install
```

### Issue: Cannot connect to MongoDB
```bash
# Solution: Check MongoDB is running and connection string is correct
# Verify in MongoDB Compass: mongodb://localhost:27017
```

## Next Steps

1. ✅ MongoDB installed and running
2. ✅ Dependencies installed
3. ✅ .env file created
4. ✅ Database seeded (optional)
5. ✅ Backend server running
6. ✅ Verified in MongoDB Compass

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Compass Guide](https://docs.mongodb.com/compass/)
- [MongoDB Atlas (Cloud)](https://www.mongodb.com/cloud/atlas)

