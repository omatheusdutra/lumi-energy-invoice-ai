param(
  [int]$MaxAttempts = 5,
  [int]$BaseDelayMs = 750
)

if ($env:PRISMA_GENERATE_MAX_ATTEMPTS) {
  $MaxAttempts = [int]$env:PRISMA_GENERATE_MAX_ATTEMPTS
}

if ($env:PRISMA_GENERATE_BASE_DELAY_MS) {
  $BaseDelayMs = [int]$env:PRISMA_GENERATE_BASE_DELAY_MS
}

$lockPatterns = @('EPERM', 'EBUSY', 'operation not permitted', 'resource busy or locked', 'Acesso negado')

for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
  $output = & npm exec prisma -- generate 2>&1
  $exitCode = $LASTEXITCODE
  $output | ForEach-Object { Write-Host $_ }

  if ($exitCode -eq 0) {
    exit 0
  }

  $outputText = ($output | Out-String)
  $isLockError = $false
  foreach ($pattern in $lockPatterns) {
    if ($outputText -match [Regex]::Escape($pattern)) {
      $isLockError = $true
      break
    }
  }

  if (-not $isLockError -or $attempt -ge $MaxAttempts) {
    exit $exitCode
  }

  $delay = $BaseDelayMs * $attempt
  Write-Warning "[prisma-generate-safe] lock detectado (tentativa $attempt/$MaxAttempts); retry em ${delay}ms."
  Remove-Item -Recurse -Force ".\node_modules\.prisma\client" -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds $delay
}

exit 1
