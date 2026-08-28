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
    public async Task<ActionResult<IEnumerable<BatchDto>>> GetAll(CancellationToken ct)
    {
        var batches = await LoadBatchesQuery().ToListAsync(ct);
        return Ok(batches.Select(MapBatch).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BatchDto>> GetById(int id, CancellationToken ct)
    {
        var batch = await LoadBatchesQuery().FirstOrDefaultAsync(b => b.Id == id, ct);
        if (batch is null) return NotFound();
        return Ok(MapBatch(batch));
    }

    [HttpGet("{id:int}/readiness")]
    public async Task<ActionResult<object>> GetReadiness(int id, CancellationToken ct)
    {
        var batch = await LoadBatchesQuery().FirstOrDefaultAsync(b => b.Id == id, ct);
        if (batch is null) return NotFound();

        var result = _saleReadiness.Evaluate(batch);
        return Ok(new
        {
            batchId = batch.Id,
            result.IsReady,
            failedRules = result.FailedRules
        });
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<BatchDto>> Create([FromBody] CreateBatchRequest request, CancellationToken ct)
    {
        if (!TryParseHealth(request.HealthStatus, out var health))
            return BadRequest(new { message = "Invalid HealthStatus. Use Healthy, Sick, or Quarantine." });

        var status = BatchStatus.Growing;
        if (!string.IsNullOrWhiteSpace(request.Status) && !Enum.TryParse(request.Status, true, out status))
            return BadRequest(new { message = "Invalid Status. Use Growing, ForSale, or SoldOut." });

        var speciesExists = await _db.PlantSpecies.AnyAsync(s => s.Id == request.PlantSpeciesId, ct);
        if (!speciesExists)
            return BadRequest(new { message = "PlantSpeciesId not found." });

        var entity = new Batch
        {
            PlantSpeciesId = request.PlantSpeciesId,
            Quantity = request.Quantity,
            PlantedAt = DateTime.SpecifyKind(request.PlantedAt.Date, DateTimeKind.Utc),
            HealthStatus = health,
            LocationLabel = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location.Trim(),
            Status = status
        };
        _db.Batches.Add(entity);
        await _db.SaveChangesAsync(ct);

        var created = await LoadBatchesQuery().FirstAsync(b => b.Id == entity.Id, ct);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, MapBatch(created));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<BatchDto>> Update(int id, [FromBody] UpdateBatchRequest request, CancellationToken ct)
    {
        var entity = await _db.Batches.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (entity is null) return NotFound();

        if (!TryParseHealth(request.HealthStatus, out var health))
            return BadRequest(new { message = "Invalid HealthStatus. Use Healthy, Sick, or Quarantine." });
        if (!Enum.TryParse<BatchStatus>(request.Status, true, out var status))
            return BadRequest(new { message = "Invalid Status. Use Growing, ForSale, or SoldOut." });

        var speciesExists = await _db.PlantSpecies.AnyAsync(s => s.Id == request.PlantSpeciesId, ct);
        if (!speciesExists)
            return BadRequest(new { message = "PlantSpeciesId not found." });

        entity.PlantSpeciesId = request.PlantSpeciesId;
        entity.Quantity = request.Quantity;
        entity.PlantedAt = DateTime.SpecifyKind(request.PlantedAt.Date, DateTimeKind.Utc);
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
    public async Task<ActionResult<BatchDto>> UpdateHealth(int id, [FromBody] UpdateBatchHealthRequest request, CancellationToken ct)
    {
        var entity = await _db.Batches.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (entity is null) return NotFound();

        if (!TryParseHealth(request.HealthStatus, out var health))
            return BadRequest(new { message = "Invalid HealthStatus. Use Healthy, Sick, or Quarantine." });

        entity.HealthStatus = health;
        await _db.SaveChangesAsync(ct);

        var updated = await LoadBatchesQuery().FirstAsync(b => b.Id == id, ct);
        return Ok(MapBatch(updated));
    }

    [HttpPost("{id:int}/mark-for-sale")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<BatchDto>> MarkForSale(int id, CancellationToken ct)
    {
        var batch = await _db.Batches
            .Include(b => b.PlantSpecies)
            .Include(b => b.WateringLogs)
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
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
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
            .Include(b => b.PlantSpecies)
            .Include(b => b.WateringLogs)
            .OrderBy(b => b.Id);

    private BatchDto MapBatch(Batch batch)
    {
        var schedule = _watering.Evaluate(batch);
        var readiness = _saleReadiness.Evaluate(batch);
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

    private static bool TryParseHealth(string value, out HealthStatus health) =>
        Enum.TryParse(value, true, out health);
}
