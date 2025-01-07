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

const path = require('path');
const Excel = require('exceljs');
const SipdUtil = require('../../util');

class SipdRef {

    name = null
    items = {}

    constructor() {
        this.initialize();
    }

    initialize() {
    }

    exportXls(outdir) {
        return new Promise((resolve, reject) => {
            try {
                const filename = path.join(outdir, `${this.name}.xlsx`);
                console.log('Creating ref %s...', filename);
                const wb = new Excel.Workbook();
                const sheet = wb.addWorksheet(this.name);
                let row = 0;
                const items = Object.values(this.items)
                    .sort((a, b) => a.kode.localeCompare(b.kode));
                for (const item of items) {
                    if (row === 0) {
                        row++;
                        sheet.getRow(row).getCell(1).value = 'ID';
                        sheet.getRow(row).getCell(2).value = 'KODE';
                        sheet.getRow(row).getCell(3).value = 'NAMA';
                    }
                    row++;
                    sheet.getRow(row).getCell(1).value = item.id;
                    sheet.getRow(row).getCell(2).value = item.kode;
                    sheet.getRow(row).getCell(3).value = item.nama;
                }
                wb.xlsx.writeFile(filename);
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }

    clear() {
        this.items = {};
    }

    static merge(cols, data, items) {
        if (Array.isArray(data)) {
            const [colId, colKode, colNama] = cols;
            for (const row of data) {
                const id = row[colId];
                const kode = SipdUtil.cleanKode(row[colKode]);
                const nama = row[colNama];
                if (items[kode] === undefined) {
                    items[kode] = {id, kode, nama};
                }
            }
        }
    }
}

module.exports = SipdRef;