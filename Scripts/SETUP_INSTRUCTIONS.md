# TodoTaskApp - Complete Setup Instructions

## 🚀 Quick Setup Guide

### Step 1: Run the SQL Script
1. Open **SQL Server Management Studio (SSMS)**
2. Connect to your SQL Server instance
3. Open the file: `Scripts/Complete_StoredProcedures.sql`
4. Execute the entire script
5. Verify that all tables and stored procedures are created successfully

### Step 2: Test the Application
1. Run the TodoTaskApp application
2. Create a user account and login
3. Create a new task
4. Click on the document icon (📄) in the task table
5. Try uploading a document

## 🔧 What the SQL Script Creates

### Tables Created:
- **Users** - User authentication and management
- **TodoTasks** - Main task storage
- **TaskAssignments** - Task sharing and assignment functionality
- **TodoTaskDocuments** - Document storage and management

### Stored Procedures Created:
- **User Management**: 3 procedures
- **Task Management**: 7 procedures  
- **Task Assignment**: 9 procedures
- **Document Management**: 6 procedures
- **Dashboard Statistics**: 1 procedure

**Total: 26 stored procedures**

## 🐛 Troubleshooting the Document Upload Issue

### The Problem:
The error you encountered was:
```
The INSERT statement conflicted with the FOREIGN KEY constraint "FK__TodoTaskD__TaskI__5DCAEF64". 
The conflict occurred in database "TodoTaskDb", table "dbo.TodoTasks", column 'Id'.
```

### Root Cause:
The `TaskId` being passed to the document upload was `0`, which doesn't exist in the `TodoTasks` table.

### Solutions Applied:

1. **Enhanced JavaScript Debugging**:
   - Added console logging to track TaskId values
   - Added validation to prevent upload with invalid TaskId
   - Added better error handling and user feedback

2. **Improved Controller Validation**:
   - Added TaskId validation in the controller
   - Enhanced logging for better debugging
   - Added specific error messages for invalid TaskId

3. **Robust Stored Procedures**:
   - Added comprehensive input validation
   - Added proper error messages
   - Added foreign key constraint checks

## 🔍 Debugging Steps

### If Document Upload Still Fails:

1. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for console messages showing TaskId values
   - Check for any JavaScript errors

2. **Check Server Logs**:
   - Look for the log message: "UploadDocuments called with TaskId: X"
   - Check for any validation errors

3. **Verify Task Creation**:
   - Make sure you're clicking on a valid task's document icon
   - Ensure the task was created successfully
   - Check that the task has a valid ID (not 0)

### Common Issues and Solutions:

| Issue | Solution |
|-------|----------|
| TaskId is 0 | Close modal and try again, or refresh the page |
| Foreign key error | Run the complete SQL script to ensure all tables exist |
| File size error | Ensure files are under 5MB |
| Document limit error | Delete some existing documents before uploading new ones |
| Modal not opening | Check browser console for JavaScript errors |

## 📋 Testing Checklist

After running the SQL script, test these features:

- [ ] User registration and login
- [ ] Task creation, editing, and deletion
- [ ] Task status updates (Pending/Completed)
- [ ] Task assignment to other users
- [ ] Document upload (click document icon)
- [ ] Document download
- [ ] Document replacement
- [ ] Document deletion
- [ ] Dashboard statistics
- [ ] Task filtering and search

## 🎯 Expected Behavior

### Document Management:
1. **Click Document Icon**: Opens modal with current document count
2. **Upload Documents**: Select multiple files, click Upload
3. **View Documents**: See list with file names, sizes, and actions
4. **Download**: Click download button to save file
5. **Replace**: Click replace button to upload new version
6. **Delete**: Click delete button to remove document

### Limits and Validation:
- Maximum 5 documents per task
- Maximum 5MB per file
- All file types supported
- Real-time validation and feedback

## 🆘 Support

If you encounter any issues:

1. **Check the SQL Script**: Ensure all procedures were created successfully
2. **Check Browser Console**: Look for JavaScript errors
3. **Check Server Logs**: Look for detailed error messages
4. **Verify Database**: Ensure all tables and foreign keys are properly set up

The enhanced debugging will help identify exactly where the issue occurs.

## ✅ Success Indicators

You'll know everything is working when:
- Document icons are clickable and show correct counts
- Document modal opens and loads existing documents
- File upload works without foreign key errors
- All CRUD operations (Create, Read, Update, Delete) work for documents
- Task list updates to show new document counts

---

**Note**: The SQL script is comprehensive and includes all necessary tables, stored procedures, and constraints for the entire TodoTaskApp project. Running this script will set up everything needed for the application to function properly.
