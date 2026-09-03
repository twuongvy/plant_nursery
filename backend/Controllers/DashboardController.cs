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
    public async Task<ActionResult<DashboardSummaryDto>> GetAsync(CancellationToken ct)
    {
        var batches = await LoadBatchesAsync(ct);

        var overdueWaterings = batches
            .Where(b => b.Status != BatchStatus.SoldOut)
            .Count(b => _watering.Evaluate(b).IsOverdue);

        var saleReadyBatches = CountGrowingSaleReady(batches);
        var growingBatches = batches.Count(b => b.Status == BatchStatus.Growing);

        return Ok(new DashboardSummaryDto(overdueWaterings, saleReadyBatches, growingBatches));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardDetailDto>> GetSummaryAsync(CancellationToken ct)
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
                    Dto = WateringDueItemMapping.From(b, info)
                };
            })
            .ToList();

        var overdue = dueItems.Where(entry => entry.Info.IsOverdue).ToList();
        var dueSoon = dueItems.Where(entry => entry.Info.State == WateringScheduleState.DueSoon).ToList();

        return Ok(new DashboardDetailDto(
            OverdueWateringCount: overdue.Count,
            DueSoonWateringCount: dueSoon.Count,
            SaleReadyCount: CountGrowingSaleReady(batches),
            GrowingCount: batches.Count(batch => batch.Status == BatchStatus.Growing),
            ForSaleCount: batches.Count(batch => batch.Status == BatchStatus.ForSale),
            DueWaterings: overdue.Concat(dueSoon)
                .Select(entry => entry.Dto)
                .OrderByDescending(dueItem => dueItem.IsOverdue)
                .ThenBy(dueItem => dueItem.DueAt)
                .ToList()));
    }

    [HttpGet("readiness")]
    public async Task<ActionResult<IEnumerable<DashboardReadinessItemDto>>> GetReadinessAsync(CancellationToken ct)
    {
        var batches = await LoadBatchesAsync(ct);

        var readinessItems = batches.Select(batch =>
        {
            var result = _saleReadiness.Evaluate(batch);
            return new DashboardReadinessItemDto(
                batch.Id,
                batch.PlantSpecies.Name,
                batch.LocationLabel,
                batch.Status.ToString(),
                batch.HealthStatus.ToString(),
                result.IsReady,
                result.FailedRules);
        });

        return Ok(readinessItems);
    }

    private int CountGrowingSaleReady(IEnumerable<Batch> batches) =>
        batches.Count(b => b.Status == BatchStatus.Growing && _saleReadiness.Evaluate(b).IsReady);

    private async Task<List<Batch>> LoadBatchesAsync(CancellationToken ct) =>
        await _db.Batches
            .AsNoTracking()
            .IncludeScheduleData()
            .OrderBy(b => b.Id)
            .ToListAsync(ct);
}
