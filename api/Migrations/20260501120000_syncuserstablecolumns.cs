using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations;

/// <summary>
/// Users tablosundaki tüm eksik kolonları güvenli biçimde ekler.
/// Her kolon IF NOT EXISTS bloğuyla kontrol edilir — zaten varsa atlar.
/// Render'daki eski DB şemasını güncel entity ile senkronize eder.
/// </summary>
public partial class SyncUsersTableColumns : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $$
            BEGIN

                -- AccountStatus (NOT NULL, varsayılan 'Active')
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'AccountStatus'
                ) THEN
                    ALTER TABLE "Users" ADD COLUMN "AccountStatus" text NOT NULL DEFAULT 'Active';
                END IF;

                -- RejectionReason (nullable)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'RejectionReason'
                ) THEN
                    ALTER TABLE "Users" ADD COLUMN "RejectionReason" text;
                END IF;

                -- IsVerified (NOT NULL, varsayılan false)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'IsVerified'
                ) THEN
                    ALTER TABLE "Users" ADD COLUMN "IsVerified" boolean NOT NULL DEFAULT false;
                END IF;

                -- VerificationToken (nullable)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'VerificationToken'
                ) THEN
                    ALTER TABLE "Users" ADD COLUMN "VerificationToken" text;
                END IF;

                -- RefreshToken (nullable)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'RefreshToken'
                ) THEN
                    ALTER TABLE "Users" ADD COLUMN "RefreshToken" text;
                END IF;

                -- RefreshTokenExpiry (nullable timestamp)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'RefreshTokenExpiry'
                ) THEN
                    ALTER TABLE "Users" ADD COLUMN "RefreshTokenExpiry" timestamp with time zone;
                END IF;

                -- PasswordResetToken (nullable)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'PasswordResetToken'
                ) THEN
                    ALTER TABLE "Users" ADD COLUMN "PasswordResetToken" text;
                END IF;

                -- PasswordResetExpiry (nullable timestamp)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'PasswordResetExpiry'
                ) THEN
                    ALTER TABLE "Users" ADD COLUMN "PasswordResetExpiry" timestamp with time zone;
                END IF;

                -- IsDeleted (NOT NULL, varsayılan false)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'IsDeleted'
                ) THEN
                    ALTER TABLE "Users" ADD COLUMN "IsDeleted" boolean NOT NULL DEFAULT false;
                END IF;

            END
            $$;
            """
        );
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Geri alma: sadece bu migration'la eklenen, zaten var olmayanları düşür.
        // Üretim ortamında Down genellikle çalıştırılmaz.
        migrationBuilder.DropColumn(name: "RejectionReason", table: "Users");
        migrationBuilder.DropColumn(name: "VerificationToken", table: "Users");
        migrationBuilder.DropColumn(name: "RefreshToken", table: "Users");
        migrationBuilder.DropColumn(name: "RefreshTokenExpiry", table: "Users");
        migrationBuilder.DropColumn(name: "PasswordResetToken", table: "Users");
        migrationBuilder.DropColumn(name: "PasswordResetExpiry", table: "Users");
        migrationBuilder.DropColumn(name: "IsDeleted", table: "Users");
    }
}
