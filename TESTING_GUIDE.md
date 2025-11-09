# Testing Guide - JWT Integration

## Quick Test Checklist

### 1. Backend Setup
```bash
cd backend
npm install
# Make sure MongoDB is running
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Test Authentication

#### Login Test
1. Open browser to `http://localhost:5173`
2. Enter credentials:
   - Username: `demo`
   - Password: `demo123`
3. Should redirect to calendar view
4. Check localStorage for `token` and `user` keys

#### Token Validation Test
1. Refresh the page
2. Should remain logged in (token validated)
3. Check browser console for any errors

#### Token Expiration Test
1. Manually modify token in localStorage (make it invalid)
2. Refresh page
3. Should automatically logout and redirect to login

### 4. Test API Endpoints

#### Get Tasks
```bash
# Get token from localStorage first
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/tasks
```

#### Create Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","date":"2024-01-15","time":"10:00"}'
```

#### Toggle Task
```bash
curl -X POST http://localhost:3000/api/tasks/TASK_ID/toggle \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Test Error Handling

#### Invalid Token
1. Use invalid token in API request
2. Should return 401 error
3. Frontend should automatically logout

#### Expired Token
1. Wait for token to expire (or manually expire it)
2. Make API request
3. Should return 401 error
4. Frontend should automatically logout

#### Missing Token
1. Remove token from request
2. Should return 401 error
3. Frontend should show error message

### 6. Test Data Operations

#### Create Task
1. Click on calendar date
2. Fill in task details
3. Click "Create"
4. Should see task in calendar
5. Check MongoDB for new task

#### Update Task
1. Click on existing task
2. Modify details
3. Click "Update"
4. Should see updated task
5. Check MongoDB for changes

#### Delete Task
1. Click on existing task
2. Click "Delete"
3. Confirm deletion
4. Task should be removed
5. Check MongoDB for removal

#### Toggle Completion
1. Click checkbox on task
2. Should toggle completion status
3. Check MongoDB for update

### 7. Test Week Navigation
1. Navigate to different weeks
2. Tasks/meetings should filter correctly
3. Data should persist across weeks

### 8. Test Calendar View
1. Switch to calendar view
2. Should see all tasks/meetings
3. Click on dates to create events
4. Click on events to edit/delete

### 9. Test Productivity Chart
1. Complete some tasks/meetings
2. Check productivity chart
3. Should show updated statistics

### 10. Test Logout
1. Click logout button
2. Should clear token and user data
3. Should redirect to login page
4. Check localStorage (should be empty)

## Common Issues

### Issue: Cannot connect to backend
**Solution**: Check if backend is running on port 3000

### Issue: MongoDB connection error
**Solution**: Check if MongoDB is running and connection string is correct

### Issue: Token expired
**Solution**: Login again to get new token

### Issue: 401 Unauthorized
**Solution**: Check if token is valid and not expired

### Issue: Data not loading
**Solution**: Check browser console for errors, verify API endpoints

### Issue: CORS errors
**Solution**: Check backend CORS configuration

## Debugging Tips

1. **Check Browser Console**: Look for errors in console
2. **Check Network Tab**: Verify API requests and responses
3. **Check localStorage**: Verify token and user data
4. **Check MongoDB**: Verify data in database
5. **Check Backend Logs**: Look for errors in server console

## Test Data

### Seed Sample Data
```bash
cd backend
npm run seed
```

This will create sample tasks and meetings for the current week.

### Manual Test Data
Use MongoDB Compass to:
1. View tasks and meetings
2. Add test data
3. Verify data structure
4. Check IDs and dates

## Expected Behavior

### On Login
- Token stored in localStorage
- User data stored in localStorage
- Redirect to calendar view
- Load tasks and meetings from API

### On Token Expiration
- Automatic logout
- Clear localStorage
- Redirect to login page
- Show error message

### On API Error
- Show error message
- Provide retry option
- Maintain current state
- Log error to console

### On Data Update
- Update UI immediately
- Show success toast
- Sync with backend
- Update MongoDB

## Performance Testing

### Load Time
- Initial load: < 2 seconds
- API requests: < 500ms
- UI updates: < 100ms

### Data Volume
- Test with 100+ tasks
- Test with 100+ meetings
- Test with multiple weeks

## Security Testing

### Token Security
- Verify token is not exposed in URLs
- Verify token is stored securely
- Verify token expiration works
- Verify token validation works

### API Security
- Verify protected endpoints require token
- Verify invalid tokens are rejected
- Verify expired tokens are rejected
- Verify missing tokens are rejected

## Browser Compatibility

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Mobile Testing

Test on:
- iOS Safari
- Android Chrome
- Responsive design
- Touch interactions

