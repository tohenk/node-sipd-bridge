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

const path = require('path');
const Excel = require('exceljs');
const Queue = require('@ntlab/ntlib/queue');
const SipdAgrWriter = require('./writer');
const SipdUtil = require('../../util');
const debug = require('debug')('sipd:agr');

class SipdAgr {
    items = []

    import(data, metadata) {
        if (Array.isArray(data)) {
            data.forEach(row => {
                let kodeSubKeg = SipdUtil.cleanKode(metadata.kode_sub_giat);
                let subkeg = this.getSubKeg(kodeSubKeg);
                if (!subkeg) {
                    subkeg = new SipdAgrSubKeg(kodeSubKeg, SipdUtil.cleanText(metadata.nama_sub_giat));
                    this.items.push(subkeg);
                }
                subkeg.import(row, metadata);
            });
        }
    }

    exportXls(outdir) {
        return new Promise((resolve, reject) => {
            const q = new Queue(this.items, subkeg => {
                const filename = path.join(outdir, subkeg.kode + '.xlsx');
                console.log('Writing %s...', filename);
                const wb = new Excel.Workbook();
                const sheet = wb.addWorksheet(subkeg.kode);
                const writer = new SipdAgrWriter(sheet);
                writer.write(subkeg);
                wb.xlsx.writeFile(filename);
                q.next();
            });
            q.once('done', () => resolve());
        });
    }

    getSubKeg(kode) {
        let result;
        this.items.forEach(item => {
            if (item.kode == kode) {
                result = item;
                return true;
            }
        });
        return result;
    }

    clear() {
        this.items = [];
    }
}

class SipdAgrSubKeg {
    items = []

    constructor(kode, nama) {
        this.kode = kode;
        this.nama = nama;
    }

    import(data, metadata) {
        this.fromJson(metadata);
        this.importPek(data);
    }

    importPek(data) {
        const s = SipdUtil.cleanText(data.subs_bl_teks);
        let pek = this.getPek(s);
        if (!pek) {
            pek = new SipdAgrPek(s);
            this.items.push(pek);
        }
        pek.import(data);
    }

    fromJson(data) {
        this.kode_skpd = SipdUtil.cleanKode(data.kode_skpd);
        this.nama_skpd = data.nama_skpd;
        this.kode_keg = SipdUtil.cleanKode(data.kode_giat);
        this.nama_keg = data.nama_giat;
    }

    getPek(pek) {
        let result;
        pek = pek.toLowerCase();
        this.items.forEach(item => {
            if (item.slug === pek) {
                result = item;
                return true;
            }
        });
        return result;
    }
}

class SipdAgrPek {
    items = []

    constructor(nama) {
        this.nama = nama;
        this.slug = nama.toLowerCase();
    }

    import(data) {
        this.fromJson(data);
        this.importRek(data);
    }

    importRek(data) {
        let [krek, nrek] = SipdUtil.splitKode(data.nama_akun);
        let kodeRek = SipdUtil.cleanKode(krek);
        let rek = this.getRek(kodeRek);
        if (!rek) {
            rek = new SipdAgrRek(kodeRek, nrek);
            this.items.push(rek);
        }
        rek.import(data);
    }

    fromJson(data) {
    }

    getRek(rek) {
        let result;
        this.items.forEach(item => {
            if (item.kode === rek) {
                result = item;
                return true;
            }
        });
        return result;
    }
}

class SipdAgrRek {
    items = []

    constructor(kode, nama) {
        this.kode = kode;
        this.nama = nama;
    }

    import(data) {
        this.fromJson(data);
        this.importRinci(data);
    }

    importRinci(data) {
        let rinci = new SipdAgrRinci(data);
        this.items.push(rinci);
    }

    fromJson(data) {
    }
}

class SipdAgrRinci {

    constructor(data) {
        this.fromJson(data);
    }

    fromJson(data) {
        this.ref = data.id_rinci_sub_bl;
        this.ssh = data.kode_standar_harga;
        this.uraian = SipdUtil.cleanText(data.nama_standar_harga);
        this.spek = data.spek;
        this.harga = SipdUtil.makeFloat(data.harga_satuan);
        this.volume = SipdUtil.makeFloat(data.koefisien);
        this.total = SipdUtil.makeFloat(data.total_harga);
        this.satuan = data.koefisien.substr(this.volume.toString().length);
        if (
            data.penerima_bantuan ||
            (data.subs_bl_teks && data.subs_bl_teks.toLowerCase().indexOf('bantuan hibah') >= 0)) {
            const penerima = SipdUtil.cleanText(data.penerima_bantuan);
            let uraian = SipdUtil.cleanText(data.ket_bl_teks);
            if (uraian) {
                // check => Nama Lembaga (Alamat)
                if (!uraian.match(/(.*?)\((.*)\)/)) {
                    debug('0>', penerima, '<=>', uraian);
                    if (SipdUtil.isAlamat(uraian)) {
                        if (uraian.toLowerCase().indexOf(penerima.toLowerCase()) < 0) {
                            debug('1>', `${penerima} (${uraian})`);
                            uraian = `${penerima} (${uraian})`;
                        }
                    } else {
                        if (uraian.toLowerCase().indexOf(penerima.toLowerCase()) < 0) {
                            debug('2>', penerima, JSON.stringify(this));
                            this.spek = uraian;
                            uraian = penerima;
                        }
                    }
                }
                this.uraian = uraian;
            }
        }
    }
}

module.exports = SipdAgr;