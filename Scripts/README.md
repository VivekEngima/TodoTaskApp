# Database Scripts

This folder contains SQL scripts for the TodoTaskApp database.

## Setup Instructions

### 1. Create the Stored Procedure

Run the following SQL script in your SQL Server database to create the required stored procedure:

```sql
-- Execute the contents of sp_GetTasksAssignedToUser.sql
```

### 2. What the Stored Procedure Does

The `sp_GetTasksAssignedToUser` stored procedure:

- Returns all tasks that are assigned TO a specific user (not created by them)
- Joins the `TodoTasks`, `TaskAssignments`, and `Users` tables
- Includes assignment information like who created the task and assignment count
- Orders results by creation date (most recent first)

### 3. Database Schema Requirements

The stored procedure expects the following tables:
- `TodoTasks` - Main tasks table
- `TaskAssignments` - Task assignment relationships
- `Users` - User information

### 4. Usage

The stored procedure is called by the `TaskAssignmentRepository.GetTasksAssignedToUserAsync()` method with a single parameter:
- `@UserId` (int) - The ID of the user to get assigned tasks for

## Changes Made

This update modifies the dashboard's "Assigned to Me" section to show only tasks that are assigned TO the logged-in user by other users, rather than showing tasks created by the logged-in user.
