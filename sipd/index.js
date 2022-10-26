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
                this.works([
                        [w => this.app.openApp(this.SIPD_APP)],
                        [w => this.login.login()],
                        [w => this.sleep(this.animedelay)],
                        [w => this.app.checkMain()],
                        [w => Promise.reject('Can\'t reach main page, login may be failed'), w => !w.getRes(3)],
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
        const works = this.getCommonWorks();
        switch (this.options.mode) {
            case Sipd.UPLOAD:
                break;
            case Sipd.DOWNLOAD:
                works.push([w => this.subkeg.download(this.options.dir, this.options.keg, this.options.skipDownload)]);
                break;
            case Sipd.UPDATE:
                works.push([w => this.refs.download(this.options.dir, this.options.skipDownload)]);
                break;
        }
        return works;
    }

    getCommonWorks() {
        const works = [];
        const mode = this.options.mode;
        if (mode == Sipd.DOWNLOAD || mode == Sipd.UPDATE) {
            if (!this.options.skipDownload) {
                works.push(
                    [w => this.start()],
                    [w => this.app.setYear()],
                );
            } else {
                works.push([w => Promise.resolve(console.log('Skipping download...'))]);
            }
        }
        return works;
    }

    waitAndClickAnimate(data) {
        return this.works([
            [w => this.waitFor(data)],
            [w => this.sleep(this.animedelay)],
            [w => w.getRes(0).click()],
            [w => Promise.resolve(w.getRes(0))],
        ]);
    }

    waitPresence(data, time = null) {
        if (null == time) {
            time = this.wait;
        }
        return new Promise((resolve, reject) => {
            let shown = false;
            let t = Date.now();
            const f = () => {
                this.works([
                    [w => this.findElements(data)],
                    [w => new Promise((resolve, reject) => {
                        let wait = true;
                        if (shown && w.res.length == 0) {
                            wait = false;
                        }
                        if (w.res.length == 1 && !shown) {
                            shown = true;
                        }
                        // is timed out
                        if (!shown && Date.now() - t > time) {
                            wait = false;
                        }
                        resolve(wait);
                    })],
                ])
                .then(result => {
                    if (result) {
                        setTimeout(f, !shown ? 250 : 500);
                    } else {
                        resolve();
                    }
                })
                .catch(err => reject(err));
            }
            f();
        });
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