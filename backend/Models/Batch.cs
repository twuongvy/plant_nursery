using System.ComponentModel.DataAnnotations;

namespace PlantNursery.Api.Models;

public class Batch
{
    public int Id { get; set; }

    public int PlantSpeciesId { get; set; }
    public PlantSpecies PlantSpecies { get; set; } = null!;

    public int Quantity { get; set; }

    public DateTime PlantedAt { get; set; }

    public HealthStatus HealthStatus { get; set; } = HealthStatus.Healthy;

    [MaxLength(100)]
    public string? LocationLabel { get; set; }

    public BatchStatus Status { get; set; } = BatchStatus.Growing;

    public ICollection<WateringLog> WateringLogs { get; set; } = new List<WateringLog>();
}
