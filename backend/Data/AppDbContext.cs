using Microsoft.EntityFrameworkCore;
using PlantNursery.Api.Models;

namespace PlantNursery.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<PlantSpecies> PlantSpecies => Set<PlantSpecies>();
    public DbSet<Batch> Batches => Set<Batch>();
    public DbSet<WateringLog> WateringLogs => Set<WateringLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<PlantSpecies>(e =>
        {
            e.HasIndex(s => s.Name).IsUnique();
        });

        modelBuilder.Entity<Batch>(e =>
        {
            e.Property(b => b.HealthStatus).HasConversion<string>().HasMaxLength(20);
            e.Property(b => b.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(b => b.PlantSpecies)
                .WithMany(s => s.Batches)
                .HasForeignKey(b => b.PlantSpeciesId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WateringLog>(e =>
        {
            e.HasOne(w => w.Batch)
                .WithMany(b => b.WateringLogs)
                .HasForeignKey(w => w.BatchId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(w => w.WateredByUser)
                .WithMany(u => u.WateringLogs)
                .HasForeignKey(w => w.WateredByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
