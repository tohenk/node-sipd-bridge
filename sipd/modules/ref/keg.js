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

const SipdRef = require('./ref');

class SipdRefKegiatan extends SipdRef {

    initialize() {
        this.name = 'M_KEG';
    }

    import(data) {
        SipdRefKegiatan.merge(SipdRefKegiatan.MAPS[SipdRefKegiatan.URUSAN], data, this.items);
        SipdRefKegiatan.merge(SipdRefKegiatan.MAPS[SipdRefKegiatan.BIDANG_URUSAN], data, this.items);
        SipdRefKegiatan.merge(SipdRefKegiatan.MAPS[SipdRefKegiatan.PROGRAM], data, this.items);
        SipdRefKegiatan.merge(SipdRefKegiatan.MAPS[SipdRefKegiatan.KEGIATAN], data, this.items);
        SipdRefKegiatan.merge(SipdRefKegiatan.MAPS[SipdRefKegiatan.SUB_KEGIATAN], data, this.items);
    }

    static get URUSAN() {
        return 1;
    }

    static get BIDANG_URUSAN() {
        return 2;
    }

    static get PROGRAM() {
        return 3;
    }

    static get KEGIATAN() {
        return 4;
    }

    static get SUB_KEGIATAN() {
        return 5;
    }

    static get MAPS() {
        return {
            [this.URUSAN]: ['id_urusan', 'kode_urusan', 'nama_urusan'],
            [this.BIDANG_URUSAN]: ['id_bidang_urusan', 'kode_bidang_urusan', 'nama_bidang_urusan'],
            [this.PROGRAM]: ['id_program', 'kode_program', 'nama_program'],
            [this.KEGIATAN]: ['id_giat', 'kode_giat', 'nama_giat'],
            [this.SUB_KEGIATAN]: ['id_sub_giat', 'kode_sub_giat', 'nama_sub_giat'],
        }
    }
}

module.exports = SipdRefKegiatan;