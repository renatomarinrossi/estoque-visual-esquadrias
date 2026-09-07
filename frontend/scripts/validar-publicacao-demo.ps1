$ErrorActionPreference = 'Stop'
$demoOrigin = 'https://demo.visualesquadrias.com'
$demoApi = 'https://jnaojtkggsedzauizxgh.supabase.co'
$demoPage = Invoke-WebRequest -Uri $demoOrigin -UseBasicParsing
$demoAsset = [regex]::Match($demoPage.Content, 'src="(/assets/index-[^"]+\.js)"').Groups[1].Value
if (-not $demoAsset) { throw 'Bundle principal não encontrado.' }
$demoCode = (Invoke-WebRequest -Uri ($demoOrigin + $demoAsset) -UseBasicParsing).Content
if (-not $demoCode.Contains($demoApi)) { throw 'Bundle não aponta para o banco demo.' }
if ($demoCode.Contains('https://ukakbfidmmtkntbftsda.supabase.co')) { throw 'URL de produção encontrada no bundle demo.' }
$publicDemoKey = $null
foreach ($candidate in [regex]::Matches($demoCode, 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+')) {
  $payload = $candidate.Value.Split('.')[1].Replace('-', '+').Replace('_', '/')
  $payload = $payload.PadRight($payload.Length + ((4 - $payload.Length % 4) % 4), '=')
  try {
    $claims = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json
    if ($claims.role -eq 'anon' -and $claims.ref -eq 'jnaojtkggsedzauizxgh') { $publicDemoKey = $candidate.Value; break }
  } catch { continue }
}
if (-not $publicDemoKey) { $publicDemoKey = [regex]::Match($demoCode, 'sb_publishable_[A-Za-z0-9_-]+').Value }
if (-not $publicDemoKey) { throw 'Chave pública do projeto demo não identificada.' }
foreach ($functionName in @('autenticar-usuario','gerenciar-usuarios')) {
  $functionUrl = "$demoApi/functions/v1/$functionName"
  $preflight = Invoke-WebRequest -Uri $functionUrl -Method Options -Headers @{Origin=$demoOrigin; 'Access-Control-Request-Method'='POST'} -SkipHttpErrorCheck
  if ($preflight.StatusCode -ne 200 -or $preflight.Headers['Access-Control-Allow-Origin'] -ne $demoOrigin) { throw "CORS demo falhou: $functionName" }
  $blocked = Invoke-WebRequest -Uri $functionUrl -Method Options -Headers @{Origin='https://origem-invalida.example'} -SkipHttpErrorCheck
  if ($blocked.StatusCode -ne 403) { throw "Origem inválida não foi bloqueada: $functionName" }
}
$invalidLogin = Invoke-WebRequest -Uri "$demoApi/functions/v1/autenticar-usuario" -Method Post -Headers @{Origin=$demoOrigin; Authorization="Bearer $publicDemoKey"; apikey=$publicDemoKey} -ContentType 'application/json' -Body '{"login":"__auditoria_usuario_inexistente__","senha":"validacao-sem-conta"}' -SkipHttpErrorCheck
if ($invalidLogin.StatusCode -ne 401 -or -not $invalidLogin.Content.Contains('Usuário ou senha inválidos')) { throw ('Fluxo de autenticação inesperado: HTTP ' + $invalidLogin.StatusCode + ' ' + $invalidLogin.Content) }
Write-Output 'PASS: domínio HTTP 200, bundle isolado no banco demo, CORS das duas funções e validação de login.'
