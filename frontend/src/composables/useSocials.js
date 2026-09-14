import { computed } from 'vue'

/**
 * Single source of truth for social/contact links and their SVG icon paths.
 * Both the home hero (HeroSection) and the public footer (App.vue) render the
 * same socials — before this module those icon paths and fallback URLs were
 * duplicated across both files, so a change to one could drift from the other.
 */

export const REF_URLS = {
  linkedin: 'https://linkedin.com/in/tefera-alagaw-a95073230',
  github: 'https://github.com/Tefe-Ala',
  email: 'tefe7ala@gmail.com',
  location: 'Kombolcha, Ethiopia',
  phone: '+251-932-242432',
}

/** Fill-style icon paths (footer + dense contexts). */
export const SOCIAL_PATHS = {
  linkedin:
    'M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z',
  github:
    'M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.05 10.05 0 0 0 22 12.25C22 6.58 17.52 2 12 2z',
  email:
    'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.4l8 5 8-5V6l-8 5-8-5z',
  telegram:
    'M21.9 4.6 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-.9.5l.3-4.6L18.3 6c.4-.3-.1-.5-.6-.2L7.3 12.3l-4.4-1.4c-1-.3-1-1 .2-1.4l17.2-6.6c.8-.3 1.5.2 1.6 1.7z',
  pin: 'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z',
  phone:
    'M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.3 1z',
  emailStroke:
    'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 7L4.5 6.2M12 11l7.5-4.8',
}

/** Keys rendered with a stroke style (open outlines) rather than filled. */
export const STROKE_ICONS = ['email']

/**
 * Build the ordered social links for a profile object (may be null when the
 * profile hasn't loaded yet — fallbacks keep the UI populated).
 * Returns [{ key, label, href, path }].
 */
export function useSocials(profile) {
  return computed(() => {
    const p = profile?.value ?? profile ?? {}
    return [
      { key: 'linkedin', label: 'LinkedIn', href: p.linkedin || REF_URLS.linkedin, path: SOCIAL_PATHS.linkedin },
      { key: 'github', label: 'GitHub', href: p.github || REF_URLS.github, path: SOCIAL_PATHS.github },
      {
        key: 'email',
        label: 'Email',
        href: p.email_public ? `mailto:${p.email_public}` : `mailto:${REF_URLS.email}`,
        path: SOCIAL_PATHS.email,
      },
      ...(p.whatsapp ? [{ key: 'telegram', label: 'Telegram', href: p.whatsapp, path: SOCIAL_PATHS.telegram }] : []),
    ]
  })
}
