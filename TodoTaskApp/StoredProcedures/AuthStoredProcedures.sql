-- =============================================
-- Authentication Stored Procedures
-- =============================================

-- Check if user exists by username
CREATE OR ALTER PROCEDURE sp_CheckUserExists
    @Username NVARCHAR(255)
AS
BEGIN
    SELECT Id FROM Users WHERE Username = @Username
END
GO

-- Create legacy user entry
CREATE OR ALTER PROCEDURE sp_CreateLegacyUser
    @Username NVARCHAR(255),
    @Password NVARCHAR(255),
    @CreatedDate DATETIME
AS
BEGIN
    INSERT INTO Users (Username, Password, CreatedDate) 
    VALUES (@Username, @Password, @CreatedDate)
END
GO

