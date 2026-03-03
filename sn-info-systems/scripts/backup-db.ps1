$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $PSScriptRoot "..\\backups\\$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

if (-not (Get-Command mongodump -ErrorAction SilentlyContinue)) {
  Write-Host "mongodump not found. Install MongoDB Database Tools first."
  exit 1
}

$mongoUri = $env:MONGODB_URI
if (-not $mongoUri) {
  $mongoUri = "mongodb://localhost:27017/sninfo"
}

mongodump --uri "$mongoUri" --out "$backupDir"
Write-Host "Backup created at $backupDir"
