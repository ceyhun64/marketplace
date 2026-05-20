using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddSiteSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Announcements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    CtaText = table.Column<string>(type: "text", nullable: true),
                    CtaUrl = table.Column<string>(type: "text", nullable: true),
                    BackgroundColor = table.Column<string>(type: "text", nullable: false),
                    TextColor = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Announcements", x => x.Id);
                }
            );

            migrationBuilder.CreateTable(
                name: "HeroSettings",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    BadgeText = table.Column<string>(type: "text", nullable: false),
                    Headline = table.Column<string>(type: "text", nullable: false),
                    HeadlineAccent = table.Column<string>(type: "text", nullable: true),
                    Subtitle = table.Column<string>(type: "text", nullable: false),
                    SearchPlaceholder = table.Column<string>(type: "text", nullable: false),
                    PrimaryCtaText = table.Column<string>(type: "text", nullable: false),
                    PrimaryCtaHref = table.Column<string>(type: "text", nullable: false),
                    SecondaryCtaText = table.Column<string>(type: "text", nullable: true),
                    SecondaryCtaHref = table.Column<string>(type: "text", nullable: true),
                    BackgroundImageUrl = table.Column<string>(type: "text", nullable: true),
                    Tags = table.Column<string>(type: "jsonb", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HeroSettings", x => x.Id);
                }
            );

            migrationBuilder.InsertData(
                table: "Announcements",
                columns: new[]
                {
                    "Id",
                    "BackgroundColor",
                    "CreatedAt",
                    "CtaText",
                    "CtaUrl",
                    "IsActive",
                    "SortOrder",
                    "Text",
                    "TextColor",
                    "UpdatedAt",
                },
                values: new object[,]
                {
                    {
                        new Guid("11111111-0000-0000-0000-000000000001"),
                        "#1e1e1e",
                        new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc),
                        "Shop now",
                        "/products",
                        true,
                        0,
                        "Free shipping on orders over $500 — ",
                        "rgba(255,255,255,0.85)",
                        new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc),
                    },
                    {
                        new Guid("11111111-0000-0000-0000-000000000002"),
                        "#1e1e1e",
                        new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc),
                        "Apply now",
                        "/auth/apply-merchant",
                        true,
                        1,
                        "New sellers welcome! Start your store today — ",
                        "rgba(255,255,255,0.85)",
                        new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc),
                    },
                    {
                        new Guid("11111111-0000-0000-0000-000000000003"),
                        "#1e1e1e",
                        new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc),
                        "See today's deals",
                        "/deals",
                        true,
                        2,
                        "Flash deals updated daily — ",
                        "rgba(255,255,255,0.85)",
                        new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc),
                    },
                }
            );

            migrationBuilder.InsertData(
                table: "HeroSettings",
                columns: new[]
                {
                    "Id",
                    "BackgroundImageUrl",
                    "BadgeText",
                    "Headline",
                    "HeadlineAccent",
                    "IsActive",
                    "PrimaryCtaHref",
                    "PrimaryCtaText",
                    "SearchPlaceholder",
                    "SecondaryCtaHref",
                    "SecondaryCtaText",
                    "Subtitle",
                    "Tags",
                    "UpdatedAt",
                },
                values: new object[]
                {
                    1,
                    null,
                    "Next-Gen Commerce",
                    "Premium Marketplace\nMeets Fast Delivery.",
                    "Marketplace",
                    true,
                    "/products",
                    "Search",
                    "Search products, stores...",
                    null,
                    null,
                    "We redefine digital commerce with independent stores and an integrated courier engine — everything under one roof.",
                    "[\"Electronics\",\"Fashion\",\"Home \\u0026 Living\",\"Fast Delivery\"]",
                    new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc),
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_SortOrder",
                table: "Announcements",
                column: "SortOrder"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Announcements");

            migrationBuilder.DropTable(name: "HeroSettings");
        }
    }
}
