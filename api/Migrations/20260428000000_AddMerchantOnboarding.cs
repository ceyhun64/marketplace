using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddMerchantOnboarding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // AccountStatus kolonu: varsayılan "Active" — mevcut kullanıcılar etkilenmez
            migrationBuilder.AddColumn<string>(
                name: "AccountStatus",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "Active");

            // RejectionReason kolonu: opsiyonel
            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Users",
                type: "text",
                nullable: true);

            // Index: admin panelinde pending başvuruları hızlı listelemek için
            migrationBuilder.CreateIndex(
                name: "IX_Users_AccountStatus",
                table: "Users",
                column: "AccountStatus");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_AccountStatus",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AccountStatus",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Users");
        }
    }
}
