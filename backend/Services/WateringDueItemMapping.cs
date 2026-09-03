using PlantNursery.Api.Dtos;
using PlantNursery.Api.Models;

namespace PlantNursery.Api.Services;

public static class WateringDueItemMapping
{
    public static WateringDueItemDto From(Batch batch, WateringScheduleInfo info) =>
        new(
            batch.Id,
            batch.PlantSpecies.Name,
            batch.LocationLabel,
            batch.Quantity,
            batch.PlantedAt,
            info.LastWateredAt,
            info.NextDueAt,
            info.IsOverdue,
            info.DaysOverdue);
}
