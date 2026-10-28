/**
 * Liquid Glass Physical Refraction & Specular Highlight Filter Engine.
 * High-performance cached implementation with downsampled optical bevel computation.
 */
export function initLiquidGlass(): () => void {
  if (typeof window === 'undefined') return () => {};

  let svg = document.getElementById('defs') as unknown as SVGSVGElement | null;
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    svg.id = 'defs';
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.pointerEvents = 'none';
    svg.setAttribute('aria-hidden', 'true');
    document.body.appendChild(svg);
  }

  let supported = false;
  try {
    supported =
      CSS.supports('backdrop-filter', 'url(#a)') ||
      CSS.supports('-webkit-backdrop-filter', 'url(#a)');
  } catch (e) {
    supported = false;
  }

  if (!supported) {
    document.documentElement.classList.add('nofx');
    return () => {};
  }

  // Cache to prevent expensive main-thread re-generation when dimensions have not changed
  const cache = new WeakMap<HTMLElement, { w: number; h: number; rad: number; id: string }>();
  let filterCounter = 0;

  function build() {
    if (!supported || !svg) return;
    const els = document.querySelectorAll<HTMLElement>('.lg');

    els.forEach((el) => {
      // If element is hidden or detached, skip
      if (el.offsetWidth === 0 && el.offsetHeight === 0) return;

      const r = el.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      if (w < 4 || h < 4) return;

      const radVal = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      const rad = Math.min(radVal, w / 2, h / 2);

      const cached = cache.get(el);
      if (cached && cached.w === w && cached.h === h && Math.abs(cached.rad - rad) < 1) {
        // Dimensions unchanged, reuse existing filter!
        return;
      }

      // Generate or reuse filter ID
      const filterId = cached ? cached.id : `lg-${filterCounter++}`;

      // Performance optimization: compute displacement & specular at half resolution.
      // feImage with preserveAspectRatio="none" scales smoothly, and feGaussianBlur smooths it out.
      const scale = w > 200 || h > 200 ? 0.5 : 1;
      const cw = Math.max(16, Math.round(w * scale));
      const ch = Math.max(16, Math.round(h * scale));
      const crad = rad * scale;

      const cm = document.createElement('canvas');
      cm.width = cw;
      cm.height = ch;
      const ctxm = cm.getContext('2d');

      const cs = document.createElement('canvas');
      cs.width = cw;
      cs.height = ch;
      const ctxs = cs.getContext('2d');

      if (!ctxm || !ctxs) return;

      const imgm = ctxm.createImageData(cw, ch);
      const dm = imgm.data;
      const imgs = ctxs.createImageData(cw, ch);
      const ds = imgs.data;

      const hw = cw / 2;
      const hh = ch / 2;
      const bezel = Math.min(Math.min(cw, ch) * 0.46, 26 * scale);

      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const px = x + 0.5 - hw;
          const py = y + 0.5 - hh;
          const qx = Math.abs(px) - (hw - crad);
          const qy = Math.abs(py) - (hh - crad);
          const ox = Math.max(qx, 0);
          const oy = Math.max(qy, 0);
          const len = Math.sqrt(ox * ox + oy * oy);
          const sd = len + Math.min(Math.max(qx, qy), 0) - crad;
          const dist = -sd;

          let nx = 0;
          let ny = 0;
          if (qx > 0 && qy > 0) {
            nx = (Math.sign(px) * ox) / (len || 1);
            ny = (Math.sign(py) * oy) / (len || 1);
          } else if (qx > qy) {
            nx = Math.sign(px);
          } else {
            ny = Math.sign(py);
          }

          const t = Math.max(0, Math.min(1, 1 - dist / bezel));
          const s = t * t;
          const idx = (y * cw + x) * 4;

          // Pure displacement vector
          dm[idx] = Math.round(128 - nx * s * 127);
          dm[idx + 1] = Math.round(128 - ny * s * 127);
          dm[idx + 2] = 128;
          dm[idx + 3] = 255;

          // Soft subtle edge highlight
          const diff = nx * -0.6 + ny * -0.8;
          const pos = Math.max(diff, 0);
          const neg = Math.max(-diff, 0);
          const dd = Math.max(dist, 0);
          const ring = Math.exp(-(dd * dd) / (2 * 1.1 * 1.1));
          const glow = Math.exp(-dd / 6);
          const a = (ring * (0.12 + 0.78 * pos + 0.25 * neg) + glow * 0.10 * (pos + 0.25 * neg)) * 0.15;

          ds[idx] = 255;
          ds[idx + 1] = 255;
          ds[idx + 2] = 255;
          ds[idx + 3] = Math.round(a * 255);
        }
      }

      ctxm.putImageData(imgm, 0, 0);
      ctxs.putImageData(imgs, 0, 0);

      const S = parseFloat(el.dataset.s || '') || 34;
      const B = parseFloat(el.dataset.b || '') || 2.5;

      // Replace or insert filter in SVG
      const existingFilter = document.getElementById(filterId);
      const filterHtml = `
        <feImage href="${cm.toDataURL()}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>
        <feImage href="${cs.toDataURL()}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="spec"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="${B}" result="frost"/>
        <feDisplacementMap in="frost" in2="map" scale="${S}" xChannelSelector="R" yChannelSelector="G" result="disp"/>
        <feColorMatrix in="disp" type="saturate" values="1.6" result="sat"/>
        <feGaussianBlur in="disp" stdDeviation="6" result="wide"/>
        <feColorMatrix in="wide" type="saturate" values="1.8" result="wideSat"/>
        <feMerge result="tinted">
          <feMergeNode in="wideSat"/>
          <feMergeNode in="sat"/>
        </feMerge>
        <feComposite in="spec" in2="tinted" operator="over"/>
      `;

      if (existingFilter) {
        existingFilter.setAttribute('width', String(w));
        existingFilter.setAttribute('height', String(h));
        existingFilter.innerHTML = filterHtml;
      } else {
        svg.insertAdjacentHTML(
          'beforeend',
          `<filter id="${filterId}" x="0" y="0" width="${w}" height="${h}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">${filterHtml}</filter>`
        );
      }

      const f = `url(#${filterId})`;
      el.style.backdropFilter = f;
      (el.style as any).webkitBackdropFilter = f;

      cache.set(el, { w, h, rad, id: filterId });
    });
  }

  // Trigger initial build
  build();

  let rafId: number | null = null;
  const scheduleBuild = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      build();
    });
  };

  window.addEventListener('resize', scheduleBuild, { passive: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleBuild).catch(() => {});
  }

  // MutationObserver throttled with requestAnimationFrame, ignoring text-only mutations
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (const m of mutations) {
      if (m.type === 'childList') {
        for (let i = 0; i < m.addedNodes.length; i++) {
          const node = m.addedNodes[i];
          if (node.nodeType === 1) {
            const el = node as HTMLElement;
            if (el.classList?.contains('lg') || el.querySelector?.('.lg')) {
              shouldUpdate = true;
              break;
            }
          }
        }
      } else if (m.type === 'attributes') {
        const target = m.target as HTMLElement;
        if (target.classList?.contains('lg') || target.classList?.contains('menu') || target.classList?.contains('more')) {
          shouldUpdate = true;
          break;
        }
      }
      if (shouldUpdate) break;
    }

    if (shouldUpdate) {
      scheduleBuild();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  return () => {
    window.removeEventListener('resize', scheduleBuild);
    observer.disconnect();
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}
