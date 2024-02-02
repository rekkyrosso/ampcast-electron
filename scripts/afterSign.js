const {notarize} = require('@electron/notarize');
const {build} = require('../package.json');

exports.default = async function (context) {
    if (process.platform === 'darwin') {
        const env = process.env;

        if (!('APPLE_ID' in env && 'APPLE_ID_PASSWORD' in env && 'APPLE_TEAM_ID' in env)) {
            console.warn(
                'Skipping notarizing step. APPLE_ID, APPLE_ID_PASSWORD and APPLE_TEAM_ID env variables must be set'
            );
            return;
        }

        console.log('Notarizing...');

        const {appOutDir} = context;
        const appName = context.packager.appInfo.productFilename;

        await notarize({
            appBundleId: build.appId,
            appPath: `${appOutDir}/${appName}.app`,
            appleId: env.APPLE_ID,
            appleIdPassword: env.APPLE_ID_PASSWORD,
            teamId: env.APPLE_TEAM_ID,
        });

        console.log('Notarization complete.');
    } else if (process.platform === 'win32') {
        // VMP sign via EVS
        const {execSync} = require('child_process');
        console.log('VMP signing start');
        execSync('python -m castlabs_evs.vmp sign-pkg ./dist/win-unpacked');
        console.log('VMP signing complete');
    }
};
