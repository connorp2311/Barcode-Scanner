module.exports = {
  packagerConfig: {
    icon: './resources/favicon.ico',
    ignore: [
      /^\/src/,
      /(.eslintrc.json)|(.gitignore)|(electron.vite.config.ts)|(forge.config.cjs)|(tsconfig.*)/
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-wix',
      config: {
        // icon
        icon: './resources/favicon.ico',
        manufacturer: 'Connor Parsons',
        upgradeCode: '93f6064f-f557-4061-a796-b45634d5f18a'
      }
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        author: 'Connor Parsons',
        setupIcon: './resources/favicon.ico'
      }
    }
  ]
}
