/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2022-2024 Toha <tohenk@yahoo.com>
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
const SipdRefKegiatan = require('./ref/keg');
const SipdRefRekening = require('./ref/rek');

class SipdRefs {

    refs = []

    constructor(owner) {
        this.owner = owner;
    }

    download(outdir, skipDownload) {
        if (!fs.existsSync(outdir)) {
            fs.mkdirSync(outdir);
        }
        return this.owner.works([
            [w => this.downloadRefs(outdir), w => !skipDownload],
            [w => this.importRefs(outdir)],
            [w => this.exportXls(outdir)],
        ]);
    }

    downloadRefs(outdir) {
        return new Promise((resolve, reject) => {
            const refs = [
                {page: 'Referensi | Akun', name: 'rek.json', uri: '/api/master/akun/listNew'},
                {page: 'Referensi | Sub Kegiatan', name: 'keg.json', uri: [
                    ['/api/master/sub_giat/list_table'],
                    ['/api/master/urusan/find_by_id_urusan_list', 'id_urusan'],
                    ['/api/master/bidang_urusan/find_by_id_bidang_urusan_list', 'id_bidang_urusan'],
                    ['/api/master/program/find_by_id_program_list', 'id_program'],
                    ['/api/master/giat/find_by_id_giat_list', 'id_giat'],
                ]},
                {page: 'Standar Harga Satuan | A S B', name: 'asb.json', uri: '/api/master/d_komponen/listAll'},
                {page: 'Standar Harga Satuan | H S P K', name: 'hspk.json', uri: '/api/master/d_komponen/listAll'},
                {page: 'Standar Harga Satuan | S B U', name: 'sbu.json', uri: '/api/master/d_komponen/listAll'},
                {page: 'Standar Harga Satuan | S S H', name: 'ssh.json', uri: '/api/master/d_komponen/listAll'},
            ];
            const q = new Queue(refs, ref => {
                this.downloadFromPage(outdir, ref)
                    .then(() => q.next())
                    .catch(err => reject(err))
                ;
            });
            q.once('done', () => resolve());
        });
    }

    downloadFromPage(outdir, data, page = 1, count = 1000) {
        console.log('Downloading file %s...', data.name);
        return new Promise((resolve, reject) => {
            const items = [];
            const f = () => {
                const works = [
                    [w => this.owner.app.clickMenu(data.page, {click: false, params: `pageIndex=${page}&pageSize=${count}`})]
                ];
                const responses = {};
                const uris = Array.isArray(data.uri) ? data.uri : [data.uri];
                for (const uri of uris) {
                    const uriId = Array.isArray(uri) ? uri[0] : uri;
                    works.push(
                        [w => this.owner.waitForResponse(uriId)],
                        [w => Promise.resolve(responses[uriId] = w.res)],
                    );
                }
                this.owner.works(works)
                    .then(() => {
                        let result;
                        for (const uri of uris) {
                            const uriId = Array.isArray(uri) ? uri[0] : uri;
                            // main result
                            if (result === undefined) {
                                result = responses[uriId];
                            } else if (Array.isArray(uri) && uri.length > 1) {
                                // merge result
                                const subresult = responses[uriId];
                                for (const row of result.data) {
                                    subresult
                                        .filter(r => r[uri[1]] === row[uri[1]])
                                        .forEach(r => {
                                            const kode = 'kode' + uri[1].substr(2);
                                            const nama = 'nama' + uri[1].substr(2);
                                            row[kode] = r[kode];
                                            row[nama] = r[nama];
                                        });
                                }
                            }
                        }
                        items.push(...result.data);
                        const recordsTotal = result.recordsTotal;
                        const pages = Math.ceil(recordsTotal / count);
                        if (page === pages) {
                            fs.writeFileSync(path.join(outdir, data.name), JSON.stringify(items, null, 2));
                            resolve();
                        } else {
                            page++;
                            f();
                        }
                    })
                    .catch(err => reject(err))
                ;
            }
            f();
        });
    }

    importRefs(outdir) {
        return this.owner.works([
            [w => glob(path.join(outdir, '*.json'), {withFileTypes: true, windowsPathsNoEscape: true})],
            [w => new Promise((resolve, reject) => {
                let count = 0;
                const files = w.getRes(0);
                const q = new Queue(files, f => {
                    let added = false;
                    const filename = path.join(f.path, f.name);
                    switch (f.name.toLowerCase()) {
                        case 'rek.json':
                            const rek = new SipdRefRekening();
                            rek.import(JSON.parse(fs.readFileSync(filename)));
                            this.refs.push(rek);
                            added = true;
                            break;
                        case 'keg.json':
                            const keg = new SipdRefKegiatan();
                            keg.import(JSON.parse(fs.readFileSync(filename)));
                            this.refs.push(keg);
                            added = true;
                            break;
                    }
                    if (added) {
                        count++;
                    }
                    q.next();
                });
                q.once('done', () => resolve(count));
            })]
        ]);
    }

    exportXls(outdir) {
        return new Promise((resolve, reject) => {
            const q = new Queue(this.refs, ref => {
                ref.exportXls(outdir)
                    .then(() => q.next())
                    .catch(err => reject(err))
                ;
            });
            q.once('done', () => resolve());
        });        
    }
}

module.exports = SipdRefs;