# expose-wsl2.ps1
# Expoe o frontend (5173) e o backend (3000) do WSL2 na rede local.
# Execute como Administrador no PowerShell do Windows.

$ports = @(3000, 5173)

# Descobre o IP atual do WSL2
$wslIp = (wsl hostname -I).Trim().Split(" ")[0]

if (-not $wslIp) {
    Write-Error "Nao foi possivel obter o IP do WSL2. Verifique se o WSL2 esta rodando."
    exit 1
}

Write-Host ""
Write-Host "IP do WSL2: $wslIp" -ForegroundColor Cyan

# Remove redirecionamentos antigos e recria com o IP atual
foreach ($port in $ports) {
    netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 2>$null | Out-Null
    netsh interface portproxy add    v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wslIp
    Write-Host "Portproxy configurado: 0.0.0.0:$port -> ${wslIp}:$port" -ForegroundColor Green
}

# Garante as regras no Windows Firewall
$rules = @{
    "WSL2 - Backend (3000)"  = 3000
    "WSL2 - Frontend (5173)" = 5173
}

foreach ($ruleName in $rules.Keys) {
    $rulePort = $rules[$ruleName]
    $existing = netsh advfirewall firewall show rule name="$ruleName" 2>$null
    if ($existing -match "No rules match") {
        netsh advfirewall firewall add rule `
            name="$ruleName" `
            dir=in action=allow protocol=TCP localport=$rulePort | Out-Null
        Write-Host "Firewall: regra criada para porta $rulePort" -ForegroundColor Green
    } else {
        Write-Host "Firewall: regra para porta $rulePort ja existe" -ForegroundColor Yellow
    }
}

# Exibe o IP Windows para compartilhar
Write-Host ""
Write-Host "Compartilhe este endereco com quem estiver no mesmo Wi-Fi:" -ForegroundColor White
$winIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notmatch "Loopback|WSL|vEthernet" -and
    $_.IPAddress -notmatch "^169\."
}).IPAddress

foreach ($ip in $winIp) {
    Write-Host "  Frontend: http://${ip}:5173" -ForegroundColor Cyan
    Write-Host "  Backend:  http://${ip}:3000/api" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Pronto! Lembre-se: o IP do WSL2 muda a cada reinicializacao." -ForegroundColor White
Write-Host "Execute este script novamente se reiniciar o computador." -ForegroundColor Gray
Write-Host ""
