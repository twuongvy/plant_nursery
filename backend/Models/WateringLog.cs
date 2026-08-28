using System.ComponentModel.DataAnnotations;

namespace PlantNursery.Api.Models;

public class WateringLog
{
    public int Id { get; set; }

    public int BatchId { get; set; }
    public Batch Batch { get; set; } = null!;

    public DateTime WateredAt { get; set; }

    public int WateredByUserId { get; set; }
    public User WateredByUser { get; set; } = null!;

    [MaxLength(500)]
    public string? Note { get; set; }
}
