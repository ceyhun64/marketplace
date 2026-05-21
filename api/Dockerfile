# ── Stage 1: deps ─────────────────────────────────────────────────────────────
# Restore NuGet packages in a separate layer so Docker cache invalidates only
# when the .csproj changes, not on every source-code edit.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS deps
WORKDIR /src
COPY api.csproj .
RUN dotnet restore --locked-mode

# ── Stage 2: builder ──────────────────────────────────────────────────────────
# Build and publish the release binary.
FROM deps AS builder
COPY . .
RUN dotnet publish api.csproj \
    -c Release \
    -o /app/out \
    --no-restore \
    /p:UseAppHost=false

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
# Minimal ASP.NET runtime image — no SDK, no source code, no secrets.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

# curl is needed for the HEALTHCHECK instruction below.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# The mcr.microsoft.com/dotnet/aspnet image already ships with a non-root
# user called "app" (uid 1654). No need to create a custom user.
WORKDIR /app
COPY --from=builder --chown=app:app /app/out .

USER app

EXPOSE 5000

ENV ASPNETCORE_URLS=http://+:5000 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_GCConserveMemory=9

# Liveness probe — hits the /health endpoint registered in Program.cs.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["dotnet", "api.dll"]
