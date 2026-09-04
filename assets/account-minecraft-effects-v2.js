(() => {
  'use strict';

  const PORTAL_ID = 'dl-account-portal';
  const MARK = 'data-dl-mcfx-v2';

  const pixelPreset = [
    ['8%','22%','4px','8.4s','-1.2s','16px','52%'],
    ['15%','76%','6px','10.2s','-4.4s','-12px','44%'],
    ['24%','42%','3px','7.8s','-2.2s','19px','64%'],
    ['34%','83%','5px','11.6s','-7.1s','11px','48%'],
    ['43%','18%','4px','9.3s','-3.6s','-15px','58%'],
    ['52%','65%','7px','12.1s','-8.1s','18px','42%'],
    ['61%','31%','4px','8.8s','-5.5s','12px','66%'],
    ['70%','79%','5px','10.7s','-6.8s','-18px','54%'],
    ['77%','16%','3px','7.5s','-1.8s','14px','61%'],
    ['84%','55%','6px','11.2s','-9.1s','-9px','45%'],
    ['91%','35%','4px','9.7s','-4.7s','16px','60%'],
    ['95%','84%','5px','12.8s','-10.2s','-14px','49%']
  ];

  const cubePreset = [
    ['7%','60%','30px','13s','-4s'],
    ['28%','13%','42px','15s','-8s'],
    ['57%','74%','34px','12s','-1s'],
    ['79%','30%','46px','16s','-10s'],
    ['90%','69%','28px','11s','-6s']
  ];

  const ringPreset = [
    ['10%','12%','104px','9s','-2s'],
    ['69%','63%','148px','12s','-7s'],
    ['83%','9%','86px','8s','-4s']
  ];

  const biomePixels = [
    ['77%','13%','5px','6.1s','-1.5s','.64'],
    ['86%','23%','7px','7.4s','-4.2s','.45'],
    ['70%','34%','4px','5.7s','-2.8s','.72'],
    ['91%','43%','6px','8.2s','-6.4s','.38'],
    ['62%','18%','3px','4.9s','-3.2s','.68'],
    ['80%','58%','5px','6.8s','-5.1s','.52'],
    ['56%','70%','4px','7.6s','-1.9s','.44'],
    ['93%','72%','3px','5.5s','-4.6s','.74']
  ];

  const biomeCubes = [
    ['8%','18%','24px','-8deg','9s','-3s'],
    ['73%','54%','34px','14deg','11s','-7s'],
    ['86%','71%','22px','-4deg','8s','-4.5s'],
    ['58%','8%','18px','9deg','7s','-2s']
  ];

  function el(className) {
    const node = document.createElement('span');
    node.className = className;
    node.setAttribute('aria-hidden', 'true');
    return node;
  }

  function mountWorldFx(portal) {
    if (portal.querySelector('.dl-mc-fx-v2')) return;

    const fx = document.createElement('div');
    fx.className = 'dl-mc-fx-v2';
    fx.setAttribute('aria-hidden', 'true');

    const grid = el('dl-mc-fx-grid');
    const scan = el('dl-mc-fx-scan');
    fx.append(grid, scan);

    [['18%','7s','-1s'],['72%','9s','-4s']].forEach(([x,dur,delay]) => {
      const beam = el('dl-mc-fx-beacon');
      beam.style.setProperty('--bx', x);
      beam.style.setProperty('--bd', dur);
      beam.style.setProperty('--delay', delay);
      fx.appendChild(beam);
    });

    pixelPreset.forEach(([x,y,s,dur,delay,dx,tone]) => {
      const p = el('dl-mc-fx-pixel');
      p.style.setProperty('--x',x);
      p.style.setProperty('--y',y);
      p.style.setProperty('--s',s);
      p.style.setProperty('--dur',dur);
      p.style.setProperty('--delay',delay);
      p.style.setProperty('--dx',dx);
      p.style.setProperty('--tone',tone);
      fx.appendChild(p);
    });

    cubePreset.forEach(([x,y,s,dur,delay]) => {
      const c = el('dl-mc-fx-cube');
      c.style.setProperty('--x',x);
      c.style.setProperty('--y',y);
      c.style.setProperty('--s',s);
      c.style.setProperty('--dur',dur);
      c.style.setProperty('--delay',delay);
      fx.appendChild(c);
    });

    ringPreset.forEach(([x,y,s,dur,delay]) => {
      const r = el('dl-mc-fx-ring');
      r.style.setProperty('--x',x);
      r.style.setProperty('--y',y);
      r.style.setProperty('--s',s);
      r.style.setProperty('--dur',dur);
      r.style.setProperty('--delay',delay);
      fx.appendChild(r);
    });

    portal.prepend(fx);
  }

  function mountBiomeFx(portal) {
    const brand = portal.querySelector('.dl-account-brand');
    if (!brand || brand.querySelector('.dl-biome-fx-v2')) return;

    const fx = document.createElement('div');
    fx.className = 'dl-biome-fx-v2';
    fx.setAttribute('aria-hidden', 'true');
    fx.append(
      el('dl-biome-grid'),
      el('dl-biome-depth'),
      el('dl-biome-portal'),
      el('dl-biome-scan')
    );

    biomePixels.forEach(([x,y,s,dur,delay,a]) => {
      const p = el('dl-biome-pixel');
      p.style.setProperty('--x',x);
      p.style.setProperty('--y',y);
      p.style.setProperty('--s',s);
      p.style.setProperty('--dur',dur);
      p.style.setProperty('--delay',delay);
      p.style.setProperty('--a',a);
      fx.appendChild(p);
    });

    biomeCubes.forEach(([x,y,s,r,dur,delay]) => {
      const c = el('dl-biome-cube');
      c.style.setProperty('--x',x);
      c.style.setProperty('--y',y);
      c.style.setProperty('--s',s);
      c.style.setProperty('--r',r);
      c.style.setProperty('--dur',dur);
      c.style.setProperty('--delay',delay);
      fx.appendChild(c);
    });

    brand.prepend(fx);
  }

  function mount(portal) {
    if (!portal || portal.getAttribute(MARK) === '1') return;
    portal.setAttribute(MARK, '1');
    mountWorldFx(portal);
    mountBiomeFx(portal);
  }

  function findAndMount() {
    mount(document.getElementById(PORTAL_ID));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', findAndMount, { once:true });
  } else {
    findAndMount();
  }

  /* Account views recreate the portal when switching login/register/legal pages.
     Observe only additions; the guard makes the single injection idempotent. */
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (!record.addedNodes.length) continue;
      const portal = document.getElementById(PORTAL_ID);
      if (portal && portal.getAttribute(MARK) !== '1') {
        mount(portal);
        break;
      }
    }
  });
  observer.observe(document.documentElement, { childList:true, subtree:true });
})();
