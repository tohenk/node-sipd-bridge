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

const { By } = require('selenium-webdriver');
const SipdScript = require('../script');

class SipdApp {

    constructor(owner) {
        this.owner = owner;
    }

    login() {
        return this.owner.works([
            [w => this.owner.findElements(By.xpath('//app-login'))],
            [w => w.getRes(0)[0].getRect(), w => w.getRes(0).length],
            [w => this.owner.scrollTo(w.getRes(1).y), w => w.getRes(0).length],
            [w => this.owner.fillInForm([
                    {target: By.id('prov-autocomplete'), value: this.owner.provinsi, onfill: (el, value) => {
                        return this.owner.works([
                            [x => el.sendKeys(value)],
                            [x => this.owner.sleep(this.owner.opdelay)],
                            [x => el.findElement(By.xpath(`../ngb-typeahead-window/button/ngb-highlight/span[text()="${value}"]/../..`))],
                            [x => x.getRes(2).click()],
                        ]);
                    }},
                    {target: By.name('email'), value: this.owner.username},
                    {target: By.name('password'), value: this.owner.password},
                ],
                By.xpath('//form[@id="kt_login_signin_form"]'),
                By.xpath('//button[@type="submit"]')
            ), w => w.getRes(0).length],
            [w => this.waitCaptcha(), w => w.getRes(0).length],
            [w => this.owner.sleep(this.owner.opdelay), w => w.getRes(0).length],
        ]);
    }

    setYear() {
        return this.owner.works([
            [w => this.owner.findElements(By.xpath('//app-tahun-anggaran-list'))],
            [w => this.owner.fillInForm([{target: By.xpath('//select[@formcontrolname="tahun"]'), value: this.owner.year}],
                By.xpath('//form[contains(@class,"form")]'),
                By.xpath('//button[@type="submit"]')
            ), w => w.getRes(0).length],
            [w => this.owner.sleep(this.owner.opdelay), w => w.getRes(0).length],
        ]);
    }

    clickMenu(menu, options) {
        let i = 0;
        let items = [];
        let menus = menu.split('|');
        menus.forEach(item => {
            switch (i) {
                case 0:
                    items.push(By.xpath(`//app-aside-menu/div/span/span[text()="${item.trim()}"]`));
                    break;
                case 1:
                    items.push(By.xpath(`../../div/div/a/span[text()="${item.trim()}"]/..`));
                    break;
            }
            i++;
        });
        return this.navigateMenu(items, options);
    }

    navigateMenu(menu, options) {
        options = options || {};
        if (options.click === undefined) {
            options.click = true;
        }
        let mitem, url, i = 0;
        const menus = Array.isArray(menu) ? menu : [menu];
        const works = [];
        menus.forEach(item => {
            works.push(
                [w => this.owner.findElement(mitem ? {el: mitem, data: item} : item)],
                [w => Promise.resolve(mitem = w.res)],
                [w => mitem.click(),
                    w => mitem && options.click],
                [w => this.owner.sleep(this.owner.opdelay),
                    w => ++i < menus.length && mitem && options.click],
                [w => mitem.getAttribute('href'),
                    w => i === menus.length && mitem && !options.click],
                [w => Promise.resolve(url = w.res),
                    w => i === menus.length && mitem && !options.click],
                [w => this.owner.getDriver().get(url + (options.params ? (url.indexOf('?') < 0 ? '?' : '&') + options.params : '')),
                    w => i === menus.length && mitem && !options.click],
                [w => Promise.resolve(url),
                    w => i === menus.length && mitem && !options.click],
            );
        });
        return this.owner.works(works);
    }

    waitCaptcha() {
        return this.owner.works([
            [w => this.owner.findElements(By.xpath('//ngx-captcha'))],
            [w => this.solveCaptcha(), w => w.getRes(0).length],
            [w => this.waitSolvedCaptcha(), w => w.getRes(0).length && !w.getRes(1)],
        ]);
    }

    solveCaptcha() {
        return this.owner.works([
            [w => this.owner.getDriver().executeScript(`return getCode()`)],
            [w => this.owner.fillFormValue({target: By.xpath('//ngx-captcha/div/div/input[@type="text"]'), value: w.getRes(0)}),
                w => w.getRes(0)],
            [w => this.owner.click(By.xpath('//ngx-captcha/div/div/input[@type="button"]')),
                w => w.getRes(0)],
            [w => this.owner.sleep(this.owner.opdelay),
                w => w.getRes(0)],
            [w => Promise.resolve(w.getRes(0))],
        ]);
    }

    waitSolvedCaptcha() {
        return this.owner.works([
            [w => Promise.resolve(this.owner.app.showMessage('Captcha', 'Please solve the captcha first!'))],
            [w => this.owner.waitForPresence(By.xpath('//ngx-captcha'))],
            [w => Promise.resolve(console.log('Captcha is solved!'))],
        ]);
    }

    showMessage(title, message) {
        if (this.owner._url) {
            this.owner.getDriver().executeScript(SipdScript.bootstrapModal(title, message));
        } else {
            console.log(message);
        }
    }
}

module.exports = SipdApp;