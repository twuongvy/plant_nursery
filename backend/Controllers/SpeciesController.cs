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
    public async Task<ActionResult<IEnumerable<PlantSpeciesDto>>> GetAllAsync(CancellationToken ct)
    {
        var speciesList = await _db.PlantSpecies
            .AsNoTracking()
            .OrderBy(species => species.Id)
            .Select(species => new PlantSpeciesDto(
                species.Id,
                species.Name,
                species.ScientificName,
                species.WateringIntervalDays,
                species.MinDaysBeforeSale))
            .ToListAsync(ct);
        return Ok(speciesList);
    }

    [HttpGet("{id:int}", Name = nameof(GetSpeciesByIdAsync))]
    public async Task<ActionResult<PlantSpeciesDto>> GetSpeciesByIdAsync(int id, CancellationToken ct)
    {
        var species = await _db.PlantSpecies.AsNoTracking().FirstOrDefaultAsync(row => row.Id == id, ct);
        if (species is null) return NotFound();
        return Ok(ToDto(species));
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<PlantSpeciesDto>> CreateAsync([FromBody] PlantSpeciesWriteRequest request, CancellationToken ct)
    {
        if (!TryNormalizeName(request.Name, out var name, out var nameError))
            return BadRequest(new { message = nameError });
        if (await NameTakenAsync(name, excludeId: null, ct))
            return Conflict(new { message = "A species with that name already exists." });

        var entity = new PlantSpecies
        {
            Name = name,
            ScientificName = string.IsNullOrWhiteSpace(request.ScientificName) ? null : request.ScientificName.Trim(),
            WateringIntervalDays = request.WateringIntervalDays,
            MinDaysBeforeSale = request.MinDaysBeforeSale
        };
        _db.PlantSpecies.Add(entity);
        await _db.SaveChangesAsync(ct);

        return CreatedAtRoute(nameof(GetSpeciesByIdAsync), new { id = entity.Id }, ToDto(entity));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<PlantSpeciesDto>> UpdateAsync(int id, [FromBody] PlantSpeciesWriteRequest request, CancellationToken ct)
    {
        var entity = await _db.PlantSpecies.FirstOrDefaultAsync(species => species.Id == id, ct);
        if (entity is null) return NotFound();

        if (!TryNormalizeName(request.Name, out var name, out var nameError))
            return BadRequest(new { message = nameError });
        if (await NameTakenAsync(name, excludeId: id, ct))
            return Conflict(new { message = "A species with that name already exists." });

        entity.Name = name;
        entity.ScientificName = string.IsNullOrWhiteSpace(request.ScientificName) ? null : request.ScientificName.Trim();
        entity.WateringIntervalDays = request.WateringIntervalDays;
        entity.MinDaysBeforeSale = request.MinDaysBeforeSale;
        await _db.SaveChangesAsync(ct);

        return Ok(ToDto(entity));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> DeleteAsync(int id, CancellationToken ct)
    {
        var entity = await _db.PlantSpecies.FirstOrDefaultAsync(species => species.Id == id, ct);
        if (entity is null) return NotFound();

        var hasBatches = await _db.Batches.AnyAsync(batch => batch.PlantSpeciesId == id, ct);
        if (hasBatches)
            return Conflict(new { message = "Cannot delete species that still has batches." });

        _db.PlantSpecies.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static PlantSpeciesDto ToDto(PlantSpecies species) =>
        new(species.Id, species.Name, species.ScientificName, species.WateringIntervalDays, species.MinDaysBeforeSale);

    private async Task<bool> NameTakenAsync(string name, int? excludeId, CancellationToken ct) =>
        await _db.PlantSpecies.AnyAsync(
            species => species.Name == name && (excludeId == null || species.Id != excludeId),
            ct);

    private static bool TryNormalizeName(string? raw, out string name, out string? error)
    {
        name = (raw ?? string.Empty).Trim();
        if (name.Length == 0)
        {
            error = "Name is required.";
            return false;
        }

        error = null;
        return true;
    }
}
