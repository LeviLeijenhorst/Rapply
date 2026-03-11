const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

if (!config.resolver.assetExts.includes('docx')) {
  config.resolver.assetExts.push('docx')
}

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@': path.resolve(__dirname, 'src'),
}

module.exports = config
