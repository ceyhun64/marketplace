using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations;

/// <summary>
/// Users tablosuna AccountStatus kolonu ekler.
/// Kolon zaten varsa (eski deploy senaryosu) sessizce atlar.
/// </summary>
public partial class AddAccountStatusToUsers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Kolon zaten varsa hata vermemesi için raw SQL kullanıyoruz.
        // EF'in AddColumn'u doğrudan "column already exists" hatası verir,
        // bu yüzden information_schema kontrolü ile güvenli ekleme yapıyoruz.
        migrationBuilder.Sql(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name   = 'Users'
                      AND column_name  = 'AccountStatus'
                ) THEN
                    ALTER TABLE "Users"
                    ADD COLUMN "AccountStatus" text NOT NULL DEFAULT 'Active';
                END IF;
            END
            $$;
            """
        );
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "AccountStatus", table: "Users");
    }
}
