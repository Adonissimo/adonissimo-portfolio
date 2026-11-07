export const themeKey = 'lorenz-hyrule-theme';
export type Theme = 'night' | 'day';

export function validTheme(value: unknown): value is Theme {
  return value === 'day' || value === 'night';
}

// A fixed, trusted bootstrap prevents a stored-theme flash before React hydrates.
export const themeBootstrap = `(function(){document.documentElement.classList.add('has-js');try{var t=localStorage.getItem('${themeKey}');if(t==='day'||t==='night')document.documentElement.dataset.theme=t}catch(e){}})();`;

export function themeSnapshot(): Theme {
  if (typeof document === 'undefined') return 'night';
  const value = document.documentElement.dataset.theme;
  return validTheme(value) ? value : 'night';
}

export function serverThemeSnapshot(): Theme {
  return 'night';
}

export function subscribeTheme(notify: () => void): () => void {
  const stored = (event: StorageEvent) => {
    if (event.key === themeKey && validTheme(event.newValue)) {
      document.documentElement.dataset.theme = event.newValue;
      notify();
    }
  };
  window.addEventListener('hyrule-theme-change', notify);
  window.addEventListener('storage', stored);
  return () => {
    window.removeEventListener('hyrule-theme-change', notify);
    window.removeEventListener('storage', stored);
  };
}
