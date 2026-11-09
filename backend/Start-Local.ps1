$ErrorActionPreference = 'Stop'
$backendRoot = $PSScriptRoot
$dotnetPath = Join-Path $env:USERPROFILE '.dotnet\dotnet.exe'
if (!(Test-Path -LiteralPath $dotnetPath)) { $dotnetPath = 'dotnet' }
Push-Location $backendRoot
try {
    & $dotnetPath publish GymHung.Api -c Release -o artifacts/local
    if ($LASTEXITCODE -ne 0) { throw 'Backend publish failed.' }
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    Push-Location (Join-Path $backendRoot 'artifacts/local')
    try { & $dotnetPath ./GymHung.Api.dll --urls http://localhost:5042 }
    finally { Pop-Location }
} finally { Pop-Location }
