/** Provider logo SVGs — kept in sync with `media/station.js` `providerLogoSvg()`. */

const PROVIDER_LOGOS: Record<string, string> = {
  supabase:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.8 2.4 5.6 13.1c-.5.7 0 1.7.9 1.7h4.7l-1 6.1c-.2 1 .9 1.6 1.5.8l8.1-10.8c.5-.7 0-1.7-.9-1.7h-4.7l1-6.1c.2-1-.8-1.6-1.4-.7Z"/></svg>',
  clerk:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="#6C47FF" stroke-width="3" stroke-linecap="round" d="M18.7 8.6A7.4 7.4 0 1 0 18.7 15.4"/><circle cx="12" cy="12" r="2.5" fill="#6C47FF"/></svg>',
  authjs:
    '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path fill="#18C6CF" d="M12 2.3 4.2 6.7v5.1c0 4.6 3.2 8.5 7.8 10 4.6-1.5 7.8-5.4 7.8-10V6.7L12 2.3Z"/><path fill="#8B2FF5" d="M12 2.3v19.5c-1.5-.5-2.9-1.3-4.1-2.3L12 2.3Z"/><path fill="#FFF7DF" d="M12 5.3 9.4 18.2c.8.7 1.6 1.2 2.6 1.6V5.3Z"/><path fill="#FF8A00" d="m12 2.3 4.1 17.2c-1.2 1-2.6 1.8-4.1 2.3V2.3Z"/></svg>',
  auth0:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect fill="#EB5424" x="3" y="3" width="18" height="18" rx="3.2"/><path fill="#ffffff" fill-rule="evenodd" clip-rule="evenodd" d="m12 6.2 1.45 4.46h4.69l-3.8 2.76 1.45 4.46L12 15.12 8.21 17.88l1.45-4.46-3.8-2.76h4.69L12 6.2Zm0 3.4-.52 1.6h-1.69l1.37 1-.52 1.6L12 12.8l1.36.99-.52-1.6 1.37-.99h-1.69L12 9.6Z"/></svg>',
  'better-auth':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect fill="#171717" x="3" y="3" width="18" height="18" rx="4"/><path fill="#ffffff" d="M8 8h3v3H8V8Zm5 0h3v3h-3V8ZM8 13h3v3H8v-3Zm5 0h3v3h-3v-3Z"/></svg>',
  polar:
    '<svg viewBox="0 0 29 29" aria-hidden="true"><path fill="#0062FF" fill-rule="evenodd" clip-rule="evenodd" d="M9.077 23.057c4.801 3.25 11.328 1.992 14.577-2.808 3.25-4.801 1.993-11.328-2.808-14.578C16.045 2.422 9.519 3.679 6.269 8.48c-3.25 4.801-1.993 11.327 2.808 14.577Zm1.393.086c4.392 2.247 9.963.138 12.444-4.711 2.48-4.848.93-10.6-3.461-12.847-4.392-2.247-9.963-.138-12.443 4.711-2.481 4.848-.932 10.6 3.46 12.847Z"/><path fill="#0062FF" fill-rule="evenodd" clip-rule="evenodd" d="M11.722 24.29c3.965 1.29 8.628-2.118 10.417-7.613 1.788-5.495.024-10.996-3.94-12.286-3.964-1.29-8.628 2.118-10.416 7.613-1.789 5.495-.025 10.995 3.939 12.286Zm1.213-.418c3.355.716 6.982-2.961 8.102-8.212 1.12-5.252-.691-10.089-4.046-10.804-3.356-.716-6.983 2.96-8.103 8.212-1.12 5.251.692 10.088 4.047 10.804Z"/><path fill="#0062FF" fill-rule="evenodd" clip-rule="evenodd" d="M13.854 24.738c2.652.284 5.3-4.14 5.912-9.882.613-5.74-1.04-10.624-3.692-10.907-2.653-.283-5.3 4.141-5.913 9.882-.613 5.741 1.04 10.624 3.693 10.907Zm1.241-1.747c1.92-.031 3.415-3.917 3.34-8.68-.075-4.764-1.693-8.6-3.612-8.57-1.92.03-3.415 3.916-3.34 8.68.076 4.763 1.693 8.6 3.612 8.57Z"/></svg>',
  'lemon-squeezy':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FACC15" d="M18.6 5.4c-4.9-.7-9.9 1.9-12.1 6.4-1.5 3-.7 5.9 1.7 7.2 2.7 1.4 6.5-.2 8.9-3.8 2-3 2.7-6.6 1.5-9.8Z"/><path fill="#111827" d="M8.5 17.5c1.4.7 3.7-.4 5.3-2.6 1.4-2 2.1-4.5 1.9-6.8-2.9.5-5.6 2.3-7 4.9-1.1 2-.9 3.8.8 4.5Z" opacity=".16"/><path fill="#111827" d="M13.7 5.2c2-.8 4-.9 5.8-.4-.9 1.5-2.6 2.4-4.3 2.2-1-.1-1.6-.8-1.5-1.8Z"/></svg>',
  github:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.86 9.71.5.1.69-.22.69-.49 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.17-1.11-1.48-1.11-1.48-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.56 2.36 1.11 2.94.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.2 9.2 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.6.7.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"/></svg>',
  gitlab:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FC6D26" d="M23.2 9.4 12 2.2.8 9.4l1.4 8.2L12 21.8l9.8-4.2 1.4-8.2Z"/><path fill="#E24329" d="M12 2.2v7.1l3.8 1.9 1.8-5.5L12 2.2Z"/><path fill="#FC6D26" d="M12 10.2 7.7 12l1.8-5.5L12 2.2Z"/><path fill="#FCA326" d="M.8 9.4 12 21.8 7.7 12 12 10.2Z"/><path fill="#FC6D26" d="M12 10.2l4.3 1.8 6.1-2.6L12 2.2Z"/></svg>',
  neon:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5c0-1 .8-1.7 1.7-1.3l9.5 4.3c1.1.5 1.8 1.6 1.8 2.8v8.6c0 1-.8 1.7-1.7 1.3L6.8 15.9A3 3 0 0 1 5 13.1V4.5Zm4.1 4.1v5l4.9 2.2v-5L9.1 8.6Z"/></svg>',
  planetscale:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.1 4.9A10 10 0 0 0 4.9 19.1L19.1 4.9Zm-12 16A10 10 0 0 0 20.9 7.1L7.1 20.9Z"/></svg>',
  mongodb:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c3 3 4.8 6.2 4.8 9.6 0 4.2-2.2 7.1-4.8 9.9-2.6-2.8-4.8-5.7-4.8-9.9C7.2 8.2 9 5 12 2Zm0 5.2v10.2"/></svg>',
  turso:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h16v3H4v-3Zm0 6h16v3H4v-3ZM7.5 4h9v3h-9V4Zm0 13h9v3h-9v-3Z"/></svg>',
  stripe:
    '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path fill="#635BFF" d="M4.5 15.4c1.5.9 3.5 1.4 5.4 1.4 1.6 0 2.5-.4 2.5-1.2 0-.7-.7-1-3-1.5-3-.7-4.7-1.8-4.7-4.1 0-2.6 2.1-4.4 5.8-4.4 2.1 0 3.9.4 5.3 1.1v3.4a10 10 0 0 0-5.1-1.4c-1.5 0-2.2.4-2.2 1.1 0 .7.8 1 3 1.5 3.1.7 4.8 1.8 4.8 4.1 0 2.7-2.2 4.5-6.2 4.5-2.2 0-4.3-.5-5.6-1.3v-3.2Z"/></svg>',
  paddle:
    '<svg viewBox="0 0 90 90" aria-hidden="true"><rect x="11" y="11" width="68" height="68" rx="17" fill="#101318"/><rect x="11.5" y="11.5" width="67" height="67" rx="16.5" fill="none" stroke="#343942"/><path fill="#FFD21E" d="M8.49991 17C8.51217 21.6945 12.3128 25.5001 17 25.5001C12.3128 25.5001 8.51217 29.3055 8.49991 34C8.48783 29.3055 4.68717 25.5001 0 25.5001C4.68717 25.5001 8.48783 21.6945 8.49991 17Z" transform="translate(19.5 -31.5) scale(3)"/></svg>',
  vercel:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 22 20H2L12 4Z"/></svg>',
  netlify:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#00C7B7" d="M8.1 7.1h2.5l3.8 6.2V7.1h2.5v9.8h-2.4l-3.9-6.2v6.2H8.1V7.1Z"/><path fill="#111827" d="M3 10.5h4.1v3H3v-3Zm16.9 0H22v3h-2.1v-3ZM10.5 3H13.5v4.1h-3.1V3Zm0 16.9H13.5V22h-3.1v-2.1Z"/></svg>',
  aws:
    '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path fill="#FF9900" d="M6.763 10.582c4.95-2.283 10.563-2.283 15.475 0 .532.243.848.741.848 1.256 0 .532-.323 1.026-.85 1.256-4.912 2.283-10.525 2.283-15.474 0-.528-.23-.851-.724-.851-.279 0-.544.098-.754.243-4.95 2.283-10.563 2.283-15.475 0-.532-.243-.848-.741-.848-1.256 0-.532.323-1.026.85-1.256.228-.098.492-.196.754-.196.279 0 .544.098.754.243Z"/><path fill="#FF9900" d="M12 3.65c-2.772 0-5.027 1.147-5.027 2.553S9.228 8.756 12 8.756s5.027-1.147 5.027-2.553S14.772 3.65 12 3.65Z"/></svg>',
  sentry:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 22 20H2L12 3Zm0 5.1L6.8 17h2.1l3.1-5.3 3.1 5.3h2.1L12 8.1Z"/></svg>',
  posthog:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#1D4AFF" d="M5.2 6.1h8.2c3 0 5.3 2 5.3 5.1 0 3.2-2.3 5.2-5.3 5.2H5.2V6.1Z"/><path fill="#F54E00" d="M4.1 4h4.2a2.35 2.35 0 0 1 0 4.7H4.1V4Z"/><circle cx="13.7" cy="11.75" r="1.1" fill="#F9BD2B"/><path fill="#F54E00" d="m16.5 9.35 2-1.15.85 1.3-2.15 1.3-.7-1.45Zm.38 4.78 2.42.86-.78 1.6-2.4-1.02.76-1.44Z"/></svg>',
  playwright:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#2EAD33" d="M8.4 8.2 5.4 17.2h2.3l.8-2.8h2.7l.8 2.8h2.3L11.6 8.2H8.4Zm1.1 4.8.8-2.4.8 2.4H9.5Z"/><path fill="#E2574C" d="M15.6 8.2 12.6 17.2h2.3l.8-2.8h2.7l.8 2.8h2.3L18.8 8.2h-3.2Zm1.1 4.8.8-2.4.8 2.4h-1.6Z"/><ellipse fill="#2EAD33" cx="9.5" cy="13.1" rx="1.1" ry="1.4"/><ellipse fill="#E2574C" cx="16.5" cy="13.1" rx="1.1" ry="1.4"/></svg>',
  logrocket:
    '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" fill="#764ABC"/><path fill="#FFFFFF" d="M12 7.4c2.7 0 4.9 2.2 4.9 4.9s-2.2 4.9-4.9 4.9-4.9-2.2-4.9-4.9 4.9-4.9 4.9-4.9Zm0 1.9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-3.2 7.4h6.4v1.5H8.8v-1.5Z"/></svg>',
  figma:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 3h3.5v6H8.5a3 3 0 1 1 0-6Zm3.5 6h3.5a3 3 0 1 0 0-6H12v6Zm0 0h3.5a3 3 0 1 1 0 6H12V9Zm-3.5 0H12v6H8.5a3 3 0 1 1 0-6ZM8.5 15H12v2.5A3.5 3.5 0 1 1 8.5 15Z"/></svg>',
  storybook:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 3.4 17.9 2l.7 18.1-12.4.7V3.4Zm8.7 3.2.3 2.4 1.7-1.3 1.7 1.1.3-3.4-4 .5v.7Zm-5.2 5.1c0 2 1.6 3.5 4.2 3.5 2.4 0 3.8-1.2 3.8-3 0-1.7-1.1-2.6-3.4-3l-1.2-.2c-.7-.1-1-.4-1-.8 0-.5.5-.8 1.3-.8.9 0 1.5.4 1.8 1.1l2.1-.8c-.5-1.4-1.8-2.2-3.8-2.2-2.3 0-3.8 1.2-3.8 2.9 0 1.6 1.1 2.5 3.3 2.9l1.2.2c.8.1 1.1.4 1.1.9 0 .6-.5.9-1.4.9-1.1 0-1.8-.5-2.1-1.3l-2.1.7Z"/></svg>',
  'product-spec':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.2h9.2L19 7v13.8H6V3.2Zm8.2 1.9v3h3l-3-3ZM8.4 10h7.2v1.7H8.4V10Zm0 3.2h7.2v1.7H8.4v-1.7Zm0 3.2h4.9v1.7H8.4v-1.7Z"/></svg>',
  'route-map':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.2a3 3 0 0 1 3 3c0 2-3 5.1-3 5.1s-3-3.1-3-5.1a3 3 0 0 1 3-3Zm0 1.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm11 5.8a3 3 0 0 1 3 3c0 2-3 5.1-3 5.1s-3-3.1-3-5.1a3 3 0 0 1 3-3Zm0 1.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM9.5 7h2.1c2.8 0 4.9 2 4.9 4.8h-2c0-1.7-1.2-2.8-2.9-2.8H9.5V7Zm4.9 10h-2.1c-2.8 0-4.9-2-4.9-4.8h2c0 1.7 1.2 2.8 2.9 2.8h2.1v2Z"/></svg>',
  react:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.2"/><ellipse cx="12" cy="12" rx="9" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.6" transform="rotate(120 12 12)"/></svg>',
  vue: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.6 4h5.1L12 11.4 16.3 4h5.1L12 20 2.6 4Zm5.6 0L12 10.5 15.8 4h-2.7L12 5.9 10.9 4H8.2Z"/></svg>',
  svelte:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FF3E00" d="M17 3.4a5.1 5.1 0 0 0-6.8 1.4L6.5 9.7a4.5 4.5 0 0 0 .8 6.3 5 5 0 0 0 6.8-1.2l.6-.8a1.55 1.55 0 0 0-.3-2.2 1.75 1.75 0 0 0-2.3.4l-.6.8a1.3 1.3 0 0 1-1.8.3 1.15 1.15 0 0 1-.2-1.6l3.7-4.8a1.3 1.3 0 0 1 1.8-.4c.5.4.6 1.1.2 1.6l-.3.4 2.8 2 .3-.4a4.65 4.65 0 0 0-1-6.7Zm-9.8 17.2a5.1 5.1 0 0 0 6.8-1.4l3.7-4.9a4.5 4.5 0 0 0-.8-6.3 5 5 0 0 0-6.8 1.2l-.6.8a1.55 1.55 0 0 0 .3 2.2 1.75 1.75 0 0 0 2.3-.4l.6-.8a1.3 1.3 0 0 1 1.8-.3 1.15 1.15 0 0 1 .2 1.6L11 17.1a1.3 1.3 0 0 1-1.8.4 1.15 1.15 0 0 1-.2-1.6l.3-.4-2.8-2-.3.4a4.65 4.65 0 0 0 1 6.7Z"/></svg>',
  angular:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 20.5 5.6 19.2 17 12 21.5 4.8 17 3.5 5.6 12 2.5Zm0 4.2-5 11h2.4l1-2.4h3.2l1 2.4H17l-5-11Zm0 3.8 1.1 2.9h-2.2l1.1-2.9Z"/></svg>',
  nodejs:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 20.2 7v10L12 21.5 3.8 17V7L12 2.5Zm-3.8 6.7v5.6h1.9v-3.1l3.8 3.1h1.9V9.2h-1.9v3.2l-3.8-3.2H8.2Z"/></svg>',
  python:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.8 3c2.7 0 4.2.8 4.2 2.5V9H9.6A2.6 2.6 0 0 0 7 11.6V13H4.5C3.5 13 3 12.2 3 11c0-3.2 1.9-4.9 5.6-4.9h3.8V5H8.8V3.6A10 10 0 0 1 11.8 3Zm-1.4 1.5a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6ZM12.2 21c-2.7 0-4.2-.8-4.2-2.5V15h6.4a2.6 2.6 0 0 0 2.6-2.6V11h2.5c1 0 1.5.8 1.5 2 0 3.2-1.9 4.9-5.6 4.9h-3.8V19h3.6v1.4a10 10 0 0 1-3 .6Zm1.4-3.1a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z"/></svg>',
  rails:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.7C5.8 9.5 11.7 5.2 21 4.8v3.1C13.5 8.3 8.7 11.6 6 18.5L3 17.7Zm4.6.7c2.1-5 5.9-7.5 11.4-7.9v2.4c-4.4.4-7.4 2.5-9 6.2l-2.4-.7Zm4.7.7c1.3-2.4 3.4-3.7 6.7-4.1v2.2c-2.2.4-3.6 1.3-4.5 2.6l-2.2-.7Z"/></svg>',
  go: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.2h7.4v1.5H3V8.2Zm-1 3h7.4v1.5H2v-1.5Zm2 3h5.4v1.5H4v-1.5Zm10.5-6.1c3.1 0 5.5 2 5.5 4.6s-2.4 4.6-5.5 4.6-5.5-2-5.5-4.6 2.4-4.6 5.5-4.6Zm0 2.1c-1.7 0-3 1.1-3 2.5s1.3 2.5 3 2.5 3-1.1 3-2.5-1.3-2.5-3-2.5Zm5.1-2h2.4l-1.2 9h-2.4l1.2-9Z"/></svg>',
  'testing-library':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v4.2l-3.4 4.5 5.4 7.9c.5.8 0 1.9-1 1.9H6c-1 0-1.6-1.1-1-1.9l5.4-7.9L7 7.2V3Zm3 3.5 2 2.7 2-2.7H10Zm1.9 8.4-2.6 3.8h5.4l-2.8-3.8Z"/></svg>',
  vitest:
    '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path fill="#FCC72B" d="M13.4 3 21 7.4 12 21 3 7.4 10.6 3l1.4 4.5L13.4 3Zm-1.4 7.3-2.1 4h4.2l-2.1-4Z"/><path fill="#729B1B" d="M12 10.3 9.9 14.3h4.2L12 10.3Z"/></svg>',
  'rate-limit':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9h-3a6 6 0 1 1-1.8-4.3L13 11h8V3l-2.7 2.7A9 9 0 0 0 12 3Z"/></svg>',
  'bot-protection':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f38020" d="M12 2.4 20 5.5v6.2c0 4.75-3.12 8.1-8 10.1-4.88-2-8-5.35-8-10.1V5.5l8-3.1Z"/><path fill="#fff7df" d="M12 5.9 16.9 8v3.72c0 2.64-1.8 4.64-4.9 6.05-3.1-1.41-4.9-3.41-4.9-6.05V8L12 5.9Z"/><path fill="#f38020" d="M12 8.2a3.15 3.15 0 0 1 3.15 3.15A3.15 3.15 0 0 1 12 14.5a3.15 3.15 0 0 1-3.15-3.15A3.15 3.15 0 0 1 12 8.2Zm0 1.65a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/></svg>',
  'secrets-hygiene':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1.5v11h-13V10H7Zm3 0h4V7a2 2 0 0 0-4 0v3Z"/></svg>',
  firebase:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FFCA28" d="M5.65 17.9 7.8 4.7c.08-.48.74-.58.96-.15l2.18 4.18 1.72-3.28c.2-.38.75-.33.88.08l4.82 12.37-6.35 3.56-6.36-3.56Z"/><path fill="#FFA000" d="m10.95 8.73-5.3 9.17 6.36 3.56 6.35-3.56-5.7-12.45-1.71 3.28Z"/><path fill="#F57C00" d="m5.65 17.9 5.3-9.17 1.06 12.73-6.36-3.56Z"/></svg>',
  cloudflare:
    '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="7" width="21" height="21" rx="1.3" fill="#111827"/><rect x="4" y="4" width="21" height="21" rx="1.3" fill="#f38020"/><path fill="#ffb647" d="M20.7 17.1h2.4c1.5 0 2.7-1 2.7-2.2 0-1.1-.9-2-2.2-2.2-.5-1.8-2.1-3-4-3-.9 0-1.8.3-2.5.8 1 .7 1.7 1.8 1.9 3.1 1.4.3 2.4 1.5 2.4 2.9 0 .2 0 .4-.1.6h-.6Z"/><path fill="#fff7df" d="M9 17.1h10.7c1.3 0 2.4-.9 2.4-2.1 0-1.1-1-2-2.3-2.1-.5-1.9-2.3-3.3-4.4-3.3-1.7 0-3.2.9-4 2.3-.4-.2-.8-.3-1.3-.3-1.5 0-2.8 1-3.1 2.4-1.2.2-2.1 1-2.1 1.9 0 .7.5 1.2 1.2 1.2H9Z"/><path fill="#fff7df" d="M8.2 19.1h12.5c.5 0 .9.4.9.9s-.4.9-.9.9H8.2c-.5 0-.9-.4-.9-.9s.4-.9.9-.9Z"/></svg>'
};

const ALIASES: Record<string, string> = {
  authjs: 'authjs',
  'auth.js': 'authjs',
  nextauth: 'authjs',
  posthog: 'posthog',
  node: 'nodejs',
  nodejs: 'nodejs',
  'node.js': 'nodejs',
  express: 'nodejs',
  expressjs: 'nodejs',
  supabase: 'supabase',
  clerk: 'clerk',
  stripe: 'stripe',
  vercel: 'vercel',
  'supabase auth': 'supabase',
  supabaseauth: 'supabase',
  'bot protection': 'bot-protection',
  botprotection: 'bot-protection',
  'secrets hygiene': 'secrets-hygiene',
  secretshygiene: 'secrets-hygiene',
  'rate limiting': 'rate-limit',
  ratelimiting: 'rate-limit',
  polar: 'polar',
  lemonsqueezy: 'lemon-squeezy',
  'lemon squeezy': 'lemon-squeezy',
  'lemon-squeezy': 'lemon-squeezy',
  github: 'github',
  gitlab: 'gitlab',
  auth0: 'auth0',
  'better-auth': 'better-auth',
  betterauth: 'better-auth',
  firebase: 'firebase',
  firestore: 'firebase',
  'mongodb atlas': 'mongodb',
  logrocket: 'logrocket',
  sentry: 'sentry',
  figma: 'figma',
  react: 'react',
  vitest: 'vitest',
  playwright: 'playwright',
  neon: 'neon',
  planetscale: 'planetscale',
  'planet scale': 'planetscale',
  mongodb: 'mongodb',
  netlify: 'netlify',
  render: 'render',
  rendercom: 'render',
  railway: 'railway',
  railwayapp: 'railway',
  cloudflare: 'cloudflare',
  cloudflarepages: 'cloudflare',
  workers: 'cloudflare',
  aws: 'aws',
  paddle: 'paddle',
  turso: 'turso',
  vue: 'vue',
  svelte: 'svelte',
  angular: 'angular',
  python: 'python',
  rails: 'rails',
  go: 'go',
  storybook: 'storybook',
  productspec: 'product-spec',
  prd: 'product-spec',
  routemap: 'route-map',
  routes: 'route-map',
  ratelimit: 'rate-limit'
};

/** CDN slugs that 404 or resolve to the wrong brand — keep inline SVG in PROVIDER_LOGOS. */
export const INLINE_ONLY_LOGO_KEYS = new Set([
  'auth0',
  'authjs',
  'better-auth',
  'clerk',
  'cloudflare',
  'lemon-squeezy',
  'netlify',
  'paddle',
  'polar',
  'posthog',
  'svelte'
]);

/** Bundled SVGs under `report/assets/` — official marks; avoids CSS fill/squash on inline paths. */
export const PROVIDER_ASSET_FILES: Record<string, string> = {
  authjs: 'provider-authjs.svg',
  logrocket: 'provider-logrocket.svg',
  aws: 'provider-aws.svg'
};

const REPORT_ASSET_PREFIX = 'report/assets';

export function providerAssetUrl(key: string): string | undefined {
  const file = PROVIDER_ASSET_FILES[key];
  return file ? `${REPORT_ASSET_PREFIX}/${file}` : undefined;
}

export function providerAssetUrls(): Record<string, string> {
  return Object.fromEntries(
    Object.keys(PROVIDER_ASSET_FILES)
      .map((key) => [key, providerAssetUrl(key)])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  ) as Record<string, string>;
}

/**
 * CDN brand marks (aligned with landing `stackIcons`) — clearer than tiny inline SVGs
 * in sidebar tiles and map nodes. Internal controls keep inline SVG only.
 */
export const PROVIDER_ICON_URLS: Record<string, string> = {
  supabase: 'https://cdn.simpleicons.org/supabase/3ECF8E',
  clerk: 'https://cdn.simpleicons.org/clerk/6C47FF',
  authjs: 'https://authjs.dev/img/etc/logo-sm.webp',
  auth0: 'https://cdn.simpleicons.org/auth0/EB5424',
  firebase: 'https://cdn.simpleicons.org/firebase/FFCA28',
  neon: 'https://cdn.simpleicons.org/neon/00E599',
  planetscale: 'https://cdn.simpleicons.org/planetscale/000000',
  mongodb: 'https://cdn.simpleicons.org/mongodb/47A248',
  turso: 'https://cdn.simpleicons.org/turso/4FF8D2',
  'lemon-squeezy': 'https://cdn.simpleicons.org/lemonsqueezy/FFC233',
  stripe: 'https://cdn.simpleicons.org/stripe/635BFF',
  github: 'https://cdn.simpleicons.org/github/FFFFFF',
  gitlab: 'https://cdn.simpleicons.org/gitlab/FC6D26',
  vercel: 'https://cdn.simpleicons.org/vercel/FFFFFF',
  netlify: 'https://cdn.simpleicons.org/netlify/00C7B7',
  render: 'https://cdn.simpleicons.org/render/46E3B7',
  railway: 'https://cdn.simpleicons.org/railway/0B0D0E',
  cloudflare: 'https://cdn.simpleicons.org/cloudflare/F38020',
  sentry: 'https://cdn.simpleicons.org/sentry/8B5CF6',
  posthog: 'https://cdn.simpleicons.org/posthog/F54E00',
  resend: 'https://cdn.simpleicons.org/resend/FFFFFF',
  upstash: 'https://cdn.simpleicons.org/upstash/00E9A3',
  playwright:
    'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/playwright/playwright-original.svg',
  figma: 'https://cdn.simpleicons.org/figma/F24E1E',
  storybook: 'https://cdn.simpleicons.org/storybook/FF4785',
  react: 'https://cdn.simpleicons.org/react/61DAFB',
  vue: 'https://cdn.simpleicons.org/vuedotjs/4FC08D',
  svelte: 'https://cdn.simpleicons.org/svelte/FF3E00',
  angular: 'https://cdn.simpleicons.org/angular/DD0031',
  nodejs: 'https://cdn.simpleicons.org/nodedotjs/5FA04E',
  python: 'https://cdn.simpleicons.org/python/3776AB',
  rails: 'https://cdn.simpleicons.org/rubyonrails/D30001',
  go: 'https://cdn.simpleicons.org/go/00ADD8',
  'testing-library': 'https://cdn.simpleicons.org/testinglibrary/E33332',
  vitest: 'https://cdn.simpleicons.org/vitest/FCC72B'
};

/** Logos with embedded brand colors — do not force `fill: currentColor` in the report. */
export const BRAND_LOGO_KEYS = new Set([
  'auth0',
  'authjs',
  'aws',
  'better-auth',
  'clerk',
  'gitlab',
  'lemon-squeezy',
  'logrocket',
  'netlify',
  'auth0',
  'paddle',
  'playwright',
  'polar',
  'posthog',
  'stripe',
  'svelte',
  'vitest'
]);

function resolveLogoKey(raw: string, compact: string): string {
  if (ALIASES[raw]) {
    return ALIASES[raw];
  }
  if (ALIASES[compact]) {
    return ALIASES[compact];
  }
  if (PROVIDER_LOGOS[compact]) {
    return compact;
  }

  const parts = raw.split('-').filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0];
    if (PROVIDER_LOGOS[first] || ALIASES[first]) {
      return ALIASES[first] ?? first;
    }
    const twoPart = parts.slice(0, 2).join('');
    if (PROVIDER_LOGOS[twoPart] || ALIASES[twoPart]) {
      return ALIASES[twoPart] ?? twoPart;
    }
    const twoHyphen = parts.slice(0, 2).join('-');
    if (ALIASES[twoHyphen]) {
      return ALIASES[twoHyphen];
    }
  }

  return compact;
}

export function normalizeProviderKey(providerOrLabel: string | undefined): string {
  if (!providerOrLabel) {
    return '';
  }
  const raw = String(providerOrLabel).trim().toLowerCase();
  const compact = raw.replace(/[^a-z0-9]+/g, '');
  return resolveLogoKey(raw, compact);
}

/** Prefer mission provider keys like `vercel-deployment` and display labels. */
export function resolveProviderLogoKey(
  ...candidates: Array<string | undefined>
): string {
  for (const candidate of candidates) {
    const key = normalizeProviderKey(candidate);
    if (key && PROVIDER_LOGOS[key]) {
      return key;
    }
  }
  for (const candidate of candidates) {
    const key = normalizeProviderKey(candidate);
    if (key) {
      return key;
    }
  }
  return '';
}

export function providerLogoClass(
  providerOrLabel: string | undefined,
  ...moreCandidates: Array<string | undefined>
): string {
  const key = resolveProviderLogoKey(providerOrLabel, ...moreCandidates) || normalizeProviderKey(providerOrLabel);
  if (!key) {
    return '';
  }
  return ` provider-logo--${key}${BRAND_LOGO_KEYS.has(key) ? ' provider-logo--brand' : ''}`;
}

function providerIconImgHtml(iconUrl: string, logoKey: string): string {
  return `<img class="provider-logo__img" src="${iconUrl}" alt="" decoding="async" data-provider-logo-key="${logoKey}" />`;
}

export function providerLogoHtml(
  providerOrLabel: string | undefined,
  labelFallback?: string,
  ...moreCandidates: Array<string | undefined>
): string {
  const key =
    resolveProviderLogoKey(providerOrLabel, labelFallback, ...moreCandidates) ||
    normalizeProviderKey(providerOrLabel);
  const svg = key && PROVIDER_LOGOS[key];
  const assetUrl = key ? providerAssetUrl(key) : undefined;
  if (assetUrl) {
    return providerIconImgHtml(assetUrl, key);
  }
  if (key && INLINE_ONLY_LOGO_KEYS.has(key) && svg) {
    return svg;
  }
  if (svg) {
    return svg;
  }
  const iconUrl = key && PROVIDER_ICON_URLS[key];
  if (iconUrl) {
    return providerIconImgHtml(iconUrl, key);
  }
  const label = (labelFallback ?? providerOrLabel ?? '?').trim();
  const initials = label ? label.slice(0, 2).toUpperCase() : '?';
  return `<span aria-hidden="true">${initials}</span>`;
}

/** Short benefit lines — kept in sync with `providerBenefitText()` in `media/station.js`. */
const LOCAL_UI_BRAND_ICON_KEYS = new Set([
  'authjs',
  'clerk',
  'github',
  'posthog',
  'resend',
  'sentry',
  'stripe',
  'supabase',
  'upstash',
  'vercel'
]);

export function providerRailLogoHtml(
  providerOrLabel: string | undefined,
  labelFallback?: string,
  ...moreCandidates: Array<string | undefined>
): string {
  const key =
    resolveProviderLogoKey(providerOrLabel, labelFallback, ...moreCandidates) ||
    normalizeProviderKey(providerOrLabel);
  const iconUrl = key && LOCAL_UI_BRAND_ICON_KEYS.has(key) ? PROVIDER_ICON_URLS[key] : undefined;
  if (iconUrl) {
    return providerIconImgHtml(iconUrl, key);
  }
  return providerLogoHtml(providerOrLabel, labelFallback, ...moreCandidates);
}

export const PROVIDER_BENEFITS: Record<string, string> = {
  supabase: 'Best when you want auth, data, and storage in one stack.',
  clerk: 'Fastest managed auth path with clean session primitives.',
  authjs: 'Best when you want framework-owned auth and full control.',
  neon: 'Good serverless Postgres fit for Vercel-style apps.',
  planetscale: 'Good fit for branching MySQL workflows.',
  mongodb: 'Good when the app already models document data.',
  turso: 'Good edge SQLite option for lightweight apps.',
  stripe: 'Best supported global payment ecosystem.',
  paddle: 'Handles merchant-of-record subscription operations.',
  polar: 'MoR billing built for developers shipping SaaS.',
  'lemon-squeezy': 'Sell digital products and subscriptions with less setup.',
  github: 'Best for GitHub Actions CI and required PR checks.',
  gitlab: 'Best for GitLab CI pipelines and merge gates.',
  vercel: 'Best fit for preview deploys, envs, and domains.',
  netlify: 'Good fit for static and serverless deploy workflows.',
  render: 'Good fit for simple web services and background jobs.',
  railway: 'Good fit for fast deploy loops and managed infra.',
  cloudflare: 'Good fit for Pages, Workers, DNS, and edge stack.',
  aws: 'Best when the app needs direct cloud infrastructure control.',
  sentry: 'Best first choice for production errors and traces.',
  posthog: 'Best for product analytics and funnel verification.',
  auth0: 'Enterprise identity with rules, MFA, and social login.',
  firebase: 'Good fit when auth, Firestore, and hosting stay in one Google stack.',
  'better-auth': 'Type-safe auth you own in your codebase.',
  playwright: 'Best for browser-flow verification and UI regression checks.',
  logrocket: 'Best when session replay is the missing evidence.',
  'rate-limit': 'Protects API routes from abuse and retry loops.',
  'bot-protection': 'Adds bot screening before expensive flows.',
  'secrets-hygiene': 'Hardens env handling and secret exposure risk.',
  figma: 'Best for screen flows, handoff, and UX alignment.',
  storybook: 'Best for proving component states before production.',
  react: 'Best fit for common component UI and app-router projects.',
  vue: 'Good fit for Vue or Nuxt product interfaces.',
  svelte: 'Good fit for SvelteKit route-first apps.',
  angular: 'Good fit for structured enterprise frontend workflows.',
  nodejs: 'Best fit for JavaScript API routes and server behavior.',
  python: 'Good fit for FastAPI-style APIs and typed validation.',
  rails: 'Good fit for full-stack CRUD and convention-heavy APIs.',
  go: 'Good fit for lean, fast HTTP services.',
  vitest: 'Fast unit and integration tests for modern JS apps.',
  'testing-library': 'User-centric component testing primitives.'
};

export function providerBenefitText(providerOrLabel: string | undefined, fallback?: string): string {
  const key = normalizeProviderKey(providerOrLabel);
  return (key && PROVIDER_BENEFITS[key]) || fallback || 'Useful path for this section.';
}

/** Embedded in static report for client-side provider tiles. */
export function providerLogosPayloadJson(): string {
  return JSON.stringify({
    logos: PROVIDER_LOGOS,
    iconUrls: PROVIDER_ICON_URLS,
    assetUrls: providerAssetUrls(),
    inlineOnly: [...INLINE_ONLY_LOGO_KEYS],
    aliases: ALIASES,
    benefits: PROVIDER_BENEFITS,
    brandKeys: [...BRAND_LOGO_KEYS]
  }).replace(/</g, '\\u003c');
}
