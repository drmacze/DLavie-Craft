(function(){
  'use strict';
  var A='/DLavie-Craft/assets/';
  var loaded={};

  function css(href){
    if(loaded[href])return;
    loaded[href]=1;
    var l=document.createElement('link');
    l.rel='stylesheet';l.href=href;l.media='print';
    l.onload=function(){l.media='all'};
    l.onerror=function(){l.media='all'};
    document.head.appendChild(l);
  }
  function script(src){
    if(loaded[src])return Promise.resolve(true);
    loaded[src]=1;
    return new Promise(function(resolve){
      var s=document.createElement('script');s.src=src;s.defer=true;
      s.onload=function(){resolve(true)};s.onerror=function(){resolve(false)};
      document.body.appendChild(s);
    });
  }
  function series(list){return list.reduce(function(p,x){return p.then(function(){return script(x)})},Promise.resolve(true))}

  var coreCss=[
    A+'marketplace-addon-v1.css?v=20260906aa2',
    A+'home-minimal-v1.css?v=20260906hm3',
    A+'gamehub-platform-v1.css?v=20260906gs2',
    A+'gamehub-crafter-social-v1.css?v=20260906gh2',
    A+'gamehub-mobile-stability-v2.css?v=20260906gs2',
    A+'gamehub-saved-nav-v2.css?v=20260906sn2'
  ];
  var gamehub=[
    A+'gamehub-stability-v2.js?v=20260906gs2',
    A+'gamehub-platform-v1.js?v=20260906gs2',
    A+'gamehub-crafter-social-v1.js?v=20260906gh2',
    A+'gamehub-saved-nav-v2.js?v=20260906sn2',
    A+'marketplace-addon-v1.js?v=20260906aa2',
    A+'home-structure-v3.js?v=20260906hm3'
  ];
  coreCss.forEach(css);
  setTimeout(function(){series(gamehub)},0);

  var accountCss=['account-legal-system.css?v=20260904d','account-load-recovery-v7.css?v=20260906z1','account-shell-integration.css?v=20260904f','account-minecraft-theme.css?v=20260904g','account-minecraft-effects.css?v=20260904h','account-minecraft-effects-v2.css?v=20260904i','account-verification-flow-v2.css?v=20260905d1','account-collector-profile-v1.css?v=20260905c1','account-collector-card-effects-v4.css?v=20260905p1','account-card-skins-v1.css?v=20260905q2','account-card-skins-stability-v2.css?v=20260905q2','account-card-full-theme-v3.css?v=20260905q4','account-card-skin-premium-v5.css?v=20260905q5','account-profile-fullscreen-v3.css?v=20260905f2','account-profile-minimal-v4.css?v=20260906w1','account-profile-snap-v5.css?v=20260906x1','account-profile-card-premium-v6.css?v=20260906y2','account-onboarding-visual-v2.css?v=20260905d1','account-onboarding-scroll-fix-v1.css?v=20260905d2','download-auth-gate.css?v=20260904j','account-performance.css?v=20260904s'].map(function(x){return A+x});
  var accountJs=['console-upload-fix.js?v=20260904','console-addon-type-fix.js?v=20260904b','public-console-entry-hide.js?v=20260904c','account-auth-runtime-fix.js?v=20260904s','account-verification-flow-v2.js?v=20260905d1','download-auth-gate.js?v=20260904j','account-legal-system.js?v=20260904d','account-load-recovery-v7.js?v=20260906z1','account-mutation-guard.js?v=20260904f','account-shell-integration.js?v=20260904s','account-minecraft-effects-v2.js?v=20260904i','account-collector-profile-v1.js?v=20260905c1','account-collector-card-motion-v3.js?v=20260905p1','account-profile-fullscreen-v3.js?v=20260906w1','account-profile-snap-v5.js?v=20260906x1','account-onboarding-visual-v2.js?v=20260905d1','account-onboarding-scroll-fix-v1.js?v=20260905d2','account-card-skins-v1.js?v=20260905q2','account-profile-card-premium-v6.js?v=20260906y1'].map(function(x){return A+x});
  var communityCss=['community-chat-v3.css?v=20260904t','community-discord-v4.css?v=20260905y','community-discord-v4-fixes.css?v=20260905y','community-rules-v1.css?v=20260905z2','community-controls-v10.css?v=20260905h1','community-role-identity-v3.css?v=20260905m1','community-sticker-console-v3.css?v=20260905k1','community-forum-console-v1.css?v=20260906p1','minecraft-icon-canonical-v9.css?v=20260905n1','community-safe-v19.css?v=20260905w1','community-clean-v26.css?v=20260906g1','community-toolbar-v27.css?v=20260906h1','community-stable-v29.css?v=20260906j1','community-thread-polish-v32.css?v=20260906m1','community-forum-access-v34.css?v=20260906p1','community-forum-nav-v35.css?v=20260906s1','community-content-polish-v35.css?v=20260906r1','community-ui-polish-v37.css?v=20260906u2','community-ui-unify-v38.css?v=20260906v1'].map(function(x){return A+x});
  var communityJs=['community-discord-reactions-v6.js?v=20260905y','community-chat-v3.js?v=20260904t','community-stickers-v2.js?v=20260906p3','community-role-identity-v3.js?v=20260905m1','community-levelup-card-v2.js?v=20260905c1','community-sticker-console-v3.js?v=20260905k1','community-forum-console-v1.js?v=20260906p1','community-v4-sync.js?v=20260905y','community-controls-v10.js?v=20260905h1','minecraft-icon-canonical-v9.js?v=20260905n1','community-safe-v19.js?v=20260905w1','community-runtime-v29.js?v=20260906s1','community-spa-replay-v31.js?v=20260906l1','community-forum-access-v34.js?v=20260906p2','community-content-polish-v35.js?v=20260906r1'].map(function(x){return A+x});

  var accountStarted=false,communityStarted=false,motionStarted=false;
  function loadAccount(){if(accountStarted)return;accountStarted=true;accountCss.forEach(css);series(accountJs)}
  function loadCommunity(){if(communityStarted)return;communityStarted=true;communityCss.forEach(css);series(communityJs)}
  function route(){var h=location.hash||'';if(/account|profile|login|register/i.test(h))loadAccount();if(/community/i.test(h))loadCommunity()}
  window.addEventListener('hashchange',route);route();

  var idle=window.requestIdleCallback||function(fn){return setTimeout(fn,1400)};
  idle(loadAccount,{timeout:3500});idle(loadCommunity,{timeout:4500});
  setTimeout(function(){
    if(motionStarted)return;motionStarted=true;
    script('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js').then(function(){return script('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js')}).then(function(){return script('https://cdn.jsdelivr.net/npm/lenis@1.3.11/dist/lenis.min.js')}).then(function(){return script(A+'dlavie-motion-engine-v2.js?v=20260905q2')});
  },4200);
})();