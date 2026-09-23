/*
 * Solinger Schneidwaren Samstag – Cookie-Banner (statische Fassung)
 * Abgeleitet vom 4dd-cookie-banner (Schwan Glas). Eine Kategorie: Statistik (Google Analytics 4).
 *
 * Konfiguration: GA_ID unten eintragen. Bleibt sie leer, zeigt das Banner sich trotzdem,
 * lädt aber nichts. BANNER_VERSION hochzählen, wenn sich der Umfang ändert – dann fragt
 * das Banner alle Besucher erneut.
 */
(function () {
    'use strict';

    var GA_ID = 'G-W660QT9VM0';
    var BANNER_VERSION = '1';
    var COOKIE = 'ssam_consent';
    var PRIVACY = '/datenschutz';
    var IMPRINT = '/impressum';

    var banner, overlay, layer1, layer2, gaLoaded = false;

    /* ---------- Cookie ---------- */

    function readCookie() {
        var m = document.cookie.match(/(?:^|; )ssam_consent=([^;]*)/);
        if (!m) return null;
        try {
            var d = JSON.parse(decodeURIComponent(m[1]));
            return (d && d.uid && d.c) ? d : null;
        } catch (e) {
            return null;
        }
    }

    function writeCookie(data) {
        document.cookie = COOKIE + '=' + encodeURIComponent(JSON.stringify(data)) +
            '; path=/; max-age=31536000; SameSite=Lax' +
            (location.protocol === 'https:' ? '; Secure' : '');
    }

    function newUid() {
        var b = new Uint8Array(16);
        window.crypto.getRandomValues(b);
        var s = '';
        for (var i = 0; i < b.length; i++) {
            s += ('0' + b[i].toString(16)).slice(-2);
        }
        return s;
    }

    /* ---------- Google Analytics ---------- */

    function gaEnable() {
        if (!GA_ID || /^G-X+$/.test(GA_ID)) return;
        window['ga-disable-' + GA_ID] = false;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        if (gaLoaded) {
            window.gtag('consent', 'update', { analytics_storage: 'granted' });
            return;
        }
        gaLoaded = true;
        window.gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'granted'
        });
        window.gtag('js', new Date());
        window.gtag('config', GA_ID, { cookie_flags: 'SameSite=Lax;Secure' });
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
        document.head.appendChild(s);
    }

    function gaDisable() {
        if (GA_ID) window['ga-disable-' + GA_ID] = true;
        if (gaLoaded && window.gtag) {
            window.gtag('consent', 'update', { analytics_storage: 'denied' });
        }
        document.cookie.split('; ').forEach(function (c) {
            var name = c.split('=')[0];
            if (!/^_ga/.test(name)) return;
            var kill = name + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = kill;
            document.cookie = kill + '; domain=.' + location.hostname.replace(/^www\./, '');
        });
    }

    /* ---------- Entscheidung ---------- */

    function decide(choices) {
        var prev = readCookie();
        var uid = (prev && prev.uid) || newUid();
        writeCookie({ v: BANNER_VERSION, uid: uid, c: choices, t: Math.floor(Date.now() / 1000) });
        if (choices.statistik) {
            gaEnable();
        } else {
            gaDisable();
        }
        document.dispatchEvent(new CustomEvent('ssam:consent', { detail: choices }));
        hide();
        statusBoxen();
    }

    function statusBoxen() {
        var boxen = document.querySelectorAll('[data-ssam-status]');
        if (!boxen.length) return;
        var c = readCookie();
        var html;
        if (!c || !/^[a-f0-9]{32}$/.test(c.uid)) {
            html = '<p>In diesem Browser wurde noch keine Auswahl getroffen oder sie wurde zurückgesetzt.</p>';
        } else {
            html = '<p><strong>Ihre aktuelle Auswahl</strong></p>'
                + '<ul><li>Statistik (Google Analytics): <strong>' + (c.c.statistik ? 'zugestimmt' : 'abgelehnt') + '</strong></li></ul>'
                + '<p>Einwilligungs-Kennung: <code>' + c.uid + '</code><br>'
                + 'Zeitpunkt: ' + new Date(c.t * 1000).toLocaleString('de-DE') + ' Uhr<br>'
                + 'Banner-Version: ' + String(c.v).replace(/[^0-9a-z.-]/gi, '') + '</p>';
        }
        Array.prototype.forEach.call(boxen, function (box) {
            box.innerHTML = html
                + '<p><button type="button" class="ssam-btn ssam-btn-primary ssam-inlinebtn js-cookie-einstellungen">Einwilligung ändern</button></p>';
        });
    }

    /* ---------- Anzeige ---------- */

    function markup() {
        return '' +
        '<div id="ssam-overlay" class="ssam-overlay" hidden>' +
        '<div id="ssam-banner" class="ssam-card" role="dialog" aria-modal="true" aria-label="Cookie-Einwilligung">' +
        '  <div id="ssam-layer1">' +
        '    <div class="ssam-head"><strong>Cookies &amp; Datenschutz</strong></div>' +
        '    <p class="ssam-text">Wir setzen essenzielle Cookies f&uuml;r den Betrieb dieser Website ein. Mit Ihrer Einwilligung messen wir zus&auml;tzlich die Seitennutzung mit Google&nbsp;Analytics. Ihre Auswahl k&ouml;nnen Sie jederzeit &auml;ndern.</p>' +
        '    <div class="ssam-actions">' +
        '      <button type="button" id="ssam-accept" class="ssam-btn ssam-btn-primary">Alle akzeptieren</button>' +
        '      <button type="button" id="ssam-essential" class="ssam-btn ssam-btn-secondary">Ablehnen</button>' +
        '    </div>' +
        '    <div class="ssam-links">' +
        '      <button type="button" id="ssam-open-settings" class="ssam-linkbtn">Einstellungen</button>' +
        '      <span aria-hidden="true">&middot;</span>' +
        '      <a href="' + PRIVACY + '">Datenschutzerkl&auml;rung</a>' +
        '      <span aria-hidden="true">&middot;</span>' +
        '      <a href="' + IMPRINT + '">Impressum</a>' +
        '    </div>' +
        '  </div>' +
        '  <div id="ssam-layer2" hidden>' +
        '    <div class="ssam-head"><strong>Cookie-Einstellungen</strong></div>' +
        '    <div class="ssam-row">' +
        '      <label class="ssam-switch ssam-switch-locked"><input type="checkbox" checked disabled aria-label="Essenziell (immer aktiv)"><span></span></label>' +
        '      <div class="ssam-rowtext"><strong>Essenziell</strong><br><small>F&uuml;r den Betrieb der Website erforderlich. Einziges Cookie: Ihre Auswahl in diesem Banner.</small></div>' +
        '    </div>' +
        '    <div class="ssam-row">' +
        '      <label class="ssam-switch"><input type="checkbox" id="ssam-opt-statistik" aria-label="Statistik (Google Analytics)"><span></span></label>' +
        '      <div class="ssam-rowtext"><strong>Statistik</strong><br><small>Statistische Auswertung der Seitennutzung (Google&nbsp;Analytics).</small>' +
        '        <details class="ssam-details"><summary>Details</summary>' +
        '          <p>Anbieter: Google Ireland Ltd. Setzt die Cookies <code>_ga</code> und <code>_ga_*</code> (Speicherdauer bis zu 2&nbsp;Jahre); Daten k&ouml;nnen dabei in die USA &uuml;bertragen werden. Rechtsgrundlage: Ihre Einwilligung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO). Mehr in der <a href="' + PRIVACY + '">Datenschutzerkl&auml;rung</a>.</p>' +
        '        </details>' +
        '      </div>' +
        '    </div>' +
        '    <div class="ssam-actions">' +
        '      <button type="button" id="ssam-save" class="ssam-btn ssam-btn-primary">Auswahl speichern</button>' +
        '      <button type="button" id="ssam-back" class="ssam-btn ssam-btn-secondary">Zur&uuml;ck</button>' +
        '    </div>' +
        '    <p class="ssam-note">Die Einwilligung ist freiwillig und l&auml;sst sich jederzeit &uuml;ber den Link &bdquo;Cookie-Einstellungen&ldquo; im Fu&szlig;bereich &auml;ndern oder widerrufen.</p>' +
        '  </div>' +
        '</div>' +
        '</div>';
    }

    function show(settings) {
        var current = readCookie();
        layer1.hidden = !!settings;
        layer2.hidden = !settings;
        if (settings) {
            var box = document.getElementById('ssam-opt-statistik');
            if (box) box.checked = !!(current && current.c && current.c.statistik);
        }
        overlay.hidden = false;
        document.documentElement.classList.add('ssam-lock');
        requestAnimationFrame(function () {
            overlay.classList.add('ssam-visible');
            var btn = banner.querySelector(settings ? '#ssam-save' : '#ssam-accept');
            if (btn) btn.focus({ preventScroll: true });
        });
    }

    function hide() {
        overlay.classList.remove('ssam-visible');
        overlay.hidden = true;
        document.documentElement.classList.remove('ssam-lock');
    }

    function init() {
        var wrap = document.createElement('div');
        wrap.innerHTML = markup();
        document.body.appendChild(wrap.firstChild);

        overlay = document.getElementById('ssam-overlay');
        banner = document.getElementById('ssam-banner');
        layer1 = document.getElementById('ssam-layer1');
        layer2 = document.getElementById('ssam-layer2');

        document.getElementById('ssam-accept').addEventListener('click', function () {
            decide({ statistik: true });
        });
        document.getElementById('ssam-essential').addEventListener('click', function () {
            decide({ statistik: false });
        });
        document.getElementById('ssam-save').addEventListener('click', function () {
            decide({ statistik: !!document.getElementById('ssam-opt-statistik').checked });
        });
        document.getElementById('ssam-open-settings').addEventListener('click', function () {
            show(true);
        });
        document.getElementById('ssam-back').addEventListener('click', function () {
            show(false);
        });

        overlay.addEventListener('click', function (ev) {
            if (ev.target === overlay && readCookie()) hide();
        });
        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' && !overlay.hidden && readCookie()) hide();
        });

        document.addEventListener('click', function (ev) {
            var link = ev.target.closest && ev.target.closest('a[href$="#cookie-einstellungen"], .js-cookie-einstellungen');
            if (!link) return;
            ev.preventDefault();
            show(true);
        });

        var current = readCookie();
        if (current && current.v === BANNER_VERSION) {
            if (current.c.statistik) gaEnable();
        } else {
            show(false);
        }

        if (location.hash === '#cookie-einstellungen') {
            show(true);
        }

        statusBoxen();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
