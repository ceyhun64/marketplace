namespace api.Common.Extensions;

public static class EnumExtensions
{
    /// <summary>
    /// Converts a PascalCase C# enum value to SCREAMING_SNAKE_CASE for JSON API responses.
    /// Consecutive uppercase letters (acronyms like "EStore") are kept together without underscores.
    ///
    /// Examples:
    ///   OrderStatus.PaymentConfirmed → "PAYMENT_CONFIRMED"
    ///   ShipmentStatus.PickedUp      → "PICKED_UP"
    ///   OrderSource.Marketplace      → "MARKETPLACE"
    ///   OrderSource.EStore           → "ESTORE"
    ///   ShippingRate.Regular         → "REGULAR"
    /// </summary>
    public static string ToApiString(this Enum value)
    {
        var name = value.ToString();
        var sb = new System.Text.StringBuilder(name.Length + 4);

        for (var i = 0; i < name.Length; i++)
        {
            var c = name[i];
            // Insert underscore before an uppercase letter only when the preceding character
            // was NOT also uppercase (handles acronyms like "EStore" → "ESTORE" not "E_STORE").
            if (i > 0 && char.IsUpper(c) && !char.IsUpper(name[i - 1]))
                sb.Append('_');
            sb.Append(char.ToUpperInvariant(c));
        }

        return sb.ToString();
    }
}
