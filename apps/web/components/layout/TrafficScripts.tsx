import Script from 'next/script';
import { SiteSettings } from '@/lib/types';
import { CustomCodeInjector } from './CustomCodeInjector';

function googleAnalyticsScript(measurementId: string) {
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}', { page_path: window.location.pathname });
  `;
}

function googleTagManagerScript(containerId: string) {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${containerId}');`;
}

function metaPixelScript(pixelId: string) {
  return `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
}

function clarityScript(projectId: string) {
  return `(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, 'clarity', 'script', '${projectId}');`;
}

function tiktokScript(pixelId: string) {
  return `
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
      ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];
      ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
      for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
      ttq.load=function(e,n){var r='https://analytics.tiktok.com/i18n/pixel/events.js';
      var a=n&&n.partner;ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};
      ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
      var o=document.createElement('script');o.type='text/javascript';o.async=!0;o.src=r+'?sdkid='+e+'&lib='+t;
      var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(o,s)};
      ttq.load('${pixelId}');
      ttq.page();
    }(window, document, 'ttq');
  `;
}

function linkedInScript(partnerId: string) {
  return `
    _linkedin_partner_id = '${partnerId}';
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(_linkedin_partner_id);
    (function(l) {
      if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}
      var s = document.getElementsByTagName('script')[0];
      var b = document.createElement('script');
      b.type = 'text/javascript';b.async = true;
      b.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
      s.parentNode.insertBefore(b, s);
    })(window.lintrk);
  `;
}

function pinterestScript(tagId: string) {
  return `
    !function(e){if(!window.pintrk){window.pintrk = function () {
      window.pintrk.queue.push(Array.prototype.slice.call(arguments))};
      var n=window.pintrk;n.queue=[],n.version='3.0';
      var t=document.createElement('script');t.async=!0,t.src=e;
      var r=document.getElementsByTagName('script')[0];r.parentNode.insertBefore(t,r)}}('https://s.pinimg.com/ct/core.js');
    pintrk('load', '${tagId}');
    pintrk('page');
  `;
}

export function TrafficScripts({ settings }: { settings: SiteSettings }) {
  const gtmId = String(settings.googleTagManagerId || '').trim();
  const ga4Id = String(settings.ga4MeasurementId || '').trim();
  const pixelId = String(settings.metaPixelId || '').trim();
  const clarityId = String(settings.microsoftClarityId || '').trim();
  const tiktokPixelId = String(settings.tiktokPixelId || '').trim();
  const linkedInPartnerId = String(settings.linkedInPartnerId || '').trim();
  const pinterestTagId = String(settings.pinterestTagId || '').trim();

  return (
    <>
      {gtmId ? <Script id="gtm-script" strategy="afterInteractive">{googleTagManagerScript(gtmId)}</Script> : null}
      {gtmId ? (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
      ) : null}

      {ga4Id ? <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" /> : null}
      {ga4Id ? <Script id="ga4-script" strategy="afterInteractive">{googleAnalyticsScript(ga4Id)}</Script> : null}
      {pixelId ? <Script id="meta-pixel-script" strategy="afterInteractive">{metaPixelScript(pixelId)}</Script> : null}
      {clarityId ? <Script id="clarity-script" strategy="afterInteractive">{clarityScript(clarityId)}</Script> : null}
      {tiktokPixelId ? <Script id="tiktok-script" strategy="afterInteractive">{tiktokScript(tiktokPixelId)}</Script> : null}
      {linkedInPartnerId ? <Script id="linkedin-script" strategy="afterInteractive">{linkedInScript(linkedInPartnerId)}</Script> : null}
      {pinterestTagId ? <Script id="pinterest-script" strategy="afterInteractive">{pinterestScript(pinterestTagId)}</Script> : null}

      <CustomCodeInjector code={settings.customHeadCode} target="head" markerId="custom-head" />
      <CustomCodeInjector code={settings.customBodyCode} target="body" markerId="custom-body" />
      <CustomCodeInjector code={settings.customFooterCode} target="footer" markerId="custom-footer" />
    </>
  );
}
