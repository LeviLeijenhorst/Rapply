const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

if (!config.resolver.assetExts.includes('docx')) {
  config.resolver.assetExts.push('docx')
}

module.exports = config
