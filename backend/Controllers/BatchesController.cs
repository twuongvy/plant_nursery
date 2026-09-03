using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlantNursery.Api.Data;
using PlantNursery.Api.Dtos;
using PlantNursery.Api.Extensions;
using PlantNursery.Api.Models;
using PlantNursery.Api.Services;

namespace PlantNursery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BatchesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly WateringScheduleService _watering;
    private readonly SaleReadinessService _saleReadiness;

    public BatchesController(
        AppDbContext db,
        WateringScheduleService watering,
        SaleReadinessService saleReadiness)
    {
        _db = db;
        _watering = watering;
        _saleReadiness = saleReadiness;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BatchDto>>> GetAllAsync(CancellationToken ct)
    {
        var batches = await LoadBatchesQuery().ToListAsync(ct);
        return Ok(batches.Select(MapBatch).ToList());
    }

    [HttpGet("{id:int}", Name = nameof(GetByIdAsync))]
    public async Task<ActionResult<BatchDto>> GetByIdAsync(int id, CancellationToken ct)
    {
        var batch = await LoadBatchesQuery().FirstOrDefaultAsync(b => b.Id == id, ct);
        if (batch is null) return NotFound();
        return Ok(MapBatch(batch));
    }

    [HttpGet("{id:int}/readiness")]
    public async Task<ActionResult<BatchReadinessDto>> GetReadinessAsync(int id, CancellationToken ct)
    {
        var batch = await LoadBatchesQuery().FirstOrDefaultAsync(b => b.Id == id, ct);
        if (batch is null) return NotFound();

        var result = _saleReadiness.Evaluate(batch);
        return Ok(new BatchReadinessDto(batch.Id, result.IsReady, result.FailedRules));
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<BatchDto>> CreateAsync([FromBody] CreateBatchRequest request, CancellationToken ct)
    {
        if (!EnumParse.TryParseDefined(request.HealthStatus, out HealthStatus health))
            return BadRequest(new { message = "Invalid HealthStatus. Use Healthy, Sick, or Quarantine." });

        if (!TryNormalizePlantedAt(request.PlantedAt, out var plantedAt, out var plantedError))
            return BadRequest(new { message = plantedError });

        var speciesExists = await _db.PlantSpecies.AnyAsync(s => s.Id == request.PlantSpeciesId, ct);
        if (!speciesExists)
            return BadRequest(new { message = "PlantSpeciesId not found." });

        var entity = new Batch
        {
            PlantSpeciesId = request.PlantSpeciesId,
            Quantity = request.Quantity,
            PlantedAt = plantedAt,
            HealthStatus = health,
            LocationLabel = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location.Trim(),
            Status = BatchStatus.Growing
        };
        _db.Batches.Add(entity);
        await _db.SaveChangesAsync(ct);

        var created = await LoadBatchesQuery().FirstAsync(b => b.Id == entity.Id, ct);
        return CreatedAtRoute(nameof(GetByIdAsync), new { id = entity.Id }, MapBatch(created));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<BatchDto>> UpdateAsync(int id, [FromBody] UpdateBatchRequest request, CancellationToken ct)
    {
        var entity = await _db.Batches.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (entity is null) return NotFound();

        if (!EnumParse.TryParseDefined(request.HealthStatus, out HealthStatus health))
            return BadRequest(new { message = "Invalid HealthStatus. Use Healthy, Sick, or Quarantine." });
        if (!EnumParse.TryParseDefined(request.Status, out BatchStatus status))
            return BadRequest(new { message = "Invalid Status. Use Growing, ForSale, or SoldOut." });
        if (status == BatchStatus.ForSale && entity.Status != BatchStatus.ForSale)
            return BadRequest(new { message = "Use mark-for-sale to set ForSale after the batch is sale-ready." });

        if (!TryNormalizePlantedAt(request.PlantedAt, out var plantedAt, out var plantedError))
            return BadRequest(new { message = plantedError });

        var speciesExists = await _db.PlantSpecies.AnyAsync(s => s.Id == request.PlantSpeciesId, ct);
        if (!speciesExists)
            return BadRequest(new { message = "PlantSpeciesId not found." });

        entity.PlantSpeciesId = request.PlantSpeciesId;
        entity.Quantity = request.Quantity;
        entity.PlantedAt = plantedAt;
        entity.HealthStatus = health;
        entity.LocationLabel = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location.Trim();
        entity.Status = status;
        await _db.SaveChangesAsync(ct);

        var updated = await LoadBatchesQuery().FirstAsync(b => b.Id == id, ct);
        return Ok(MapBatch(updated));
    }

    /// <summary>Optional light update: User may update health only.</summary>
    [HttpPatch("{id:int}/health")]
    [Authorize(Roles = $"{nameof(UserRole.Admin)},{nameof(UserRole.User)}")]
    public async Task<ActionResult<BatchDto>> UpdateHealthAsync(int id, [FromBody] UpdateBatchHealthRequest request, CancellationToken ct)
    {
        var entity = await _db.Batches.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (entity is null) return NotFound();

        if (!EnumParse.TryParseDefined(request.HealthStatus, out HealthStatus health))
            return BadRequest(new { message = "Invalid HealthStatus. Use Healthy, Sick, or Quarantine." });

        entity.HealthStatus = health;
        await _db.SaveChangesAsync(ct);

        var updated = await LoadBatchesQuery().FirstAsync(b => b.Id == id, ct);
        return Ok(MapBatch(updated));
    }

    [HttpPost("{id:int}/mark-for-sale")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<BatchDto>> MarkForSaleAsync(int id, CancellationToken ct)
    {
        var batch = await _db.Batches
            .IncludeScheduleData()
            .FirstOrDefaultAsync(b => b.Id == id, ct);
        if (batch is null) return NotFound();

        var readiness = _saleReadiness.Evaluate(batch);
        if (!readiness.IsReady)
            return BadRequest(new { message = "Batch is not sale-ready.", failedRules = readiness.FailedRules });

        batch.Status = BatchStatus.ForSale;
        await _db.SaveChangesAsync(ct);

        return Ok(MapBatch(batch));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> DeleteAsync(int id, CancellationToken ct)
    {
        var entity = await _db.Batches.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (entity is null) return NotFound();

        _db.Batches.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private IQueryable<Batch> LoadBatchesQuery() =>
        _db.Batches
            .AsNoTracking()
            .IncludeScheduleData()
            .OrderBy(b => b.Id);

    private BatchDto MapBatch(Batch batch)
    {
        var schedule = _watering.Evaluate(batch);
        var readiness = _saleReadiness.Evaluate(batch, schedule);
        return new BatchDto(
            batch.Id,
            batch.PlantSpeciesId,
            batch.PlantSpecies.Name,
            batch.Quantity,
            batch.PlantedAt,
            batch.HealthStatus.ToString(),
            batch.LocationLabel,
            batch.Status.ToString(),
            readiness.IsReady,
            schedule.IsOverdue,
            schedule.LastWateredAt,
            schedule.NextDueAt,
            readiness.IsReady ? null : readiness.FailedRules);
    }

    private static bool TryNormalizePlantedAt(DateTime plantedAt, out DateTime utcDate, out string? error)
    {
        utcDate = default;
        if (plantedAt == default)
        {
            error = "PlantedAt is required.";
            return false;
        }

        utcDate = DateTime.SpecifyKind(plantedAt.Date, DateTimeKind.Utc);
        if (utcDate > DateTime.UtcNow.Date)
        {
            error = "PlantedAt cannot be in the future.";
            return false;
        }

        error = null;
        return true;
    }
}
