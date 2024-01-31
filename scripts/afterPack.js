exports.default = function (context) {
    // Skip if not mac
    if (process.platform !== 'darwin') {
        return;
    }

    // VMP sign via EVS
    const {execSync} = require('child_process');
    console.info('VMP signing start');
    execSync('python -m castlabs_evs.vmp sign-pkg ./dist/mac');
    console.info('VMP signing complete');
};
