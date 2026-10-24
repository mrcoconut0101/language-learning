#!/usr/bin/env bash
# Builds two files from src/:
#   index.html          standalone web app (open on iPhone, Share > Add to Home Screen)
#   dist/quartier.html  page fragment published as a Claude artifact
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Lexend:wght@400;500;600;700&display=swap">'
fragment() {
  echo '<title>Le Quartier</title>'
  echo '<meta name="claude:viewport-fit-sides" content="cover">'
  echo "$FONTS"
  echo '<style>'; cat src/style.css; echo '</style>'
  cat src/body.html
  echo '<script>'; cat src/data.js; echo; cat src/app.js; echo '</script>'
}
fragment > dist/quartier.html
{
  echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  echo '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
  echo '<meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="apple-mobile-web-app-title" content="Quartier">'
  echo '<meta name="theme-color" content="#1D3B7A"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon.svg">'
  echo '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);color-scheme:light}body{margin:0}[hidden]{display:none!important}*{box-sizing:border-box}</style>'
  echo '</head><body>'
  fragment
  echo '</body></html>'
} > index.html
echo "built index.html and dist/quartier.html"
