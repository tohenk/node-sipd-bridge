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
 
class SipdLogin {

    constructor(owner) {
        this.owner = owner;
    }

    checkLogin(needLogin = true) {
        return new Promise((resolve, reject) => {
            this.owner.findElements(By.xpath(SipdPath.LOGIN_FORM))
                .then((elements) => {
                    let el;
                    const f = success => {
                        if ((needLogin && success) || (!needLogin && !success)) {
                            resolve(el);
                        } else {
                            reject(needLogin ? 'Login is not available' : 'Login is needed');
                        }
                    }
                    if (elements.length) {
                        el = elements[0];
                        el.isDisplayed()
                            .then(visible => f(visible))
                        ;
                    } else {
                        f(false);
                    }
                })
                .catch(err => reject(err))
            ;
        });
    }

    login() {
        return this.owner.works([
            [w => this.checkLogin()],
            [w => this.owner.fillInForm([
                    {parent: w.getRes(0), target: By.name('user_name'), value: this.owner.username},
                    {parent: w.getRes(0), target: By.name('user_password'), value: this.owner.password},
                ],
                By.xpath(SipdPath.LOGIN_FORM),
                By.xpath(SipdPath.LOGIN_FORM_SUBMIT)
            )],
            [w => this.waitLoader()],
            [w => this.waitToast()],
        ]);
    }

    waitLoader() {
        return this.owner.waitPresence(By.xpath('//div[contains(@class,"blockOverlay")]'));
    }

    waitToast() {
        return this.owner.waitPresence(By.xpath('//div[contains(@class,"jq-toast-wrap")]'));
    }
}

module.exports = SipdLogin;