# TodoTaskApp - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Design Patterns](#architecture--design-patterns)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [Core Features](#core-features)
6. [Application Flow](#application-flow)
7. [Code Structure](#code-structure)
8. [Key Components](#key-components)
9. [Security Implementation](#security-implementation)
10. [Frontend Architecture](#frontend-architecture)
11. [API Endpoints](#api-endpoints)
12. [Interview Talking Points](#interview-talking-points)

---

## Project Overview

**TodoTaskApp** is a comprehensive task management application built with ASP.NET Core MVC that allows users to create, manage, and collaborate on tasks. The application features user authentication, task assignment, document management, and real-time dashboard analytics.

### Key Highlights:
- **Multi-user collaboration** with task assignment capabilities
- **Document management** system with file upload/download
- **Real-time dashboard** with charts and statistics
- **Responsive design** with modern UI/UX
- **Secure authentication** with cookie-based sessions
- **Database-driven** with stored procedures for performance

---

## Architecture & Design Patterns

### 1. **Clean Architecture (N-Tier)**
```
┌─────────────────┐
│   Controllers   │ ← Presentation Layer
├─────────────────┤
│    Services     │ ← Business Logic Layer
├─────────────────┤
│  Repositories   │ ← Data Access Layer
├─────────────────┤
│   Database      │ ← Data Storage Layer
└─────────────────┘
```

### 2. **Dependency Injection Pattern**
- All services and repositories are registered in `Program.cs`
- Constructor injection used throughout the application
- Promotes loose coupling and testability

### 3. **Repository Pattern**
- Abstracts data access logic
- Centralizes database operations
- Makes the application database-agnostic

### 4. **Service Layer Pattern**
- Contains business logic
- Orchestrates multiple repository calls
- Handles validation and error handling

---

## Technology Stack

### Backend Technologies:
- **ASP.NET Core 8.0** - Web framework
- **C#** - Programming language
- **Dapper** - Micro ORM for data access
- **SQL Server** - Database
- **Stored Procedures** - Database operations
- **Microsoft.AspNetCore.Identity** - Password hashing

### Frontend Technologies:
- **Bootstrap 5** - CSS framework
- **jQuery** - JavaScript library
- **Chart.js** - Data visualization
- **Font Awesome** - Icons
- **Razor Pages** - Server-side rendering

### Development Tools:
- **Visual Studio** - IDE
- **SQL Server Management Studio** - Database management
- **Git** - Version control

---

## Database Design

### Core Tables:

#### 1. **Users Table**
```sql
Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE()
)
```

#### 2. **TodoTasks Table**
```sql
TodoTasks (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    Priority NVARCHAR(20) NOT NULL DEFAULT 'Normal',
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    DueDate DATETIME NOT NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedDate DATETIME,
    CompletedDate DATETIME,
    UserId INT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
)
```

#### 3. **TaskAssignments Table**
```sql
TaskAssignments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TaskId INT NOT NULL,
    AssignedUserId INT NOT NULL,
    AssignedByUserId INT NOT NULL,
    AssignedDate DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (TaskId) REFERENCES TodoTasks(Id),
    FOREIGN KEY (AssignedUserId) REFERENCES Users(Id),
    FOREIGN KEY (AssignedByUserId) REFERENCES Users(Id)
)
```

#### 4. **TodoTaskDocuments Table**
```sql
TodoTaskDocuments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TaskId INT NOT NULL,
    DocumentName NVARCHAR(255) NOT NULL,
    DocumentData VARBINARY(MAX) NOT NULL,
    FileSize BIGINT NOT NULL,
    ContentType NVARCHAR(100) NOT NULL,
    UploadDate DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (TaskId) REFERENCES TodoTasks(Id)
)
```

### Key Relationships:
- **One-to-Many**: User → TodoTasks (User creates multiple tasks)
- **Many-to-Many**: Users ↔ TodoTasks (via TaskAssignments)
- **One-to-Many**: TodoTask → TodoTaskDocuments (Task has multiple documents)

---

## Core Features

### 1. **User Authentication & Authorization**
- **Registration/Login** with secure password hashing
- **Cookie-based authentication** with configurable expiration
- **Session management** with sliding expiration
- **Access control** for task operations

### 2. **Task Management**
- **CRUD operations** for tasks (Create, Read, Update, Delete)
- **Priority levels**: High, Normal, Low
- **Status tracking**: Pending, Hold, Completed
- **Due date management** with calendar integration
- **Duplicate task prevention**

### 3. **Task Assignment System**
- **Multi-user collaboration** - assign tasks to other users
- **Assignment tracking** - who assigned what to whom
- **Access control** - users can only access their own tasks or assigned tasks
- **Assignment history** with timestamps

### 4. **Document Management**
- **File upload** with size validation (5MB limit)
- **Multiple file support** (max 5 documents per task)
- **File type validation** and content type detection
- **Download functionality** with proper MIME types
- **Document replacement** capability

### 5. **Dashboard & Analytics**
- **Real-time statistics** with task counts and percentages
- **Interactive charts** showing priority and status distribution
- **Task activity trends** with line charts
- **Recent tasks** and upcoming tasks lists
- **Assigned tasks** overview

### 6. **Advanced Features**
- **Task filtering** by priority, status, date range
- **Search functionality** across task titles and descriptions
- **CSV export/import** for bulk operations
- **Responsive design** for mobile and desktop
- **AJAX-powered** UI for smooth user experience

---

## Application Flow

### 1. **User Registration Flow**
```
User Registration → Password Hashing → Database Storage → Auto Login → Dashboard
```

### 2. **Task Creation Flow**
```
Create Task → Validation → Database Insert → Assignment (if specified) → UI Update
```

### 3. **Task Assignment Flow**
```
Select Task → Choose Users → Create Assignments → Update Access Rights → Notify Users
```

### 4. **Document Upload Flow**
```
Select Files → Validation → Convert to Binary → Database Storage → Update UI
```

### 5. **Dashboard Data Flow**
```
Page Load → AJAX Call → Service Layer → Repository → Stored Procedures → Data Processing → Chart Rendering
```

---

## Code Structure

### Project Organization:
```
TodoTaskApp/
├── Controllers/          # MVC Controllers
├── Models/              # Data Models & ViewModels
├── Services/            # Business Logic Layer
├── Repository/          # Data Access Layer
├── IRepository/         # Repository Interfaces
├── IServices/           # Service Interfaces
├── Data/                # Database Context
├── Extensions/          # Custom Extensions
├── Filters/             # Custom Filters
├── Views/               # Razor Views
└── wwwroot/             # Static Files (CSS, JS, Images)
```

### Key Design Principles:
- **Separation of Concerns** - Each layer has distinct responsibilities
- **Interface Segregation** - Small, focused interfaces
- **Dependency Inversion** - High-level modules don't depend on low-level modules
- **Single Responsibility** - Each class has one reason to change

---

## Key Components

### 1. **DapperContext.cs**
```csharp
public class DapperContext
{
    private readonly string _connectionString;
    
    public DapperContext(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
    }
    
    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}
```
**Purpose**: Manages database connections using Dapper ORM

### 2. **AuthExtensions.cs**
```csharp
public static class AuthExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        return int.Parse(user.FindFirst("UserId")?.Value ?? "0");
    }
    
    public static string GetUsername(this ClaimsPrincipal user)
    {
        return user.Identity?.Name ?? string.Empty;
    }
}
```
**Purpose**: Extension methods for user authentication data

### 3. **TodoTaskService.cs**
```csharp
public class TodoTaskService : ITodoTaskService
{
    private readonly ITodoTaskRepository _todoTaskRepository;
    private readonly ITaskAssignmentRepository _taskAssignmentRepository;
    
    public async Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetAllTasksAsync(int userId)
    {
        return await _taskAssignmentRepository.GetAllAccessibleTasksAsync(userId);
    }
}
```
**Purpose**: Business logic for task operations with assignment awareness

### 4. **TaskAssignmentRepository.cs**
```csharp
public async Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetAllAccessibleTasksAsync(int userId)
{
    using var connection = _context.CreateConnection();
    return await connection.QueryAsync<TodoTaskWithAssignmentInfo>(
        "sp_GetAllAccessibleTasks",
        new { UserId = userId },
        commandType: CommandType.StoredProcedure);
}
```
**Purpose**: Data access for task assignments using stored procedures

---

## Security Implementation

### 1. **Password Security**
- **Microsoft.AspNetCore.Identity.PasswordHasher** for secure password hashing
- **Salt and hash** generation for each password
- **Password verification** using built-in methods

### 2. **Authentication Security**
- **Cookie-based authentication** with secure settings
- **HttpOnly cookies** to prevent XSS attacks
- **SameSite=Strict** to prevent CSRF attacks
- **Sliding expiration** for session management

### 3. **Authorization**
- **Role-based access control** (future enhancement)
- **Resource-based authorization** for task access
- **User isolation** - users can only access their own data or assigned data

### 4. **Input Validation**
- **Model validation** with data annotations
- **Server-side validation** for all inputs
- **File upload validation** with size and type checks
- **SQL injection prevention** using parameterized queries

---

## Frontend Architecture

### 1. **Modular JavaScript Architecture**
```javascript
window.TodoApp = {
    Core: { /* Core functionality */ },
    Forms: { /* Form handling */ },
    Assignments: { /* Task assignment logic */ },
    Documents: { /* Document management */ },
    Filters: { /* Task filtering */ },
    Utils: { /* Utility functions */ }
};
```

### 2. **AJAX-Powered UI**
- **Asynchronous data loading** for better performance
- **Real-time updates** without page refresh
- **Error handling** with user-friendly messages
- **Loading indicators** for better UX

### 3. **Responsive Design**
- **Bootstrap 5** for responsive layout
- **Mobile-first approach** for better mobile experience
- **Flexible grid system** for different screen sizes
- **Touch-friendly** interface elements

### 4. **Data Visualization**
- **Chart.js** for interactive charts
- **Real-time data updates** for dashboard
- **Responsive charts** that adapt to screen size
- **Multiple chart types** (pie, donut, line)

---

## API Endpoints

### Authentication Endpoints:
- `GET /Auth/Login` - Login page
- `POST /Auth/Login` - Process login
- `GET /Auth/Signup` - Registration page
- `POST /Auth/Signup` - Process registration
- `POST /Auth/Logout` - Logout user
- `POST /Auth/CheckUsername` - Check username availability

### Task Management Endpoints:
- `GET /Todo` - Main task page
- `GET /Todo/GetAllTasks` - Get all tasks (AJAX)
- `GET /Todo/GetTask/{id}` - Get specific task (AJAX)
- `POST /Todo/CreateTask` - Create new task (AJAX)
- `POST /Todo/UpdateTask` - Update existing task (AJAX)
- `POST /Todo/DeleteTask/{id}` - Delete task (AJAX)
- `POST /Todo/UpdateTaskStatus` - Update task status (AJAX)

### Assignment Endpoints:
- `GET /Todo/GetUsersForAssignment` - Get users for assignment (AJAX)
- `GET /Todo/GetTaskAssignments/{taskId}` - Get task assignments (AJAX)

### Document Endpoints:
- `GET /Todo/GetDocuments/{taskId}` - Get task documents (AJAX)
- `POST /Todo/UploadDocuments` - Upload documents (AJAX)
- `POST /Todo/DeleteDocument` - Delete document (AJAX)
- `GET /Todo/DownloadDocument/{documentId}` - Download document

### Dashboard Endpoints:
- `GET /Dashboard` - Dashboard page
- `GET /Dashboard/GetStatistics` - Get dashboard statistics (AJAX)

---

## Interview Talking Points

### 1. **Architecture Decisions**
- **Why Clean Architecture?** - Separation of concerns, testability, maintainability
- **Why Dapper over Entity Framework?** - Performance, control over SQL, lightweight
- **Why Stored Procedures?** - Performance, security, centralized business logic

### 2. **Technical Challenges Solved**
- **Multi-user task assignment** - Complex access control logic
- **File upload management** - Binary data storage, size validation
- **Real-time dashboard** - Efficient data aggregation and chart rendering
- **Responsive design** - Mobile-first approach with Bootstrap

### 3. **Performance Optimizations**
- **Stored procedures** for complex queries
- **Database indexing** on frequently queried columns
- **AJAX loading** to reduce page load times
- **Efficient data models** to minimize database calls

### 4. **Security Measures**
- **Password hashing** with industry-standard algorithms
- **Input validation** at multiple layers
- **SQL injection prevention** with parameterized queries
- **XSS protection** with proper output encoding

### 5. **Scalability Considerations**
- **Repository pattern** for easy database switching
- **Service layer** for business logic separation
- **Modular JavaScript** for maintainable frontend code
- **Stored procedures** for database optimization

### 6. **Future Enhancements**
- **Real-time notifications** using SignalR
- **Role-based permissions** for advanced access control
- **Task templates** for common task types
- **API versioning** for mobile app integration
- **Caching layer** with Redis for better performance

### 7. **Code Quality**
- **SOLID principles** implementation
- **Dependency injection** for loose coupling
- **Error handling** with proper logging
- **Code documentation** and comments
- **Consistent naming conventions**

---

## Conclusion

This TodoTaskApp demonstrates proficiency in:
- **Full-stack development** with ASP.NET Core
- **Database design** and optimization
- **Security implementation** and best practices
- **Modern web development** with responsive design
- **Clean architecture** and design patterns
- **Performance optimization** techniques
- **User experience** design and implementation

The application showcases real-world development skills including multi-user collaboration, file management, data visualization, and secure authentication - all essential skills for modern web development roles.
