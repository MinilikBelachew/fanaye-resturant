param(
    [string]$Port = "COM9",
    [string]$JsonFile
)

if (-not $JsonFile -or -not (Test-Path $JsonFile)) {
    Write-Error "JSON file not provided or does not exist."
    exit 1
}

$rawJson = Get-Content -Path $JsonFile -Raw -Encoding UTF8
$data = $rawJson | ConvertFrom-Json

$maxCols = if ($data.paperWidth -eq "80mm") { 42 } else { 32 }
$divider = ("-" * $maxCols) + "`n"
$doubleDivider = ("=" * $maxCols) + "`n"

function Format-Line([string]$left, [string]$right, [int]$width) {
    $spaces = $width - $left.Length - $right.Length
    if ($spaces -gt 0) {
        return $left + (" " * $spaces) + $right + "`n"
    }
    return "$left $right`n"
}

$candidatePorts = @($Port)
if ($Port -eq "COM9") { $candidatePorts += "COM8" }
elseif ($Port -eq "COM8") { $candidatePorts += "COM9" }

$sp = $null
$connected = $false
$lastError = ""

foreach ($p in $candidatePorts) {
    try {
        $sp = New-Object System.IO.Ports.SerialPort $p, 9600, "None", 8, "One"
        $sp.ReadTimeout = 3000
        $sp.WriteTimeout = 3000
        $sp.Open()
        $connected = $true
        $Port = $p
        break
    } catch {
        $lastError = $_.Exception.Message
        if ($sp -and $sp.IsOpen) { $sp.Close() }
    }
}

if (-not $connected) {
    Write-Error "Failed to connect to printer on candidate ports ($($candidatePorts -join ', ')): $lastError"
    exit 1
}

try {
    
    [System.Collections.Generic.List[byte]]$b = New-Object 'System.Collections.Generic.List[byte]'
    
    # ESC @ (Initialize)
    $b.AddRange([byte[]]@(0x1B, 0x40))
    
    # Center: ESC a 1
    $b.AddRange([byte[]]@(0x1B, 0x61, 0x01))
    
    # Double size header: GS ! 0x11
    $b.AddRange([byte[]]@(0x1D, 0x21, 0x11))
    $restName = if ($data.restaurantName) { $data.restaurantName.ToUpper() } else { "RESTAURANT" }
    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes("$restName`n"))
    
    # Normal size: GS ! 0x00
    $b.AddRange([byte[]]@(0x1D, 0x21, 0x00))
    if ($data.branchName) {
        $b.AddRange([System.Text.Encoding]::ASCII.GetBytes("$($data.branchName)`n"))
    }
    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes($doubleDivider))
    
    # Left align: ESC a 0
    $b.AddRange([byte[]]@(0x1B, 0x61, 0x00))
    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes("Receipt #: $($data.billNumber)`n"))
    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes("Date:     $($data.date)`n"))
    if ($data.table) {
        $b.AddRange([System.Text.Encoding]::ASCII.GetBytes("Table:    $($data.table)`n"))
    }
    if ($data.waiter) {
        $b.AddRange([System.Text.Encoding]::ASCII.GetBytes("Server:   $($data.waiter)`n"))
    }
    if ($data.cashier) {
        $b.AddRange([System.Text.Encoding]::ASCII.GetBytes("Cashier:  $($data.cashier)`n"))
    }
    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes($divider))
    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes((Format-Line "QTY  ITEM" "TOTAL" $maxCols)))
    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes($divider))
    
    # Items
    foreach ($item in $data.lines) {
        $qtyName = "$($item.quantity)x $($item.itemName)"
        $price = "$($item.total) ETB"
        if (($qtyName.Length + $price.Length + 1) -le $maxCols) {
            $b.AddRange([System.Text.Encoding]::ASCII.GetBytes((Format-Line $qtyName $price $maxCols)))
        } else {
            $b.AddRange([System.Text.Encoding]::ASCII.GetBytes("$qtyName`n"))
            $b.AddRange([System.Text.Encoding]::ASCII.GetBytes((Format-Line "" $price $maxCols)))
        }
    }
    
    # Total
    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes($divider))
    $b.AddRange([byte[]]@(0x1D, 0x21, 0x01)) # Double height total
    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes((Format-Line "TOTAL:" "$($data.total) ETB" $maxCols)))
    $b.AddRange([byte[]]@(0x1D, 0x21, 0x00))
    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes((Format-Line "Status:" "$($data.status)" $maxCols)))
    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes($doubleDivider))
    
    # Footer Center: ESC a 1
    $b.AddRange([byte[]]@(0x1B, 0x61, 0x01))

    # Native ESC/POS Hardware QR Code
    if ($data.qrData) {
        $qrBytes = [System.Text.Encoding]::ASCII.GetBytes($data.qrData)
        $len = $qrBytes.Length + 3
        $pL = [byte]($len % 256)
        $pH = [byte]([math]::Floor($len / 256))

        # Model 2
        $b.AddRange([byte[]]@(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00))
        # Size (5 dots)
        $b.AddRange([byte[]]@(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x05))
        # Error correction L
        $b.AddRange([byte[]]@(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30))
        # Store data
        $b.AddRange([byte[]]@(0x1D, 0x28, 0x6B, $pL, $pH, 0x31, 0x50, 0x30))
        $b.AddRange($qrBytes)
        # Print symbol
        $b.AddRange([byte[]]@(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30))
        $b.AddRange([System.Text.Encoding]::ASCII.GetBytes("Scan to verify receipt`n"))
    }

    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes("THANK YOU FOR DINING WITH US!`n"))
    $b.AddRange([System.Text.Encoding]::ASCII.GetBytes("*** FOR INTERNAL USE ONLY ***`n`n"))
    
    # Feed 2 lines to reach tear-off line without wasting paper: ESC d 2
    $b.AddRange([byte[]]@(0x1B, 0x64, 0x02))
    
    $arr = $b.ToArray()
    $sp.Write($arr, 0, $arr.Length)
    Start-Sleep -Milliseconds 500
    $sp.Close()
    
    Write-Output "SUCCESS"
    exit 0
} catch {
    Write-Error $_.Exception.Message
    try { if ($sp.IsOpen) { $sp.Close() } } catch {}
    exit 1
}
