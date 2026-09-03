using System.ComponentModel.DataAnnotations;

namespace PlantNursery.Api.Dtos;

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record LoginResponse(
    string Token,
    string Email,
    string Username,
    string Role,
    DateTime ExpiresAtUtc);

public record MeResponse(
    int Id,
    string Email,
    string Username,
    string Role);

public record PlantSpeciesDto(
    int Id,
    string Name,
    string? ScientificName,
    int WateringIntervalDays,
    int MinDaysBeforeSale);

public record PlantSpeciesWriteRequest(
    [Required, MaxLength(150)] string Name,
    [MaxLength(200)] string? ScientificName,
    [Range(1, 365)] int WateringIntervalDays,
    [Range(0, 3650)] int MinDaysBeforeSale);

/// <summary>Matches frontend Batch type (location, readinessNotes).</summary>
public record BatchDto(
    int Id,
    int PlantSpeciesId,
    string SpeciesName,
    int Quantity,
    DateTime PlantedAt,
    string HealthStatus,
    string? Location,
    string Status,
    bool IsSaleReady,
    bool IsWateringOverdue,
    DateTime? LastWateredAt,
    DateTime NextWateringDueAt,
    IReadOnlyList<string>? ReadinessNotes);

public record CreateBatchRequest(
    [Range(1, int.MaxValue)] int PlantSpeciesId,
    [Range(1, int.MaxValue)] int Quantity,
    DateTime PlantedAt,
    string HealthStatus,
    [MaxLength(100)] string? Location,
    string? Status);

public record UpdateBatchRequest(
    [Range(1, int.MaxValue)] int PlantSpeciesId,
    [Range(1, int.MaxValue)] int Quantity,
    DateTime PlantedAt,
    string HealthStatus,
    [MaxLength(100)] string? Location,
    string Status);

public record UpdateBatchHealthRequest(
    [Required] string HealthStatus);

public record WateringLogDto(
    int Id,
    int BatchId,
    string? Location,
    DateTime WateredAt,
    int WateredByUserId,
    string WateredByUsername,
    string? Note);

public record CreateWateringLogRequest(
    [Range(1, int.MaxValue)] int BatchId,
    DateTime? WateredAt,
    [MaxLength(500)] string? Note);

/// <summary>Matches frontend WateringDueItem (location, dueAt).</summary>
public record WateringDueItemDto(
    int BatchId,
    string SpeciesName,
    string? Location,
    int Quantity,
    DateTime PlantedAt,
    DateTime? LastWateredAt,
    DateTime DueAt,
    bool IsOverdue,
    int DaysOverdue);

public record DashboardSummaryDto(
    int OverdueWaterings,
    int SaleReadyBatches,
    int GrowingBatches);

public record DashboardDetailDto(
    int OverdueWateringCount,
    int DueSoonWateringCount,
    int SaleReadyCount,
    int GrowingCount,
    int ForSaleCount,
    IReadOnlyList<WateringDueItemDto> DueWaterings);

public record BatchReadinessDto(
    int BatchId,
    bool IsReady,
    IReadOnlyList<string> FailedRules);

public record DashboardReadinessItemDto(
    int BatchId,
    string SpeciesName,
    string? Location,
    string Status,
    string HealthStatus,
    bool IsSaleReady,
    IReadOnlyList<string> FailedRules);
