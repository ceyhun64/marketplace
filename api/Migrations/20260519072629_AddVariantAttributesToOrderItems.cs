using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddVariantAttributesToOrderItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ProductId1",
                table: "WishlistItems",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Dictionary<string, string>>(
                name: "VariantAttributes",
                table: "OrderItems",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VariantId",
                table: "OrderItems",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VendorOrderId",
                table: "OrderItems",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MerchantWallets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PendingBalance = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    AvailableBalance = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalWithdrawn = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantWallets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantWallets_MerchantProfiles_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "MerchantProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductQuestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Question = table.Column<string>(type: "text", nullable: false),
                    Answer = table.Column<string>(type: "text", nullable: true),
                    AnsweredByMerchantId = table.Column<Guid>(type: "uuid", nullable: true),
                    AnsweredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductQuestions_MerchantProfiles_AnsweredByMerchantId",
                        column: x => x.AnsweredByMerchantId,
                        principalTable: "MerchantProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ProductQuestions_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductQuestions_Users_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductVariants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    SKU = table.Column<string>(type: "text", nullable: false),
                    Attributes = table.Column<Dictionary<string, string>>(type: "jsonb", nullable: false),
                    PriceOverride = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Stock = table.Column<int>(type: "integer", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductVariants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductVariants_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: true),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reviews_Users_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VendorOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    SubTotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PlatformFee = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MerchantNetAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    SettledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DispatchAttempts = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorOrders_MerchantProfiles_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "MerchantProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorOrders_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WalletTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WalletId = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PendingBefore = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PendingAfter = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    AvailableBefore = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    AvailableAfter = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    VendorOrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    Reference = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WalletTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_MerchantProfiles_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "MerchantProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_MerchantWallets_WalletId",
                        column: x => x.WalletId,
                        principalTable: "MerchantWallets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WishlistItems_ProductId1",
                table: "WishlistItems",
                column: "ProductId1");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_VariantId",
                table: "OrderItems",
                column: "VariantId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_VendorOrderId",
                table: "OrderItems",
                column: "VendorOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantWallets_MerchantId",
                table: "MerchantWallets",
                column: "MerchantId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductQuestions_AnsweredByMerchantId",
                table: "ProductQuestions",
                column: "AnsweredByMerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductQuestions_CustomerId",
                table: "ProductQuestions",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductQuestions_ProductId",
                table: "ProductQuestions",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductVariants_ProductId_SKU",
                table: "ProductVariants",
                columns: new[] { "ProductId", "SKU" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_CustomerId_ProductId",
                table: "Reviews",
                columns: new[] { "CustomerId", "ProductId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ProductId",
                table: "Reviews",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorOrders_MerchantId_Status",
                table: "VendorOrders",
                columns: new[] { "MerchantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_VendorOrders_OrderId",
                table: "VendorOrders",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_MerchantId",
                table: "WalletTransactions",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_WalletId",
                table: "WalletTransactions",
                column: "WalletId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_ProductVariants_VariantId",
                table: "OrderItems",
                column: "VariantId",
                principalTable: "ProductVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_VendorOrders_VendorOrderId",
                table: "OrderItems",
                column: "VendorOrderId",
                principalTable: "VendorOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_WishlistItems_Products_ProductId1",
                table: "WishlistItems",
                column: "ProductId1",
                principalTable: "Products",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_ProductVariants_VariantId",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_VendorOrders_VendorOrderId",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_WishlistItems_Products_ProductId1",
                table: "WishlistItems");

            migrationBuilder.DropTable(
                name: "ProductQuestions");

            migrationBuilder.DropTable(
                name: "ProductVariants");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "VendorOrders");

            migrationBuilder.DropTable(
                name: "WalletTransactions");

            migrationBuilder.DropTable(
                name: "MerchantWallets");

            migrationBuilder.DropIndex(
                name: "IX_WishlistItems_ProductId1",
                table: "WishlistItems");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_VariantId",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_VendorOrderId",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ProductId1",
                table: "WishlistItems");

            migrationBuilder.DropColumn(
                name: "VariantAttributes",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "VariantId",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "VendorOrderId",
                table: "OrderItems");
        }
    }
}
