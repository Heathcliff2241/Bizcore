/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')

const brandstudioPath = path.join(__dirname, '..', 'brandstudio-vite', 'src', 'utils', 'componentLibrary.ts')
const storefrontPath = path.join(__dirname, '..', 'components', 'storefront', 'index.ts')

function extractTypeKeysFromBrandStudio(file) {
  const text = fs.readFileSync(file, 'utf8')
  // Look for `type: 'xxx'` or id: 'xxx'
  const typeRegex = /type:\s*['"]([a-z0-9-]+)['"]/ig
  const idRegex = /id:\s*['"]([a-z0-9-]+)['"]/ig
  const types = new Set()
  let m
  while ((m = typeRegex.exec(text))) types.add(m[1])
  while ((m = idRegex.exec(text))) types.add(m[1])
  return Array.from(types).sort()
}

function extractKeysFromStorefrontIndex(file) {
  const text = fs.readFileSync(file, 'utf8')
  const mapRegex = /componentMap:\s*{([\s\S]*?)}\s*;/m
  const m = mapRegex.exec(text)
  const keys = new Set()
  if (!m) return []
  const mapBody = m[1]
  // find 'key': or "key": patterns
  const keyRegex = /['"]([a-z0-9-]+)['"]\s*:/ig
  let k
  while ((k = keyRegex.exec(mapBody))) keys.add(k[1])
  return Array.from(keys).sort()
}

function main() {
  const brandstudioKeys = extractTypeKeysFromBrandStudio(brandstudioPath)
  const storefrontKeys = extractKeysFromStorefrontIndex(storefrontPath)

  const bsOnly = brandstudioKeys.filter(x => !storefrontKeys.includes(x))
  const sfOnly = storefrontKeys.filter(x => !brandstudioKeys.includes(x))

  console.log('BrandStudio component Types:', brandstudioKeys.length)
  console.log('Storefront componentMap keys:', storefrontKeys.length)

  if (bsOnly.length === 0 && sfOnly.length === 0) {
    console.log('\x1b[32m%s\x1b[0m', 'SUCCESS: Component contracts match between BrandStudio and Storefront')
    process.exit(0)
  }

  console.error('\x1b[31mMismatch detected!\x1b[0m')
  if (bsOnly.length) {
    console.error('\nTypes present in BrandStudio but missing in storefront componentMap:\n')
    bsOnly.forEach(k => console.error('- ' + k))
  }
  if (sfOnly.length) {
    console.error('\nTypes present in storefront componentMap but missing in BrandStudio:\n')
    sfOnly.forEach(k => console.error('- ' + k))
  }
  process.exit(2)
}

main()
