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

const SipdPath = require('./path');

class SipdScript {

    static setScrollerPosition(top) {
        let scroller = SipdPath.SIDEMENU_SCROLLER_CLASS;
        return `
let scrollers = document.getElementsByClassName("${scroller}");
if (scrollers.length) {
    scrollers[0].scrollTop = ${top};
}
`
    }

    static getDataTablesJson() {
        return `
let dt = $('.dataTables_wrapper table').DataTable();
if (dt) {
    return dt.ajax.json();
}
`
    }

    static bootstrapModal(title, message, button = 'Oke') {
        let id = 'x-modal-' + parseInt(Math.random() * 1000000 + 1);
        return `
$('#wrapper').append(\`
<div id="${id}" class="modal fade" tabindex="-1" role="dialog">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title">${title}</h4>
      </div>
      <div class="modal-body">
        <p>${message}</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-dismiss="modal">${button}</button>
      </div>
    </div>
  </div>
</div>\`);
if (!$.modalStyleIncluded) {
    $.modalStyleIncluded = true;
    // https://stackoverflow.com/questions/18422223/bootstrap-3-modal-vertical-position-center
    $(document.head).append(\`
<style>
@media screen and (min-width: 768px) { 
    .modal:before {
        display: inline-block;
        vertical-align: middle;
        content: " ";
        height: 100%;
    }
}
.modal {
    text-align: center;
}
.modal-dialog {
    display: inline-block;
    text-align: left;
    vertical-align: middle;
}
</style>
\`
    );
}
$('#${id}').modal({show: true});
`;
    }
}

module.exports = SipdScript;