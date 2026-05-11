// Global toast system. Replaces alert() across the app.
(function () {
    'use strict';

    function ensureStack() {
        let stack = document.getElementById('toast-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.id = 'toast-stack';
            stack.className = 'toast-stack';
            document.body.appendChild(stack);
        }
        return stack;
    }

    function show(opts) {
        const stack = ensureStack();
        const t = document.createElement('div');
        t.className = 'toast ' + (opts.kind || '');
        const inner = document.createElement('div');
        inner.style.flex = '1';
        if (opts.title) {
            const h = document.createElement('div');
            h.className = 'toast-title';
            h.textContent = opts.title;
            inner.appendChild(h);
        }
        const msg = document.createElement('div');
        msg.className = 'toast-msg';
        msg.textContent = opts.message || '';
        inner.appendChild(msg);
        t.appendChild(inner);

        const close = document.createElement('button');
        close.className = 'toast-close';
        close.innerHTML = '&times;';
        close.onclick = () => t.remove();
        t.appendChild(close);

        stack.appendChild(t);
        const ttl = opts.ttl || (opts.kind === 'error' ? 6000 : 3500);
        setTimeout(() => t.remove(), ttl);
        return t;
    }

    window.Toast = {
        success: (title, message) => show({ kind: 'success', title, message }),
        error:   (title, message) => show({ kind: 'error',   title, message }),
        warn:    (title, message) => show({ kind: 'warn',    title, message }),
        info:    (title, message) => show({ kind: '',        title, message }),
    };

    // Helper: deshabilita botón mientras corre la promesa
    window.withLoading = function (btn, fn) {
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.dataset.loading = '1';
        btn.textContent = '…';
        return Promise.resolve(fn()).finally(() => {
            btn.disabled = false;
            delete btn.dataset.loading;
            btn.textContent = originalText;
        });
    };
})();
