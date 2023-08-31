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
const glob = require('glob');
const path = require('path');
const DomParser = require('dom-parser');
const Queue = require('@ntlab/ntlib/queue');
const SipdAgr = require('./agr');
const SipdData = require('../data');
const SipdUtil = require('../util');

class SipdSubkeg {

    constructor(owner) {
        this.owner = owner;
        this.agr = new SipdAgr();
    }

    download(outdir, subkeg, skipDownload) {
        if (!fs.existsSync(outdir)) {
            fs.mkdirSync(outdir);
        }
        this.agr.clear();
        return this.owner.works([
            [w => this.downloadKegList(outdir, subkeg), w => !skipDownload],
            [w => this.importAgr(outdir)],
            [w => this.exportXls(outdir)],
        ]);
    }

    downloadKegList(outdir, subkeg) {
        console.log('Downloading list...');
        return this.owner.works([
            [w => this.owner.app.clickMenu('Sub Kegiatan Belanja')],
            [w => this.downloadSkpdOrKegList(outdir, subkeg)],
        ]);
    }

    downloadSkpdOrKegList(outdir, subkeg) {
        return new Promise((resolve, reject) => {
            this.owner.data.pickData(SipdData.SHOW_ITEM_ALL)
                .then(result => {
                    if (result.length) {
                        // is skpd?
                        if (!result[0].kode_sub_giat) {
                            // process SKPD
                            const q = new Queue(result, info => {
                                const url = this.owner.sipdurl.getMainUrl(info.nama_skpd.sParam);
                                this.owner.getDriver().get(url)
                                    .then(() => {
                                        this.downloadSkpdOrKegList(outdir, subkeg)
                                            .then(() => q.next())
                                            .catch(err => reject(err))
                                        ;
                                    })
                                    .catch(err => reject(err))
                                ;
                            });
                            q.once('done', () => resolve(true));
                        } else {
                            // process SUBKEG
                            result.sort((a, b) => a.kode_sub_giat.localeCompare(b.kode_sub_giat));
                            const q = new Queue(result, info => {
                                let doit = SipdUtil.makeFloat(info.rincian) > 0;
                                if (doit && subkeg) {
                                    if (Array.isArray(subkeg)) {
                                        doit = subkeg.indexOf(SipdUtil.cleanKode(info.kode_sub_giat)) >= 0;
                                    } else {
                                        doit = subkeg == SipdUtil.cleanKode(info.kode_sub_giat);
                                    }
                                }
                                if (doit) {
                                    const url = this.owner.sipdurl.getMainUrl(this.getRinciUrl(info.action));
                                    this.downloadKeg(outdir, info.kode_sub_giat, info.nama_sub_giat.nama_sub_giat, url)
                                        .then(() => q.next())
                                        .catch(err => reject(err))
                                    ;
                                } else {
                                    q.next();
                                }
                            });
                            q.once('done', () => resolve(true));
                        }
                    } else {
                        resolve(false);
                    }
                })
            ;
        });
    }

    getRinciUrl(str) {
        let result = null;
        const dom = new DomParser().parseFromString(str);
        const nodes = dom.getElementsByTagName('a');
        nodes.forEach(node => {
            if (node.innerHTML.match(/Detil Rincian/)) {
                result = node.getAttribute('href').split('?')[1];
                return true;
            }
        });
        return result;
    }

    downloadKeg(outdir, keg, title, url) {
        console.log('Downloading %s...', title.replace('\n\n', '\n').replace('\n', ''));
        let filename = SipdUtil.cleanKode(keg) + '.json';
        return this.owner.works([
            [w => this.owner.getDriver().get(url)],
            [w => this.owner.data.saveData(path.join(outdir, filename), SipdData.SHOW_ITEM_ALL)],
        ]);
    }

    importAgr(outdir) {
        return new Promise((resolve, reject) => {
            let count = 0;
            glob(path.join(outdir, '*.json'), (err, files) => {
                if (err) return reject(err);
                const q = new Queue(files, f => {
                    const data = JSON.parse(fs.readFileSync(f));
                    this.agr.import(data);
                    count++;
                    q.next();
                });
                q.once('done', () => {
                    console.log('Done importing %d files...', count);
                    resolve(count)
                });
            });
        });
    }

    exportXls(outdir) {
        return new Promise((resolve, reject) => {
            this.agr.exportXls(outdir)
                .then(() => resolve())
                .catch(err => reject(err))
            ;
        });        
    }
}

module.exports = SipdSubkeg;