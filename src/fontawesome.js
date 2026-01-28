/**
 * FontAwesome configuration for Docusaurus (SSR)
 *
 * This file must be loaded as a client module to prevent the "flash of unstyled icons"
 * (FOUC) issue where icons appear very large momentarily on page load.
 *
 * The fix works by:
 * 1. Disabling FontAwesome's automatic CSS injection (which happens too late in SSR)
 * 2. Importing the CSS directly so it's included in the initial page render
 */
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

// Prevent FontAwesome from adding its CSS since we did it manually above
config.autoAddCss = false;
