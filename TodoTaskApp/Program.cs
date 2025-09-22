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

// Add Dapper Context
builder.Services.AddScoped<DapperContext>();

builder.Services.AddScoped<ITodoTaskRepository, TodoTaskRepository>();
builder.Services.AddScoped<ITodoTaskService, TodoTaskService>();
// Add document repositories and services
builder.Services.AddScoped<ITodoTaskDocumentRepository, TodoTaskDocumentRepository>();
builder.Services.AddScoped<ITodoTaskDocumentService, TodoTaskDocumentService>();

// Add User authentication services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

// ADD Task Assignment services
builder.Services.AddScoped<ITaskAssignmentRepository, TaskAssignmentRepository>();
builder.Services.AddScoped<ITaskAssignmentService, TaskAssignmentService>();

// Add Password Hasher
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// Add Cookie Authentication
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

// Add Authorization
builder.Services.AddAuthorization();

// Add JSON options for better serialization
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.WriteIndented = true;
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// Configure routes
app.MapControllerRoute(
    name: "Auth",
    pattern: "Auth/{action=Login}",
    defaults: new { controller = "Auth" });

app.MapControllerRoute(
    name: "Todo",
    pattern: "Todo/{action}/{id?}",
    defaults: new { controller = "Todo", action = "Index" }
);

// Default Home Route - redirect unauthenticated users to login
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Dashboard}/{action=Index}");

app.Run();