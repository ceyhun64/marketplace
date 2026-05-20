# Test Instructions

## Applied: 3 Fixes + 5 Test Files

---

## FIXES

| # | File | Problem | Solution |
|---|------|---------|----------|
| 1 | `api/Common/Mappings/MappingProfile.cs` | Enum PascalCase → Frontend UPPER_SNAKE_CASE mismatch | `ToUpperSnakeCase()` helper + all status ForMember mappings |
| 2 | `api/Controllers/AdminController.cs` | `POST /api/admin/store/{id}/setup` endpoint was missing | Endpoint + `AdminStoreSetupDto` added |
| 3 | `api/Application/Commands/Orders/CreateOrderCommand.cs` | Stock check race condition | Wrapped with `IsolationLevel.Serializable` transaction |

---

## RUNNING BACKEND TESTS (xUnit)

```bash
# Add the test project to the solution (once only)
cd api
dotnet sln ../marketplace.sln add ../api.Tests/api.Tests.csproj

# Run all tests
cd api.Tests
dotnet test --logger "console;verbosity=normal"

# Run a single test file
dotnet test --filter "FullyQualifiedName~EnumSerializationTests"
dotnet test --filter "FullyQualifiedName~AdminStoreSetupTests"
dotnet test --filter "FullyQualifiedName~CreateOrderStockTests"
```

**Expected result:**
```
EnumSerializationTests: 18 passed
AdminStoreSetupTests:    4 passed
CreateOrderStockTests:   5 passed
Total: 27 passed
```

---

## RUNNING FRONTEND TESTS (Jest)

```bash
cd web

# Install Jest dependencies (first time only)
npm install --save-dev jest jest-environment-jsdom @testing-library/react \
  @testing-library/jest-dom @types/jest ts-jest next

# Run all tests
npx jest --testPathPattern="__tests__"

# Watch mode
npx jest --watch

# Run a specific file
npx jest enumMapping
npx jest TrackingTimeline
```

**Expected result:**
```
enumMapping.test.ts:       16 passed
TrackingTimeline.test.tsx: 12 passed (requires component rendering)
```

> **Note:** TrackingTimeline tests require `@testing-library/react` to be installed.
> For enum logic tests only, `enumMapping.test.ts` is sufficient.

---

## TEST FILES

```
api.Tests/
├── api.Tests.csproj
├── EnumSerializationTests.cs      # Fix #1 — 18 tests
├── AdminStoreSetupTests.cs        # Fix #2 — 4 tests
└── CreateOrderStockTests.cs       # Fix #3 — 5 tests

web/__tests__/
├── enumMapping.test.ts            # Fix #1 frontend — 16 tests
└── TrackingTimeline.test.tsx      # TrackingTimeline render — 12 tests
```
