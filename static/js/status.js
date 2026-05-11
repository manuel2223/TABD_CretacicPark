// Backend health check + global error UX
(function () {
    'use strict';

    function injectBanner(message, level) {
        if (document.getElementById('app-status-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'app-status-banner';
        banner.className = 'app-banner app-banner-' + (level || 'warn');
        banner.innerHTML =
            '<span class="app-banner-dot"></span>' +
            '<span class="app-banner-msg">' + message + '</span>' +
            '<button class="app-banner-close" aria-label="Cerrar">&times;</button>';
        banner.querySelector('.app-banner-close').onclick = function () {
            banner.remove();
        };
        document.body.insertBefore(banner, document.body.firstChild);
    }

    function clearLoadingPlaceholders() {
        const empty = '<div class="empty-state">Sin datos disponibles. Conecta la base de datos para ver registros.</div>';

        document.querySelectorAll('[id^="contenedor-"]').forEach(function (el) {
            el.innerHTML = '<div class="col"><div class="empty-state">Sin datos disponibles. Conecta la base de datos para ver registros.</div></div>';
        });

        document.querySelectorAll('tbody[id^="tabla-"], tbody#tabla-auditoria').forEach(function (tb) {
            const cols = tb.previousElementSibling && tb.previousElementSibling.querySelectorAll('th').length || 5;
            tb.innerHTML = '<tr><td colspan="' + cols + '" class="empty-state-row">Sin datos. Conecta la base de datos.</td></tr>';
        });
    }

    function checkBackend() {
        fetch('/api/dinosaurios', { method: 'GET' })
            .then(function (r) {
                if (!r.ok) throw new Error('http ' + r.status);
                return r.json();
            })
            .then(function (data) {
                if (data && data.error) {
                    injectBanner('Base de datos desconectada · ' + data.error, 'danger');
                    repeatClear();
                }
            })
            .catch(function (err) {
                injectBanner('Base de datos desconectada. Las APIs no responden (' + err.message + ').', 'danger');
                repeatClear();
            });
    }

    function repeatClear() {
        // Re-apply empty states to win race with page-specific cargar*() functions
        // that may clear tbody on their own 500 response
        clearLoadingPlaceholders();
        [200, 600, 1500].forEach(function (ms) {
            setTimeout(clearLoadingPlaceholders, ms);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkBackend);
    } else {
        checkBackend();
    }
})();
