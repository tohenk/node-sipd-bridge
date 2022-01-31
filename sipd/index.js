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

const WebRobot = require('@ntlab/webrobot');
const Work = require('@ntlab/ntlib/work');
const SipdApp = require('./modules/app');
const SipdLogin = require('./modules/login');
const SipdSubkeg = require('./modules/subkeg');
const SipdRefs = require('./modules/refs');
const SipdData = require('./data');
const SipdUrl = require('./url');

class Sipd extends WebRobot {

    SIPD_APP = 'Sistem Informasi Keuangan Daerah'

    initialize() {
        this.sipdurl = new SipdUrl(this.url);
        this.url = this.sipdurl.getUrl();
        this.delay = this.options.delay || 500;
        this.opdelay = this.options.opdelay || 400;
        this.animedelay = this.options.animedelay || 2000;
        this.username = this.options.username;
        this.password = this.options.password;
        this.year = this.options.year || (new Date()).getFullYear();
        this.data = new SipdData(this);
        this.app = new SipdApp(this);
        this.login = new SipdLogin(this);
        this.subkeg = new SipdSubkeg(this);
        this.refs = new SipdRefs(this);
    }

    start() {
        return new Promise((resolve, reject) => {
            let retry = 1;
            const f = () => {
                Work.works([
                        () => this.app.openApp(this.SIPD_APP),
                        () => this.sleep(this.animedelay),
                        () => this.login.login(),
                        () => this.sleep(this.animedelay),
                        () => new Promise((resolve, reject) => {
                            this.app.checkMain()
                                .then(ismain => {
                                    if (ismain) return resolve();
                                    reject('Can\'t reach main page, login may be failed');
                                })
                            ;
                        }),
                    ])
                    .then(() => resolve())
                    .catch(err => {
                        retry--;
                        if (retry < 0) {
                            if (err) return reject(err);
                            reject();
                        } else {
                            f();
                        }
                    })
                ;
            }
            f();
        });
    }

    getWorks() {
        const works = [];
        switch (this.options.mode) {
            case Sipd.UPLOAD:
                break;
            case Sipd.DOWNLOAD:
                if (!this.options.skipDownload) {
                    works.push(
                        () => this.start(),
                        () => this.app.setYear(),
                    );
                }
                works.push(() => this.subkeg.download(this.options.dir, this.options.keg, this.options.skipDownload));
                break;
            case Sipd.UPDATE:
                if (!this.options.skipDownload) {
                    works.push(
                        () => this.start(),
                        () => this.app.setYear(),
                    );
                }
                works.push(() => this.refs.download(this.options.dir, this.options.skipDownload));
                break;
        }
        return works;
    }

    static get UPLOAD() {
        return 'upload';
    }

    static get DOWNLOAD() {
        return 'download';
    }

    static get UPDATE() {
        return 'update';
    }
}

module.exports = Sipd;