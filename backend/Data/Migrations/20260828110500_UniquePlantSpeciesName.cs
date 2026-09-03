using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PlantNursery.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class UniquePlantSpeciesName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PlantSpecies_Name",
                table: "PlantSpecies");

            migrationBuilder.CreateIndex(
                name: "IX_PlantSpecies_Name",
                table: "PlantSpecies",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PlantSpecies_Name",
                table: "PlantSpecies");

            migrationBuilder.CreateIndex(
                name: "IX_PlantSpecies_Name",
                table: "PlantSpecies",
                column: "Name");
        }
    }
}
