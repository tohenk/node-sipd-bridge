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

class SipdPath {

    static get APP() {
        return '//div[@class="wrapper-tengah"]/div/div[contains(@class,"setbulet")]/div/span[contains(text(),"_APP_")]/../../div[contains(@class,"bulet")]';
    }

    static get LOGIN_FORM() {
        return '//form[@id="loginform"]';
    }

    static get LOGIN_FORM_SUBMIT() {
        return '//form[@id="loginform"]/div[contains(@class,"form-group")]/div/button[@type="submit"]';
    }

    static get YEAR() {
        return '//div[@class="wrapper-tengah"]/div/div[contains(@class,"setbulet")]/h5/span[contains(text(),"_YEAR_")]/../../div[contains(@class,"bulet")]';
    }

    static get MENU() {
        return '//ul[contains(@class,"navbar-top-links")]/li/a[contains(@class,"open-close")]';
    }

    static get SIDEMENU() {
        return '//ul[@id="side-menu"]/li/a/span[contains(text(),"_ITEM_")]/../..';
    }

    static get SIDEMENU_SCROLLER_CLASS() {
        return 'slimscrollsidebar';
    }

    static get SIDEMENU_SCROLLER() {
        return '//div[contains(@class,"_CLASS_")]'.replace(/_CLASS_/, this.SIDEMENU_SCROLLER_CLASS);
    }

    static get SIDEMENU_SUB() {
        return '//ul[contains(@class,"_LEVEL_")]/li/a/span[contains(text(),"_ITEM_")]/../..';
    }

    static get SIDEMENU_SUB_LEVEL2() {
        return 'nav-second-level';
    }

    static get SIDEMENU_SUB_LEVEL3() {
        return 'nav-third-level';
    }

    static get KEG_MENU() {
        return '//div[@class="dataTables_scrollBody"]/table/tbody/tr/td[2]/a[contains(text(),"_KEG_")]/../../td[9]/ul/li[2]';
    }

    static get KEG_MENU_ITEM() {
        return './/ul/li/a[contains(text(),"_ITEM_")]';
    }

    static get DATATABLES_PAGESIZE() {
        return '//div[contains(@class,"dataTables_wrapper")]/div[@class="dataTables_length"]/label/select/option[@value="_SIZE_"]';
    }

    static get DATATABLES_PROCESSING() {
        return '//div[contains(@class,"dataTables_wrapper")]/div[@class="dataTables_processing"]';
    }

    static getApp(app) {
        return this.APP.replace(/_APP_/, app);
    }

    static getYear(year) {
        return this.YEAR.replace(/_YEAR_/, year);
    }

    static getSideMenu(item) {
        return this.SIDEMENU.replace(/_ITEM_/, item);
    }

    static getSubSideMenu(item, level) {
        return this.SIDEMENU_SUB.replace(/_LEVEL_/, level).replace(/_ITEM_/, item);
    }

    static getKegMenu(keg) {
        return this.KEG_MENU.replace(/_KEG_/, keg);
    }

    static getKegMenuItem(title) {
        return this.KEG_MENU_ITEM.replace(/_ITEM_/, title);
    }

    static setDataTablePageSize(size) {
        return this.DATATABLES_PAGESIZE.replace(/_SIZE_/, size);
    }

}

module.exports = SipdPath;