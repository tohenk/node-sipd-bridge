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

class SipdUtil {

    static cleanText(text) {
        if (text.substr(0, 3) == '[-]' || text.substr(0, 3) == '[#]') {
            text = text.substr(3).trim();
        }
        if (text) {
            text = this.decodeEntities(text);
            text = this.cleanDup(text, '\'"');
        }
        return text;
    }

    static cleanKode(kode) {
        let result = '';
        for (let i = 0; i < kode.length; i++) {
            if (kode.charAt(i).match(/[A-Za-z0-9]/)) {
                result += kode.charAt(i);
            }
        }
        return result;
    }

    static cleanDup(str, c) {
        str = str.trim();
        if (str) {
            for (let i = 0; i < c.length; i++) {
                let d = c[i];
                let dup = d + d;
                while (str.indexOf(dup) >= 0) str = str.replace(dup, d);
            }
        }
        return str;
    }

    static splitKode(s) {
        let p = s.indexOf(' ');
        if (p >=0) {
            return [s.substr(0, p).trim(), s.substr(p).trim()]
        }
    }

    static padnum(num, len) {
        let str = num.toString();
        while (str.length < len) {
            str = '0' + str;
        }
        return str;
    }

    static makeFloat(value) {
        if (value) {
            value = parseFloat(value);
        }
        return value;
    }

    static floatValue(value) {
        if (value != undefined && value != null) {
            if (value - Math.trunc(value) > 0) {
                value = value.toString().replace('.', ',');
            }
        }
        return value;
    }

    // https://stackoverflow.com/questions/44195322/a-plain-javascript-way-to-decode-html-entities-works-on-both-browsers-and-node
    static decodeEntities(encodedString) {
        let translate_re = /&(nbsp|amp|quot|lt|gt);/g;
        let translate = {
            "nbsp": " ",
            "amp" : "&",
            "quot": "\"",
            "lt"  : "<",
            "gt"  : ">"
        };
        return encodedString
            .replace(translate_re, (match, entity) => {
                return translate[entity];
            })
            .replace(/&#(\d+);/gi, (match, numStr) => {
                let num = parseInt(numStr, 10);
                return String.fromCharCode(num);
            })
        ;
    }

    static isAlamat(s) {
        if (s) {
            return s.toLowerCase().match(/(kota|kab(upaten)?|kec(amatan)?|desa|ds|kel(urahan)?)(\.)?\s/g);
        }
    }
}

module.exports = SipdUtil;