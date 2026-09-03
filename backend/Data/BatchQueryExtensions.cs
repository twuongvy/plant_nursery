using Microsoft.EntityFrameworkCore;
using PlantNursery.Api.Models;

namespace PlantNursery.Api.Data;

public static class BatchQueryExtensions
{
    /// <summary>
    /// Species plus the latest watering log only — enough for schedule/readiness.
    /// </summary>
    public static IQueryable<Batch> IncludeScheduleData(this IQueryable<Batch> query) =>
        query
            .Include(b => b.PlantSpecies)
            .Include(b => b.WateringLogs.OrderByDescending(w => w.WateredAt).Take(1));
}
