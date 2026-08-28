using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlantNursery.Api.Data;
using PlantNursery.Api.Dtos;
using PlantNursery.Api.Models;
using PlantNursery.Api.Services;

namespace PlantNursery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly WateringScheduleService _watering;
    private readonly SaleReadinessService _saleReadiness;

    public DashboardController(
        AppDbContext db,
        WateringScheduleService watering,
        SaleReadinessService saleReadiness)
    {
        _db = db;
        _watering = watering;
        _saleReadiness = saleReadiness;
    }

    /// <summary>Frontend contract: overdueWaterings, saleReadyBatches, growingBatches.</summary>
    [HttpGet]
    public async Task<ActionResult<DashboardSummaryDto>> Get(CancellationToken ct)
    {
        var batches = await LoadBatchesAsync(ct);

        var overdueWaterings = batches
            .Where(b => b.Status != BatchStatus.SoldOut)
            .Count(b => _watering.Evaluate(b).IsOverdue);

        var saleReadyBatches = batches.Count(b => _saleReadiness.Evaluate(b).IsReady);
        var growingBatches = batches.Count(b => b.Status == BatchStatus.Growing);

        return Ok(new DashboardSummaryDto(overdueWaterings, saleReadyBatches, growingBatches));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardDetailDto>> Summary(CancellationToken ct)
    {
        var batches = await LoadBatchesAsync(ct);
        var active = batches.Where(b => b.Status != BatchStatus.SoldOut).ToList();

        var dueItems = active
            .Select(b =>
            {
                var info = _watering.Evaluate(b);
                return new
                {
                    Info = info,
                    Dto = ToDueItem(b, info)
                };
            })
            .ToList();

        var overdue = dueItems.Where(x => x.Info.IsOverdue).ToList();
        var dueSoon = dueItems.Where(x => x.Info.State == WateringScheduleState.DueSoon).ToList();

        return Ok(new DashboardDetailDto(
            OverdueWateringCount: overdue.Count,
            DueSoonWateringCount: dueSoon.Count,
            SaleReadyCount: batches.Count(b => _saleReadiness.Evaluate(b).IsReady),
            GrowingCount: batches.Count(b => b.Status == BatchStatus.Growing),
            ForSaleCount: batches.Count(b => b.Status == BatchStatus.ForSale),
            DueWaterings: overdue.Concat(dueSoon)
                .Select(x => x.Dto)
                .OrderByDescending(d => d.IsOverdue)
                .ThenBy(d => d.DueAt)
                .ToList()));
    }

    [HttpGet("readiness")]
    public async Task<ActionResult<IEnumerable<object>>> Readiness(CancellationToken ct)
    {
        var batches = await LoadBatchesAsync(ct);

        var items = batches.Select(b =>
        {
            var result = _saleReadiness.Evaluate(b);
            return new
            {
                batchId = b.Id,
                speciesName = b.PlantSpecies.Name,
                location = b.LocationLabel,
                status = b.Status.ToString(),
                healthStatus = b.HealthStatus.ToString(),
                isSaleReady = result.IsReady,
                failedRules = result.FailedRules
            };
        });

        return Ok(items);
    }

    private async Task<List<Batch>> LoadBatchesAsync(CancellationToken ct) =>
        await _db.Batches
            .AsNoTracking()
            .Include(b => b.PlantSpecies)
            .Include(b => b.WateringLogs)
            .OrderBy(b => b.Id)
            .ToListAsync(ct);

    private static WateringDueItemDto ToDueItem(Batch b, WateringScheduleInfo info) =>
        new(
            b.Id,
            b.PlantSpecies.Name,
            b.LocationLabel,
            b.Quantity,
            b.PlantedAt,
            info.LastWateredAt,
            info.NextDueAt,
            info.IsOverdue,
            info.DaysOverdue);
}
