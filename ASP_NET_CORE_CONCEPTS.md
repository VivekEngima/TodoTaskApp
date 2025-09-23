# ASP.NET Core Concepts in TodoTaskApp

## Table of Contents
1. [Dependency Injection](#dependency-injection)
2. [Middleware Pipeline](#middleware-pipeline)
3. [Model Binding & Validation](#model-binding--validation)
4. [Authentication & Authorization](#authentication--authorization)
5. [Configuration Management](#configuration-management)
6. [Routing](#routing)
7. [Action Results](#action-results)
8. [View Models & Razor Views](#view-models--razor-views)
9. [Tag Helpers](#tag-helpers)
10. [Anti-Forgery Tokens](#anti-forgery-tokens)
11. [Logging](#logging)
12. [Error Handling](#error-handling)
13. [Static Files](#static-files)
14. [JSON Serialization](#json-serialization)
15. [Async/Await Pattern](#asyncawait-pattern)

---

## Dependency Injection

### **What is Dependency Injection?**
Dependency Injection (DI) is a design pattern that implements Inversion of Control (IoC) for resolving dependencies. Instead of creating objects directly, dependencies are injected from the outside.

### **Where it's used in TodoTaskApp:**

#### **1. Service Registration** (Program.cs:16-35)
```csharp
// Database connection
builder.Services.AddScoped<DapperContext>();

// Task management services
builder.Services.AddScoped<ITodoTaskRepository, TodoTaskRepository>();
builder.Services.AddScoped<ITodoTaskService, TodoTaskService>();

// User management services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

// Password security
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
```

**Why use DI here?**
- **Loose Coupling**: Controllers don't directly create service instances
- **Testability**: Easy to mock dependencies for unit testing
- **Lifecycle Management**: ASP.NET Core manages object creation and disposal
- **Configuration**: Centralized service configuration

#### **2. Constructor Injection** (TodoController.cs:17-28)
```csharp
public class TodoController : Controller
{
    private readonly ITodoTaskService _todoTaskService;
    private readonly ITodoTaskDocumentService _documentService;
    private readonly ITaskAssignmentService _taskAssignmentService;
    private readonly ILogger<TodoController> _logger;

    public TodoController(
        ITodoTaskService todoTaskService,
        ITodoTaskDocumentService documentService,
        ITaskAssignmentService taskAssignmentService,
        ILogger<TodoController> logger)
    {
        _todoTaskService = todoTaskService;
        _documentService = documentService;
        _taskAssignmentService = taskAssignmentService;
        _logger = logger;
    }
}
```

**Why constructor injection?**
- **Immutability**: Dependencies are set once and can't be changed
- **Clear Dependencies**: Easy to see what a class depends on
- **Compile-time Safety**: Missing dependencies cause compilation errors

#### **3. Service Lifetimes**
```csharp
builder.Services.AddScoped<ITodoTaskService, TodoTaskService>();  // Per HTTP request
builder.Services.AddSingleton<IConfiguration>(builder.Configuration);  // Application lifetime
builder.Services.AddTransient<ILogger<TodoController>, Logger<TodoController>>();  // Per injection
```

**Why different lifetimes?**
- **Scoped**: Perfect for services that need to be shared within a single HTTP request
- **Singleton**: For stateless services that don't change
- **Transient**: For lightweight, stateless services

---

## Middleware Pipeline

### **What is Middleware?**
Middleware components form a pipeline that handles HTTP requests and responses. Each middleware can process the request before passing it to the next component.

### **Where it's used in TodoTaskApp:**

#### **1. Pipeline Configuration** (Program.cs:62-78)
```csharp
var app = builder.Build();

// Error handling for production
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// Check user login
app.UseAuthentication();
app.UseAuthorization();
```

**Why this order?**
- **Exception Handler**: Must be first to catch all exceptions
- **HTTPS Redirection**: Redirects HTTP to HTTPS before processing
- **Static Files**: Serves CSS, JS, images before routing
- **Routing**: Determines which controller/action to call
- **Authentication**: Verifies user identity
- **Authorization**: Checks if user has permission

#### **2. Custom Middleware Example**
```csharp
// Custom middleware for request logging
app.Use(async (context, next) =>
{
    var start = DateTime.UtcNow;
    await next();
    var elapsed = DateTime.UtcNow - start;
    _logger.LogInformation("Request {Method} {Path} took {ElapsedMs}ms", 
        context.Request.Method, context.Request.Path, elapsed.TotalMilliseconds);
});
```

**Why custom middleware?**
- **Cross-cutting Concerns**: Logging, authentication, error handling
- **Request/Response Modification**: Add headers, modify content
- **Performance Monitoring**: Track request timing

---

## Model Binding & Validation

### **What is Model Binding?**
Model binding automatically maps HTTP request data to action method parameters and model properties.

### **Where it's used in TodoTaskApp:**

#### **1. Form Model Binding** (AuthController.cs:33)
```csharp
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
{
    if (!ModelState.IsValid)
    {
        return View(model);
    }
    // ... rest of the method
}
```

**Why model binding?**
- **Automatic Mapping**: Converts form data to strongly-typed objects
- **Type Safety**: Compile-time checking of property types
- **Validation Integration**: Works seamlessly with data annotations

#### **2. JSON Model Binding** (TodoController.cs:170)
```csharp
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<IActionResult> CreateTask([FromBody] TodoTaskViewModel model)
{
    if (!ModelState.IsValid)
    {
        var errors = ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage);
        return Json(new { success = false, message = "Validation failed", errors = errors });
    }
    // ... rest of the method
}
```

**Why [FromBody]?**
- **JSON Deserialization**: Automatically converts JSON to C# objects
- **AJAX Support**: Essential for modern web applications
- **Content Negotiation**: Handles different content types

#### **3. Data Annotations Validation** (User.cs:10-18)
```csharp
[Required(ErrorMessage = "Username is required")]
[StringLength(50, ErrorMessage = "Username cannot exceed 50 characters")]
[RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username can only contain letters, numbers, and underscores")]
public string Username { get; set; } = string.Empty;

[Required(ErrorMessage = "Password is required")]
[StringLength(255, ErrorMessage = "Password cannot exceed 255 characters")]
public string Password { get; set; } = string.Empty;
```

**Why data annotations?**
- **Declarative Validation**: Rules defined at the model level
- **Client-side Validation**: Automatic JavaScript validation
- **Server-side Validation**: Consistent validation on both sides
- **Custom Error Messages**: User-friendly error messages

---

## Authentication & Authorization

### **What is Authentication/Authorization?**
- **Authentication**: Verifies who the user is (login process)
- **Authorization**: Determines what the user can do (permissions)

### **Where it's used in TodoTaskApp:**

#### **1. Authentication Configuration** (Program.cs:38-49)
```csharp
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Auth/Login";
        options.LogoutPath = "/Auth/Logout";
        options.AccessDeniedPath = "/Auth/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromHours(24);
        options.SlidingExpiration = true;
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.Cookie.SameSite = SameSiteMode.Strict;
    });
```

**Why cookie authentication?**
- **Stateless**: No server-side session storage needed
- **Secure**: HttpOnly prevents XSS, SameSite prevents CSRF
- **Configurable**: Flexible expiration and security settings
- **User-friendly**: Seamless login experience

#### **2. Authorization Attributes** (DashboardController.cs:9)
```csharp
[Authorize]
public class DashboardController : Controller
{
    // All actions require authentication
}
```

**Why [Authorize]?**
- **Protection**: Prevents unauthorized access to sensitive data
- **Declarative**: Easy to apply to controllers/actions
- **Flexible**: Can be applied at different levels

#### **3. Claims-based Identity** (AuthController.cs:53-58)
```csharp
var claims = new List<Claim>
{
    new Claim(ClaimTypes.Name, result.User!.Username),
    new Claim(ClaimTypes.NameIdentifier, result.User.Id.ToString()),
    new Claim("UserId", result.User.Id.ToString())
};

var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
```

**Why claims?**
- **Flexible Identity**: Can store any user information
- **Standardized**: Uses standard claim types
- **Extensible**: Easy to add custom claims
- **Stateless**: No need to query database for user info

---

## Configuration Management

### **What is Configuration Management?**
ASP.NET Core provides a flexible configuration system that can read from multiple sources and merge them into a unified configuration.

### **Where it's used in TodoTaskApp:**

#### **1. Configuration Sources** (appsettings.json)
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=dell;Database=TodoTaskDb;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=True"
  },
  "Authentication": {
    "Cookie": {
      "ExpireTimeSpan": "24:00:00",
      "SlidingExpiration": true
    }
  }
}
```

**Why configuration files?**
- **Environment-specific**: Different settings for dev/staging/production
- **Secure**: Sensitive data can be stored in environment variables
- **Maintainable**: Easy to change settings without recompiling

#### **2. Configuration Injection** (DapperContext.cs:12-17)
```csharp
public class DapperContext
{
    private readonly IConfiguration _configuration;
    private readonly string _connectionString;

    public DapperContext(IConfiguration configuration)
    {
        _configuration = configuration;
        _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
            throw new ArgumentNullException(nameof(configuration), "Connection string 'DefaultConnection' not found.");
    }
}
```

**Why inject IConfiguration?**
- **Dependency Injection**: Follows DI principles
- **Testability**: Easy to mock for unit tests
- **Type Safety**: Strongly-typed configuration access
- **Validation**: Can validate configuration at startup

---

## Routing

### **What is Routing?**
Routing maps incoming HTTP requests to controller actions based on URL patterns.

### **Where it's used in TodoTaskApp:**

#### **1. Convention-based Routing** (Program.cs:81-95)
```csharp
app.MapControllerRoute(
    name: "Auth",
    pattern: "Auth/{action=Login}",
    defaults: new { controller = "Auth" });

app.MapControllerRoute(
    name: "Todo",
    pattern: "Todo/{action}/{id?}",
    defaults: new { controller = "Todo", action = "Index" }
);

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Dashboard}/{action=Index}");
```

**Why convention-based routing?**
- **Flexible**: Can create custom URL patterns
- **SEO-friendly**: Clean, readable URLs
- **RESTful**: Follows REST conventions
- **Backward Compatible**: Works with existing MVC patterns

#### **2. Attribute Routing** (TodoController.cs:81)
```csharp
[HttpGet]
public async Task<IActionResult> GetAllTasks()
{
    // Maps to: GET /Todo/GetAllTasks
}
```

**Why attribute routing?**
- **Explicit**: Clear mapping between URL and action
- **Co-located**: Route definition next to action method
- **Flexible**: Can override convention-based routes
- **API-friendly**: Better for Web API scenarios

---

## Action Results

### **What are Action Results?**
Action Results are return types from controller actions that determine how the HTTP response is generated.

### **Where it's used in TodoTaskApp:**

#### **1. View Results** (AuthController.cs:24)
```csharp
[HttpGet]
public IActionResult Login(string? returnUrl = null)
{
    ViewBag.ReturnUrl = returnUrl;
    return View();  // Returns Login.cshtml view
}
```

**Why View()?**
- **Server-side Rendering**: Generates HTML on the server
- **Model Binding**: Can pass data to the view
- **Layout Support**: Uses shared layouts and partial views

#### **2. JSON Results** (TodoController.cs:119)
```csharp
return Json(new { success = true, data = tasksWithInfo });
```

**Why Json()?**
- **AJAX Support**: Perfect for dynamic web applications
- **API Responses**: Standard format for web APIs
- **Lightweight**: Smaller payload than HTML

#### **3. Redirect Results** (AuthController.cs:81)
```csharp
return RedirectToAction("Index", "Dashboard");
```

**Why RedirectToAction()?**
- **Post-Redirect-Get**: Prevents duplicate form submissions
- **User Experience**: Smooth navigation flow
- **SEO**: Proper HTTP status codes

#### **4. File Results** (TodoController.cs:378)
```csharp
return File(bytes, "text/csv", fileName);
```

**Why File()?**
- **File Downloads**: Serves files to users
- **Content Types**: Proper MIME type handling
- **Streaming**: Efficient for large files

---

## View Models & Razor Views

### **What are View Models?**
View Models are classes specifically designed to carry data between controllers and views, separate from domain models.

### **Where it's used in TodoTaskApp:**

#### **1. View Model Definition** (TodoTaskViewModel.cs)
```csharp
public class TodoTaskViewModel
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = "Normal";
    public string Status { get; set; } = "Pending";
    public DateTime DueDate { get; set; } = DateTime.Now.AddDays(7);
    public List<int> AssignedUserIds { get; set; } = new List<int>();
    public List<TaskAssignmentViewModel> Assignments { get; set; } = new List<TaskAssignmentViewModel>();
}
```

**Why View Models?**
- **Separation of Concerns**: Views don't depend on domain models
- **Data Shaping**: Only include data needed by the view
- **Validation**: View-specific validation rules
- **Security**: Prevent over-posting attacks

#### **2. Razor View Usage** (Todo/Index.cshtml:1-4)
```html
@model IEnumerable<TodoTaskViewModel>
@{
    ViewData["Title"] = "Todo Tasks ✍";
}
```

**Why Razor Views?**
- **Server-side Rendering**: HTML generated on the server
- **IntelliSense**: Full C# IntelliSense support
- **Layout System**: Shared layouts and partial views
- **Model Binding**: Strongly-typed model access

#### **3. ViewBag Usage** (AuthController.cs:26)
```csharp
ViewBag.ReturnUrl = returnUrl;
return View();
```

**Why ViewBag?**
- **Dynamic Data**: Can pass any data type
- **Simple**: Easy to use for small amounts of data
- **Flexible**: No need to create View Models for simple data

---

## Tag Helpers

### **What are Tag Helpers?**
Tag Helpers are server-side components that process HTML elements in Razor views, making HTML generation more natural and maintainable.

### **Where it's used in TodoTaskApp:**

#### **1. Form Tag Helper** (Auth/Login.cshtml)
```html
<form asp-action="Login" asp-controller="Auth" method="post">
    <div class="mb-3">
        <label asp-for="Username" class="form-label"></label>
        <input asp-for="Username" class="form-control" />
        <span asp-validation-for="Username" class="text-danger"></span>
    </div>
</form>
```

**Why Tag Helpers?**
- **HTML-like Syntax**: More natural than HTML helpers
- **IntelliSense**: Full IntelliSense support
- **Maintainable**: Easier to read and maintain
- **Validation**: Automatic client-side validation

#### **2. Validation Tag Helpers**
```html
<span asp-validation-for="Username" class="text-danger"></span>
```

**Why validation Tag Helpers?**
- **Automatic**: Generates validation HTML automatically
- **Client-side**: Enables client-side validation
- **Consistent**: Same validation on client and server

---

## Anti-Forgery Tokens

### **What are Anti-Forgery Tokens?**
Anti-forgery tokens prevent Cross-Site Request Forgery (CSRF) attacks by ensuring that form submissions come from the same origin.

### **Where it's used in TodoTaskApp:**

#### **1. Token Validation** (AuthController.cs:32)
```csharp
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
{
    // Method implementation
}
```

**Why [ValidateAntiForgeryToken]?**
- **Security**: Prevents CSRF attacks
- **Required**: Essential for any form that modifies data
- **Automatic**: ASP.NET Core handles token generation and validation

#### **2. JavaScript Token Setup** (shared-utilities.js)
```javascript
window.TodoApp.Utils.setupAntiForgeryToken = function() {
    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
    // Setup for AJAX requests
};
```

**Why manual token setup?**
- **AJAX Requests**: Manual token inclusion in AJAX calls
- **Security**: Ensures all requests are protected
- **Consistency**: Same protection for all form submissions

---

## Logging

### **What is Logging?**
Logging provides a way to record application events, errors, and diagnostic information for debugging and monitoring.

### **Where it's used in TodoTaskApp:**

#### **1. Logger Injection** (TodoController.cs:15)
```csharp
private readonly ILogger<TodoController> _logger;

public TodoController(/* other dependencies */, ILogger<TodoController> logger)
{
    _logger = logger;
}
```

**Why inject ILogger?**
- **Dependency Injection**: Follows DI principles
- **Type Safety**: Strongly-typed logger for each class
- **Configurable**: Can configure logging levels per class

#### **2. Logging Usage** (TodoController.cs:75)
```csharp
catch (Exception ex)
{
    _logger.LogError(ex, "Error loading todo tasks");
    return View(new List<TodoTaskViewModel>());
}
```

**Why structured logging?**
- **Searchable**: Easy to search and filter logs
- **Contextual**: Includes relevant context information
- **Performance**: Efficient logging with minimal overhead

---

## Error Handling

### **What is Error Handling?**
Error handling provides a way to gracefully handle exceptions and provide meaningful feedback to users.

### **Where it's used in TodoTaskApp:**

#### **1. Global Exception Handling** (Program.cs:65-69)
```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}
```

**Why global exception handling?**
- **User Experience**: Prevents application crashes
- **Security**: Hides sensitive error details in production
- **Monitoring**: Centralized error logging

#### **2. Try-Catch Blocks** (UserService.cs:49-57)
```csharp
try
{
    var result = await _userService.LoginAsync(model);
    // Success handling
}
catch (Exception ex)
{
    _logger.LogError(ex, "Error during login process for user {Username}", model.Username);
    ModelState.AddModelError(string.Empty, "An unexpected error occurred. Please try again.");
    return View(model);
}
```

**Why try-catch blocks?**
- **Graceful Degradation**: Application continues to function
- **User Feedback**: Meaningful error messages
- **Logging**: Error details recorded for debugging

---

## Static Files

### **What are Static Files?**
Static files are served directly by the web server without processing, such as CSS, JavaScript, images, and other assets.

### **Where it's used in TodoTaskApp:**

#### **1. Static Files Middleware** (Program.cs:72)
```csharp
app.UseStaticFiles();
```

**Why UseStaticFiles()?**
- **Performance**: Direct file serving without processing
- **Caching**: Browser can cache static assets
- **CDN Ready**: Easy to move to CDN later

#### **2. Static File Structure** (wwwroot/)
```
wwwroot/
├── css/
│   └── site.css
├── js/
│   ├── todo-main.js
│   ├── dashboard-main.js
│   └── shared-utilities.js
├── lib/
│   ├── bootstrap/
│   ├── jquery/
│   └── chart.js/
└── favicon.ico
```

**Why organized structure?**
- **Maintainability**: Easy to find and manage files
- **Performance**: Can optimize loading order
- **Scalability**: Easy to add new assets

---

## JSON Serialization

### **What is JSON Serialization?**
JSON serialization converts C# objects to JSON format for API responses and AJAX communication.

### **Where it's used in TodoTaskApp:**

#### **1. JSON Configuration** (Program.cs:55-60)
```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.WriteIndented = true;
    });
```

**Why configure JSON options?**
- **Consistency**: Standardized JSON format
- **Readability**: Indented JSON for development
- **Compatibility**: Maintains property names as-is

#### **2. AJAX JSON Responses** (TodoController.cs:119)
```csharp
return Json(new { success = true, data = tasksWithInfo });
```

**Why JSON responses?**
- **AJAX Support**: Perfect for dynamic web applications
- **Lightweight**: Smaller payload than HTML
- **Structured**: Easy to parse on client-side

---

## Async/Await Pattern

### **What is Async/Await?**
Async/await allows methods to perform non-blocking operations, improving application performance and scalability.

### **Where it's used in TodoTaskApp:**

#### **1. Async Controller Actions** (TodoController.cs:31)
```csharp
public async Task<IActionResult> Index()
{
    try
    {
        var userId = User.GetUserId();
        var tasks = await _todoTaskService.GetAllTasksAsync(userId);
        // ... rest of the method
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error loading todo tasks");
        return View(new List<TodoTaskViewModel>());
    }
}
```

**Why async/await?**
- **Performance**: Non-blocking I/O operations
- **Scalability**: Better resource utilization
- **Responsiveness**: UI remains responsive during long operations

#### **2. Async Service Methods** (TodoTaskService.cs:25)
```csharp
public async Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetAllTasksAsync(int userId)
{
    try
    {
        return await _taskAssignmentRepository.GetAllAccessibleTasksAsync(userId);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error getting all tasks for user {UserId}", userId);
        throw;
    }
}
```

**Why async in services?**
- **Database Operations**: Non-blocking database calls
- **Chain of Calls**: Maintains async pattern throughout
- **Error Handling**: Proper exception propagation

#### **3. Async Repository Methods** (TodoTaskRepository.cs:125)
```csharp
public async Task<IEnumerable<TodoTask>> GetAllTasksAsync(int userId)
{
    var query = "GetAllTodoTasks";

    using var connection = _context.CreateConnection();
    var tasks = await connection.QueryAsync<TodoTask>(
        query,
        new { UserId = userId },
        commandType: CommandType.StoredProcedure);

    return tasks;
}
```

**Why async in repositories?**
- **Database I/O**: Non-blocking database operations
- **Resource Management**: Proper connection disposal
- **Performance**: Better throughput for concurrent requests

---

## Summary

### **Key ASP.NET Core Concepts Demonstrated:**

1. **Dependency Injection** - Loose coupling and testability
2. **Middleware Pipeline** - Request/response processing
3. **Model Binding** - Automatic data mapping
4. **Authentication/Authorization** - Security implementation
5. **Configuration Management** - Environment-specific settings
6. **Routing** - URL mapping and RESTful APIs
7. **Action Results** - Response generation
8. **View Models** - Data transfer objects
9. **Tag Helpers** - HTML generation
10. **Anti-Forgery Tokens** - CSRF protection
11. **Logging** - Application monitoring
12. **Error Handling** - Graceful failure management
13. **Static Files** - Asset serving
14. **JSON Serialization** - API communication
15. **Async/Await** - Performance optimization

### **Why These Concepts Matter:**

- **Modern Web Development**: Industry-standard practices
- **Security**: Protection against common attacks
- **Performance**: Scalable and efficient applications
- **Maintainability**: Clean, testable, and maintainable code
- **User Experience**: Responsive and reliable applications

This TodoTaskApp demonstrates proficiency in modern ASP.NET Core development with real-world implementation of these essential concepts! 🚀
