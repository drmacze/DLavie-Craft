(() => {
  'use strict';

  const MASTER='.dl-master-icon';
  const LEGACY='.dl-mc-icon,.dl-mc-sweep-icon,.dl-mc-forge-icon,.dl-native-icon-hidden';
  const CONTROLS=[
    '.main-nav a','.header-actions button','.header-actions a','.site-header button',
    '.site-footer button','.site-footer a','.dl-shell-account','.dl-shell-legal-links button',
    '.dl-account-tabs button','.dl-account-btn','.dl-account-link','.dl-account-row button',
    '.community-toolbar button','.forum-sidebar nav button','.forum-tabs button',
    '.community-page button:not(.dl-v10-chip):not(.dl-v10-add):not(.dl-v10-reply):not(.dl-v10-vote):not(.dl-v10-emoji)',
    '.console-sidebar nav button','.console-app button','.download-card button','.download-card a',
    '.project-card button','.project-card a','.news-card button','.news-card a'
  ].join(',');

  const NEVER_HIDE='.dl-community-avatar,.dl-community-role-chip,.dl-community-verified,.dl-react-crystal-v7,.dl-v10-chip,.dl-v10-vote';
  const ICON_CLASS=/(^|[-_])(icon|glyph|symbol|marker|emblem|badge-icon|nav-icon|menu-icon)([-_]|$)/i;

  function isVisualIcon(node){
    if(!(node instanceof HTMLElement))return false;
    if(node.matches(NEVER_HIDE)||node.closest(NEVER_HIDE))return false;
    if(node.matches(MASTER)||node.matches(LEGACY))return true;
    const cls=typeof node.className==='string'?node.className:'';
    if(ICON_CLASS.test(cls))return true;
    const text=(node.textContent||'').trim();
    if(!text&&node.querySelector('svg'))return true;
    if(!text&&node.children.length<=3&&node.getBoundingClientRect){
      const r=node.getBoundingClientRect();
      if(r.width>0&&r.width<=42&&r.height>0&&r.height<=42)return true;
    }
    return false;
  }

  function getDirectMaster(host){
    return [...host.children].find(el=>el.matches?.(MASTER))||null;
  }

  function suppress(node){
    if(!(node instanceof HTMLElement))return;
    node.dataset.dlIconSuppressed='1';
    node.style.setProperty('display','none','important');
    node.setAttribute('aria-hidden','true');
  }

  function normalize(host){
    if(!host?.isConnected||host.closest('.dl-v10-picker,.dl-sticker-sheet,.dl-levelup-overlay'))return;
    const keep=getDirectMaster(host);

    host.querySelectorAll(LEGACY).forEach(suppress);

    const allMasters=[...host.querySelectorAll(MASTER)];
    if(keep){
      allMasters.forEach(m=>{if(m!==keep)suppress(m);});
      [...host.children].forEach(child=>{
        if(child===keep)return;
        if(isVisualIcon(child))suppress(child);
      });
      host.querySelectorAll(':scope > svg').forEach(svg=>{
        if(!keep.contains(svg)){
          svg.style.setProperty('display','none','important');
          svg.setAttribute('aria-hidden','true');
        }
      });
      host.classList.add('dl-one-icon-only');
      return;
    }

    // If React supplies only nested icon wrappers, keep one visual icon and hide the rest.
    const direct=[...host.children].filter(isVisualIcon);
    if(direct.length>1){
      const first=direct[0];
      direct.slice(1).forEach(suppress);
      first.style.removeProperty('display');
      first.removeAttribute('aria-hidden');
      delete first.dataset.dlIconSuppressed;
      host.classList.add('dl-one-icon-only');
    }
  }

  function reactionCrystal(){
    const icon=document.createElement('span');
    icon.className='dl-react-crystal-v7';
    icon.setAttribute('aria-hidden','true');
    icon.innerHTML='<i class="crystal"></i><i class="facet a"></i><i class="facet b"></i><i class="spark s1"></i><i class="spark s2"></i><i class="plus h"></i><i class="plus v"></i>';
    return icon;
  }

  function fixReactionButtons(root){
    root.querySelectorAll?.('.dl-v10-add').forEach(button=>{
      const existing=button.querySelector('.dl-react-crystal-v7');
      if(existing&&button.children.length===1)return;
      button.replaceChildren(reactionCrystal());
      button.setAttribute('aria-label','Tambah reaction');
      button.setAttribute('title','Tambah reaction');
      button.dataset.dlNoIcon='true';
    });
  }

  function scan(root=document){
    if(!root?.querySelectorAll)return;
    if(root.matches?.(CONTROLS))normalize(root);
    root.querySelectorAll(CONTROLS).forEach(normalize);
    fixReactionButtons(root);
  }

  let raf=0;
  const roots=new Set();
  function queue(root){
    if(root?.nodeType===1)roots.add(root);
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const batch=roots.size?[...roots]:[document];
      roots.clear();
      batch.forEach(scan);
    });
  }

  function boot(){
    document.documentElement.classList.add('dl-hard-icon-dedupe-v7');
    scan(document);
    const observer=new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes){
          if(node.nodeType!==1)continue;
          if(node.closest?.('.dl-react-crystal-v7,.dl-v10-picker'))continue;
          queue(node);
        }
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  window.addEventListener('hashchange',()=>setTimeout(()=>queue(document.body),90));
  window.addEventListener('pageshow',()=>setTimeout(()=>queue(document.body),90));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();