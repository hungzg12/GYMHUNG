using GymHung.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace GymManagement.Api.Controllers;

[ApiController, Authorize, Route("api/ai")]
public sealed class AiAssistantController(AiService service, WorkspaceService workspace) : ControllerBase
{
    [HttpPost("conversations/{conversationId:long}/messages")] public async Task<IActionResult> SendMessage(long conversationId, ChatRequest request, CancellationToken ct) => Ok(await service.SendAsync(User, conversationId, request.Message, ct));
    [HttpPost("churn/{memberId:long}")] public async Task<IActionResult> Churn(long memberId, CancellationToken ct) => Ok(await service.ChurnAsync(User, memberId, ct));
    [HttpPost("recommendations/{id:long}/accept-plan")] public async Task<IActionResult> Accept(long id, ConfirmedAiPlan request, CancellationToken ct) => Ok(await service.AcceptAsync(User, id, request, ct));
    [HttpPost("plans/confirm")]
    public async Task<IActionResult> Confirm(ConfirmPlanRequest request, CancellationToken ct)
    {
        if (!request.Confirmed)
            throw new ApiException(400, "Cần xác nhận giáo án trước khi lưu.");
        return Ok(await workspace.SaveAsync(User, "WorkoutPlans", null, new MutationRequest(request.Draft), ct));
    }
    public sealed record ChatRequest(string? Message); public sealed record ConfirmPlanRequest(bool Confirmed, System.Text.Json.JsonElement Draft);
}

