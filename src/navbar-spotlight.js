/**
 * Sliding spotlight for the left navbar links — mirrors the wcpos.com header
 * (wcpos-com repo, src/components/main/site-nav.tsx). One pill glides between
 * links on hover / keyboard focus, then settles on the active page as a brand
 * tint when the pointer leaves. On the docs site the active page is always
 * "Documentation" (the other left links point at wcpos.com), so the resting
 * tint marks where the visitor is in the cross-site nav.
 *
 * The pill is a plain DOM node prepended outside React's knowledge; position()
 * re-creates it if a navbar re-render drops it. Colours and transitions live
 * in custom.css (.wcpos-nav-spotlight), including the reduced-motion override.
 */
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const CONTAINER = '.navbar__items:not(.navbar__items--right)';

let hoveredLink = null;

function position() {
  const container = document.querySelector(CONTAINER);
  if (!container) {
    return;
  }

  let spot = container.querySelector(':scope > .wcpos-nav-spotlight');
  if (!spot) {
    spot = document.createElement('span');
    spot.className = 'wcpos-nav-spotlight';
    spot.setAttribute('aria-hidden', 'true');
    container.prepend(spot);
  }

  if (hoveredLink && !hoveredLink.isConnected) {
    hoveredLink = null;
  }
  // The docs site statically marks Documentation as the active cross-site
  // section (.navbar-link-docs, see docusaurus.config.js); prefer a real
  // navbar__link--active if Docusaurus ever applies one.
  const activeLink =
    container.querySelector('.navbar__link--active') ||
    container.querySelector('.navbar-link-docs');
  if (activeLink) {
    activeLink.setAttribute('aria-current', 'page');
  }
  const target = hoveredLink || activeLink;
  spot.classList.toggle('wcpos-nav-spotlight--hover', Boolean(hoveredLink));

  if (!target) {
    spot.style.opacity = '0';
    return;
  }

  // Appearing from hidden (initial paint, or no-active pages): jump into
  // place without a visible slide from a stale position.
  const appearing = spot.style.opacity !== '1';
  if (appearing) {
    spot.style.transition = 'none';
  }
  spot.style.opacity = '1';
  spot.style.left = `${target.offsetLeft}px`;
  spot.style.top = `${target.offsetTop}px`;
  spot.style.width = `${target.offsetWidth}px`;
  spot.style.height = `${target.offsetHeight}px`;
  if (appearing) {
    requestAnimationFrame(() => {
      spot.style.transition = '';
    });
  }
}

function linkFrom(element) {
  if (!(element instanceof Element)) {
    return null;
  }
  const container = element.closest(CONTAINER);
  if (!container) {
    return null;
  }
  const link = element.closest('.navbar__link');
  return link && link.parentElement === container ? link : null;
}

if (ExecutionEnvironment.canUseDOM) {
  // Delegated listeners survive navbar re-renders (no per-node bindings).
  document.addEventListener('pointerover', (event) => {
    const link = linkFrom(event.target);
    if (link) {
      hoveredLink = link;
      position();
    }
  });

  document.addEventListener('pointerout', (event) => {
    if (!hoveredLink || !(event.target instanceof Element)) {
      return;
    }
    if (!event.target.closest(CONTAINER)) {
      return;
    }
    const to = event.relatedTarget;
    // Leaving the nav row (or landing on the brand) settles the pill back on
    // the active link; moving across the 4px gaps between pills does not.
    if (
      !(to instanceof Element) ||
      !to.closest(CONTAINER) ||
      to.closest('.navbar__brand')
    ) {
      hoveredLink = null;
      position();
    }
  });

  // Keyboard: the spotlight follows focus, like the wcpos.com header.
  document.addEventListener('focusin', (event) => {
    const link = linkFrom(event.target);
    if (link) {
      hoveredLink = link;
      position();
    }
  });
  document.addEventListener('focusout', (event) => {
    if (hoveredLink && linkFrom(event.target)) {
      hoveredLink = null;
      position();
    }
  });

  window.addEventListener('resize', () => position());
  // Web-font swap changes link widths after first paint.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => position());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => position());
  } else {
    position();
  }
}

export function onRouteDidUpdate() {
  hoveredLink = null;
  requestAnimationFrame(position);
}
