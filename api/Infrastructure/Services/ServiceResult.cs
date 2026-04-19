using api.Infrastructure.Services; // ✅ Bu eksikti

namespace api.Infrastructure.Services;

/// <summary>
/// Servis katmanından dönen sonuçları sarmalayan generic wrapper.
/// Controller'larda if/else yerine .Success kontrolü kullanılır.
/// </summary>
public class ServiceResult<T>
{
    public bool Success { get; private set; }
    public string Message { get; private set; } = string.Empty;
    public T? Data { get; private set; }

    private ServiceResult() { }

    public static ServiceResult<T> Ok(T data, string message = "") =>
        new()
        {
            Success = true,
            Data = data,
            Message = message,
        };

    public static ServiceResult<T> Fail(string message) =>
        new() { Success = false, Message = message };
}

/// <summary>
/// Veri dönmeyen işlemler için.
/// </summary>
public class ServiceResult
{
    public bool Success { get; private set; }
    public string Message { get; private set; } = string.Empty;

    private ServiceResult() { }

    public static ServiceResult Ok(string message = "") =>
        new() { Success = true, Message = message };

    public static ServiceResult Fail(string message) =>
        new() { Success = false, Message = message };
}
