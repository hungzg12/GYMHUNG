using System.Security.Claims;
using GymManagement.Api.Data;
using GymManagement.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
namespace GymHung.Application;

public interface IAiProvider
{
    string Name
    {
        get;
    }
    Task<string> AnswerAsync(string message, string? goal, CancellationToken ct);
}
public sealed class DemoAiProvider : IAiProvider
{
    public string Name => "AI demo — rules-v1"; public Task<string> AnswerAsync(string message, string? goal, CancellationToken ct) => Task.FromResult($"[AI demo • rules-v1] Mục tiêu hiện tại: {goal ?? "chưa cập nhật"}. Đây là phản hồi mô phỏng. Bạn có thể theo dõi lịch tập, giáo án được PT xác nhận và ghi nhận tiến độ trong GYM HUNG. Với đề xuất giáo án, hãy xem lại cùng PT trước khi xác nhận lưu.");
}
public sealed class AiService(GymDbContext db, WorkspaceScope scope, AccessService access, IAiProvider provider)
{
    public async Task<object> SendAsync(ClaimsPrincipal p, long id, string? message, CancellationToken ct)
    {
        await access.DemandAsync(p, "ai.write", ct);
        if (string.IsNullOrWhiteSpace(message) || message.Length > 4000)
            throw new ApiException(400, "Tin nhắn cần từ 1 đến 4000 ký tự.");
        var conversation = await db.AIConversations.SingleOrDefaultAsync(x => x.ConversationId == id, ct) ?? throw new ApiException(404, "Không tìm thấy cuộc trò chuyện.");
        var allowed = await scope.CreateAsync(p, ct);
        if (!allowed(conversation))
            throw new ApiException(403, "Cuộc trò chuyện ngoài phạm vi tài khoản.");
        if (conversation.Status != "Active")
            throw new ApiException(409, "Cuộc trò chuyện đã đóng.");
        var member = await db.Members.FindAsync(new object[] { conversation.MemberId }, ct);
        var response = await provider.AnswerAsync(message, member?.Goal, ct);
        var userMessage = new AIConversationMessage { ConversationId = id, SenderType = "User", Message = message.Trim(), CreatedAt = GymClock.Now };
        var reply = new AIConversationMessage { ConversationId = id, SenderType = "Assistant", Message = response, ContextData = "{\"provider\":\"demo\",\"modelVersion\":\"rules-v1\"}", CreatedAt = GymClock.Now };
        db.AddRange(userMessage, reply);
        conversation.UpdatedAt = GymClock.Now;
        await db.SaveChangesAsync(ct);
        var type = db.Model.FindEntityType(typeof(AIConversationMessage))!;
        return new
        {
            provider = provider.Name,
            userMessage = ResourceDto.From(userMessage, type),
            assistantMessage = ResourceDto.From(reply, type)
        };
    }
    public async Task<object> AcceptAsync(ClaimsPrincipal p, long recommendationId, ConfirmedAiPlan request, CancellationToken ct)
    {
        await access.DemandAsync(p, "ai.write", ct);
        if (!request.Confirmed)
            throw new ApiException(400, "Cần xác nhận giáo án trước khi lưu.");
        if (string.IsNullOrWhiteSpace(request.PlanName) || request.PlanName.Length > 200 || request.Goal?.Length > 500 || request.EndDate < request.StartDate)
            throw new ApiException(400, "Thông tin giáo án không hợp lệ.");
        var recommendation = await db.AIRecommendations.FindAsync(new object[] { recommendationId }, ct) ?? throw new ApiException(404, "Khuyến nghị không tồn tại.");
        var allowed = await scope.CreateAsync(p, ct);
        if (!allowed(recommendation))
            throw new ApiException(403, "Khuyến nghị ngoài phạm vi tài khoản.");
        if (request.TrainerId != null && !await db.MemberTrainers.AnyAsync(x => x.MemberId == recommendation.MemberId && x.TrainerId == request.TrainerId && x.Status == "Active", ct))
            throw new ApiException(400, "PT chưa được phân công cho hội viên.");
        var plan = new WorkoutPlan { MemberId = recommendation.MemberId, TrainerId = request.TrainerId, PlanName = request.PlanName, Goal = request.Goal, StartDate = request.StartDate, EndDate = request.EndDate, Note = "[AI demo đã được người dùng xác nhận] " + request.Note, Status = "Active", CreatedAt = GymClock.Now };
        db.Add(plan);
        db.Add(new AuditLog { UserId = long.Parse(p.FindFirstValue(ClaimTypes.NameIdentifier)!), Action = "ConfirmAiPlan", EntityName = "WorkoutPlans", CreatedAt = GymClock.Now });
        recommendation.IsRead = true;
        await db.SaveChangesAsync(ct);
        return ResourceDto.From(plan, db.Model.FindEntityType(typeof(WorkoutPlan))!);
    }
    public async Task<object> ChurnAsync(ClaimsPrincipal p, long memberId, CancellationToken ct)
    {
        await access.DemandAsync(p, "churn.write", ct);
        var member = await db.Members.FindAsync(new object[] { memberId }, ct) ?? throw new ApiException(404, "Không tìm thấy hội viên.");
        var allowed = await scope.CreateAsync(p, ct);
        if (!allowed(member))
            throw new ApiException(403, "Hội viên ngoài phạm vi tài khoản.");
        var last = await db.CheckIns.Where(x => x.MemberId == memberId).OrderByDescending(x => x.CheckInTime).Select(x => (DateTime?)x.CheckInTime).FirstOrDefaultAsync(ct);
        var days = last == null ? 30 : Math.Max(0, (GymClock.Now - last.Value).Days);
        var score = 100m * Math.Min(1m, days / 30m);
        var row = new ChurnPrediction { MemberId = memberId, PredictionDate = GymClock.Now, CreatedAt = GymClock.Now, RiskScore = decimal.Round(score, 4), RiskLevel = score >= 70m ? "High" : score >= 40m ? "Medium" : "Low", Factors = $"Demo: số ngày từ check-in gần nhất = {days}. Điểm (0–100) = 100 * min(1, ngày / 30). Không có check-in: 30 ngày.", RecommendedActions = "Liên hệ hội viên để thống nhất lịch tập và mục tiêu.", ModelVersion = "demo-rules-v1-no-ml" };
        db.Add(row);
        await db.SaveChangesAsync(ct);
        return ResourceDto.From(row, db.Model.FindEntityType(typeof(ChurnPrediction))!);
    }
}



public sealed record ConfirmedAiPlan(bool Confirmed, string PlanName, string? Goal, long? TrainerId, DateOnly? StartDate, DateOnly? EndDate, string? Note);

