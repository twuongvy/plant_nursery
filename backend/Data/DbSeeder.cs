using Microsoft.EntityFrameworkCore;
using PlantNursery.Api.Models;

namespace PlantNursery.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(
        AppDbContext db,
        string? adminPassword,
        string? staffPassword,
        CancellationToken ct = default)
    {
        if (!await db.Users.AnyAsync(ct))
        {
            if (string.IsNullOrWhiteSpace(adminPassword) || string.IsNullOrWhiteSpace(staffPassword))
                return;

            db.Users.AddRange(
                new User
                {
                    Email = "admin@nursery.local",
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                    Role = UserRole.Admin
                },
                new User
                {
                    Email = "staff@nursery.local",
                    Username = "staff",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(staffPassword),
                    Role = UserRole.User
                });
            await db.SaveChangesAsync(ct);
        }

        if (!await db.PlantSpecies.AnyAsync(ct))
        {
            var monstera = new PlantSpecies
            {
                Name = "Monstera Deliciosa",
                ScientificName = "Monstera deliciosa",
                WateringIntervalDays = 7,
                MinDaysBeforeSale = 30
            };
            var snake = new PlantSpecies
            {
                Name = "Snake Plant",
                ScientificName = "Dracaena trifasciata",
                WateringIntervalDays = 14,
                MinDaysBeforeSale = 21
            };
            var pothos = new PlantSpecies
            {
                Name = "Golden Pothos",
                ScientificName = "Epipremnum aureum",
                WateringIntervalDays = 5,
                MinDaysBeforeSale = 14
            };

            db.PlantSpecies.AddRange(monstera, snake, pothos);
            await db.SaveChangesAsync(ct);

            var actor = await db.Users.FirstOrDefaultAsync(u => u.Email == "admin@nursery.local", ct)
                        ?? await db.Users.FirstAsync(ct);
            var today = DateTime.UtcNow.Date;

            var readyBatch = new Batch
            {
                PlantSpeciesId = monstera.Id,
                Quantity = 12,
                PlantedAt = today.AddDays(-45),
                HealthStatus = HealthStatus.Healthy,
                LocationLabel = "Greenhouse A-1",
                Status = BatchStatus.Growing
            };
            var overdueBatch = new Batch
            {
                PlantSpeciesId = pothos.Id,
                Quantity = 20,
                PlantedAt = today.AddDays(-20),
                HealthStatus = HealthStatus.Healthy,
                LocationLabel = "Bench B-3",
                Status = BatchStatus.Growing
            };
            var youngBatch = new Batch
            {
                PlantSpeciesId = snake.Id,
                Quantity = 8,
                PlantedAt = today.AddDays(-5),
                HealthStatus = HealthStatus.Healthy,
                LocationLabel = "Nursery C-2",
                Status = BatchStatus.Growing
            };
            var sickBatch = new Batch
            {
                PlantSpeciesId = monstera.Id,
                Quantity = 4,
                PlantedAt = today.AddDays(-60),
                HealthStatus = HealthStatus.Sick,
                LocationLabel = "Quarantine Q-1",
                Status = BatchStatus.Growing
            };

            db.Batches.AddRange(readyBatch, overdueBatch, youngBatch, sickBatch);
            await db.SaveChangesAsync(ct);

            // Ready batch: watered recently (compliant).
            db.WateringLogs.Add(new WateringLog
            {
                BatchId = readyBatch.Id,
                WateredAt = today.AddDays(-2),
                WateredByUserId = actor.Id,
                Note = "Seed: recent watering"
            });
            // Overdue batch: last watered beyond interval (pothos = 5 days).
            db.WateringLogs.Add(new WateringLog
            {
                BatchId = overdueBatch.Id,
                WateredAt = today.AddDays(-10),
                WateredByUserId = actor.Id,
                Note = "Seed: stale watering"
            });
            // Young batch: watered at planting (not yet due).
            db.WateringLogs.Add(new WateringLog
            {
                BatchId = youngBatch.Id,
                WateredAt = youngBatch.PlantedAt,
                WateredByUserId = actor.Id,
                Note = "Seed: initial watering"
            });

            await db.SaveChangesAsync(ct);
        }
    }
}
