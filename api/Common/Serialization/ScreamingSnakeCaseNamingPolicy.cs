using System.Text.Json;

namespace api.Common.Serialization;

/// <summary>
/// JSON naming policy that converts PascalCase enum member names to SCREAMING_SNAKE_CASE.
/// Used with <see cref="System.Text.Json.Serialization.JsonStringEnumConverter"/> so that
/// enum properties serialized inline (not via .ToString()) also produce the correct format.
///
/// Consecutive uppercase letters (acronyms) are treated as a single word:
///   EStore → ESTORE  (not E_STORE)
///   PaymentConfirmed → PAYMENT_CONFIRMED
/// </summary>
public sealed class ScreamingSnakeCaseNamingPolicy : JsonNamingPolicy
{
    public static readonly ScreamingSnakeCaseNamingPolicy Instance = new();

    public override string ConvertName(string name)
    {
        if (string.IsNullOrEmpty(name)) return name;

        var sb = new System.Text.StringBuilder(name.Length + 4);
        for (var i = 0; i < name.Length; i++)
        {
            var c = name[i];
            if (i > 0 && char.IsUpper(c) && !char.IsUpper(name[i - 1]))
                sb.Append('_');
            sb.Append(char.ToUpperInvariant(c));
        }
        return sb.ToString();
    }
}
