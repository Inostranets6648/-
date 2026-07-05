document.addEventListener("DOMContentLoaded", () => {

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scrollable-text p').forEach(p => observer.observe(p));

   
    const scrollContainer = document.getElementById('scrollContainer');
    const scrollBtn = document.getElementById('scrollToTopBtn');

    if (scrollBtn && scrollContainer) {
        scrollBtn.addEventListener('click', () => {
            scrollContainer.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', () => {
            const isAtBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 5;
            
            if (isAtBottom) {
                scrollBtn.classList.add('is-visible');
            } else {
                scrollBtn.classList.remove('is-visible');
            }
        });
    }

    const overlay = document.getElementById('welcomeOverlay');
    const check1 = document.getElementById('check1');
    const check2 = document.getElementById('check2');
    const slider = document.getElementById('unlockSlider');
    const enterBtn = document.getElementById('enterBtn');

    if (localStorage.getItem('passedVerification') === 'true' && overlay) {
        overlay.style.display = 'none';
    }

    function validateRequirements() {
        if (!check1 || !check2 || !slider || !enterBtn) return;
        const isCheck1Passed = check1.checked;
        const isCheck2Passed = check2.checked;
        const isSliderPassed = parseInt(slider.value) === 0;

        if (isCheck1Passed && isCheck2Passed && isSliderPassed) {
            enterBtn.disabled = false;
        } else {
            enterBtn.disabled = true;
        }
    }

    if (check1) check1.addEventListener('change', validateRequirements);
    if (check2) check2.addEventListener('change', validateRequirements);
    if (slider) slider.addEventListener('input', validateRequirements);

    const playlist = [
        {file: 'The Girl From Ipanema (Mono Version).mp3', title: "The Girl From Ipanema"},
        {file: 'Every Step You Take.mp3', title: 'Every Step You Take'}
    ];
    let currentTrackIndex = 0;
    let isMusicAllowed = false;

    const audio = new Audio();
    audio.volume = 0.4;

    const musicConsent = document.getElementById('musicConsent');
    const trackTitle = document.getElementById('trackTitle');
    const playePauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    const skipTooltip = document.getElementById('skipTooltip');

    let skipAccumulator = 0;
    let skipTimeout = null;

    function loadTrack(index) {
        if (!playlist[index]) return;
        audio.src = playlist[index].file;
        if (trackTitle) trackTitle.textContent = playlist[index].title;
        if (progressFill) progressFill.style.width = '0%';
        if (currentTimeEl) currentTimeEl.textContent = '0:00';
    }
    loadTrack(currentTrackIndex);

    // ИСПРАВЛЕНО: убрана опечатка в seconsds и лишние скобки в return
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // ИСПРАВЛЕНО: добавлено "%" к ширине линии прогресса
    audio.addEventListener('timeupdate', () => {
        const current = audio.currentTime;
        const duration = audio.duration || 0;
        if (currentTimeEl) currentTimeEl.textContent = formatTime(current);

        if (duration > 0 && progressFill) {
            const percentage = (current / duration) * 100;
            progressFill.style.width = `${percentage}%`;
        }
    });

    audio.addEventListener('loadedmetadata', () => {
        if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
        changeTrack(1);
    });

    function togglePlay() {
        if (!audio.src) return;
        if (audio.paused) {
            audio.play().catch(e => console.log("Браузер заблокировал звук:", e));
            if (playePauseBtn) playePauseBtn.textContent = '⏸';
        } else {
            audio.pause();
            if (playePauseBtn) playePauseBtn.textContent = '▶';
        }
    }

    if (playePauseBtn) playePauseBtn.addEventListener('click', togglePlay);

    function changeTrack(direction) {
        if (direction === -1 && audio.currentTime > 10) {
            audio.currentTime = 0;
        } else {
            currentTrackIndex += direction;
            if (currentTrackIndex >= playlist.length) currentTrackIndex = 0;
            if (currentTrackIndex < 0) currentTrackIndex = playlist.length - 1;

            loadTrack(currentTrackIndex);
            if (!audio.paused || (playePauseBtn && playePauseBtn.textContent === '⏸')) {
                audio.play().catch(() => {});
            }
        }
    }

    if (prevBtn) prevBtn.addEventListener('click', () => changeTrack(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeTrack(1));

    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const duration = audio.duration;

            if (duration > 0) {
                audio.currentTime = (clickX / width) * duration;
            }
        });
    }

    // ИСПРАВЛЕНО: корректный сброс таймаута, применение времени и показ тултипа
    function handleSkip(seconds) {
        clearTimeout(skipTimeout);
        skipAccumulator += seconds;
        const sign = skipAccumulator > 0 ? '+' : '';
        
        if (skipTooltip) {
            skipTooltip.textContent = `Перемотка: ${sign}${skipAccumulator} сек.`;
            skipTooltip.classList.add('show');
        }

        skipTimeout = setTimeout(() => {
            let newTime = audio.currentTime + skipAccumulator;
            if (newTime < 0) newTime = 0;
            if (newTime > audio.duration) newTime = audio.duration;

            audio.currentTime = newTime; // Применяем изменения к треку

            skipAccumulator = 0;
            if (skipTooltip) skipTooltip.classList.remove('show');
        }, 1000);
    }

    if (forwardBtn) forwardBtn.addEventListener('click', () => handleSkip(10));
    if (rewindBtn) rewindBtn.addEventListener('click', () => handleSkip(-10));

    if (enterBtn) {
        enterBtn.addEventListener('click', () => {
            if (overlay) overlay.classList.add('hidden');
            localStorage.setItem('passedVerification', 'true');

            isMusicAllowed = musicConsent ? musicConsent.checked : false;

            if (isMusicAllowed) {
                audio.play()
                    .then(() => {
                        if (playePauseBtn) playePauseBtn.textContent = '⏸';
                    })
                    .catch(e => console.log("Автоплей заблокирован системой:", e));
            } else {
                if (playePauseBtn) playePauseBtn.textContent = '▶';
            }
        });
    }
});