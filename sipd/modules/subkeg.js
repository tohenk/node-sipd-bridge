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

const fs = require('fs');
const { glob } = require('glob');
const path = require('path');
const Queue = require('@ntlab/work/queue');
const SipdAgr = require('./agr');
const SipdUtil = require('../util');
const debug = require('debug')('sipdagr:subkeg');

class SipdSubkeg {

    constructor(owner) {
        this.owner = owner;
        this.agr = new SipdAgr();
    }

    download(outdir, subkeg, skipDownload) {
        if (!fs.existsSync(outdir)) {
            fs.mkdirSync(outdir);
        }
        return this.owner.works([
            [w => this.downloadKegList(outdir, subkeg), w => !skipDownload],
            [w => this.importAgr(outdir)],
        ]);
    }

    downloadKegList(outdir, subkeg) {
        console.log('Downloading list...');
        return this.owner.works([
            [w => this.owner.app.clickMenu('Penganggaran | Sub Kegiatan Belanja', {click: false})],
            [w => this.owner.waitForResponse('/api/renja/sub_bl/list_belanja_by_tahun_daerah_unit', {encoded: false})],
            [w => new Promise((resolve, reject) => {
                const f = a => `${a.kode_sub_skpd}-${a.kode_sub_giat}`;
                let items = w.getRes(1);
                const filters = [];
                // apply filter: unit, prog, keg, and subkeg (in dotted format)
                for (const opts of [
                    ['unit', 'kode_skpd', 'kode_sub_skpd'],
                    ['prog', 'kode_program'],
                    ['keg', 'kode_giat'],
                    ['subkeg', 'kode_sub_giat'],
                ]) {
                    const opt = opts.shift();
                    if (this.owner.options[opt]) {
                        filters.push(opt);
                        const values = Array.isArray(this.owner.options[opt]) ? this.owner.options[opt] : [this.owner.options[opt]];
                        items = items.filter(a => {
                            const datas = opts.map(k => a[k]);
                            for (const v of values) {
                                if (datas.includes(v)) {
                                    return true;
                                }
                            }
                            return false;
                        });
                    }
                }
                if (items.length) {
                    items.sort((a, b) => f(a).localeCompare(f(b)));
                    const q = new Queue(items, item => {
                        let doit = SipdUtil.makeFloat(item.rincian) > 0;
                        if (doit && subkeg) {
                            if (Array.isArray(subkeg)) {
                                doit = subkeg.indexOf(SipdUtil.cleanKode(item.kode_sub_giat)) >= 0;
                            } else {
                                doit = subkeg === SipdUtil.cleanKode(item.kode_sub_giat);
                            }
                        }
                        if (doit) {
                            this.owner.works([
                                [x => this.downloadKeg(outdir, item)],
                            ])
                            .then(() => q.next())
                            .catch(err => reject(err));
                        } else {
                            q.next();
                        }
                    });
                    q.once('done', () => resolve(true));
                } else {
                    reject(`Nothing to download when applying ${filters.join(', ')} filter!`)
                }
            })],
        ]);
    }

    downloadKeg(outdir, data, options) {
        options = options || {};
        const maxretry = options.retry !== undefined ? options.retry : 10;
        const timeout = options.timeout !== undefined ? options.timeout : 30000;
        const keg = data.kode_sub_giat;
        const title = data.nama_sub_giat
        const url = `${this.owner.url}/penganggaran/anggaran/cascading/rincian/sub-kegiatan/${data.id_sub_bl}`;
        const fname = SipdUtil.cleanKode(keg);
        outdir = path.join(outdir, data.kode_sub_skpd);
        if (!fs.existsSync(outdir)) {
            fs.mkdirSync(outdir);
        }
        if (this.skpd !== data.kode_sub_skpd) {
            this.skpd = data.kode_sub_skpd;
            console.log('-- %s --', data.nama_sub_skpd);
        }
        let retry = maxretry;
        const s = title.replace(/\n+/g, ' ');
        console.log('Downloading %s...', s);
        return new Promise((resolve, reject) => {
            const f = () => {
                this.owner.works([
                    [w => this.owner.getDriver().get(url)],
                    [w => this.owner.waitForResponse([
                        '/api/renja/rinci_sub_bl/get_by_id_sub_bl',
                        '/api/renja/subs_sub_bl/find_by_id_list',
                        '/api/renja/ket_sub_bl/find_by_id_list',
                    ], {timeout})],
                    [w => this.mergeDataset(w.getRes(1)[0], w.getRes(1)[1], w.getRes(1)[2])],
                    [w => Promise.resolve(fs.writeFileSync(path.join(outdir, fname + '.meta'), JSON.stringify(data, null, 2)))],
                    [w => Promise.resolve(fs.writeFileSync(path.join(outdir, fname + '.json'), JSON.stringify(w.getRes(1)[0], null, 2)))],
                ])
                .then(res => resolve(res))
                .catch(err => {
                    debug('%s: %s', s, err);
                    if (--retry) {
                        console.log('Downloading %s (retry %d of %d)...', s, maxretry - retry + 1, maxretry);
                        f();
                    } else {
                        reject(err);
                    }
                });
            }
            f();
        });
    }

    mergeDataset(rinci, sub, ket) {
        return new Promise((resolve, reject) => {
            const subs = {}, kets = {};
            sub.forEach(item => {
                subs[item.id_subs_sub_bl] = item.subs_bl_teks;
            });
            ket.forEach(item => {
                kets[item.id_ket_sub_bl] = item.ket_bl_teks;
            });
            for (const r of rinci) {
                if (subs[r.id_subs_sub_bl] !== undefined) {
                    r.subs_bl_teks = subs[r.id_subs_sub_bl];
                }
                if (kets[r.id_ket_sub_bl] !== undefined) {
                    r.ket_bl_teks = kets[r.id_ket_sub_bl];
                }
            }
            resolve(rinci);
        });
    }

    importAgr(outdir) {
        return this.owner.works([
            [w => glob(path.join(outdir, '*', '*.json'), {withFileTypes: true, windowsPathsNoEscape: true})],
            [w => new Promise((resolve, reject) => {
                let count = 0;
                const files = w.getRes(0);
                const q = new Queue(files, f => {
                    const data = JSON.parse(fs.readFileSync(path.join(f.path, f.name)));
                    const metadata = JSON.parse(fs.readFileSync(path.join(f.path, f.name.replace('.json', '.meta'))));
                    this.agr.clear();
                    this.agr.import(data, metadata);
                    this.agr.exportXls(f.path)
                        .then(() => {
                            count++;
                            q.next();
                        })
                        .catch(err => reject(err))
                    ;
                });
                q.once('done', () => {
                    console.log('Done importing %d files...', count);
                    resolve(count)
                });
            })]
        ]);
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