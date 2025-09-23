# Document Management Setup Instructions

## Overview
This document provides instructions for setting up the document management functionality in the TodoTaskApp.

## Features
- **Upload Documents**: Users can upload up to 5 documents per task
- **Download Documents**: Users can download any document associated with a task
- **Delete Documents**: Users can delete specific documents
- **Replace Documents**: Users can replace existing documents with new ones
- **File Size Limit**: Maximum 5MB per file
- **File Type Support**: All file types are supported

## Database Setup

### 1. Execute the Stored Procedures Script
Run the following SQL script to create the necessary stored procedures and table:

```sql
-- Execute the sp_DocumentProcedures.sql file
-- This will create:
-- - TodoTaskDocuments table
-- - All necessary stored procedures
-- - Indexes for performance
```

### 2. Verify Table Creation
The script will create the `TodoTaskDocuments` table with the following structure:
- `Id` (INT, Primary Key, Identity)
- `TaskId` (INT, Foreign Key to TodoTasks)
- `DocumentName` (NVARCHAR(255))
- `DocumentData` (VARBINARY(MAX))
- `FileSize` (BIGINT)
- `ContentType` (NVARCHAR(100))
- `UploadDate` (DATETIME)

## Frontend Features

### 1. Document Icon
- The document icon in the task table is now clickable
- Shows document count (e.g., "📄 3" for 3 documents)
- Clicking opens the document management modal

### 2. Document Modal
- **Upload Section**: Allows multiple file selection (up to 5 total)
- **Document List**: Shows all documents with actions
- **Document Count Badge**: Shows current count vs. limit (e.g., "3/5")

### 3. Document Actions
- **Download**: Click the download button to download a document
- **Replace**: Click the replace button to replace with a new file
- **Delete**: Click the delete button to remove a document

## Backend Endpoints

### 1. Get Documents
- **Endpoint**: `GET /Todo/GetDocuments?taskId={taskId}`
- **Returns**: List of documents for the specified task

### 2. Upload Documents
- **Endpoint**: `POST /Todo/UploadDocuments`
- **Parameters**: `TaskId` (int), `Files` (List<IFormFile>)
- **Validation**: 5 document limit, 5MB file size limit

### 3. Download Document
- **Endpoint**: `GET /Todo/DownloadDocument?documentId={documentId}`
- **Returns**: File download

### 4. Delete Document
- **Endpoint**: `POST /Todo/DeleteDocument`
- **Parameters**: `documentId` (int)

### 5. Replace Document
- **Endpoint**: `POST /Todo/ReplaceDocument`
- **Parameters**: `documentId` (int), `newFile` (IFormFile)

## Usage Instructions

### 1. Upload Documents
1. Click on the document icon in the task table
2. In the modal, click "Choose Files" and select one or more files
3. Click "Upload" to upload the files
4. The document count will update automatically

### 2. Download Documents
1. Open the document modal for a task
2. Click the download button (📥) next to any document
3. The file will download to your default download folder

### 3. Replace Documents
1. Open the document modal for a task
2. Click the replace button (🔄) next to any document
3. Select a new file in the replace modal
4. Click "Replace Document"

### 4. Delete Documents
1. Open the document modal for a task
2. Click the delete button (🗑️) next to any document
3. Confirm the deletion in the popup

## Error Handling

### 1. File Size Limit
- If a file exceeds 5MB, an error message will be displayed
- The upload will be cancelled

### 2. Document Count Limit
- If trying to upload more than 5 documents total, an error will be shown
- The upload will be cancelled

### 3. File Validation
- All file types are accepted
- Empty files are rejected

## Security Considerations

1. **File Size Limits**: Enforced both client-side and server-side
2. **Document Count Limits**: Enforced both client-side and server-side
3. **User Access Control**: Users can only access documents for tasks they own or are assigned to
4. **Anti-Forgery Tokens**: All POST requests include CSRF protection

## Performance Considerations

1. **Database Indexes**: Created on TaskId and UploadDate for better query performance
2. **File Storage**: Documents are stored as VARBINARY(MAX) in the database
3. **Memory Management**: Files are processed using MemoryStream for efficient handling

## Troubleshooting

### Common Issues

1. **"Maximum 5 documents allowed per task"**
   - Solution: Delete some existing documents before uploading new ones

2. **"File size cannot exceed 5MB"**
   - Solution: Compress or split the file before uploading

3. **Document modal not opening**
   - Solution: Check browser console for JavaScript errors
   - Ensure all required scripts are loaded

4. **Upload failing**
   - Solution: Check file permissions and network connection
   - Verify the stored procedures are created correctly

### Database Issues

1. **Table not found**
   - Solution: Run the sp_DocumentProcedures.sql script

2. **Stored procedure errors**
   - Solution: Check SQL Server error logs
   - Verify the stored procedures were created successfully

## Support

For technical support or issues, check:
1. Browser console for JavaScript errors
2. Server logs for backend errors
3. Database connection and stored procedure execution
4. File permissions and network connectivity
