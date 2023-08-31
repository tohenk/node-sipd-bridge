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

const { By } = require('selenium-webdriver');
const SipdPath = require('../path');
const SipdScript = require('../script');

class SipdApp {

    constructor(owner) {
        this.owner = owner;
    }

    openApp(app) {
        return this.owner.works([
            [w => this.owner.open()],
            [w => this.owner.waitAndClickAnimate(By.xpath(SipdPath.getApp(app)))],
        ]);
    }

    checkAnonymous() {
        return new Promise((resolve, reject) => {
            this.owner.getDriver().getCurrentUrl()
                .then(url => resolve(0 == url.indexOf(this.owner.sipdurl.getUrl())))
            ;
        });
    }

    checkMain() {
        return new Promise((resolve, reject) => {
            this.owner.getDriver().getCurrentUrl()
                .then(url => resolve(0 == url.indexOf(this.owner.sipdurl.getMainUrl())))
            ;
        });
    }

    setYear() {
        return this.owner.works([
            [w => this.checkMain()],
            [w => Promise.reject('Need in main page'), w => !w.getRes(0)],
            [w => this.owner.waitAndClickAnimate(By.xpath(SipdPath.getYear(this.owner.year)))],
        ]);
    }

    checkUnit() {
        return this.owner.works([
            [w => this.owner.sleep()],
            [w => this.owner.findElements(By.xpath('//table[@id="table_respon_unit"]'))],
            [w => Promise.resolve(console.log('User seems only associated with single unit, skipping...')), w => !w.getRes(1)],
            [w => w.getRes(1)[0].isDisplayed(), w => w.getRes(1)],
            [w => Promise.resolve(console.log('Unit is unavailable...')), w => w.getRes(1) && !w.getRes(3)],
            [w => this.owner.data.waitProcessing(), w => w.getRes(1) && w.getRes(3)],
            [w => w.getRes(1)[0].findElement(By.xpath('.//tbody/tr/td[contains(text(),"' + this.owner.unit + '")]/../td[2]/a')), w => w.getRes(1) && w.getRes(3)],
            [w => w.res.click(), w => w.getRes(1) && w.getRes(3)],
        ]);
    }

    clickMenu(menu) {
        let i = 0;
        let items = [];
        let menus = menu.split('|');
        menus.forEach(item => {
            switch (i) {
                case 0:
                    items.push(By.xpath(SipdPath.getSideMenu(item.trim())));
                    break;
                case 1:
                    items.push(By.xpath(SipdPath.getSubSideMenu(item.trim(), SipdPath.SIDEMENU_SUB_LEVEL2)));
                    break;
                case 2:
                    items.push(By.xpath(SipdPath.getSubSideMenu(item.trim(), SipdPath.SIDEMENU_SUB_LEVEL3)));
                    break;
            }
            i++;
        });
        return this.navigateMenu(items);
    }

    navigateMenu(menu) {
        let mitem;
        let i = 0;
        let menus = Array.isArray(menu) ? menu : [menu];
        let works = [[w => this.owner.waitAndClick(By.xpath(SipdPath.MENU))]];
        menus.forEach(item => {
            works.push(
                [w => new Promise((resolve, reject) => {
                    this.owner.findElement(mitem ? {el: mitem, data: item} : item)
                        .then((el) => {
                            mitem = el;
                            el.getRect()
                                .then(rect => {
                                    this.owner.getDriver()
                                        .executeScript(SipdScript.setScrollerPosition(rect.y))
                                        .then(() => resolve())
                                    ;
                                })
                            ;
                        })
                        .catch(err => reject(err))
                    ;
                })],
                [w => new Promise((resolve, reject) => {
                    if (mitem) {
                        mitem.click()
                            .then(() => resolve())
                            .catch(err => reject(err))
                        ;
                    } else {
                        reject('Menu not found');
                    }
                })],
                [w => new Promise((resolve, reject) => {
                    if (++i < menus.length) {
                        this.owner.sleep(this.owner.delay)
                            .then(() => resolve());
                    } else {
                        resolve();
                    }
                })],
            );
        });
        return this.owner.works(works);
    }

    showMessage(title, message) {
        if (this.owner.opened) {
            this.owner.getDriver().executeScript(SipdScript.bootstrapModal(title, message));
        } else {
            console.log(message);
        }
    }
}

module.exports = SipdApp;