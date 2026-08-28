using System.ComponentModel.DataAnnotations;

namespace PlantNursery.Api.Models;

public class PlantSpecies
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? ScientificName { get; set; }

    /// <summary>Days between required waterings.</summary>
    public int WateringIntervalDays { get; set; }

    /// <summary>Minimum age in days before a batch may be marked for sale.</summary>
    public int MinDaysBeforeSale { get; set; }

    public ICollection<Batch> Batches { get; set; } = new List<Batch>();
}
