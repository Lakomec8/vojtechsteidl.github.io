(() => {
  'use strict';
  // Only page paths, named campaign tags and coarse sources are retained for
  // this tab. Never store form contents, test results or full referrer URLs.
  const KEY = 'vs-lead-context-v1';
  const GOALS = {
    '/priprava-na-prijimacky-z-matematiky/': 'prijimacky',
    '/test-prijimacky-9-matematika/': 'prijimacky',
    '/priprava-na-maturitu-z-matematiky/': 'maturita',
    '/test-maturita-matematika/': 'maturita',
    '/doucovani-vs-matematiky/': 'vs-matematika',
    '/test-vs-matematika-1-rocnik/': 'vs-matematika'
  };
  const SOURCES = {
    'google.com': 'google', 'google.cz': 'google',
    'seznam.cz': 'seznam', 'search.seznam.cz': 'seznam',
    'firmy.cz': 'firmy.cz', 'superprof.cz': 'superprof',
    'doucuji.eu': 'doucuji', 'linkedin.com': 'linkedin'
  };
  const tag = value => (value || '').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 80);
  const path = location.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
  let context = null;
  try { context = JSON.parse(sessionStorage.getItem(KEY)); } catch (_) {}
  if (!context || context.version !== 1) {
    const params = new URLSearchParams(location.search);
    let source = tag(params.get('utm_source'));
    let medium = tag(params.get('utm_medium'));
    if (!source && document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (ref.origin !== location.origin) {
          const host = ref.hostname.replace(/^www\./, '');
          source = SOURCES[host] || 'external-referral';
          medium = ['google', 'seznam'].includes(source) ? 'organic' : 'referral';
        }
      } catch (_) {}
    }
    context = { version: 1, landing_page: path, acquisition_source: source || 'direct-or-unknown',
      acquisition_medium: medium || 'unknown', campaign: tag(params.get('utm_campaign')), offer: '' };
  }
  if (GOALS[path]) context.offer = GOALS[path];
  try { sessionStorage.setItem(KEY, JSON.stringify(context)); } catch (_) {}
  const fields = () => ({ landing_page: context.landing_page,
    acquisition_source: context.acquisition_source,
    acquisition_medium: context.acquisition_medium,
    campaign: context.campaign || 'none', offer: context.offer || 'unknown', contact_page: path });
  document.querySelectorAll('#contactForm, #groupInterestForm, #groupForm').forEach(form => {
    form.addEventListener('formdata', event => {
      Object.entries(fields()).forEach(([key, value]) => event.formData.set(key, value));
    });
  });
  const services = { prijimacky: 'prijimacky', maturita: 'maturita', 'vs-matematika': 'vysoka-skola' };
  const service = document.getElementById('service');
  if (service && !service.value && services[context.offer]) service.value = services[context.offer];
  window.LeadAttribution = {
    summaryLines: () => Object.entries(fields()).map(([key, value]) => `${key}: ${value}`)
  };
})();
