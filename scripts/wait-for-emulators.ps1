param(
  [int]$TimeoutSeconds = 60,
  [string]$Url = 'http://localhost:5000/v2/health'
)

$end = (Get-Date).AddSeconds($TimeoutSeconds)
while ((Get-Date) -lt $end) {
  try {
    $resp = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($resp.StatusCode -eq 200) {
      Write-Host "OK: $Url is reachable"
      $resp.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
      exit 0
    }
    else {
      Write-Host "Status: $($resp.StatusCode) - waiting..."
    }
  }
  catch {
    Write-Host "Waiting for $Url... ($($_.Exception.Message))"
  }
  Start-Sleep -Seconds 1
}
Write-Error "Timed out waiting for $Url after $TimeoutSeconds seconds"
exit 2
