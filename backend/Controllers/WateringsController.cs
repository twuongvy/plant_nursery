using System.Security.Claims;
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
public class WateringsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly WateringScheduleService _watering;

    public WateringsController(AppDbContext db, WateringScheduleService watering)
    {
        _db = db;
        _watering = watering;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WateringLogDto>>> GetAll([FromQuery] int? batchId, CancellationToken ct)
    {
        var query = _db.WateringLogs
            .AsNoTracking()
            .Include(w => w.Batch)
            .Include(w => w.WateredByUser)
            .AsQueryable();

        if (batchId.HasValue)
            query = query.Where(w => w.BatchId == batchId.Value);

        var items = await query
            .OrderByDescending(w => w.WateredAt)
            .Select(w => new WateringLogDto(
                w.Id,
                w.BatchId,
                w.Batch.LocationLabel,
                w.WateredAt,
                w.WateredByUserId,
                w.WateredByUser.Username,
                w.Note))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("due")]
    public async Task<ActionResult<IEnumerable<WateringDueItemDto>>> GetDue(
        [FromQuery] bool overdueOnly = false,
        CancellationToken ct = default)
    {
        var batches = await _db.Batches
            .AsNoTracking()
            .Include(b => b.PlantSpecies)
            .Include(b => b.WateringLogs)
            .Where(b => b.Status != BatchStatus.SoldOut)
            .ToListAsync(ct);

        var due = batches
            .Select(b =>
            {
                var info = _watering.Evaluate(b);
                return new WateringDueItemDto(
                    b.Id,
                    b.PlantSpecies.Name,
                    b.LocationLabel,
                    b.Quantity,
                    b.PlantedAt,
                    info.LastWateredAt,
                    info.NextDueAt,
                    info.IsOverdue,
                    info.DaysOverdue);
            })
            .Where(d => overdueOnly
                ? d.IsOverdue
                : d.IsOverdue || d.DueAt.Date <= DateTime.UtcNow.Date.AddDays(1))
            .OrderByDescending(d => d.IsOverdue)
            .ThenBy(d => d.DueAt)
            .ToList();

        return Ok(due);
    }

    [HttpPost]
    public async Task<ActionResult<WateringLogDto>> Record([FromBody] CreateWateringLogRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var batchExists = await _db.Batches.AnyAsync(b => b.Id == request.BatchId, ct);
        if (!batchExists)
            return BadRequest(new { message = "BatchId not found." });

        var wateredAt = request.WateredAt.HasValue
            ? DateTime.SpecifyKind(request.WateredAt.Value, DateTimeKind.Utc)
            : DateTime.UtcNow;

        var entity = new WateringLog
        {
            BatchId = request.BatchId,
            WateredAt = wateredAt,
            WateredByUserId = userId.Value,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };
        _db.WateringLogs.Add(entity);
        await _db.SaveChangesAsync(ct);

        var created = await _db.WateringLogs
            .AsNoTracking()
            .Include(w => w.Batch)
            .Include(w => w.WateredByUser)
            .FirstAsync(w => w.Id == entity.Id, ct);

        var dto = new WateringLogDto(
            created.Id,
            created.BatchId,
            created.Batch.LocationLabel,
            created.WateredAt,
            created.WateredByUserId,
            created.WateredByUser.Username,
            created.Note);

        return CreatedAtAction(nameof(GetAll), new { batchId = created.BatchId }, dto);
    }

    private int? GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : null;
    }
}
