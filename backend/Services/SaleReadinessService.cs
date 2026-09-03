using PlantNursery.Api.Models;

namespace PlantNursery.Api.Services;

public record SaleReadinessResult(
    bool IsReady,
    IReadOnlyList<string> FailedRules);

/// <summary>
/// Sale readiness: age, healthy, watering not overdue, status Growing or ForSale.
/// </summary>
public class SaleReadinessService
{
    private readonly WateringScheduleService _wateringSchedule;

    public SaleReadinessService(WateringScheduleService wateringSchedule)
    {
        _wateringSchedule = wateringSchedule;
    }

    public SaleReadinessResult Evaluate(Batch batch, DateTime? asOfUtc = null)
    {
        var watering = _wateringSchedule.Evaluate(batch, asOfUtc);
        return Evaluate(batch, watering, asOfUtc);
    }

    public SaleReadinessResult Evaluate(Batch batch, WateringScheduleInfo watering, DateTime? asOfUtc = null)
    {
        ArgumentNullException.ThrowIfNull(batch);
        ArgumentNullException.ThrowIfNull(watering);
        if (batch.PlantSpecies is null)
            throw new InvalidOperationException("Batch.PlantSpecies must be loaded.");

        var asOf = asOfUtc ?? DateTime.UtcNow;
        var failures = new List<string>();

        var ageDays = (asOf.Date - batch.PlantedAt.Date).Days;
        if (ageDays < batch.PlantSpecies.MinDaysBeforeSale)
            failures.Add($"Age {ageDays}d is below MinDaysBeforeSale ({batch.PlantSpecies.MinDaysBeforeSale}).");

        if (batch.HealthStatus != HealthStatus.Healthy)
            failures.Add($"HealthStatus is {batch.HealthStatus}; must be Healthy.");

        if (watering.IsOverdue)
            failures.Add($"Watering overdue by {watering.DaysOverdue} day(s). Next due was {watering.NextDueAt:yyyy-MM-dd}.");

        if (batch.Status is not (BatchStatus.Growing or BatchStatus.ForSale))
            failures.Add($"Status is {batch.Status}; must be Growing or ForSale.");

        return new SaleReadinessResult(failures.Count == 0, failures);
    }
}
