using System.Security.Claims;
using Microsoft.AspNetCore.DataProtection;
using System.Text;
using System.Threading.RateLimiting;
using GymHung.Application;
using GymManagement.Api.Data;
using GymManagement.Api.Data.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
var builder = WebApplication.CreateBuilder(args);
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured.");
if (Encoding.UTF8.GetByteCount(jwtKey) < 32) throw new InvalidOperationException("JWT signing key requires at least 32 bytes.");
if (!builder.Environment.IsDevelopment())
{
    if (jwtKey.Contains("dev-only", StringComparison.OrdinalIgnoreCase) || jwtKey.Contains("change", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Configure a private production JWT signing key.");
    var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>();
    if (origins is null || origins.Length == 0 || origins.Any(origin => !Uri.TryCreate(origin, UriKind.Absolute, out var uri) || uri.Scheme != "https" || uri.AbsolutePath != "/" || !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment)))
        throw new InvalidOperationException("Configure explicit HTTPS frontend origins for production.");
}
builder.Services.AddControllers().AddJsonOptions(o => { o.JsonSerializerOptions.Converters.Add(new LongStringConverter()); o.JsonSerializerOptions.Converters.Add(new DecimalStringConverter()); });
var protection = builder.Services.AddDataProtection().SetApplicationName("GymHung");
if (builder.Configuration["DataProtection:KeyPath"] is { Length: > 0 } keyPath)
    protection.PersistKeysToFileSystem(new DirectoryInfo(keyPath));
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<GymDbContext>(o => o.UseSqlServer(builder.Configuration.GetConnectionString("GymDatabase")));
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<WorkspaceScope>();
builder.Services.AddScoped<AccessService>();
builder.Services.AddScoped<WorkspaceService>();
builder.Services.AddScoped<ResourceQueryService>();
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<AiService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<PaymentService>();
builder.Services.AddScoped<IAiProvider, DemoAiProvider>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => { o.TokenValidationParameters = new TokenValidationParameters { ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true, ValidIssuer = builder.Configuration["Jwt:Issuer"], ValidAudience = builder.Configuration["Jwt:Audience"], IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), ClockSkew = TimeSpan.FromSeconds(30) }; o.Events = new JwtBearerEvents { OnTokenValidated = async context => { if (!long.TryParse(context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id)) { context.Fail("Invalid subject"); return; } var db = context.HttpContext.RequestServices.GetRequiredService<GymDbContext>(); var hash = await db.Users.Where(u => u.UserId == id && u.Status == "Active").Select(u => u.PasswordHash).SingleOrDefaultAsync(); if (hash is null || context.Principal?.FindFirstValue("security_stamp") != GymManagement.Api.SessionStamp.Create(hash, jwtKey)) context.Fail("Session revoked"); } }; });
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, GymManagement.Api.DatabasePermissionHandler>();
builder.Services.AddAuthorization(o => { foreach (var code in new[] { "dashboard.read", "payments.write", "ai.write", "churn.write" }) o.AddPolicy(code, p => p.RequireAuthenticatedUser().AddRequirements(new GymManagement.Api.DatabasePermission(code))); });
builder.Services.AddCors(o => o.AddPolicy("frontend", p => p.WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? new[] { "http://localhost:3107", "http://127.0.0.1:3107", "http://localhost:5173", "http://127.0.0.1:5173" }).AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddRateLimiter(o => { o.RejectionStatusCode = 429; o.AddPolicy("login", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 })); });
var app = builder.Build();
app.Use(async (context, next) => { try { await next(); } catch (Exception ex) { var status = ex switch { ApiException a => a.Status, Microsoft.EntityFrameworkCore.DbUpdateException => 409, Microsoft.Data.SqlClient.SqlException s when s.Number is 1205 or 51000 => 409, _ => 500 }; var message = ex is ApiException ? ex.Message : status == 409 ? "Dữ liệu trùng, đang được sử dụng hoặc đã thay đổi. Vui lòng tải lại." : "Không thể xử lý yêu cầu. Vui lòng thử lại."; if (status == 500) app.Logger.LogError("Unhandled request failure. TraceId={TraceId}, Type={Type}", context.TraceIdentifier, ex.GetType().Name); context.Response.StatusCode = status; await Results.Problem(statusCode: status, title: message, detail: status < 500 ? message : null, extensions: new Dictionary<string, object?> { { "traceId", context.TraceIdentifier } }).ExecuteAsync(context); } });
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); } else { app.UseHsts(); app.UseHttpsRedirection(); }
app.UseCors("frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
public partial class Program
{
}


