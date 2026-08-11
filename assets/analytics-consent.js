(() => {
    const MEASUREMENT_ID = 'G-G3ZD7VC099';
    const STORAGE_KEY = 'vs_analytics_consent_v1';

    let savedChoice = null;
    try {
        savedChoice = window.localStorage.getItem(STORAGE_KEY);
    } catch (_) {
        savedChoice = null;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
        window.dataLayer.push(arguments);
    };

    // Consent Mode v2: analytics storage is denied until the visitor consents.
    window.gtag('consent', 'default', {
        analytics_storage: savedChoice === 'granted' ? 'granted' : 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted'
    });

    // Load the Google tag so Google can detect the installation. With analytics_storage
    // denied it does not set Analytics cookies before the visitor grants consent.
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID);

    const googleTag = document.createElement('script');
    googleTag.async = true;
    googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    document.head.appendChild(googleTag);

    function removeBanner() {
        document.getElementById('analytics-consent-banner')?.remove();
    }

    function saveChoice(value) {
        try {
            window.localStorage.setItem(STORAGE_KEY, value);
        } catch (_) {
            // If localStorage is unavailable, the choice lasts only for the current page load.
        }
    }

    function showBanner() {
        if (document.getElementById('analytics-consent-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'analytics-consent-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Nastavení analytických cookies');
        banner.innerHTML = `
            <div class="analytics-consent__inner">
                <div class="analytics-consent__copy">
                    <strong>Statistika návštěvnosti</strong>
                    <span>Google Analytics používám pouze pro měření návštěvnosti webu. Analytické cookies se spustí až po vašem souhlasu.</span>
                </div>
                <div class="analytics-consent__actions">
                    <button type="button" data-consent="denied">Odmítnout</button>
                    <button type="button" class="analytics-consent__accept" data-consent="granted">Povolit analytiku</button>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.id = 'analytics-consent-styles';
        style.textContent = `
            #analytics-consent-banner {
                position: fixed;
                right: 18px;
                bottom: 18px;
                left: 18px;
                z-index: 99999;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            .analytics-consent__inner {
                display: flex;
                max-width: 980px;
                margin: 0 auto;
                padding: 16px 18px;
                gap: 18px;
                align-items: center;
                justify-content: space-between;
                border: 1px solid rgba(15, 42, 67, .16);
                border-radius: 14px;
                background: #ffffff;
                box-shadow: 0 16px 45px rgba(15, 23, 42, .18);
                color: #102A43;
            }
            .analytics-consent__copy {
                display: grid;
                gap: 4px;
                max-width: 650px;
            }
            .analytics-consent__copy strong {
                font-size: 15px;
            }
            .analytics-consent__copy span {
                color: #52667a;
                font-size: 13px;
                line-height: 1.45;
            }
            .analytics-consent__actions {
                display: flex;
                gap: 8px;
                flex: 0 0 auto;
            }
            .analytics-consent__actions button {
                min-height: 40px;
                padding: 0 14px;
                border: 1px solid #cbd5e1;
                border-radius: 9px;
                background: #fff;
                color: #102A43;
                font: inherit;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
            }
            .analytics-consent__actions button:hover,
            .analytics-consent__actions button:focus-visible {
                background: #f1f5f9;
                outline: none;
            }
            .analytics-consent__actions .analytics-consent__accept {
                border-color: #2563eb;
                background: #2563eb;
                color: #fff;
            }
            .analytics-consent__actions .analytics-consent__accept:hover,
            .analytics-consent__actions .analytics-consent__accept:focus-visible {
                background: #1d4ed8;
            }
            @media (max-width: 680px) {
                #analytics-consent-banner {
                    right: 10px;
                    bottom: 10px;
                    left: 10px;
                }
                .analytics-consent__inner {
                    display: grid;
                    gap: 12px;
                    padding: 14px;
                }
                .analytics-consent__actions {
                    width: 100%;
                }
                .analytics-consent__actions button {
                    flex: 1 1 0;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(banner);

        banner.addEventListener('click', (event) => {
            const button = event.target.closest('[data-consent]');
            if (!button) return;

            const choice = button.dataset.consent;
            saveChoice(choice);

            window.gtag('consent', 'update', {
                analytics_storage: choice === 'granted' ? 'granted' : 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
            });

            removeBanner();
        });
    }

    if (savedChoice !== 'granted' && savedChoice !== 'denied') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showBanner, { once: true });
        } else {
            showBanner();
        }
    }
})();
