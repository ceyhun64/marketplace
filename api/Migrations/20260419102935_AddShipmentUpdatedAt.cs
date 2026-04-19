using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddShipmentUpdatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_ProductOffers_OfferId",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Couriers_CourierId",
                table: "Shipments");

            migrationBuilder.DropForeignKey(
                name: "FK_ShipmentStatusHistory_Shipments_ShipmentId",
                table: "ShipmentStatusHistory");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ShipmentStatusHistory",
                table: "ShipmentStatusHistory");

            migrationBuilder.RenameTable(
                name: "ShipmentStatusHistory",
                newName: "ShipmentStatusHistories");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "ShipmentStatusHistories",
                newName: "ChangedAt");

            migrationBuilder.RenameIndex(
                name: "IX_ShipmentStatusHistory_ShipmentId",
                table: "ShipmentStatusHistories",
                newName: "IX_ShipmentStatusHistories_ShipmentId");

            migrationBuilder.AddColumn<Guid>(
                name: "CourierId1",
                table: "Shipments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Shipments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "ProductOffers",
                type: "numeric(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "Orders",
                type: "numeric(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "ShippingRate",
                table: "Orders",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<decimal>(
                name: "UnitPrice",
                table: "OrderItems",
                type: "numeric(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AddColumn<Guid>(
                name: "UserId1",
                table: "Couriers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "ShipmentStatusHistories",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ShipmentStatusHistories",
                table: "ShipmentStatusHistories",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_CourierId1",
                table: "Shipments",
                column: "CourierId1");

            migrationBuilder.CreateIndex(
                name: "IX_Couriers_UserId1",
                table: "Couriers",
                column: "UserId1",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Couriers_Users_UserId1",
                table: "Couriers",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_ProductOffers_OfferId",
                table: "OrderItems",
                column: "OfferId",
                principalTable: "ProductOffers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Couriers_CourierId",
                table: "Shipments",
                column: "CourierId",
                principalTable: "Couriers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Couriers_CourierId1",
                table: "Shipments",
                column: "CourierId1",
                principalTable: "Couriers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ShipmentStatusHistories_Shipments_ShipmentId",
                table: "ShipmentStatusHistories",
                column: "ShipmentId",
                principalTable: "Shipments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Couriers_Users_UserId1",
                table: "Couriers");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_ProductOffers_OfferId",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Couriers_CourierId",
                table: "Shipments");

            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Couriers_CourierId1",
                table: "Shipments");

            migrationBuilder.DropForeignKey(
                name: "FK_ShipmentStatusHistories_Shipments_ShipmentId",
                table: "ShipmentStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_CourierId1",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_Couriers_UserId1",
                table: "Couriers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ShipmentStatusHistories",
                table: "ShipmentStatusHistories");

            migrationBuilder.DropColumn(
                name: "CourierId1",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "Couriers");

            migrationBuilder.RenameTable(
                name: "ShipmentStatusHistories",
                newName: "ShipmentStatusHistory");

            migrationBuilder.RenameColumn(
                name: "ChangedAt",
                table: "ShipmentStatusHistory",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_ShipmentStatusHistories_ShipmentId",
                table: "ShipmentStatusHistory",
                newName: "IX_ShipmentStatusHistory_ShipmentId");

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "ProductOffers",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "Orders",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)");

            migrationBuilder.AlterColumn<int>(
                name: "ShippingRate",
                table: "Orders",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<decimal>(
                name: "UnitPrice",
                table: "OrderItems",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "ShipmentStatusHistory",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ShipmentStatusHistory",
                table: "ShipmentStatusHistory",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_ProductOffers_OfferId",
                table: "OrderItems",
                column: "OfferId",
                principalTable: "ProductOffers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Couriers_CourierId",
                table: "Shipments",
                column: "CourierId",
                principalTable: "Couriers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ShipmentStatusHistory_Shipments_ShipmentId",
                table: "ShipmentStatusHistory",
                column: "ShipmentId",
                principalTable: "Shipments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
