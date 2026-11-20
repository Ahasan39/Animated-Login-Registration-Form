/**
 * Animated Login & Registration Form - Interaction & Laravel Mode Helper
 * Handles:
 * 1. Smooth toggling between Login and Register views (.wrapper.active)
 * 2. URL hash (#register / #login) & query param (?mode=register / ?mode=login) synchronization
 *    so Laravel redirects or validation errors can open the target view automatically
 * 3. Interactive password visibility toggle & input value/focus state helpers
 */

document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('authWrapper');
    const registerLink = document.querySelector('.register-link');
    const loginLink = document.querySelector('.login-link');
    const loginInfo = document.querySelector('.info-text.login');
    const registerInfo = document.querySelector('.info-text.register');
    const toast = document.getElementById('statusToast');
    let toastTimer = null;

    /**
     * Switches between 'login' and 'register' modes smoothly
     * @param {'login' | 'register'} mode
     * @param {Object} options
     * @param {boolean} [options.updateUrl=true]
     * @param {boolean} [options.instant=false]
     */
    function setAuthMode(mode, { updateUrl = true, instant = false } = {}) {
        const isRegister = mode === 'register';

        if (instant) {
            wrapper.style.transition = 'none';
            wrapper.querySelectorAll('.bg-animate, .bg-animate2, .animation').forEach((el) => {
                el.style.transition = 'none';
            });
        }

        wrapper.classList.toggle('active', isRegister);

        // Update ARIA visibility on welcome panels
        if (loginInfo && registerInfo) {
            loginInfo.setAttribute('aria-hidden', String(isRegister));
            registerInfo.setAttribute('aria-hidden', String(!isRegister));
        }

        // Update URL query/hash without triggering a page jump
        if (updateUrl && window.history && window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.set('mode', mode);
            url.hash = mode;
            window.history.replaceState({ mode }, '', url.toString());
        }

        if (instant) {
            // Force reflow, then restore CSS transitions
            void wrapper.offsetWidth;
            requestAnimationFrame(() => {
                wrapper.style.transition = '';
                wrapper.querySelectorAll('.bg-animate, .bg-animate2, .animation').forEach((el) => {
                    el.style.transition = '';
                });
            });
        }
    }

    /**
     * Reads initial mode from URL query (?mode=register) or hash (#register)
     */
    function detectInitialModeFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const queryMode = (params.get('mode') || params.get('view') || '').toLowerCase();
        const hashMode = window.location.hash.replace('#', '').toLowerCase();

        if (queryMode === 'register' || queryMode === 'signup' || hashMode === 'register' || hashMode === 'signup') {
            return 'register';
        }
        if (queryMode === 'login' || queryMode === 'signin' || hashMode === 'login' || hashMode === 'signin') {
            return 'login';
        }
        return wrapper.classList.contains('active') ? 'register' : 'login';
    }

    // Apply initial mode immediately if URL requests #register or ?mode=register
    const initialMode = detectInitialModeFromUrl();
    if (initialMode === 'register') {
        setAuthMode('register', { updateUrl: false, instant: true });
    }

    // In-card "Sign Up" and "Sign In" toggle links
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            setAuthMode('register');
        });
    }

    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            setAuthMode('login');
        });
    }

    // Listen for browser back/forward or manual hash change
    window.addEventListener('hashchange', () => {
        const mode = detectInitialModeFromUrl();
        setAuthMode(mode, { updateUrl: false });
    });

    // =========================================================================
    // Floating Label & Focus / Value State Helpers (supports Laravel old() values)
    // =========================================================================
    const inputs = document.querySelectorAll('.input-box input');

    function syncInputValueState(input) {
        const box = input.closest('.input-box');
        if (!box) return;
        box.classList.toggle('has-value', input.value.trim().length > 0);
    }

    inputs.forEach((input) => {
        // Initialize in case Laravel `old()` pre-populates the value
        syncInputValueState(input);

        input.addEventListener('input', () => syncInputValueState(input));
        input.addEventListener('blur', () => syncInputValueState(input));
    });

    // =========================================================================
    // Interactive Password Visibility Toggle
    // =========================================================================
    const passwordToggles = document.querySelectorAll('.password-toggle');

    passwordToggles.forEach((toggleBtn) => {
        toggleBtn.addEventListener('click', () => {
            const targetId = toggleBtn.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            if (!passwordInput) return;

            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

            const lockedIcon = toggleBtn.querySelector('.icon-locked');
            const unlockedIcon = toggleBtn.querySelector('.icon-unlocked');

            if (lockedIcon && unlockedIcon) {
                lockedIcon.hidden = isPassword;
                unlockedIcon.hidden = !isPassword;
            }

            toggleBtn.setAttribute(
                'aria-label',
                isPassword ? 'Hide password' : 'Show password'
            );
            passwordInput.focus();
        });
    });

    // =========================================================================
    // Standalone Preview Demo Submit & Google Button Feedback
    // (When integrated into Laravel, remove or disable e.preventDefault() below)
    // =========================================================================
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.hidden = true;
        }, 3200);
    }

    ['loginForm', 'registerForm'].forEach((formId) => {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', (e) => {
            // Only intercept in standalone static preview
            e.preventDefault();

            const firstEmpty = Array.from(form.querySelectorAll('input[required]')).find(
                (inp) => !inp.value.trim()
            );

            if (firstEmpty) {
                firstEmpty.focus();
                showToast(`Please fill in the "${firstEmpty.nextElementSibling?.textContent || firstEmpty.name}" field.`);
                return;
            }

            if (formId === 'registerForm') {
                const pwd = document.getElementById('register-password');
                const confirmPwd = document.getElementById('register-password-confirm');
                if (pwd && confirmPwd && pwd.value !== confirmPwd.value) {
                    confirmPwd.focus();
                    showToast('Passwords do not match.');
                    return;
                }
            }

            const label = formId === 'loginForm' ? 'Login' : 'Registration';
            showToast(`${label} form ready for Laravel POST submission!`);
        });
    });

    document.querySelectorAll('.btn-google').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Google OAuth button ready for Laravel Socialite redirect!');
        });
    });
});
