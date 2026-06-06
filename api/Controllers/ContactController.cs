using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private readonly ILogger<ContactController> _logger;

    public ContactController(ILogger<ContactController> logger)
    {
        _logger = logger;
    }

    [HttpPost]
    public IActionResult Submit([FromBody] ContactDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _logger.LogInformation(
            "Contact form: name={Name} email={Email} subject={Subject}",
            dto.Name, dto.Email, dto.Subject);

        return Ok(new { message = "Your message has been received. We'll respond within 24 hours." });
    }
}

public record ContactDto(
    string Name,
    string Email,
    string Subject,
    string Message
);
