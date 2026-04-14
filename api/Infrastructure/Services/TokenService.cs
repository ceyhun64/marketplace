using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using api.Domain.Entities;
using Microsoft.IdentityModel.Tokens;

namespace api.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["JWT_SECRET"]!));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email,          user.Email),
            new(ClaimTypes.Role,           user.Role.ToString()),
        };

        // Attach MerchantId claim so controllers can scope queries
        if (user.MerchantProfile is not null)
            claims.Add(new Claim("merchantId", user.MerchantProfile.Id.ToString()));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = int.TryParse(_config["JWT_EXPIRES_MINUTES"], out var m) ? m : 15;

        var token = new JwtSecurityToken(
            issuer:   _config["JWT_ISSUER"],
            audience: _config["JWT_AUDIENCE"],
            claims:   claims,
            expires:  DateTime.UtcNow.AddMinutes(expires),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public Guid? GetUserIdFromToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);
            var idClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(idClaim, out var id) ? id : null;
        }
        catch
        {
            return null;
        }
    }
}