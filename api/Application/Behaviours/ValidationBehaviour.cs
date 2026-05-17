using FluentValidation;
using MediatR;

namespace api.Application.Behaviours;

/// <summary>
/// MediatR pipeline behavior — her IRequest gönderiminde kayıtlı FluentValidation
/// validator'larını otomatik olarak tetikler. Herhangi bir validation hatası varsa
/// ValidationException fırlatır; controller'da 400 Bad Request'e dönüştürülür.
/// </summary>
public class ValidationBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehaviour(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        if (!_validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);

        var failures = _validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next();
    }
}
