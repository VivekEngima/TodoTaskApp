-- Document Management Stored Procedures
-- This script creates all necessary stored procedures for document functionality

-- 1. Get documents by task ID
CREATE OR ALTER PROCEDURE sp_GetDocumentsByTaskId
    @TaskId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id,
        TaskId,
        DocumentName,
        FileSize,
        ContentType,
        UploadDate
    FROM TodoTaskDocuments
    WHERE TaskId = @TaskId
    ORDER BY UploadDate DESC;
END
GO

-- 2. Get document by ID
CREATE OR ALTER PROCEDURE sp_GetDocumentById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id,
        TaskId,
        DocumentName,
        DocumentData,
        FileSize,
        ContentType,
        UploadDate
    FROM TodoTaskDocuments
    WHERE Id = @Id;
END
GO

-- 3. Insert new document
CREATE OR ALTER PROCEDURE sp_InsertDocument
    @TaskId INT,
    @DocumentName NVARCHAR(255),
    @DocumentData VARBINARY(MAX),
    @FileSize BIGINT,
    @ContentType NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO TodoTaskDocuments (TaskId, DocumentName, DocumentData, FileSize, ContentType, UploadDate)
    VALUES (@TaskId, @DocumentName, @DocumentData, @FileSize, @ContentType, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS Id;
END
GO

-- 4. Delete document
CREATE OR ALTER PROCEDURE sp_DeleteDocument
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM TodoTaskDocuments
    WHERE Id = @Id;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- 5. Get document count by task
CREATE OR ALTER PROCEDURE sp_GetDocumentCountByTask
    @TaskId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) AS DocumentCount
    FROM TodoTaskDocuments
    WHERE TaskId = @TaskId;
END
GO

-- 6. Update document
CREATE OR ALTER PROCEDURE sp_UpdateDocument
    @Id INT,
    @DocumentName NVARCHAR(255),
    @DocumentData VARBINARY(MAX),
    @FileSize BIGINT,
    @ContentType NVARCHAR(100),
    @UploadDate DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE TodoTaskDocuments
    SET 
        DocumentName = @DocumentName,
        DocumentData = @DocumentData,
        FileSize = @FileSize,
        ContentType = @ContentType,
        UploadDate = @UploadDate
    WHERE Id = @Id;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- 7. Create TodoTaskDocuments table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TodoTaskDocuments' AND xtype='U')
BEGIN
    CREATE TABLE TodoTaskDocuments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TaskId INT NOT NULL,
        DocumentName NVARCHAR(255) NOT NULL,
        DocumentData VARBINARY(MAX) NOT NULL,
        FileSize BIGINT NOT NULL,
        ContentType NVARCHAR(100) NOT NULL,
        UploadDate DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT FK_TodoTaskDocuments_TodoTasks 
            FOREIGN KEY (TaskId) REFERENCES TodoTasks(Id) ON DELETE CASCADE
    );
    
    -- Create index for better performance
    CREATE INDEX IX_TodoTaskDocuments_TaskId ON TodoTaskDocuments(TaskId);
    CREATE INDEX IX_TodoTaskDocuments_UploadDate ON TodoTaskDocuments(UploadDate);
END
GO

PRINT 'Document management stored procedures created successfully!';
