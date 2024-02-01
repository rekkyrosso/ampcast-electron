const {notarize} = require('@electron/notarize');
const {build} = require('../package.json');

exports.default = async function (context) {
    console.log(`afterSign: appOutDir=${context.appOutDir}`);

    if (process.platform === 'darwin') {
        // Notarize
        if (!('APPLE_ID' in process.env && 'APPLE_ID_PASSWORD' in process.env)) {
            console.warn(
                'Skipping notarizing step. APPLE_ID and APPLE_ID_PASSWORD env variables must be set'
            );
            return;
        }

        console.log('Notarizing...');

        const {appOutDir} = context;
        const appName = context.packager.appInfo.productFilename;

        await notarize({
            appBundleId: build.appId,
            appPath: `${appOutDir}/${appName}.app`,
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_ID_PASSWORD,
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
