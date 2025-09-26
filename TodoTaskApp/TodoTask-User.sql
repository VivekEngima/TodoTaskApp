CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE()
);

select * from Users

ALTER TABLE TodoTasks 
ADD UserId INT NULL;

ALTER TABLE TodoTasks
ADD CONSTRAINT FK_TodoTasks_Users 
FOREIGN KEY (UserId) REFERENCES Users(Id);

INSERT INTO Users (Username, Password, CreatedDate)
VALUES 
('root', 'root123', GETDATE()), -- password: root123
('admin', '123', GETDATE()), -- password: admin123
('john', '456', GETDATE()); -- password: john123

UPDATE TodoTasks 
SET UserId = 1 -- root user
WHERE UserId IS NULL;

ALTER TABLE TodoTasks
ALTER COLUMN UserId INT NOT NULL;

INSERT INTO TodoTasks (Title, Description, Priority, Status, DueDate, CreatedDate, UserId)
VALUES
('John Personal Task', 'Complete personal project setup', 'High', 'Pending', DATEADD(DAY, 3, GETDATE()), GETDATE(), 2),
('Buy Groceries', 'Weekly grocery shopping', 'Normal', 'Pending', DATEADD(DAY, 1, GETDATE()), GETDATE(), 2),
('Jane Work Task', 'Prepare presentation for meeting', 'High', 'Pending', DATEADD(DAY, 2, GETDATE()), GETDATE(), 2),
('Book Appointment', 'Schedule doctor appointment', 'Low', 'Pending', DATEADD(DAY, 7, GETDATE()), GETDATE(), 2);

select * from TodoTasks where UserId=2;

CREATE PROCEDURE GetUserByUsername
    @Username NVARCHAR(50)
AS
BEGIN
    SELECT Id, Username, Password, CreatedDate
    FROM Users
    WHERE Username = @Username;
END
GO

CREATE PROCEDURE CreateUser
    @Username NVARCHAR(50),
    @Password NVARCHAR(255)
AS
BEGIN
    IF EXISTS (SELECT 1 FROM Users WHERE Username = @Username)
    BEGIN
        RETURN -1 -- Username already exists
    END
    
    INSERT INTO Users (Username, Password, CreatedDate)
    VALUES (@Username, @Password, GETDATE());
    
    RETURN SCOPE_IDENTITY(); -- Return new user ID
END
GO

CREATE PROCEDURE ValidateUserLogin
    @Username NVARCHAR(50),
    @Password NVARCHAR(255)
AS
BEGIN
    SELECT Id, Username, CreatedDate
    FROM Users
    WHERE Username = @Username AND Password = @Password;
END
GO

CREATE OR ALTER PROCEDURE GetAllTodoTasks
    @UserId INT
AS
BEGIN
    SELECT Id, Title, Description, Priority, Status, DueDate, CreatedDate, UpdatedDate, CompletedDate, UserId
    FROM TodoTasks
    WHERE UserId = @UserId
    ORDER BY CreatedDate DESC;
END
GO

CREATE OR ALTER PROCEDURE GetTodoTaskById
    @Id INT,
    @UserId INT
AS
BEGIN
    SELECT Id, Title, Description, Priority, Status, DueDate, CreatedDate, UpdatedDate, CompletedDate, UserId
    FROM TodoTasks
    WHERE Id = @Id AND UserId = @UserId;
END
GO

CREATE OR ALTER PROCEDURE CreateTodoTask
    @Title NVARCHAR(100),
    @Description NVARCHAR(500),
    @Priority NVARCHAR(20),
    @Status NVARCHAR(20),
    @DueDate DATETIME,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO TodoTasks (Title, Description, Priority, Status, DueDate, CreatedDate, UserId)
    VALUES (@Title, @Description, @Priority, @Status, @DueDate, GETDATE(), @UserId);
    
    SELECT SCOPE_IDENTITY() AS Id;
END
GO

CREATE OR ALTER PROCEDURE UpdateTodoTask
    @Id INT,
    @Title NVARCHAR(100),
    @Description NVARCHAR(500),
    @Priority NVARCHAR(20),
    @Status NVARCHAR(20),
    @DueDate DATETIME,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update task if user is the owner OR if task is assigned to the user
    UPDATE TodoTasks
    SET Title = @Title,
        Description = @Description,
        Priority = @Priority,
        Status = @Status,
        DueDate = @DueDate,
        UpdatedDate = GETDATE(),
        CompletedDate = CASE WHEN @Status = 'Completed' THEN GETDATE() ELSE CompletedDate END
    WHERE Id = @Id 
    AND (
        UserId = @UserId  -- User is the owner
        OR EXISTS (
            SELECT 1 FROM TaskAssignments 
            WHERE TaskId = @Id AND AssignedUserId = @UserId
        )  -- Task is assigned to the user
    );
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

CREATE OR ALTER PROCEDURE DeleteTodoTask
    @Id INT,
    @UserId INT
AS
BEGIN
    DELETE FROM TodoTasks
    WHERE Id = @Id AND UserId = @UserId;
    
    RETURN @@ROWCOUNT;
END
GO

CREATE OR ALTER PROCEDURE UpdateTodoTaskStatus
    @Id INT,
    @Status NVARCHAR(20),
    @UserId INT
AS
BEGIN
    UPDATE TodoTasks
    SET Status = @Status,
        UpdatedDate = GETDATE(),
        CompletedDate = CASE WHEN @Status = 'Completed' THEN GETDATE() ELSE NULL END
    WHERE Id = @Id AND UserId = @UserId;
    
    RETURN @@ROWCOUNT;
END
GO

