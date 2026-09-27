/* ══════════════════════════════════════════════════════════════
   CÔNG NGHỆ ĐIỆN – QUANG — NHÓM 3 · script.js
   Điều khiển deck: chuyển slide, fullscreen, menu, placeholder ảnh, video
══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* ═══ 1. CẤU HÌNH ẢNH ════════════════════════════════════════
       Thay ảnh của bạn tại assets/images/ với đúng tên file dưới đây.
       Nếu file tồn tại → web tự hiển thị; nếu chưa có → giữ placeholder. */
    const slideImages = {
        incandescent: "assets/images/slide4-incandescent.jpg",
        fluorescent: "assets/images/slide4-fluorescent.jpg",
        led: "assets/images/slide4-led.jpg",
        incandescentPrinciple: "assets/images/slide5-incandescent-principle.jpg",
        fluorescentPrinciple: "assets/images/slide6-fluorescent-principle.jpg",
        ledPrinciple: "assets/images/slide7-led-principle.jpg",
        production: "assets/images/slide9-production.jpg",
        home: "assets/images/slide10-home.jpg",
        agriculture: "assets/images/slide11-agriculture.jpg",
        medical: "assets/images/slide12-medical.jpg",
        greenCity: "assets/images/slide13-green-city.jpg",
        smartLighting: "assets/images/slide14-smart-lighting.jpg",
        future: "assets/images/slide16-future.jpg"
    };

    const YT_ID = 'GnAk91vzr9g'; // Video mô phỏng (chỉ embed, không tải về)

    /* ═══ 2. THAM CHIẾU DOM ═══ */
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => Array.from(document.querySelectorAll(s));
    const slides = $$('.slide');
    const TOTAL = slides.length;
    const curLabel = $('#curLabel');
    const pFill = $('#pFill');
    const pBar = $('#pBar');
    const menu = $('#menu');
    const scrim = $('#menuScrim');
    const menuList = $('#menuList');
    const hint = $('#hint');

    let cur = 0;
    let leaveTimer = null;
    let animOn = true;

    /* ═══ 3. PLACEHOLDER ẢNH — tự nhận ảnh khi tồn tại ═══ */
    function initPlaceholders() {
        $$('.ph').forEach((fig) => {
            const src = slideImages[fig.dataset.img];
            if (!src) return;
            const probe = new Image();
            probe.onload = () => {
                fig.classList.add('has-img');           // ảnh thật thay placeholder
                const el = document.createElement('img');
                el.src = src;
                el.alt = fig.dataset.alt || 'Ảnh minh họa';
                fig.appendChild(el);
            };
            probe.onerror = () => { /* chưa có ảnh → giữ nguyên placeholder */ };
            probe.src = src;
        });
    }

    /* ═══ 4. MENU MỤC LỤC — build từ data-title của từng slide ═══ */
    const menuItems = [];
    slides.forEach((s, i) => {
        const li = document.createElement('li');
        li.innerHTML =
            '<span class="m-num">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<span class="m-title">' + (s.dataset.title || 'Slide ' + (i + 1)) + '</span>';
        li.addEventListener('click', () => { goTo(i); closeMenu(); });
        menuList.appendChild(li);
        menuItems.push(li);
    });

    function openMenu() { menu.classList.add('open'); scrim.classList.add('show'); menu.setAttribute('aria-hidden', 'false'); }
    function closeMenu() { menu.classList.remove('open'); scrim.classList.remove('show'); menu.setAttribute('aria-hidden', 'true'); }
    function toggleMenu() { menu.classList.contains('open') ? closeMenu() : openMenu(); }

    /* ═══ 5. CHUYỂN SLIDE ═══ */
    function goTo(n) {
        n = Math.max(0, Math.min(TOTAL - 1, n));
        if (n === cur) return;

        clearTimeout(leaveTimer);
        slides.forEach((s, i) => {
            if (i === n) { s.classList.add('active'); }
            else if (i === cur) { s.classList.remove('active'); s.classList.add('leaving'); }
            else { s.classList.remove('active', 'leaving'); }
        });
        leaveTimer = setTimeout(() => slides.forEach((s) => s.classList.remove('leaving')), 340);

        // Nếu rời slide chứa video → dừng phát
        if (slides[cur].querySelector('video, iframe')) resetVideo();

        cur = n;
        updateHud();
        writeHash();
    }
    const next = () => goTo(cur + 1);
    const prev = () => goTo(cur - 1);

    function updateHud() {
        curLabel.textContent = 'SLIDE ' + String(cur + 1).padStart(2, '0');
        pFill.style.width = ((cur + 1) / TOTAL * 100) + '%';
        pBar.setAttribute('aria-valuenow', cur + 1);
        $('#btnPrev').classList.toggle('disabled', cur === 0);
        $('#btnNext').classList.toggle('disabled', cur === TOTAL - 1);
        menuItems.forEach((li, i) => li.classList.toggle('active', i === cur));
    }

    /* Deep-link: #5 → mở trực tiếp slide 5 */
    function writeHash() {
        try { history.replaceState(null, '', '#' + (cur + 1)); } catch (e) { /* file:// có thể chặn */ }
    }
    function readHash() {
        const m = location.hash.match(/^#(\d+)$/);
        if (m) { const n = parseInt(m[1], 10) - 1; if (n !== cur) goTo(n); }
    }

    /* ═══ 6. FULLSCREEN ═══ */
    function toggleFs() {
        if (!document.fullscreenElement) {
            (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)
                .call(document.documentElement).catch(() => { });
        } else {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        }
    }
    document.addEventListener('fullscreenchange', () => {
        const fs = !!document.fullscreenElement;
        $('#btnFs').innerHTML = '<i class="fa-solid ' + (fs ? 'fa-compress' : 'fa-expand') + '"></i><span>' + (fs ? 'Thoát' : 'Toàn màn hình') + '</span>';
    });

    /* ═══ 7. BẬT / TẮT ANIMATION ═══ */
    function setAnim(on) {
        animOn = on;
        document.body.classList.toggle('no-anim', !on);
        $('#animState').textContent = on ? 'BẬT' : 'TẮT';
    }

    /* ═══ 8. VIDEO & MEDIA QUY TRÌNH SẢN XUẤT ĐÈN HUỲNH QUANG ═══ */
    const mainIframe = $('#mainIframe');
    const tabVideo = $('#tabVideo');
    const tabPhoto = $('#tabPhoto');
    const mediaVideo = $('#mediaVideo');
    const mediaPhoto = $('#mediaPhoto');
    const btnVideoFs = $('#btnVideoFs');
    const videoFrame = $('#videoFrame');

    function resetVideo() {
        const video = $('#mainVideo');
        if (video) video.pause();
        const iframe = $('#mainIframe');
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            } catch (e) { }
        }
    }

    /* Chuyển đổi tab Video / Ảnh dây chuyền */
    if (tabVideo && tabPhoto && mediaVideo && mediaPhoto) {
        tabVideo.addEventListener('click', () => {
            tabVideo.classList.add('active');
            tabPhoto.classList.remove('active');
            mediaVideo.classList.add('active');
            mediaPhoto.classList.remove('active');
            if (btnVideoFs) btnVideoFs.style.display = '';
        });
        tabPhoto.addEventListener('click', () => {
            tabPhoto.classList.add('active');
            tabVideo.classList.remove('active');
            mediaPhoto.classList.add('active');
            mediaVideo.classList.remove('active');
            if (btnVideoFs) btnVideoFs.style.display = 'none';
            resetVideo();
        });
    }

    /* Phóng to khung video toàn màn hình */
    if (btnVideoFs && videoFrame) {
        btnVideoFs.addEventListener('click', () => {
            if (document.fullscreenElement === videoFrame) {
                (document.exitFullscreen || document.webkitExitFullscreen).call(document);
            } else if (videoFrame.requestFullscreen) {
                videoFrame.requestFullscreen();
            } else if (videoFrame.webkitRequestFullscreen) {
                videoFrame.webkitRequestFullscreen();
            }
        });
    }

    document.addEventListener('fullscreenchange', () => {
        const isFrameFs = document.fullscreenElement === videoFrame;
        if (btnVideoFs) {
            btnVideoFs.innerHTML = '<i class="fa-solid ' + (isFrameFs ? 'fa-compress' : 'fa-expand') + '"></i> ' + (isFrameFs ? 'Thu nhỏ' : 'Phóng to video');
        }
    });

    /* ═══ 9. BÀN PHÍM ═══ */
    document.addEventListener('keydown', (e) => {
        if (e.target.closest('input,textarea,iframe,video')) return;
        switch (e.key) {
            case 'ArrowRight': case 'PageDown': e.preventDefault(); next(); break;
            case ' ': case 'Spacebar': e.preventDefault(); next(); break;
            case 'ArrowLeft': case 'PageUp': e.preventDefault(); prev(); break;
            case 'Home': e.preventDefault(); goTo(0); break;
            case 'End': e.preventDefault(); goTo(TOTAL - 1); break;
            case 'f': case 'F': toggleFs(); break;
            case 'm': case 'M': toggleMenu(); break;
            case 'Escape': closeMenu(); break;
        }
    });

    /* ═══ 10. NÚT HUD + MENU ═══ */
    $('#btnNext').addEventListener('click', next);
    $('#btnPrev').addEventListener('click', prev);
    $('#btnFs').addEventListener('click', toggleFs);
    $('#btnMenu').addEventListener('click', toggleMenu);
    $('#menuClose').addEventListener('click', closeMenu);
    scrim.addEventListener('click', closeMenu);
    $('#menuFs').addEventListener('click', toggleFs);
    $('#menuHome').addEventListener('click', () => { goTo(0); closeMenu(); });
    $('#menuAnim').addEventListener('click', () => setAnim(!animOn));

    /* ═══ 11. SWIPE (tablet) ═══ */
    let touchX = null;
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) touchX = e.touches[0].clientX;
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
        if (touchX === null || menu.classList.contains('open')) { touchX = null; return; }
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 60) (dx < 0 ? next() : prev());
        touchX = null;
    }, { passive: true });

    /* ═══ 12. KHỞI TẠO ═══ */
    $('#totalLabel').textContent = String(TOTAL).padStart(2, '0');
    initPlaceholders();
    updateHud();
    readHash();
    window.addEventListener('hashchange', readHash);

    // toast gợi ý phím tắt — tự ẩn sau 5.2s
    setTimeout(() => hint.classList.add('hide'), 5200);
})();