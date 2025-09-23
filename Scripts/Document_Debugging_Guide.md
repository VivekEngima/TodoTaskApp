# Document CRUD Operations Debugging Guide

## 🔍 Step-by-Step Debugging Process

### Step 1: Check Browser Console
1. Open the TodoTaskApp in your browser
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Look for these messages when the page loads:
   ```
   Initializing document event handlers...
   Document event handlers setup complete
   Document event handlers initialized.
   ```

### Step 2: Test Document Modal Opening
1. Click on a document icon (📄) in the task table
2. Check the console for these messages:
   ```
   Opening document modal for task ID: [TASK_ID]
   Task ID type: number
   Loading documents for task ID: [TASK_ID]
   ```

### Step 3: Test Document Loading
1. When the modal opens, check the console for:
   ```
   Documents response: {success: true, data: [...], count: X}
   Displaying documents: [...]
   Processing document: {...}
   Generated HTML: <div class="d-flex...
   ```

### Step 4: Test Document Upload
1. Select a file in the document modal
2. Click the Upload button
3. Check the console for:
   ```
   Document upload form submitted
   Current Document Task ID: [TASK_ID]
   Task ID from form: [TASK_ID]
   ```

### Step 5: Test Document Actions
1. If documents are displayed, try clicking the action buttons
2. Check the console for any errors

## 🐛 Common Issues and Solutions

### Issue 1: "escapeHtml is not defined"
**Solution**: This has been fixed by adding the `escapeHtml` function to the JavaScript.

### Issue 2: Document modal not opening
**Possible Causes**:
- TaskId is 0 or invalid
- JavaScript errors preventing modal opening
- Missing Bootstrap modal functionality

**Debug Steps**:
1. Check console for "Opening document modal for task ID: 0"
2. Run `testDocumentFunctionality()` in console
3. Verify the task has a valid ID

### Issue 3: Documents not loading
**Possible Causes**:
- Database connection issues
- Stored procedures not created
- TaskId validation failing

**Debug Steps**:
1. Check console for "Loading documents for task ID: [ID]"
2. Check server logs for "GetDocuments called with TaskId: [ID]"
3. Verify the SQL script was run successfully

### Issue 4: Upload not working
**Possible Causes**:
- TaskId validation failing
- File size or count limits exceeded
- Form submission issues

**Debug Steps**:
1. Check console for upload form submission
2. Verify TaskId is valid (not 0)
3. Check file size (must be < 5MB)
4. Check document count (must be < 5)

## 🧪 Testing Commands

### Run in Browser Console:

```javascript
// Test document functionality
testDocumentFunctionality();

// Test opening document modal for task ID 1
openDocumentModal(1);

// Test loading documents for task ID 1
loadDocumentsForTask(1);

// Check if elements exist
console.log('Modal exists:', $('#documentModal').length > 0);
console.log('Form exists:', $('#documentUploadForm').length > 0);
console.log('File input exists:', $('#documentFile').length > 0);
```

## 📋 Checklist for Document CRUD Operations

### ✅ Upload Documents
- [ ] Document modal opens when clicking document icon
- [ ] File input accepts multiple files
- [ ] Upload button is clickable
- [ ] Files are uploaded successfully
- [ ] Success message appears
- [ ] Document list updates
- [ ] Document count badge updates

### ✅ View Documents
- [ ] Documents are displayed in the modal
- [ ] File names are shown correctly
- [ ] File sizes are displayed
- [ ] Action buttons are visible

### ✅ Download Documents
- [ ] Download button is clickable
- [ ] File downloads when clicked
- [ ] Correct file name is used

### ✅ Replace Documents
- [ ] Replace button opens replace modal
- [ ] Current document name is shown
- [ ] File input accepts new file
- [ ] Replace button works
- [ ] Document is updated successfully

### ✅ Delete Documents
- [ ] Delete button shows confirmation
- [ ] Document is deleted after confirmation
- [ ] Document list updates
- [ ] Document count badge updates

## 🔧 Manual Testing Steps

1. **Create a Task**:
   - Go to Todo page
   - Click "Add Task"
   - Fill in details and save

2. **Test Document Upload**:
   - Click the document icon (📄) next to the task
   - Select a small file (< 1MB)
   - Click Upload
   - Verify success message

3. **Test Document View**:
   - Open document modal again
   - Verify the uploaded document appears
   - Check file name and size display

4. **Test Document Download**:
   - Click the download button (📥)
   - Verify file downloads

5. **Test Document Replace**:
   - Click the replace button (🔄)
   - Select a different file
   - Click "Replace Document"
   - Verify the document is updated

6. **Test Document Delete**:
   - Click the delete button (🗑️)
   - Confirm deletion
   - Verify document is removed

## 🚨 Error Messages to Look For

### JavaScript Errors:
- `escapeHtml is not defined`
- `Cannot read property 'length' of undefined`
- `TaskId is 0 or invalid`

### Server Errors:
- `Invalid TaskId provided`
- `Task with ID X does not exist`
- `Maximum 5 documents allowed per task`
- `File size cannot exceed 5MB`

### Network Errors:
- `404 Not Found` for `/Todo/GetDocuments`
- `500 Internal Server Error`
- `CSRF token validation failed`

## 📞 Support

If you're still having issues:

1. **Check the complete console output** and share it
2. **Check server logs** for any errors
3. **Verify the SQL script** was run successfully
4. **Test with a simple file** (small text file)
5. **Try with a fresh task** (delete and recreate)

The enhanced debugging will help identify exactly where the issue occurs in the document CRUD operations.
