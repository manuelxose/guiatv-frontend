$env:NODE_ENV = "development"
$env:PORT = "3000"
$env:API_VERSION = "2.0.0"
$env:CACHE_TYPE = "valkey" 
# Fallback logic handles connection failure, so we can set valkey here safely.
# If user has a local instance, it will connect. If not, it warns and uses InMemory.

$env:REDIS_URL = "redis://localhost:6379"
# Default local Valkey/Redis URL

Write-Host "Starting GuiaTV Backend (Local Mode)..."
Write-Host "Cache Type: $env:CACHE_TYPE"
Write-Host "Redis URL: $env:REDIS_URL"

npm run dev
