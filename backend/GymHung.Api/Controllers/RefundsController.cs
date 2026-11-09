using System.Security.Claims;
using GymHung.Application;
using GymManagement.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Api.Controllers;

[ApiController, Authorize(Policy="payments.write"), Route("api/refunds")]
public sealed class RefundsController(GymDbContext db, WorkspaceService workspace, WorkspaceScope scope) : ControllerBase
{
    public sealed record RefundRequest(long PaymentId, decimal Amount, string Reason, Guid RequestKey);
    public sealed record Decision(bool Approve);
    public sealed record Payout(string Reference);
    public sealed class RefundRow
    {
        public long RefundId {get;set;}
        public long PaymentId {get;set;}
        [System.ComponentModel.DataAnnotations.Schema.Column(TypeName="decimal(19,4)")]
        public decimal Amount {get;set;}
        public string Reason {get;set;}="";
        public string Status {get;set;}="";
        public long RequestedBy {get;set;}
        public long? ReviewedBy {get;set;}
        public DateTime CreatedAt {get;set;}
        public DateTime? ReviewedAt {get;set;}
        public Guid RequestKey {get;set;}
        public DateTime? PaidAt {get;set;}
        public long? PaidBy {get;set;}
        public string? PayoutReference {get;set;}
    }
    [HttpGet, Authorize(Roles="Admin")]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await db.Database.SqlQueryRaw<RefundRow>("SELECT TOP (500) * FROM dbo.RefundRequests ORDER BY RefundId DESC").ToListAsync(ct));
    [HttpPost("{id:long}/pay"),Authorize(Roles="Admin")]
    public async Task<IActionResult> Pay(long id,Payout request,CancellationToken ct)
    {
        if(string.IsNullOrWhiteSpace(request.Reference)||request.Reference.Length>100)throw new ApiException(400,"Nhập mã phiếu chi tối đa 100 ký tự.");
        await using var tx=await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable,ct);
        await workspace.LockAsync("gym-payments",ct);
        var row=await db.Database.SqlQuery<RefundRow>($"SELECT * FROM dbo.RefundRequests WHERE RefundId={id}").SingleOrDefaultAsync(ct)??throw new ApiException(404,"Không tìm thấy yêu cầu.");
        if(row.Status!="Approved")throw new ApiException(409,"Yêu cầu chưa được duyệt.");
        var reference=request.Reference.Trim();
        if(row.PaidAt is not null){if(row.PayoutReference!=reference)throw new ApiException(409,"Đã ghi nhận chi tiền bằng phiếu khác.");await tx.CommitAsync(ct);return Ok(row);}
        var userId=long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);var now=GymClock.Now;
        await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE dbo.RefundRequests SET PaidAt={now},PaidBy={userId},PayoutReference={reference} WHERE RefundId={id}",ct);
        db.AuditLogs.Add(new GymManagement.Api.Data.Entities.AuditLog{UserId=userId,Action="RefundCashPaid",EntityName="RefundRequests",EntityId=id,CreatedAt=now});
        await db.SaveChangesAsync(ct);await tx.CommitAsync(ct);return Ok(new {paidAt=now});
    }

    [HttpPost]
    public async Task<IActionResult> Create(RefundRequest request,CancellationToken ct)
    {
        if(request.Amount<=0 || request.Amount!=decimal.Round(request.Amount,4) || string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Length>500 || request.RequestKey==Guid.Empty) throw new ApiException(400,"Thông tin hoàn tiền không hợp lệ.");
        await using var tx=await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable,ct);
        await workspace.LockAsync("gym-payments",ct);
        var payment=await db.Payments.FindAsync(new object[]{request.PaymentId},ct) ?? throw new ApiException(404,"Không tìm thấy thanh toán.");
        if(!(await scope.CreateAsync(User,ct))(payment)) throw new ApiException(403,"Thanh toán ngoài phạm vi.");
        var previous=await db.Database.SqlQuery<RefundRow>($"SELECT * FROM dbo.RefundRequests WHERE RequestKey={request.RequestKey}").SingleOrDefaultAsync(ct);
        if(previous is not null){if(previous.PaymentId!=request.PaymentId || previous.Amount!=request.Amount || previous.Reason!=request.Reason.Trim())throw new ApiException(409,"Mã yêu cầu đã dùng cho nội dung khác.");await tx.CommitAsync(ct);return Ok(previous);}
        if(payment.Status!="Completed" || payment.PaymentMethod!="Cash")throw new ApiException(409,"Luồng này chỉ ghi nhận hoàn tiền mặt cho khoản đã thu. Thanh toán online cần nhà cung cấp xác nhận.");
        var reserved=await db.Database.SqlQuery<decimal>($"SELECT COALESCE(SUM(Amount),0) AS Value FROM dbo.RefundRequests WHERE PaymentId={request.PaymentId} AND Status IN ('Pending','Approved')").SingleAsync(ct);
        if(reserved+request.Amount>payment.Amount)throw new ApiException(409,"Tổng tiền hoàn và chờ duyệt vượt số tiền đã thu.");
        var userId=long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var reason=request.Reason.Trim();var now=GymClock.Now;
        await db.Database.ExecuteSqlInterpolatedAsync($"INSERT dbo.RefundRequests(PaymentId,Amount,Reason,RequestedBy,CreatedAt,RequestKey) VALUES({request.PaymentId},{request.Amount},{reason},{userId},{now},{request.RequestKey})",ct);
        var result=await db.Database.SqlQuery<RefundRow>($"SELECT * FROM dbo.RefundRequests WHERE RequestKey={request.RequestKey}").SingleAsync(ct);
        await tx.CommitAsync(ct);return Ok(result);
    }
    [HttpPost("{id:long}/review"),Authorize(Roles="Admin")]
    public async Task<IActionResult> Review(long id,Decision request,CancellationToken ct)
    {
        await using var tx=await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable,ct);
        await workspace.LockAsync("gym-payments",ct);
        var row=await db.Database.SqlQuery<RefundRow>($"SELECT * FROM dbo.RefundRequests WHERE RefundId={id}").SingleOrDefaultAsync(ct) ?? throw new ApiException(404,"Không tìm thấy yêu cầu.");
        var status=request.Approve?"Approved":"Rejected";
        if(row.Status!="Pending"){if(row.Status!=status)throw new ApiException(409,"Yêu cầu đã được xử lý.");await tx.CommitAsync(ct);return Ok(row);}
        var userId=long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);var now=GymClock.Now;
        await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE dbo.RefundRequests SET Status={status},ReviewedBy={userId},ReviewedAt={now} WHERE RefundId={id}",ct);
        await tx.CommitAsync(ct);return Ok(new {status});
    }
}
