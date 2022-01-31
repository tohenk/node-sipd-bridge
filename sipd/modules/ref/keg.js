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

const path = require('path');
const Excel = require('exceljs');
const SipdUtil = require('../../util');

class SipdRefKegiatan {
    items = []

    import(data) {
        if (Array.isArray(data)) {
            data.forEach(row => {
                let infos = [
                    ['id_urusan', 'nama_urusan'],
                    ['id_bidang_urusan', 'nama_bidang_urusan'],
                    ['id_program', 'nama_program'],
                    ['id_giat', 'nama_giat'],
                    ['id_sub_giat', 'nama_sub_giat'],
                ];
                infos.forEach(info => {
                    let [fid, fnama] = info;
                    let id = row[fid];
                    if (!this.getKeg(id)) {
                        let [kd, nama] = SipdUtil.splitKode(row[fnama]);
                        this.items.push({
                            id: id,
                            kode: SipdUtil.cleanKode(kd),
                            nama: nama,
                        });
                    }
                });
            });
        }
    }

    exportXls(outdir) {
        return new Promise((resolve, reject) => {
            try {
                const filename = path.join(outdir, 'M_KEG.xlsx');
                console.log('Creating ref %s...', filename);
                const wb = new Excel.Workbook();
                const sheet = wb.addWorksheet('M_KEG');
                let row = 0;
                this.items.forEach(item => {
                    if (row == 0) {
                        row++;
                        sheet.getRow(row).getCell(1).value = 'ID';
                        sheet.getRow(row).getCell(2).value = 'KODE';
                        sheet.getRow(row).getCell(3).value = 'NAMA';
                    }
                    row++;
                    sheet.getRow(row).getCell(1).value = item.id;
                    sheet.getRow(row).getCell(2).value = item.kode;
                    sheet.getRow(row).getCell(3).value = item.nama;
                });
                wb.xlsx.writeFile(filename);
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }

    getKeg(id) {
        let result;
        this.items.forEach(item => {
            if (item.id == id) {
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

module.exports = SipdRefKegiatan;