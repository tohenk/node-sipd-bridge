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
const { By } = require('selenium-webdriver');
const SipdPath = require('./path');
const SipdScript = require('./script');

class SipdData {

    constructor(owner) {
        this.owner = owner;
    }

    setPageSize(size) {
        size = size != undefined ? size : this.SHOW_ITEM_ALL;
        return this.owner.waitAndClick(By.xpath(SipdPath.setDataTablePageSize(size + '')));
    }

    isProcessing() {
        let processing;
        return this.owner.works([
            [w => new Promise((resolve, reject) => {
                this.owner.findElement(By.xpath(SipdPath.DATATABLES_PROCESSING))
                    .then(el => {
                        processing = el;
                        resolve();
                    })
                    .catch(err => reject(err))
                ;
            })],
            [w => new Promise((resolve, reject) => {
                processing.isDisplayed()
                    .then(visible => resolve(visible))
                ;
            })],
        ]);
    }

    waitProcessing() {
        return new Promise((resolve, reject) => {
            const f = () => {
                this.isProcessing()
                    .then(processing => {
                        if (processing) {
                            setTimeout(f, 1000);
                        } else {
                            resolve();
                        }
                    })
                ;
            }
            f();
        });   
    }

    getData() {
        return new Promise((resolve, reject) => {
            this.owner.getDriver()
                .executeScript(SipdScript.getDataTablesJson())
                .then(result => resolve(result.data ? result.data : null))
                .catch(err => reject(err))
            ;
        });   
    }

    pickData(size) {
        return this.owner.works([
            [w => this.setPageSize(size), w => size],
            [w => this.owner.sleep(this.owner.opdelay), w => size],
            [w => this.waitProcessing()],
            [w => this.getData()],
        ]);
    }

    saveData(filename, size) {
        return new Promise((resolve, reject) => {
            this.pickData(size)
                .then(result => {
                    if (result) {
                        fs.writeFileSync(filename, JSON.stringify(result));
                    }
                    resolve(result);
                })
                .catch(err => reject(err))
            ;
        });   
    }

    static get SHOW_ITEM_ALL() {
        return -1;
    }

    static get SHOW_ITEM_20() {
        return 20;
    }

    static get SHOW_ITEM_50() {
        return 50;
    }

    static get SHOW_ITEM_100() {
        return 100;
    }
}

module.exports = SipdData;