using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class FixModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_ProductOffers_OfferId",
                table: "OrderItems"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Users_CreatedById",
                table: "Products"
            );

            migrationBuilder.DropTable(name: "MerchantPlugin");

            migrationBuilder.DropTable(name: "ProductOffers");

            migrationBuilder.DropTable(name: "Plugins");

            migrationBuilder.DropColumn(name: "Latitude", table: "ShipmentStatusHistories");

            migrationBuilder.DropColumn(name: "Longitude", table: "ShipmentStatusHistories");

            migrationBuilder.RenameColumn(
                name: "CreatedById",
                table: "Products",
                newName: "MerchantId"
            );

            migrationBuilder.RenameIndex(
                name: "IX_Products_CreatedById",
                table: "Products",
                newName: "IX_Products_MerchantId"
            );

            migrationBuilder.Sql(@"DELETE FROM ""Products"";");

            migrationBuilder.RenameColumn(
                name: "OfferId",
                table: "OrderItems",
                newName: "ProductId"
            );

            migrationBuilder.RenameIndex(
                name: "IX_OrderItems_OfferId",
                table: "OrderItems",
                newName: "IX_OrderItems_ProductId"
            );

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "ShipmentStatusHistories",
                type: "uuid",
                nullable: true
            );

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "ShipmentStatusHistories",
                type: "text",
                nullable: true
            );

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Products",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m
            );

            migrationBuilder.AddColumn<bool>(
                name: "PublishToMarket",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false
            );

            migrationBuilder.AddColumn<bool>(
                name: "PublishToStore",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false
            );

            migrationBuilder.AddColumn<int>(
                name: "Stock",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.AddColumn<string>(
                name: "CustomDomain",
                table: "MerchantProfiles",
                type: "text",
                nullable: true
            );

            migrationBuilder.AddColumn<bool>(
                name: "DomainVerified",
                table: "MerchantProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false
            );

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Products_ProductId",
                table: "OrderItems",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict
            );

            migrationBuilder.AddForeignKey(
                name: "FK_Products_MerchantProfiles_MerchantId",
                table: "Products",
                column: "MerchantId",
                principalTable: "MerchantProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Products_ProductId",
                table: "OrderItems"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_Products_MerchantProfiles_MerchantId",
                table: "Products"
            );

            migrationBuilder.DropColumn(name: "CreatedById", table: "ShipmentStatusHistories");

            migrationBuilder.DropColumn(name: "Location", table: "ShipmentStatusHistories");

            migrationBuilder.DropColumn(name: "Price", table: "Products");

            migrationBuilder.DropColumn(name: "PublishToMarket", table: "Products");

            migrationBuilder.DropColumn(name: "PublishToStore", table: "Products");

            migrationBuilder.DropColumn(name: "Stock", table: "Products");

            migrationBuilder.DropColumn(name: "CustomDomain", table: "MerchantProfiles");

            migrationBuilder.DropColumn(name: "DomainVerified", table: "MerchantProfiles");

            migrationBuilder.RenameColumn(
                name: "MerchantId",
                table: "Products",
                newName: "CreatedById"
            );

            migrationBuilder.RenameIndex(
                name: "IX_Products_MerchantId",
                table: "Products",
                newName: "IX_Products_CreatedById"
            );

            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "OrderItems",
                newName: "OfferId"
            );

            migrationBuilder.RenameIndex(
                name: "IX_OrderItems_ProductId",
                table: "OrderItems",
                newName: "IX_OrderItems_OfferId"
            );

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "ShipmentStatusHistories",
                type: "double precision",
                nullable: true
            );

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "ShipmentStatusHistories",
                type: "double precision",
                nullable: true
            );

            migrationBuilder.CreateTable(
                name: "Plugins",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    Description = table.Column<string>(type: "text", nullable: false),
                    IconUrl = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plugins", x => x.Id);
                }
            );

            migrationBuilder.CreateTable(
                name: "ProductOffers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PublishToMarket = table.Column<bool>(type: "boolean", nullable: false),
                    PublishToStore = table.Column<bool>(type: "boolean", nullable: false),
                    Rating = table.Column<double>(type: "double precision", nullable: false),
                    Stock = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductOffers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductOffers_MerchantProfiles_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "MerchantProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_ProductOffers_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "MerchantPlugin",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PluginId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExpiresAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SubscribedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantPlugin", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantPlugin_MerchantProfiles_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "MerchantProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_MerchantPlugin_Plugins_PluginId",
                        column: x => x.PluginId,
                        principalTable: "Plugins",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_MerchantPlugin_MerchantId",
                table: "MerchantPlugin",
                column: "MerchantId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_MerchantPlugin_PluginId",
                table: "MerchantPlugin",
                column: "PluginId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_ProductOffers_MerchantId",
                table: "ProductOffers",
                column: "MerchantId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_ProductOffers_ProductId",
                table: "ProductOffers",
                column: "ProductId"
            );

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_ProductOffers_OfferId",
                table: "OrderItems",
                column: "OfferId",
                principalTable: "ProductOffers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict
            );

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Users_CreatedById",
                table: "Products",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );
        }
    }
}
