using System.Security.Claims;
using System.Text.Json;
using GymHung.Application;
using GymManagement.Api.Data;
using GymManagement.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Api.Controllers;

[ApiController, Authorize, Route("api/memberships")]
public sealed class MembershipLifecycleController(GymDbContext db, WorkspaceService workspace, AccessService access, WorkspaceScope scope) : ControllerBase
{
    public sealed record FreezeRequest(string Reason);
    [HttpPost("{id:long}/freeze")]
    public async Task<IActionResult> Freeze(long id, FreezeRequest request, CancellationToken ct)
    {
        await access.DemandAsync(User,"packages.write",ct);
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Length > 500) throw new ApiException(400,"Nhập lý do tối đa 500 ký tự.");
        await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable,ct);
        await workspace.LockAsync("membership-lifecycle",ct);
        var package = await db.MemberPackages.FindAsync(new object[]{id},ct) ?? throw new ApiException(404,"Không tìm thấy gói.");
        if (!(await scope.CreateAsync(User,ct))(package)) throw new ApiException(403,"Gói ngoài phạm vi tài khoản.");
        if(package.Status != "Active" || package.EndDate is null || package.EndDate < GymClock.Today || package.StartDate > GymClock.Today) throw new ApiException(409,"Chỉ bảo lưu gói theo ngày đang hiệu lực.");
        package.Status="Suspended";
        package.UpdatedAt=GymClock.Now;
        db.Add(new AuditLog {UserId=long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!),Action="FreezeMembership",EntityName="MemberPackages",EntityId=id,NewData=JsonSerializer.Serialize(new {reason=request.Reason.Trim(),start=GymClock.Today,endDate=package.EndDate}),CreatedAt=GymClock.Now});
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return Ok(new {status=package.Status});
    }
    [HttpPost("{id:long}/resume")]
    public async Task<IActionResult> Resume(long id,CancellationToken ct)
    {
        await access.DemandAsync(User,"packages.write",ct);
        await using var tx=await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable,ct);
        await workspace.LockAsync("membership-lifecycle",ct);
        var package=await db.MemberPackages.FindAsync(new object[]{id},ct) ?? throw new ApiException(404,"Không tìm thấy gói.");
        if (!(await scope.CreateAsync(User,ct))(package)) throw new ApiException(403,"Gói ngoài phạm vi tài khoản.");
        var last=await db.AuditLogs.Where(x=>x.EntityName=="MemberPackages" && x.EntityId==id && (x.Action=="FreezeMembership" || x.Action=="ResumeMembership")).OrderByDescending(x=>x.AuditLogId).FirstOrDefaultAsync(ct);
        if(package.Status!="Suspended" || package.EndDate is null || last?.Action!="FreezeMembership") throw new ApiException(409,"Không có đợt bảo lưu đang mở.");
        var days=GymClock.Today.DayNumber-DateOnly.FromDateTime(last.CreatedAt).DayNumber;
        var previousEnd=package.EndDate;
        package.EndDate=package.EndDate.Value.AddDays(days); package.Status="Active"; package.UpdatedAt=GymClock.Now;
        db.Add(new AuditLog {UserId=long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!),Action="ResumeMembership",EntityName="MemberPackages",EntityId=id,NewData=JsonSerializer.Serialize(new {days,previousEnd,endDate=package.EndDate}),CreatedAt=GymClock.Now});
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return Ok(new {status=package.Status,extendedDays=days,endDate=package.EndDate});
    }
}
