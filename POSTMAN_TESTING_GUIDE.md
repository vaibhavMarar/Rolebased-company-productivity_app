# Postman Testing Guide - Calendar App API

Complete step-by-step guide to test your Calendar App API using Postman.

## Prerequisites

1. **Backend server must be running**

   ```bash
   cd backend
   npm start
   ```

   Server should be running on `http://localhost:3000`

2. **Install Postman** (if not already installed)
   - Download from: https://www.postman.com/downloads/
   - Or use Postman web version

## Step-by-Step Setup

### Step 1: Create a New Postman Collection

1. Open Postman
2. Click **"New"** → **"Collection"**
3. Name it: `Calendar App API`
4. Click **"Create"**

### Step 2: Set Up Environment Variables (Recommended)

1. Click the **"Environments"** icon (left sidebar) or click **"Environments"** tab
2. Click **"+"** to create a new environment
3. Name it: `Calendar App Local`
4. Add these variables:
   - **Variable**: `base_url` → **Initial Value**: `http://localhost:3000`
   - **Variable**: `token` → **Initial Value**: (leave empty)
5. Click **"Save"**
6. Select this environment from the dropdown (top right)

### Step 3: Test Health Check Endpoint

1. In your collection, click **"Add Request"**
2. Name it: `Health Check`
3. Set method to: **GET**
4. Enter URL: `{{base_url}}/health`
   - Or directly: `http://localhost:3000/health`
5. Click **"Send"**
6. **Expected Response**: `{ "status": "ok" }`

---

## Authentication Testing

### Step 4: Login to Get JWT Token

1. **Create Login Request**

   - Click **"Add Request"** in collection
   - Name it: `Login`
   - Method: **POST**
   - URL: `{{base_url}}/auth/login`

2. **Set Headers**

   - Go to **"Headers"** tab
   - Add header:
     - **Key**: `Content-Type`
     - **Value**: `application/json`

3. **Set Body**

   - Go to **"Body"** tab
   - Select **"raw"**
   - Select **"JSON"** from dropdown
   - Enter:
     ```json
     {
       "username": "demo",
       "password": "demo123"
     }
     ```

4. **Send Request**

   - Click **"Send"**
   - **Expected Response** (200 OK):
     ```json
     {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "user": {
         "username": "demo"
       },
       "expiresIn": "24h"
     }
     ```

5. **Save Token Automatically** (Optional but Recommended)
   - Go to **"Tests"** tab in the Login request
   - Add this script:
     ```javascript
     if (pm.response.code === 200) {
       const response = pm.response.json();
       pm.environment.set("token", response.token);
       console.log("Token saved:", response.token);
     }
     ```
   - Now when you send the Login request, the token will be automatically saved!

---

## Testing Protected Endpoints

All protected endpoints require the JWT token in the Authorization header.

### Step 5: Set Up Authorization for Collection

**Option A: Collection-Level Authorization (Recommended)**

1. Click on your collection name
2. Go to **"Authorization"** tab
3. Type: **Bearer Token**
4. Token: `{{token}}`
5. This applies to all requests in the collection

**Option B: Manual Authorization per Request**

- For each request, go to **"Authorization"** tab
- Type: **Bearer Token**
- Token: `{{token}}`

---

## Tasks Endpoints Testing

### Step 6: Get All Tasks

1. **Create Request**

   - Name: `Get All Tasks`
   - Method: **GET**
   - URL: `{{base_url}}/api/tasks`

2. **Authorization**

   - If using collection-level auth, it's already set
   - Otherwise, go to **"Authorization"** tab → **Bearer Token** → `{{token}}`

3. **Send Request**
   - **Expected**: Array of tasks or empty array `[]`

### Step 7: Create a Task

1. **Create Request**

   - Name: `Create Task`
   - Method: **POST**
   - URL: `{{base_url}}/api/tasks`

2. **Headers**

   - `Content-Type`: `application/json`

3. **Body** (raw JSON):

   ```json
   {
     "title": "Test Task from Postman",
     "date": "2024-12-20",
     "time": "14:00"
   }
   ```

   - **Note**: Date must be today or in the future (YYYY-MM-DD format)
   - Time is optional (defaults to "09:00")

4. **Send Request**
   - **Expected Response** (201 Created):
     ```json
     {
       "_id": "...",
       "title": "Test Task from Postman",
       "date": "2024-12-20",
       "time": "14:00",
       "completed": false,
       "createdAt": "...",
       "updatedAt": "..."
     }
     ```

### Step 8: Update a Task

1. **Create Request**

   - Name: `Update Task`
   - Method: **PUT**
   - URL: `{{base_url}}/api/tasks/:id`
   - Replace `:id` with actual task ID from previous response
   - Example: `{{base_url}}/api/tasks/67890abcdef1234567890123`

2. **Body** (raw JSON):

   ```json
   {
     "title": "Updated Task Title",
     "date": "2024-12-21",
     "time": "15:30"
   }
   ```

3. **Send Request**
   - **Expected**: Updated task object

### Step 9: Toggle Task Completion

1. **Create Request**

   - Name: `Toggle Task`
   - Method: **POST**
   - URL: `{{base_url}}/api/tasks/:id/toggle`
   - Replace `:id` with actual task ID

2. **Send Request**
   - **Expected**: Task with `completed` status toggled

### Step 10: Delete a Task

1. **Create Request**

   - Name: `Delete Task`
   - Method: **DELETE**
   - URL: `{{base_url}}/api/tasks/:id`
   - Replace `:id` with actual task ID

2. **Send Request**
   - **Expected Response** (200 OK):
     ```json
     {
       "message": "Task deleted successfully",
       "task": { ... }
     }
     ```

---

## Meetings Endpoints Testing

### Step 11: Get All Meetings

1. **Create Request**

   - Name: `Get All Meetings`
   - Method: **GET**
   - URL: `{{base_url}}/api/meetings`

2. **Send Request**
   - **Expected**: Array of meetings or empty array `[]`

### Step 12: Create a Meeting

1. **Create Request**

   - Name: `Create Meeting`
   - Method: **POST**
   - URL: `{{base_url}}/api/meetings`

2. **Body** (raw JSON):

   ```json
   {
     "title": "Team Meeting from Postman",
     "date": "2024-12-20",
     "time": "16:00"
   }
   ```

3. **Send Request**
   - **Expected**: Created meeting object

### Step 13: Update a Meeting

1. **Create Request**

   - Name: `Update Meeting`
   - Method: **PUT**
   - URL: `{{base_url}}/api/meetings/:id`

2. **Body** (raw JSON):

   ```json
   {
     "title": "Updated Meeting Title",
     "date": "2024-12-22",
     "time": "17:00"
   }
   ```

3. **Send Request**
   - **Expected**: Updated meeting object

### Step 14: Toggle Meeting Completion

1. **Create Request**

   - Name: `Toggle Meeting`
   - Method: **POST**
   - URL: `{{base_url}}/api/meetings/:id/toggle`

2. **Send Request**
   - **Expected**: Meeting with `completed` status toggled

### Step 15: Delete a Meeting

1. **Create Request**

   - Name: `Delete Meeting`
   - Method: **DELETE**
   - URL: `{{base_url}}/api/meetings/:id`

2. **Send Request**
   - **Expected**: Success message with deleted meeting

---

## Token Verification Endpoints

### Step 16: Verify Token (Public)

1. **Create Request**

   - Name: `Verify Token (Public)`
   - Method: **POST**
   - URL: `{{base_url}}/auth/verify-token`

2. **Body** (raw JSON):

   ```json
   {
     "token": "{{token}}"
   }
   ```

3. **Send Request**
   - **Expected Response** (200 OK):
     ```json
     {
       "valid": true,
       "user": {
         "username": "demo",
         "userId": "demo-user-id"
       },
       "message": "Token is valid"
     }
     ```

### Step 17: Verify Token (Protected)

1. **Create Request**

   - Name: `Verify Token (Protected)`
   - Method: **GET**
   - URL: `{{base_url}}/auth/verify`

2. **Authorization**: Bearer Token `{{token}}`

3. **Send Request**
   - **Expected**: Token validation response

### Step 18: Logout

1. **Create Request**

   - Name: `Logout`
   - Method: **POST**
   - URL: `{{base_url}}/auth/logout`

2. **Authorization**: Bearer Token `{{token}}`

3. **Send Request**
   - **Expected**: Success message

---

## Testing Error Cases

### Step 19: Test Without Token

1. Create a new request (e.g., `Get Tasks - No Token`)
2. **Remove Authorization** header
3. Send request to any protected endpoint
4. **Expected Response** (401 Unauthorized):
   ```json
   {
     "error": "Access token required",
     "code": "NO_TOKEN"
   }
   ```

### Step 20: Test Invalid Token

1. Create a new request
2. Set Authorization header with invalid token: `Bearer invalid-token-123`
3. **Expected Response** (401 Unauthorized):
   ```json
   {
     "error": "Invalid token",
     "code": "INVALID_TOKEN"
   }
   ```

### Step 21: Test Invalid Login Credentials

1. Use the Login request
2. Change body to:
   ```json
   {
     "username": "wrong",
     "password": "wrong"
   }
   ```
3. **Expected Response** (401 Unauthorized):
   ```json
   {
     "error": "Invalid credentials",
     "code": "INVALID_CREDENTIALS"
   }
   ```

### Step 22: Test Missing Required Fields

1. Create Task request with missing fields:
   ```json
   {
     "title": "Task without date"
   }
   ```
2. **Expected Response** (400 Bad Request):
   ```json
   {
     "error": "Title and date are required"
   }
   ```

---

## Quick Reference: All Endpoints

### Public Endpoints (No Auth Required)

- `GET /health` - Health check
- `POST /auth/login` - Login
- `POST /auth/verify-token` - Verify token (public)

### Protected Endpoints (Auth Required)

- `GET /auth/verify` - Verify token (protected)
- `POST /auth/logout` - Logout
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/toggle` - Toggle task
- `GET /api/meetings` - Get all meetings
- `POST /api/meetings` - Create meeting
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting
- `POST /api/meetings/:id/toggle` - Toggle meeting

---

## Tips & Best Practices

1. **Save Token Automatically**: Use the Test script in Login request to auto-save token
2. **Use Environment Variables**: Makes it easy to switch between dev/prod
3. **Organize Requests**: Group by category (Auth, Tasks, Meetings)
4. **Use Variables**: Store IDs in variables for easy reuse
5. **Test Error Cases**: Always test both success and error scenarios
6. **Check Response Times**: Monitor API performance
7. **Export Collection**: Save your collection for future use

---

## Troubleshooting

### Issue: "Cannot GET /api/tasks"

- **Solution**: Make sure backend server is running on port 3000

### Issue: "401 Unauthorized" on protected endpoints

- **Solution**:
  1. Make sure you logged in first
  2. Check that token is saved in environment variable
  3. Verify Authorization header is set correctly

### Issue: "Token has expired"

- **Solution**: Login again to get a new token (tokens expire after 24 hours)

### Issue: "Route not found" (404)

- **Solution**: Check the URL path and make sure server is running

### Issue: "Network Error"

- **Solution**:
  1. Verify backend server is running
  2. Check if URL is correct (`http://localhost:3000`)
  3. Check firewall/antivirus settings

---

## Demo Credentials

- **Username**: `demo`
- **Password**: `demo123`

---

## Next Steps

1. Create a Postman Collection with all these requests
2. Export and share with your team
3. Set up automated tests using Postman's test scripts
4. Use Postman's Collection Runner for batch testing
5. Integrate with CI/CD pipeline for automated API testing
