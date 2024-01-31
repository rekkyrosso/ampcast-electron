const {notarize} = require('@electron/notarize');

exports.default = function (context) {
    // Skip if not mac build
    if (process.platform === 'darwin') {
        console.log('Notarizing');
        // Get context vars
        const appName = context.packager.appInfo.productFilename;
        const appDir = context.appOutDir;

        // Notarize
        return notarize({
            appBundleId: 'com.rekkyrosso.ampcast',
            appPath: `${appDir}/${appName}.app`,
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_ID_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID,
        });
    } else if (process.platform === 'win32') {
        // VMP sign via EVS
        const {execSync} = require('child_process');
        console.log('VMP signing start');
        execSync('python -m castlabs_evs.vmp sign-pkg ./dist/win-unpacked');
        console.log('VMP signing complete');
    }
};
