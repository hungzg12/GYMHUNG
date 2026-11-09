using System.Security.Claims;
using GymHung.Application;
using GymManagement.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Api.Controllers;

[ApiController, Route("api/avatars")]
public sealed class AvatarsController(GymDbContext db,AccessService access,IConfiguration configuration) : ControllerBase
{
    private string Root => Path.GetFullPath(configuration["Storage:AvatarPath"] ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"GymHung","avatars"));
    [HttpPost,Authorize,RequestSizeLimit(3*1024*1024)]
    public async Task<IActionResult> Upload(IFormFile file,CancellationToken ct)
    {
        await access.DemandAsync(User,"profile.write",ct);
        if(file.Length is <=0 or >2*1024*1024)throw new ApiException(400,"Ảnh phải nhỏ hơn hoặc bằng 2 MB.");
        await using var input=file.OpenReadStream();using var buffer=new MemoryStream();await input.CopyToAsync(buffer,ct);var bytes=buffer.ToArray();
        var extension=bytes.Length>12 && bytes.AsSpan(0,8).SequenceEqual(new byte[]{137,80,78,71,13,10,26,10})?"png":bytes.Length>4&&bytes[0]==255&&bytes[1]==216&&bytes[2]==255?"jpg":null;
        if(extension is null)throw new ApiException(400,"Chỉ nhận ảnh PNG hoặc JPEG.");
        var id=long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user=await db.Users.SingleAsync(u=>u.UserId==id&&u.Status=="Active",ct);
        Directory.CreateDirectory(Root);var name=Guid.NewGuid().ToString("N")+"."+extension;var path=Path.Combine(Root,name);
        await System.IO.File.WriteAllBytesAsync(path,bytes,ct);
        try{user.AvatarUrl="/api/avatars/"+name;user.UpdatedAt=GymClock.Now;await db.SaveChangesAsync(ct);}
        catch{System.IO.File.Delete(path);throw;}
        return Ok(new {avatarUrl=user.AvatarUrl});
    }
    [HttpGet("{name}")]
    public IActionResult Read(string name)
    {
        var extension=Path.GetExtension(name);
        if(extension is not (".png" or ".jpg") || !Guid.TryParseExact(Path.GetFileNameWithoutExtension(name),"N",out _))return NotFound();
        var path=Path.Combine(Root,name);if(!System.IO.File.Exists(path))return NotFound();
        Response.Headers["X-Content-Type-Options"]="nosniff";
        Response.Headers["Content-Security-Policy"]="default-src 'none'; sandbox";
        return PhysicalFile(path,extension==".png"?"image/png":"image/jpeg");
    }
}
