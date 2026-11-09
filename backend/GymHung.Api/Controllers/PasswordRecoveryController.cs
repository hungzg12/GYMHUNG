using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using GymHung.Application;
using GymManagement.Api.Data;
using GymManagement.Api.Data.Entities;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Api.Controllers;

[ApiController, Route("api/auth"), EnableRateLimiting("login")]
public sealed class PasswordRecoveryController(GymDbContext db, IDataProtectionProvider protection, IConfiguration config, IPasswordHasher<User> hasher, WorkspaceService workspace, ILogger<PasswordRecoveryController> logger) : ControllerBase
{
    public sealed record ForgotRequest(string Email);
    public sealed record ResetRequest(string Token, string NewPassword);
    private sealed record Ticket(long UserId, string Stamp, DateTime Expires);
    private static string Stamp(string hash) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(hash)));

    [HttpPost("forgot-password")]
    public async Task<IActionResult> Forgot(ForgotRequest request, CancellationToken ct)
    {
        var host = config["Mail:Host"];
        var from = config["Mail:From"];
        var resetUrl = config["Mail:ResetUrl"];
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from) || !Uri.TryCreate(resetUrl, UriKind.Absolute, out var uri) || uri.Scheme != "https")
            throw new ApiException(503, "Chức năng khôi phục mật khẩu chưa được cấu hình. Vui lòng liên hệ phòng tập.");
        if (!MailAddress.TryCreate(request.Email, out _)) throw new ApiException(400, "Email không hợp lệ.");
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == request.Email.Trim() && u.Status == "Active", ct);
        if (user is not null)
        {
            var token = protection.CreateProtector("GymHung.PasswordRecovery.v1").Protect(JsonSerializer.Serialize(new Ticket(user.UserId, Stamp(user.PasswordHash), DateTime.UtcNow.AddMinutes(15))));
            var link = resetUrl + (resetUrl!.Contains('?') ? "&" : "?") + "resetToken=" + Uri.EscapeDataString(token);
            using var smtp = new SmtpClient(host, config.GetValue("Mail:Port", 587)) { EnableSsl = true };
            if (!string.IsNullOrWhiteSpace(config["Mail:Username"])) smtp.Credentials = new NetworkCredential(config["Mail:Username"], config["Mail:Password"]);
            using var message = new MailMessage(from!, user.Email, "GYM HUNG - Đặt lại mật khẩu", $"Liên kết có hiệu lực 15 phút:\n{link}\nNếu bạn không yêu cầu, hãy bỏ qua email này.");
            try { await smtp.SendMailAsync(message, ct); }
            catch (SmtpException) { logger.LogError("Password recovery mail delivery failed. TraceId={TraceId}", HttpContext.TraceIdentifier); }
        }
        return Ok(new { message = "Nếu email khớp tài khoản đang hoạt động, liên kết đặt lại mật khẩu sẽ được gửi đến bạn." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> Reset(ResetRequest request, CancellationToken ct)
    {
        if (request.NewPassword.Length is < 8 or > 128 || request.Token.Length > 4096) throw new ApiException(400, "Dữ liệu không hợp lệ.");
        Ticket ticket;
        try { ticket = JsonSerializer.Deserialize<Ticket>(protection.CreateProtector("GymHung.PasswordRecovery.v1").Unprotect(request.Token))!; }
        catch (Exception ex) when (ex is CryptographicException or JsonException or ArgumentException) { throw new ApiException(400, "Liên kết không hợp lệ hoặc đã hết hạn."); }
        if (ticket is null || ticket.Expires <= DateTime.UtcNow) throw new ApiException(400, "Liên kết không hợp lệ hoặc đã hết hạn.");
        await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, ct);
        await workspace.LockAsync("password-recovery", ct);
        var user = await db.Users.SingleOrDefaultAsync(u => u.UserId == ticket.UserId && u.Status == "Active", ct);
        if (user is null || Stamp(user.PasswordHash) != ticket.Stamp) throw new ApiException(400, "Liên kết không hợp lệ hoặc đã hết hạn.");
        user.PasswordHash = hasher.HashPassword(user, request.NewPassword);
        user.UpdatedAt = GymClock.Now;
        db.Add(new AuditLog { UserId = user.UserId, Action = "ResetPassword", EntityName = "Users", EntityId = user.UserId, CreatedAt = GymClock.Now });
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return NoContent();
    }
}
