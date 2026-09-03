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
public class WateringsController : ControllerBase
{
    private const int UnfilteredListCap = 200;

    private readonly AppDbContext _db;
    private readonly WateringScheduleService _watering;

    public WateringsController(AppDbContext db, WateringScheduleService watering)
    {
        _db = db;
        _watering = watering;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WateringLogDto>>> GetAllAsync([FromQuery] int? batchId, CancellationToken ct)
    {
        var query = _db.WateringLogs
            .AsNoTracking()
            .Include(w => w.Batch)
            .Include(w => w.WateredByUser)
            .AsQueryable();

        if (batchId.HasValue)
            query = query.Where(w => w.BatchId == batchId.Value);

        query = query.OrderByDescending(w => w.WateredAt);
        if (!batchId.HasValue)
            query = query.Take(UnfilteredListCap);

        var logs = await query
            .Select(log => new WateringLogDto(
                log.Id,
                log.BatchId,
                log.Batch.LocationLabel,
                log.WateredAt,
                log.WateredByUserId,
                log.WateredByUser.Username,
                log.Note))
            .ToListAsync(ct);

        return Ok(logs);
    }

    [HttpGet("due")]
    public async Task<ActionResult<IEnumerable<WateringDueItemDto>>> GetDueAsync(
        [FromQuery] bool overdueOnly = false,
        CancellationToken ct = default)
    {
        var batches = await _db.Batches
            .AsNoTracking()
            .IncludeScheduleData()
            .Where(b => b.Status != BatchStatus.SoldOut)
            .ToListAsync(ct);

        var due = batches
            .Select(b => WateringDueItemMapping.From(b, _watering.Evaluate(b)))
            .Where(d => overdueOnly
                ? d.IsOverdue
                : d.IsOverdue || d.DueAt.Date <= DateTime.UtcNow.Date.AddDays(1))
            .OrderByDescending(d => d.IsOverdue)
            .ThenBy(d => d.DueAt)
            .ToList();

        return Ok(due);
    }

    [HttpPost]
    public async Task<ActionResult<WateringLogDto>> RecordAsync([FromBody] CreateWateringLogRequest request, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var batch = await _db.Batches.FirstOrDefaultAsync(b => b.Id == request.BatchId, ct);
        if (batch is null)
            return BadRequest(new { message = "BatchId not found." });
        if (batch.Status == BatchStatus.SoldOut)
            return BadRequest(new { message = "Cannot record watering for a sold-out batch." });

        if (!TryResolveWateredAt(request.WateredAt, batch.PlantedAt, out var wateredAt, out var wateredError))
            return BadRequest(new { message = wateredError });

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
            .Include(log => log.Batch)
            .Include(log => log.WateredByUser)
            .FirstAsync(log => log.Id == entity.Id, ct);

        return CreatedAtAction(nameof(GetAllAsync), new { batchId = created.BatchId }, ToDto(created));
    }

    private static WateringLogDto ToDto(WateringLog log) =>
        new(
            log.Id,
            log.BatchId,
            log.Batch.LocationLabel,
            log.WateredAt,
            log.WateredByUserId,
            log.WateredByUser.Username,
            log.Note);

    private static bool TryResolveWateredAt(
        DateTime? requested,
        DateTime plantedAt,
        out DateTime wateredAt,
        out string? error)
    {
        var now = DateTime.UtcNow;
        wateredAt = now;
        error = null;

        if (!requested.HasValue)
            return true;

        var candidate = requested.Value.Kind == DateTimeKind.Local
            ? requested.Value.ToUniversalTime()
            : DateTime.SpecifyKind(requested.Value, DateTimeKind.Utc);

        if (candidate > now.AddMinutes(1))
        {
            error = "WateredAt cannot be in the future.";
            return false;
        }

        if (candidate.Date < plantedAt.Date)
        {
            error = "WateredAt cannot be before the batch was planted.";
            return false;
        }

        wateredAt = candidate;
        return true;
    }
}
