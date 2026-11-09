using System.Security.Cryptography;
using System.Text;

namespace GymManagement.Api;

public static class SessionStamp
{
    public static string Create(string passwordHash, string signingKey) =>
        Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(signingKey), Encoding.UTF8.GetBytes(passwordHash)));
}
