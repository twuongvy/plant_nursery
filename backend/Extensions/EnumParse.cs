namespace PlantNursery.Api.Extensions;

public static class EnumParse
{
    public static bool TryParseDefined<T>(string? value, out T result) where T : struct, Enum
    {
        result = default;
        if (string.IsNullOrWhiteSpace(value)) return false;

        var trimmed = value.Trim();
        if (trimmed.Length > 0 && trimmed.All(char.IsDigit))
            return false;

        if (!Enum.TryParse(trimmed, ignoreCase: true, out T parsed))
            return false;
        if (!Enum.IsDefined(parsed))
            return false;

        result = parsed;
        return true;
    }
}
