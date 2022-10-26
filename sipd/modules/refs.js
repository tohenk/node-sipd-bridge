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
const Queue = require('@ntlab/ntlib/queue');
const SipdData = require('../data');
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
                {page: 'Referensi | Sub Kegiatan', name: 'keg.json'},
                {page: 'Referensi | Akun', name: 'rek.json'},
                {page: 'Referensi | Standar Harga | SSH', name: 'ssh.json'},
                {page: 'Referensi | Standar Harga | SBU', name: 'sbu.json'},
                {page: 'Referensi | Standar Harga | HSPK', name: 'hspk.json'},
                {page: 'Referensi | Standar Harga | ASB', name: 'asb.json'},
            ];
            const q = new Queue(refs, ref => {
                this.downloadFromPage(ref.page, path.join(outdir, ref.name))
                    .then(() => q.next())
                    .catch(err => reject(err))
                ;
            });
            q.once('done', () => resolve());
        });
    }

    downloadFromPage(page, filename) {
        console.log('Downloading file %s...', filename);
        return this.owner.works([
            [w => this.owner.app.clickMenu(page)],
            [W => this.owner.data.saveData(filename, SipdData.SHOW_ITEM_ALL)],
        ]);
    }

    importRefs(outdir) {
        return new Promise((resolve, reject) => {
            let count = 0;
            glob(path.join(outdir, '*.json'), (err, files) => {
                if (err) return reject(err);
                const q = new Queue(files, f => {
                    let added = false;
                    const filename = path.basename(f).toLowerCase();
                    switch (filename) {
                        case 'rek.json':
                            let rek = new SipdRefRekening();
                            rek.import(JSON.parse(fs.readFileSync(f)));
                            this.refs.push(rek);
                            added = true;
                            break;
                        case 'keg.json':
                            let keg = new SipdRefKegiatan();
                            keg.import(JSON.parse(fs.readFileSync(f)));
                            this.refs.push(keg);
                            added = true;
                            break;
                    }
                    if (added) count++;
                    q.next();
                });
                q.once('done', () => resolve(count));
            });
        });
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