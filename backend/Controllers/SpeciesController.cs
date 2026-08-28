using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlantNursery.Api.Data;
using PlantNursery.Api.Dtos;
using PlantNursery.Api.Models;

namespace PlantNursery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SpeciesController : ControllerBase
{
    private readonly AppDbContext _db;

    public SpeciesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PlantSpeciesDto>>> GetAll(CancellationToken ct)
    {
        var items = await _db.PlantSpecies
            .AsNoTracking()
            .OrderBy(s => s.Name)
            .Select(s => new PlantSpeciesDto(s.Id, s.Name, s.ScientificName, s.WateringIntervalDays, s.MinDaysBeforeSale))
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PlantSpeciesDto>> GetById(int id, CancellationToken ct)
    {
        var s = await _db.PlantSpecies.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (s is null) return NotFound();
        return Ok(new PlantSpeciesDto(s.Id, s.Name, s.ScientificName, s.WateringIntervalDays, s.MinDaysBeforeSale));
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<PlantSpeciesDto>> Create([FromBody] CreatePlantSpeciesRequest request, CancellationToken ct)
    {
        var entity = new PlantSpecies
        {
            Name = request.Name.Trim(),
            ScientificName = string.IsNullOrWhiteSpace(request.ScientificName) ? null : request.ScientificName.Trim(),
            WateringIntervalDays = request.WateringIntervalDays,
            MinDaysBeforeSale = request.MinDaysBeforeSale
        };
        _db.PlantSpecies.Add(entity);
        await _db.SaveChangesAsync(ct);

        var dto = new PlantSpeciesDto(entity.Id, entity.Name, entity.ScientificName, entity.WateringIntervalDays, entity.MinDaysBeforeSale);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, dto);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<PlantSpeciesDto>> Update(int id, [FromBody] UpdatePlantSpeciesRequest request, CancellationToken ct)
    {
        var entity = await _db.PlantSpecies.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return NotFound();

        entity.Name = request.Name.Trim();
        entity.ScientificName = string.IsNullOrWhiteSpace(request.ScientificName) ? null : request.ScientificName.Trim();
        entity.WateringIntervalDays = request.WateringIntervalDays;
        entity.MinDaysBeforeSale = request.MinDaysBeforeSale;
        await _db.SaveChangesAsync(ct);

        return Ok(new PlantSpeciesDto(entity.Id, entity.Name, entity.ScientificName, entity.WateringIntervalDays, entity.MinDaysBeforeSale));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.PlantSpecies.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return NotFound();

        var hasBatches = await _db.Batches.AnyAsync(b => b.PlantSpeciesId == id, ct);
        if (hasBatches)
            return Conflict(new { message = "Cannot delete species that still has batches." });

        _db.PlantSpecies.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
