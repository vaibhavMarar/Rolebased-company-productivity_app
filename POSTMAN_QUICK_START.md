# Postman Quick Start Guide

## 🚀 Fast Setup (5 Minutes)

### Step 1: Start Your Backend Server
```bash
cd backend
npm start
```
✅ Server should be running on `http://localhost:3000`

### Step 2: Import Postman Collection (Easiest Method)

1. **Open Postman**
2. Click **"Import"** button (top left)
3. Click **"Upload Files"**
4. Select: `Calendar_App_API.postman_collection.json`
5. Click **"Import"**

✅ Collection imported with all requests ready!

### Step 3: Set Up Environment (Optional but Recommended)

1. Click **"Environments"** (left sidebar)
2. Click **"+"** to create new environment
3. Name: `Calendar App Local`
4. Add variable:
   - **Variable**: `base_url` → **Value**: `http://localhost:3000`
   - **Variable**: `token` → **Value**: (leave empty)
5. Click **"Save"**
6. Select this environment from dropdown (top right)

### Step 4: Test the API

#### A. Health Check
1. Open collection → Click **"Health Check"**
2. Click **"Send"**
3. ✅ Should return: `{ "status": "ok" }`

#### B. Login (Get Token)
1. Open collection → **Authentication** → **Login**
2. Click **"Send"**
3. ✅ Token is automatically saved! (Check environment variables)

#### C. Test Protected Endpoint
1. Open collection → **Tasks** → **Get All Tasks**
2. Click **"Send"**
3. ✅ Should return array of tasks (or empty array `[]`)

---

## 📝 Manual Setup (If Not Using Import)

### 1. Create Collection
- Click **"New"** → **"Collection"**
- Name: `Calendar App API`

### 2. Create Login Request
- **Method**: POST
- **URL**: `http://localhost:3000/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
  ```json
  {
    "username": "demo",
    "password": "demo123"
  }
  ```
- **Tests Tab** (to auto-save token):
  ```javascript
  if (pm.response.code === 200) {
      const response = pm.response.json();
      pm.environment.set("token", response.token);
  }
  ```

### 3. Set Collection Authorization
- Click collection name → **Authorization** tab
- Type: **Bearer Token**
- Token: `{{token}}`

### 4. Create Test Request
- **Method**: GET
- **URL**: `http://localhost:3000/api/tasks`
- Authorization is inherited from collection

---

## 🎯 Essential Endpoints to Test

### Must Test First:
1. ✅ `GET /health` - Verify server is running
2. ✅ `POST /auth/login` - Get JWT token
3. ✅ `GET /api/tasks` - Test protected endpoint

### Then Test:
4. `POST /api/tasks` - Create a task
5. `PUT /api/tasks/:id` - Update task
6. `DELETE /api/tasks/:id` - Delete task

---

## 🔑 Demo Credentials

- **Username**: `demo`
- **Password**: `demo123`

---

## ⚠️ Common Issues

### "Cannot GET /api/tasks"
→ Backend server not running. Start it with `npm start` in backend folder.

### "401 Unauthorized"
→ Token not set. Run Login request first to get token.

### "Token has expired"
→ Login again to get a new token (tokens expire after 24 hours).

---

## 📚 Full Documentation

See `POSTMAN_TESTING_GUIDE.md` for complete step-by-step instructions with all endpoints.

---

## 💡 Pro Tips

1. **Auto-save Token**: The Login request has a test script that automatically saves the token
2. **Collection Auth**: Set Bearer Token at collection level so all requests use it
3. **Environment Variables**: Use `{{base_url}}` and `{{token}}` for easy switching
4. **Save Responses**: Right-click response → Save as Example for documentation

---

## 🎬 Quick Test Sequence

1. **Health Check** → Verify server
2. **Login** → Get token (auto-saved)
3. **Get All Tasks** → Test protected endpoint
4. **Create Task** → Add new task
5. **Get All Tasks** → Verify task was created

Done! 🎉

