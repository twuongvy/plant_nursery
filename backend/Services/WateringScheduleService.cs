using PlantNursery.Api.Models;

namespace PlantNursery.Api.Services;

public enum WateringScheduleState
{
    Ok,
    DueSoon,
    Overdue
}

public record WateringScheduleInfo(
    DateTime? LastWateredAt,
    DateTime NextDueAt,
    bool IsOverdue,
    int DaysOverdue,
    WateringScheduleState State);

/// <summary>
/// Pure watering schedule rules: due when last watering (or planted date) + interval has passed.
/// </summary>
public class WateringScheduleService
{
    public WateringScheduleInfo Evaluate(Batch batch, DateTime? asOfUtc = null)
    {
        ArgumentNullException.ThrowIfNull(batch);
        if (batch.PlantSpecies is null)
            throw new InvalidOperationException("Batch.PlantSpecies must be loaded.");

        var asOf = asOfUtc ?? DateTime.UtcNow;
        var interval = Math.Max(1, batch.PlantSpecies.WateringIntervalDays);

        var lastWatered = batch.WateringLogs?
            .OrderByDescending(w => w.WateredAt)
            .Select(w => (DateTime?)w.WateredAt)
            .FirstOrDefault();

        var anchor = lastWatered ?? batch.PlantedAt;
        var nextDue = anchor.Date.AddDays(interval);
        var asOfDate = asOf.Date;
        var daysPastDue = (asOfDate - nextDue).Days;
        var isOverdue = daysPastDue > 0;
        // Due today or within the next day counts as due-soon for dashboard queue.
        var isDueSoon = !isOverdue && daysPastDue >= -1;

        var state = isOverdue
            ? WateringScheduleState.Overdue
            : isDueSoon
                ? WateringScheduleState.DueSoon
                : WateringScheduleState.Ok;

        return new WateringScheduleInfo(
            LastWateredAt: lastWatered,
            NextDueAt: nextDue,
            IsOverdue: isOverdue,
            DaysOverdue: isOverdue ? daysPastDue : 0,
            State: state);
    }

    public bool IsWateringCompliant(Batch batch, DateTime? asOfUtc = null)
        => !Evaluate(batch, asOfUtc).IsOverdue;
}
