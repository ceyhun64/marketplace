# Test Talimatları

## Uygulandı: 3 Fix + 5 Test Dosyası

---

## FIX'LER

| # | Dosya | Sorun | Çözüm |
|---|-------|-------|-------|
| 1 | `api/Common/Mappings/MappingProfile.cs` | Enum PascalCase → Frontend UPPER_SNAKE_CASE uyumsuzluğu | `ToUpperSnakeCase()` helper + tüm status ForMember mappings |
| 2 | `api/Controllers/AdminController.cs` | `POST /api/admin/store/{id}/setup` endpoint eksikti | Endpoint + `AdminStoreSetupDto` eklendi |
| 3 | `api/Application/Commands/Orders/CreateOrderCommand.cs` | Stok kontrolü race condition | `IsolationLevel.Serializable` transaction ile sarıldı |

---

## BACKEND TESTLERİ ÇALIŞTIRMA (xUnit)

```bash
# Test projesini solution'a ekle (sadece bir kez)
cd api
dotnet sln ../marketplace.sln add ../api.Tests/api.Tests.csproj

# Testleri çalıştır
cd api.Tests
dotnet test --logger "console;verbosity=normal"

# Tek dosya
dotnet test --filter "FullyQualifiedName~EnumSerializationTests"
dotnet test --filter "FullyQualifiedName~AdminStoreSetupTests"
dotnet test --filter "FullyQualifiedName~CreateOrderStockTests"
```

**Beklenen sonuç:**
```
EnumSerializationTests: 18 passed
AdminStoreSetupTests:    4 passed
CreateOrderStockTests:   5 passed
Total: 27 passed
```

---

## FRONTEND TESTLERİ ÇALIŞTIRMA (Jest)

```bash
cd web

# Jest bağımlılıklarını yükle (ilk seferinde)
npm install --save-dev jest jest-environment-jsdom @testing-library/react \
  @testing-library/jest-dom @types/jest ts-jest next

# Testleri çalıştır
npx jest --testPathPattern="__tests__"

# Watch mode
npx jest --watch

# Belirli dosya
npx jest enumMapping
npx jest TrackingTimeline
```

**Beklenen sonuç:**
```
enumMapping.test.ts:     16 passed
TrackingTimeline.test.tsx: 12 passed (bileşen render gerektiriyor)
```

> **Not:** TrackingTimeline testleri `@testing-library/react` kurulumu gerektirir.
> Sadece enum logic testleri için `enumMapping.test.ts` yeterlidir.

---

## TEST DOSYALARI

```
api.Tests/
├── api.Tests.csproj
├── EnumSerializationTests.cs      # Fix #1 — 18 test
├── AdminStoreSetupTests.cs        # Fix #2 — 4 test
└── CreateOrderStockTests.cs       # Fix #3 — 5 test

web/__tests__/
├── enumMapping.test.ts            # Fix #1 frontend — 16 test
└── TrackingTimeline.test.tsx      # TrackingTimeline render — 12 test
```
