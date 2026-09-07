(function(){
  'use strict';
  var A='/DLavie-Craft/assets/',loaded={};
  function css(href){if(loaded[href])return;loaded[href]=1;var l=document.createElement('link');l.rel='stylesheet';l.href=href;l.media='print';l.onload=function(){l.media='all'};l.onerror=function(){l.media='all'};document.head.appendChild(l)}
  function script(src){if(loaded[src])return Promise.resolve(true);loaded[src]=1;return new Promise(function(resolve){var s=document.createElement('script');s.src=src;s.defer=true;s.onload=function(){resolve(true)};s.onerror=function(){resolve(false)};document.body.appendChild(s)})}
  function series(list){return list.reduce(function(p,x){return p.then(function(){return script(x)})},Promise.resolve(true))}

  var homeStarted=false,marketStarted=false,socialStarted=false,accountStarted=false,communityStarted=false;
  function loadHome(){
    if(homeStarted)return;homeStarted=true;
    ['home-minimal-v1.css?v=20260906hm3','gamehub-platform-v1.css?v=20260906gs2','gamehub-mobile-stability-v2.css?v=20260906gs2','gamehub-saved-nav-v2.css?v=20260906sn2'].forEach(function(x){css(A+x)});
    series([A+'gamehub-stability-v2.js?v=20260906gs2',A+'gamehub-platform-v1.js?v=20260906gs2',A+'gamehub-saved-nav-v2.js?v=20260906sn2',A+'home-structure-v3.js?v=20260906hm3']);
  }
  function loadMarketplace(){if(marketStarted)return;marketStarted=true;css(A+'marketplace-addon-v1.css?v=20260906aa2');script(A+'marketplace-addon-v1.js?v=20260906aa2')}
  function loadSocial(){if(socialStarted)return;socialStarted=true;css(A+'gamehub-crafter-social-v1.css?v=20260906gh2');script(A+'gamehub-crafter-social-v1.js?v=20260906gh2')}
  function loadAccount(){
    if(accountStarted)return;accountStarted=true;
    ['account-legal-system.css?v=20260904d','account-load-recovery-v7.css?v=20260906z1','account-shell-integration.css?v=20260904f','account-minecraft-theme.css?v=20260904g','account-minecraft-effects.css?v=20260904h','account-minecraft-effects-v2.css?v=20260904i','account-verification-flow-v2.css?v=20260905d1','account-collector-profile-v1.css?v=20260905c1','account-collector-card-effects-v4.css?v=20260905p1','account-card-skins-v1.css?v=20260905q2','account-card-skins-stability-v2.css?v=20260905q2','account-card-full-theme-v3.css?v=20260905q4','account-card-skin-premium-v5.css?v=20260905q5','account-profile-fullscreen-v3.css?v=20260905f2','account-profile-minimal-v4.css?v=20260906w1','account-profile-snap-v5.css?v=20260906x1','account-profile-card-premium-v6.css?v=20260906y2','account-onboarding-visual-v2.css?v=20260905d1','account-onboarding-scroll-fix-v1.css?v=20260905d2','download-auth-gate.css?v=20260904j','account-performance.css?v=20260904s'].forEach(function(x){css(A+x)});
    series(['console-upload-fix.js?v=20260904','console-addon-type-fix.js?v=20260904b','public-console-entry-hide.js?v=20260904c','account-auth-runtime-fix.js?v=20260904s','account-verification-flow-v2.js?v=20260905d1','download-auth-gate.js?v=20260904j','account-legal-system.js?v=20260904d','account-load-recovery-v7.js?v=20260906z1','account-mutation-guard.js?v=20260904f','account-shell-integration.js?v=20260904s','account-minecraft-effects-v2.js?v=20260904i','account-collector-profile-v1.js?v=20260905c1','account-collector-card-motion-v3.js?v=20260905p1','account-profile-fullscreen-v3.js?v=20260906w1','account-profile-snap-v5.js?v=20260906x1','account-onboarding-visual-v2.js?v=20260905d1','account-onboarding-scroll-fix-v1.js?v=20260905d2','account-card-skins-v1.js?v=20260905q2','account-profile-card-premium-v6.js?v=20260906y1'].map(function(x){return A+x}));
  }
  function loadCommunity(){
    if(communityStarted)return;communityStarted=true;
    ['community-chat-v3.css?v=20260904t','community-discord-v4.css?v=20260905y','community-discord-v4-fixes.css?v=20260905y','community-rules-v1.css?v=20260905z2','community-controls-v10.css?v=20260905h1','community-role-identity-v3.css?v=20260905m1','community-sticker-console-v3.css?v=20260905k1','community-forum-console-v1.css?v=20260906p1','minecraft-icon-canonical-v9.css?v=20260905n1','community-safe-v19.css?v=20260905w1','community-clean-v26.css?v=20260906g1','community-toolbar-v27.css?v=20260906h1','community-stable-v29.css?v=20260906j1','community-thread-polish-v32.css?v=20260906m1','community-forum-access-v34.css?v=20260906p1','community-forum-nav-v35.css?v=20260906s1','community-content-polish-v35.css?v=20260906r1','community-ui-polish-v37.css?v=20260906u2','community-ui-unify-v38.css?v=20260906v1'].forEach(function(x){css(A+x)});
    series(['community-discord-reactions-v6.js?v=20260905y','community-chat-v3.js?v=20260904t','community-stickers-v2.js?v=20260906p3','community-role-identity-v3.js?v=20260905m1','community-levelup-card-v2.js?v=20260905c1','community-sticker-console-v3.js?v=20260905k1','community-forum-console-v1.js?v=20260906p1','community-v4-sync.js?v=20260905y','community-controls-v10.js?v=20260905h1','minecraft-icon-canonical-v9.js?v=20260905n1','community-safe-v19.js?v=20260905w1','community-runtime-v29.js?v=20260906s1','community-spa-replay-v31.js?v=20260906l1','community-forum-access-v34.js?v=20260906p2','community-content-polish-v35.js?v=20260906r1'].map(function(x){return A+x}));
  }

  function route(){
    var h=(location.hash||'#/').toLowerCase();
    if(h===''||h==='#'||h==='#/'||/home/.test(h))setTimeout(loadHome,180);
    if(/marketplace/.test(h))loadMarketplace();
    if(/project|crafter|creator/.test(h))loadSocial();
    if(/account|profile|login|register/.test(h)){loadAccount();loadSocial()}
    if(/community/.test(h))loadCommunity();
  }
  window.addEventListener('hashchange',route);
  route();
})();