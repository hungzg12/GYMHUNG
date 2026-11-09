using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using GymHung.Application;
using GymManagement.Api.Controllers;
using GymManagement.Api.Data;
using GymManagement.Api.Data.Entities;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

var options = new DbContextOptionsBuilder<GymDbContext>().UseSqlServer("Server=.\\SQLEXPRESS;Database=gymhung_restore_verify_20261109;Trusted_Connection=True;TrustServerCertificate=True;").Options;
var protection = new EphemeralDataProtectionProvider();
var hasher = new PasswordHasher<User>();
await using var db = new GymDbContext(options);
var user = await db.Users.Where(u => u.Username.StartsWith("verify.")).OrderByDescending(u => u.UserId).FirstAsync();
var before = user.PasswordHash;
string Ticket(DateTime expires) => protection.CreateProtector("GymHung.PasswordRecovery.v1").Protect(JsonSerializer.Serialize(new { UserId = user.UserId, Stamp = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(before))), Expires = expires }));
PasswordRecoveryController Controller(GymDbContext context) => new(context, protection, new ConfigurationBuilder().Build(), hasher, new WorkspaceService(context, new WorkspaceScope(context), new AccessService(context), hasher), NullLogger<PasswordRecoveryController>.Instance);
async Task<int> Reset(string token)
{
    await using var context = new GymDbContext(options);
    try { await Controller(context).Reset(new(token, "Recovery-verification-Password123"), default); return 204; }
    catch (ApiException error) { return error.Status; }
}
if (await Reset("malformed") != 400) throw new Exception("Malformed token accepted");
if (await Reset(Ticket(DateTime.UtcNow.AddMinutes(-1))) != 400) throw new Exception("Expired token accepted");
var valid = Ticket(DateTime.UtcNow.AddMinutes(15));
var results = await Task.WhenAll(Reset(valid), Reset(valid));
if (!results.Order().SequenceEqual(new[] { 204, 400 })) throw new Exception("Concurrent replay not prevented: " + string.Join(',',results));
if (await Reset(valid) != 400) throw new Exception("Replayed token accepted");
await db.Entry(user).ReloadAsync();
if (hasher.VerifyHashedPassword(user,user.PasswordHash,"Recovery-verification-Password123") == PasswordVerificationResult.Failed) throw new Exception("Password was not persisted");
Console.WriteLine("PASS: malformed, expired, concurrent single-use, replay rejection and persisted password on isolated SQL database.");
