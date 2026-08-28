using System.ComponentModel.DataAnnotations;

namespace PlantNursery.Api.Models;

public class User
{
    public int Id { get; set; }

    [Required, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public ICollection<WateringLog> WateringLogs { get; set; } = new List<WateringLog>();
}
