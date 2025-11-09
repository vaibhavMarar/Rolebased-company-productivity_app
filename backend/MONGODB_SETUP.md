# MongoDB Integration Setup Guide

This guide will walk you through setting up MongoDB for the Calendar App backend using MongoDB Compass.

## Prerequisites

1. **MongoDB Community Server** - Download and install from [MongoDB Website](https://www.mongodb.com/try/download/community)
2. **MongoDB Compass** - Download from [MongoDB Compass](https://www.mongodb.com/products/compass)
3. **Node.js** - Already installed (required for the backend)

## Step 1: Install MongoDB Community Server

### Windows:
1. Download MongoDB Community Server from the official website
2. Run the installer
3. Choose "Complete" installation
4. Install MongoDB as a Windows Service (recommended)
5. Install MongoDB Compass (GUI tool) - checked by default
6. Complete the installation

### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux:
Follow the installation guide for your distribution on MongoDB's website.

## Step 2: Verify MongoDB Installation

1. **Start MongoDB Service:**
   - **Windows**: MongoDB should start automatically as a Windows Service
   - **macOS/Linux**: Run `brew services start mongodb-community` or `sudo systemctl start mongod`

2. **Verify MongoDB is running:**
   - Open MongoDB Compass
   - It should automatically connect to `mongodb://localhost:27017`
   - If it connects successfully, MongoDB is running!

## Step 3: Install Dependencies

Navigate to the backend directory and install the required packages:

```bash
cd backend
npm install
```

This will install:
- `mongoose` - MongoDB ODM (Object Document Mapper)
- Other existing dependencies

## Step 4: Create .env File

Create a `.env` file in the `backend` directory:

```bash
# In backend directory
touch .env
```

Add the following content to `.env`:

```env
# Server Port
PORT=3000

# MongoDB Connection String
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/calendar_app

# JWT Secret Key (Change this in production)
JWT_SECRET=your-secret-key-change-in-production
```

### MongoDB Connection String Options:

1. **Local MongoDB (Default):**
   ```
   MONGODB_URI=mongodb://localhost:27017/calendar_app
   ```

2. **MongoDB with Authentication:**
   ```
   MONGODB_URI=mongodb://username:password@localhost:27017/calendar_app?authSource=admin
   ```

3. **MongoDB Atlas (Cloud):**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/calendar_app?retryWrites=true&w=majority
   ```

## Step 5: Start MongoDB (if not running)

### Windows:
MongoDB should start automatically. If not:
1. Open Services (services.msc)
2. Find "MongoDB" service
3. Right-click and select "Start"

### macOS/Linux:
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

## Step 6: Connect Using MongoDB Compass

1. **Open MongoDB Compass**
2. **Connect to local MongoDB:**
   - Connection string: `mongodb://localhost:27017`
   - Click "Connect"
3. **Verify Connection:**
   - You should see the default databases: `admin`, `config`, `local`
   - The `calendar_app` database will be created automatically when you run the application

## Step 7: Seed Initial Data (Optional)

To populate the database with sample tasks and meetings:

```bash
npm run seed
```

This will:
- Clear any existing data
- Create sample tasks and meetings for the current week
- Display confirmation messages

## Step 8: Start the Backend Server

```bash
npm start
```

You should see:
```
MongoDB Connected: localhost
Database: calendar_app
Server running on http://localhost:3000
```

## Step 9: Verify in MongoDB Compass

1. **Refresh MongoDB Compass**
2. **Navigate to `calendar_app` database**
3. **Check Collections:**
   - `tasks` - Contains all tasks
   - `meetings` - Contains all meetings
4. **View Documents:**
   - Click on `tasks` collection to see task documents
   - Click on `meetings` collection to see meeting documents

## Database Structure

### Tasks Collection
Each task document has:
```json
{
  "_id": ObjectId("..."),
  "title": "Complete project proposal",
  "date": "2024-01-15",
  "day": "Monday",
  "time": "09:00",
  "completed": false,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### Meetings Collection
Each meeting document has:
```json
{
  "_id": ObjectId("..."),
  "title": "Team meeting",
  "date": "2024-01-15",
  "day": "Monday",
  "time": "10:00",
  "completed": false,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongoDB connection error: connect ECONNREFUSED`

**Solution:**
1. Check if MongoDB service is running
2. Verify MongoDB is listening on port 27017
3. Check connection string in `.env` file

### Port Already in Use

**Error:** `Port 27017 already in use`

**Solution:**
1. Check if another MongoDB instance is running
2. Stop other MongoDB instances
3. Or change MongoDB port in MongoDB configuration

### Authentication Failed

**Error:** `Authentication failed`

**Solution:**
1. Verify username and password in connection string
2. Check if user has proper permissions
3. Verify `authSource` parameter in connection string

### Database Not Found

**Note:** The database `calendar_app` will be created automatically when you first run the application. You don't need to create it manually.

## Using MongoDB Atlas (Cloud)

If you want to use MongoDB Atlas instead of local MongoDB:

1. **Create MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create a Cluster:**
   - Create a free M0 cluster
   - Choose a cloud provider and region

3. **Configure Database Access:**
   - Go to "Database Access"
   - Create a database user
   - Set username and password

4. **Configure Network Access:**
   - Go to "Network Access"
   - Add IP address: `0.0.0.0/0` (for development)
   - Or add your specific IP address

5. **Get Connection String:**
   - Go to "Clusters"
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string

6. **Update .env File:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/calendar_app?retryWrites=true&w=majority
   ```
   Replace `username` and `password` with your database user credentials.

## API Endpoints

All endpoints remain the same. The backend now uses MongoDB instead of in-memory storage:

- `GET /api/tasks` - Get all tasks from MongoDB
- `POST /api/tasks` - Create new task in MongoDB
- `PUT /api/tasks/:id` - Update task in MongoDB
- `DELETE /api/tasks/:id` - Delete task from MongoDB
- `POST /api/tasks/:id/toggle` - Toggle task completion

Same for meetings endpoints.

## Benefits of MongoDB Integration

1. **Persistent Storage:** Data persists between server restarts
2. **Scalability:** Can handle large amounts of data
3. **Querying:** Advanced querying capabilities
4. **Validation:** Schema validation with Mongoose
5. **Relationships:** Can easily add user relationships in the future
6. **Backup:** Easy to backup and restore data

## Next Steps

1. Test all API endpoints
2. Verify data persistence (restart server and check data)
3. Add user authentication with MongoDB (store users in database)
4. Add data relationships (tasks/meetings belong to users)
5. Implement data pagination for large datasets

## Support

If you encounter any issues:
1. Check MongoDB logs
2. Verify connection string
3. Check MongoDB Compass for connection status
4. Review server console for error messages

