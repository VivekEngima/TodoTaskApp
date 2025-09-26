CREATE TABLE TodoTaskDocuments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TaskId INT NOT NULL,
    DocumentName NVARCHAR(255) NOT NULL,
    DocumentData VARBINARY(MAX) NOT NULL,
    FileSize BIGINT NOT NULL,
    ContentType NVARCHAR(100) NOT NULL,
    UploadDate DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (TaskId) REFERENCES TodoTasks(Id) ON DELETE CASCADE
);

-- Get documents by task ID
CREATE or alter PROCEDURE sp_GetDocumentsByTaskId
    @TaskId INT
AS
BEGIN
    SELECT Id, TaskId, DocumentName, FileSize, ContentType, UploadDate
    FROM TodoTaskDocuments 
    WHERE TaskId = @TaskId
    ORDER BY UploadDate DESC;
END;

-- Insert document
CREATE or alter PROCEDURE sp_InsertDocument
    @TaskId INT,
    @DocumentName NVARCHAR(255),
    @DocumentData VARBINARY(MAX),
    @FileSize BIGINT,
    @ContentType NVARCHAR(100)
AS
BEGIN
    INSERT INTO TodoTaskDocuments (TaskId, DocumentName, DocumentData, FileSize, ContentType)
    VALUES (@TaskId, @DocumentName, @DocumentData, @FileSize, @ContentType);
    SELECT SCOPE_IDENTITY() as Id;
END;

-- Delete document
CREATE or alter PROCEDURE sp_DeleteDocument
    @Id INT
AS
BEGIN
    DELETE FROM TodoTaskDocuments WHERE Id = @Id;
    SELECT @@ROWCOUNT as AffectedRows;
END;

-- Get document by ID (for download)
CREATE or alter PROCEDURE sp_GetDocumentById
    @Id INT
AS
BEGIN
    SELECT Id, TaskId, DocumentName, DocumentData, FileSize, ContentType, UploadDate
    FROM TodoTaskDocuments 
    WHERE Id = @Id;
END;

-- Get document count by task
CREATE or alter PROCEDURE sp_GetDocumentCountByTask
    @TaskId INT
AS
BEGIN
    SELECT COUNT(*) as DocumentCount FROM TodoTaskDocuments WHERE TaskId = @TaskId;
END;

-- Update/Replace document stored procedure
CREATE PROCEDURE sp_UpdateDocument
    @Id INT,
    @DocumentName NVARCHAR(255),
    @DocumentData VARBINARY(MAX),
    @FileSize BIGINT,
    @ContentType NVARCHAR(100),
    @UploadDate DATETIME2
AS
BEGIN
    UPDATE TodoTaskDocuments 
    SET 
        DocumentName = @DocumentName,
        DocumentData = @DocumentData,
        FileSize = @FileSize,
        ContentType = @ContentType,
        UploadDate = @UploadDate
    WHERE Id = @Id;
    
    SELECT @@ROWCOUNT as AffectedRows;
END;
