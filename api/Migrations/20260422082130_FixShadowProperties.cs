using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class FixShadowProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
        DELETE FROM ""Products""
        WHERE ""MerchantId"" NOT IN (SELECT ""Id"" FROM ""MerchantProfiles"");
    "
            );
            migrationBuilder.DropForeignKey(name: "FK_Couriers_Users_UserId1", table: "Couriers");

            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Couriers_CourierId1",
                table: "Shipments"
            );

            migrationBuilder.DropIndex(name: "IX_Shipments_CourierId1", table: "Shipments");

            migrationBuilder.DropIndex(name: "IX_Couriers_UserId1", table: "Couriers");

            migrationBuilder.DropColumn(name: "CourierId1", table: "Shipments");

            migrationBuilder.DropColumn(name: "UserId1", table: "Couriers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CourierId1",
                table: "Shipments",
                type: "uuid",
                nullable: true
            );

            migrationBuilder.AddColumn<Guid>(
                name: "UserId1",
                table: "Couriers",
                type: "uuid",
                nullable: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_CourierId1",
                table: "Shipments",
                column: "CourierId1"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Couriers_UserId1",
                table: "Couriers",
                column: "UserId1",
                unique: true
            );

            migrationBuilder.AddForeignKey(
                name: "FK_Couriers_Users_UserId1",
                table: "Couriers",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "Id"
            );

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Couriers_CourierId1",
                table: "Shipments",
                column: "CourierId1",
                principalTable: "Couriers",
                principalColumn: "Id"
            );
        }
    }
}
