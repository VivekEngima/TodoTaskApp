using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using TodoTaskApp.Data;
using TodoTaskApp.IRepository;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;
using TodoTaskApp.Repository;
using TodoTaskApp.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// Database connection
builder.Services.AddScoped<DapperContext>();

// Task management services
builder.Services.AddScoped<ITodoTaskRepository, TodoTaskRepository>();
builder.Services.AddScoped<ITodoTaskService, TodoTaskService>();

// Document handling services
builder.Services.AddScoped<ITodoTaskDocumentRepository, TodoTaskDocumentRepository>();
builder.Services.AddScoped<ITodoTaskDocumentService, TodoTaskDocumentService>();

// User management services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

// Task assignment services
builder.Services.AddScoped<ITaskAssignmentRepository, TaskAssignmentRepository>();
builder.Services.AddScoped<ITaskAssignmentService, TaskAssignmentService>();

// Password security
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// User login system
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

// User permissions
builder.Services.AddAuthorization();

// JSON formatting
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.WriteIndented = true;
    });

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

// URL routing
app.MapControllerRoute(
    name: "Auth",
    pattern: "Auth/{action=Login}",
    defaults: new { controller = "Auth" });

app.MapControllerRoute(
    name: "Todo",
    pattern: "Todo/{action}/{id?}",
    defaults: new { controller = "Todo", action = "Index" }
);

// Main page
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Dashboard}/{action=Index}");

app.Run();