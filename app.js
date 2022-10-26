/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2022 Toha <tohenk@yahoo.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const fs = require('fs');
const path = require('path');
const Cmd = require('@ntlab/ntlib/cmd');
const Sipd = require('./sipd');

Cmd.addVar('config', 'c', 'Set configuration file', 'filename');
Cmd.addVar('mode', '', 'Processing mode, can be download or upload', 'mode');
Cmd.addVar('url', '', 'Set SIPD url', 'url');
Cmd.addVar('username', 'u', 'Set username', 'username');
Cmd.addVar('password', 'p', 'Set password', 'password');
Cmd.addVar('year', 'y', 'Set year', 'year');
Cmd.addVar('dir', 'd', 'Set input or output directory', 'filename-or-folder');
Cmd.addBool('no-download', '', 'Do not download from SIPD instead use previously downloaded files', false);
Cmd.addBool('help', '', 'Show program usage', false);

if (!Cmd.parse() || (Cmd.get('help') && usage())) {
    process.exit();
}

class App {

    config = {}

    initialize() {
        let filename, profile;
        // read configuration from command line values
        if (Cmd.get('config') && fs.existsSync(Cmd.get('config'))) {
            filename = Cmd.get('config');
        } else if (fs.existsSync(path.join(__dirname, 'config.json'))) {
            filename = path.join(__dirname, 'config.json');
        }
        if (filename) {
            console.log('Reading configuration %s', filename);
            this.config = JSON.parse(fs.readFileSync(filename));
        }
        if (Cmd.get('url')) this.config.url = Cmd.get('url');
        if (Cmd.get('username')) this.config.username = Cmd.get('username');
        if (Cmd.get('password')) this.config.password = Cmd.get('password');
        if (Cmd.get('year')) this.config.year = Cmd.get('year');
        if (Cmd.get('dir')) this.config.dir = Cmd.get('dir');
        if (Cmd.get('no-download')) this.config.skipDownload = Cmd.get('no-download');
        if (!this.config.workdir) this.config.workdir = __dirname;
        if (!this.config.mode) this.config.mode = Cmd.get('mode') ? Cmd.get('mode') : Sipd.DOWNLOAD;
    
        if (!this.config.username || !this.config.password) {
            console.log('Both username or password must be supplied!');
            return;
        }
        if (this.config.mode == Sipd.UPLOAD && !this.config.dir) {
            console.log('No data file to process!');
            return;
        }
        // load profile
        this.config.profiles = {};
        filename = path.join(__dirname, 'profiles.json');
        if (fs.existsSync(filename)) {
            const profiles = JSON.parse(fs.readFileSync(filename));
            if (profiles.profiles) this.config.profiles = profiles.profiles;
            if (profiles.active) profile = profiles.active;
        }
        if (Cmd.get('profile')) profile = Cmd.get('profile');
        if (profile && this.config.profiles[profile]) {
            console.log('Using profile %s', profile);
            const keys = ['timeout', 'wait', 'delay', 'opdelay'];
            for (let key in this.config.profiles[profile]) {
                if (keys.indexOf(key) < 0) continue;
                this.config[key] = this.config.profiles[profile][key];
            }
        }
        return true;
    }

    checkDir(defaultDir) {
        if (!this.config.dir) {
            this.config.dir = path.join(__dirname, defaultDir);
        } else if (this.config.dir.slice(-1) != '/' && this.config.dir.slice(-1) != '\\') {
            this.config.dir = fs.realpathSync(path.dirname(this.config.dir));
        }
    }

    startApp() {
        const sipd = new Sipd(this.config);
        switch (this.config.mode) {
            case Sipd.UPLOAD:
                console.log('Processing UPLOAD, please wait...');
                break;
            case Sipd.DOWNLOAD:
                console.log('Processing DOWNLOAD, please wait...');
                this.checkDir('agr');
                break;
            case Sipd.UPDATE:
                console.log('Processing UPDATE, please wait...');
                this.checkDir('refs');
                break;
        }
        const works = sipd.getWorks();
        if (works) {
            sipd.works(works, next => {
                setTimeout(() => next(), 500);
            }).then(() => {
                sipd.app.showMessage('Information', 'The process has been completed! :)');
                console.log('Done');
            }).catch(err => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Unknown error, aborting!!!');
                }
            });
        } else {
            console.log('Unknown MODE %s!!!', this.config.mode);
        }
    }

    run() {
        if (this.initialize()) {
            this.startApp();
            return true;
        }
    }
}

(function run() {
    new App().run();
})();

function usage() {
    console.log('Usage:');
    console.log('  node %s [options]', path.basename(process.argv[1]));
    console.log('');
    console.log('Options:');
    console.log(Cmd.dump());
    console.log('');
    return true;
}