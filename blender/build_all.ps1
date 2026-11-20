# Rebuilds every asset (.blend + .glb + preview png), then validates the GLBs.
$blender = "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
foreach ($n in "door_ring","door_arch","door_lintel","prop_bookshelf","prop_relic_case","prop_lectern","prop_pedestal","prop_globe") {
  Write-Host "== $n"
  & $blender -b --factory-startup -P "$here\make_$n.py" | Select-String "STATS|Error|Traceback"
}
node "$here\validate_glb.mjs"
