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

class SipdScript {

    static bootstrapModal(title, message, button = 'Oke') {
        let id = 'x-modal-' + parseInt(Math.random() * 1000000 + 1);
        return `
$(document.body).append(\`
<ngb-modal-window id="${id}" class="d-block modal fade show" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-md" role="document">
    <div class="modal-content">
      <div class="modal-header py-2">
        <h2 class="modal-title fw-bold">${title}</h2>
        <button type="button" class="btn-close" aria-label="Close" onclick="const dlg=document.querySelector('#${id}');dlg.remove();return false;"></button>
      </div>
      <div class="modal-body">
        <p class="fs-1 fw-bold text-danger">${message}</p>
      </div>
    </div>
  </div>
</ngb-modal-window>\`);
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
`;
    }
}

module.exports = SipdScript;