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

class SipdAgrMetaData {

    constructor() {
        this.column = Object.freeze({
            REKENING: 'rekening',
            JENIS: 'jenis',
            URAIAN: 'uraian',
            SPEK: 'spek',
            KODE: 'kode',
            VOLUME: 'volume',
            SATUAN: 'satuan',
            HARGA: 'harga',
            TOTAL: 'total',
            REF: 'ref',
        });
        this.columns = {
            [this.column.REKENING]: 'Kode Rekening',
            [this.column.JENIS]: 'Jenis',
            [this.column.URAIAN]: 'Uraian',
            [this.column.SPEK]: 'Spek',
            [this.column.KODE]: 'Kode',
            [this.column.VOLUME]: 'Volume',
            [this.column.SATUAN]: 'Satuan',
            [this.column.HARGA]: 'Harga Satuan',
            [this.column.TOTAL]: 'Total',
            [this.column.REF]: 'Ref',
        }
        this.headers = [
            {r: 1, key: 'SKPD', var1: 'kode_skpd', var2: 'nama_skpd'},
            {r: 2, key: 'Kegiatan', var1: 'kode_keg', var2: 'nama_keg'},
            {r: 3, key: 'Sub Kegiatan', var1: 'kode', var2: 'nama'},
        ];
        this.datatype = Object.freeze({SUBKEG: 'SUB', REKENING: 'REK', URAIAN: 'UR'});
        this.datarow = 6;
    }
}

class SipdAgrWriter {

    constructor(sheet) {
        this.sheet = sheet;
        this.metadata = new SipdAgrMetaData();
        this.pos = this.metadata.datarow;
    }

    nextRow(nextRow = true) {
        if (nextRow) this.pos++;
        this.row = this.sheet.getRow(this.pos);
    }

    rowset(col, value) {
        if (this.row) {
            return this.row.getCell(this.columns[col]).value = value;
        }
    }

    write(agr) {
        this.writeHeader(agr);
        let seq = 0;
        agr.items.forEach(pek => this.writePek(pek, ++seq));
    }

    writeHeader(data) {
        this.columns = {};
        this.metadata.headers.forEach(info => {
            const row = this.sheet.getRow(info.r);
            row.getCell(1).value = info.key;
            row.getCell(2).value = data[info.var1] ? data[info.var1] : null;
            row.getCell(3).value = data[info.var2] ? data[info.var2] : null;
        });
        this.nextRow(false);
        let col = 0;
        Object.keys(this.metadata.columns).forEach(key => {
            col++;
            this.row.getCell(col).value = this.metadata.columns[key];
            this.columns[key] = col;
        });
    }

    writePek(agr, seq) {
        this.nextRow();
        this.rowset(this.metadata.column.REKENING, seq);
        this.rowset(this.metadata.column.JENIS, this.metadata.datatype.SUBKEG);
        this.rowset(this.metadata.column.URAIAN, agr.nama);
        agr.items.forEach(rek => this.writeRek(rek));
    }

    writeRek(agr) {
        this.nextRow();
        this.rowset(this.metadata.column.REKENING, agr.kode);
        this.rowset(this.metadata.column.JENIS, this.metadata.datatype.REKENING);
        this.rowset(this.metadata.column.URAIAN, agr.nama);
        let seq = 0;
        agr.items.forEach(rinci => this.writeRinci(rinci, ++seq));
    }

    writeRinci(agr, seq) {
        this.nextRow();
        this.rowset(this.metadata.column.REKENING, seq);
        this.rowset(this.metadata.column.JENIS, this.metadata.datatype.URAIAN);
        this.rowset(this.metadata.column.URAIAN, agr.uraian);
        this.rowset(this.metadata.column.SPEK, agr.spek);
        this.rowset(this.metadata.column.KODE, agr.ssh);
        this.rowset(this.metadata.column.SATUAN, agr.satuan);
        this.rowset(this.metadata.column.VOLUME, agr.volume);
        this.rowset(this.metadata.column.HARGA, agr.harga);
        this.rowset(this.metadata.column.TOTAL, agr.total);
        this.rowset(this.metadata.column.REF, agr.ref);
    }
}

module.exports = SipdAgrWriter;