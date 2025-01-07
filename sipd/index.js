/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2022-2025 Toha <tohenk@yahoo.com>
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
const SipdSubkeg = require('./modules/subkeg');
const SipdRefs = require('./modules/refs');
const debug = require('debug')('sipd');

class Sipd extends WebRobot {

    WAIT_GONE = 1
    WAIT_PRESENCE = 2

    initialize() {
        this.delay = this.options.delay || 500;
        this.opdelay = this.options.opdelay || 400;
        this.provinsi = this.options.provinsi;
        this.username = this.options.username;
        this.password = this.options.password;
        this.unit = this.options.unit;
        this.year = this.options.year || (new Date()).getFullYear();
        this.app = new SipdApp(this);
        this.subkeg = new SipdSubkeg(this);
        this.refs = new SipdRefs(this);
    }

    getWorks() {
        const works = this.getCommonWorks();
        switch (this.options.mode) {
            case Sipd.UPLOAD:
                break;
            case Sipd.DOWNLOAD:
                works.push([w => this.subkeg.download(this.options.dir, this.options.keg, this.options.skipDownload)]);
                break;
            case Sipd.REFS:
                works.push([w => this.refs.download(this.options.dir, this.options.skipDownload)]);
                break;
        }
        return works;
    }

    getCommonWorks() {
        const works = [];
        const mode = this.options.mode;
        if (mode === Sipd.DOWNLOAD || mode === Sipd.REFS) {
            if (!this.options.skipDownload) {
                const code =
                    'd2luZG93LmdldENvZGUgPSBmdW5jdGlvbigpIHsKICAgIGlmIChBcnJheS5pc0FycmF5KHdpbmRvdy5' +
                    'yZXRfbm9kZXMpKSB7CiAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIHdpbmRvdy5yZXRfbm9kZXMpIH' +
                    'sKICAgICAgICAgICAgaWYgKG5vZGUubm9kZU5hbWUgPT09ICdOR1gtQ0FQVENIQScgJiYgQXJyYXkua' +
                    'XNBcnJheShub2RlLl9fbmdDb250ZXh0X18pKSB7CiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG8g' +
                    'b2Ygbm9kZS5fX25nQ29udGV4dF9fKSB7CiAgICAgICAgICAgICAgICAgICAgaWYgKG8gJiYgby5jYXB' +
                    '0Y2hTZXJ2aWNlICYmIG8uY29kZSkgewogICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gby5jb2' +
                    'RlOwogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgI' +
                    'GJyZWFrOwogICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQp9';
                works.push(
                    [w => this.getDriver().sendDevToolsCommand('Page.addScriptToEvaluateOnNewDocument', {
                        source: `
                            addEventListener('load', e => {
                                if (XMLHttpRequest.prototype._send === undefined) {
                                    XMLHttpRequest.prototype._send = XMLHttpRequest.prototype.send;
                                    XMLHttpRequest.prototype.send = function(a) {
                                        if (window.request === undefined) {
                                            window.request = {};
                                        }
                                        const uri = this.__zone_symbol__xhrURL.substr(window.location.origin.length);
                                        window.request[uri] = this;
                                        this._send(a);
                                    }
                                }
                            });
                            window.getXhrResponse = function(path) {
                                if (window.request && window.request[path] !== undefined) {
                                    const xhr = window.request[path];
                                    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status >= 200 && xhr.status < 400) {
                                        return xhr.responseText;
                                    } else if (xhr.status >= 400) {
                                        throw new Error(xhr.responseText);
                                    }
                                }
                            }
                            ${Buffer.from(code, '\x62\x61\x73\x65\x36\x34').toString()}
                            `
                    })],
                    [w => this.open()],
                    [w => this.app.login()],
                    [w => this.app.setYear()],
                );
            } else {
                works.push([w => Promise.resolve(console.log('Skipping download...'))]);
            }
        }
        return works;
    }

    waitForResponse(uri, options = {}) {
        options = options || {};
        return new Promise((resolve, reject) => {
            const f = () => {
                this.getDriver().executeScript('return getXhrResponse(arguments[0])', uri)
                    .then(result => {
                        if (result === null) {
                            debug(`still waiting response ${uri}`);
                            setTimeout(f, 500);
                        } else {
                            if (result) {
                                const data = JSON.parse(result);
                                if (data.data) {
                                    if (options.encoded) {
                                        const b64dec = s => {
                                            return Buffer.from(s, 'base64').toString();
                                        }
                                        const rev = s => {
                                            return s.split('').reduce((acc, char) => char + acc, '');
                                        }
                                        result = JSON.parse(rev(b64dec(rev(b64dec(data.data)))));
                                    } else {
                                        result = data.data;
                                    }
                                }
                            }
                            resolve(result);
                        }
                    })
                    .catch(err => reject(err));
            }
            f();
        });
    }

    waitForPresence(data, options = {}) {
        options = options || {};
        if (options.time === undefined) {
            options.time = this.wait;
        }
        if (options.mode === undefined) {
            options.mode = this.WAIT_GONE;
        }
        return new Promise((resolve, reject) => {
            let el, presence = false;
            const t = Date.now();
            const f = () => {
                this.works([
                    [w => this.findElements(data)],
                    [w => new Promise((resolve, reject) => {
                        let wait = true;
                        if (options.mode === this.WAIT_GONE && presence && w.res.length === 0) {
                            debug(`element now is gone: ${data}`);
                            el = w.res[0];
                            wait = false;
                        }
                        if (options.mode === this.WAIT_PRESENCE && !presence && w.res.length === 1) {
                            debug(`element now is presence: ${data}`);
                            el = w.res[0];
                            wait = false;
                        }
                        if (w.res.length === 1 && !presence) {
                            presence = true;
                        }
                        // is timed out
                        if (options.time > 0 && !presence && Date.now() - t > options.time) {
                            wait = false;
                        }
                        resolve(wait);
                    })],
                ])
                .then(result => {
                    if (result) {
                        debug(`still waiting for ${options.mode === this.WAIT_GONE ? 'gone' : 'presence'}: ${data}`);
                        setTimeout(f, !presence ? 250 : 500);
                    } else {
                        resolve(el);
                    }
                })
                .catch(err => reject(err));
            }
            f();
        });
    }

    scrollTo(top) {
        return this.getDriver().executeScript(`window.scrollTo(0, ${top});`);
    }

    static get UPLOAD() {
        return 'upload';
    }

    static get DOWNLOAD() {
        return 'download';
    }

    static get REFS() {
        return 'refs';
    }
}

module.exports = Sipd;