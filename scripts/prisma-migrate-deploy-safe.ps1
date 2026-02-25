param(
  [int]$MaxAttempts = 5,
  [int]$BaseDelayMs = 1000
)

if ($env:PRISMA_MIGRATE_MAX_ATTEMPTS) {
  $MaxAttempts = [int]$env:PRISMA_MIGRATE_MAX_ATTEMPTS
}

if ($env:PRISMA_MIGRATE_BASE_DELAY_MS) {
  $BaseDelayMs = [int]$env:PRISMA_MIGRATE_BASE_DELAY_MS
}

$retryablePatterns = @('EPERM', 'EBUSY', 'spawn EPERM', 'operation not permitted', 'resource busy or locked')

for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
  $output = & npm exec prisma -- migrate deploy 2>&1
  $exitCode = $LASTEXITCODE
  $output | ForEach-Object { Write-Host $_ }

  if ($exitCode -eq 0) {
    exit 0
  }

  $outputText = ($output | Out-String)
  $canRetry = $false
  foreach ($pattern in $retryablePatterns) {
    if ($outputText -match [Regex]::Escape($pattern)) {
      $canRetry = $true
      break
    }
  }

  if (-not $canRetry -or $attempt -ge $MaxAttempts) {
    exit $exitCode
  }

  $delay = $BaseDelayMs * $attempt
  Write-Warning "[prisma-migrate-deploy-safe] erro transiente detectado (tentativa $attempt/$MaxAttempts); retry em ${delay}ms."
  Start-Sleep -Milliseconds $delay
}

exit 1
