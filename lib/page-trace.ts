/** Only public portfolio routes may supply a temporary, local page-turn texture. */
let cancelCapture: (() => void) | undefined;

export function cancelPageTrace(): void { cancelCapture?.(); }

export function canTracePage(pathname: string): boolean {
  return ['/', '/about', '/contact', '/projects', '/blog'].includes(pathname)
    || pathname.startsWith('/projects/') || pathname.startsWith('/blog/');
}

export async function capturePageTrace(compact: boolean): Promise<HTMLCanvasElement | null> {
  cancelPageTrace();
  if (!canTracePage(window.location.pathname)) return null;
  const main = document.querySelector('main');
  if (!main) return null;
  const width = document.documentElement.clientWidth;
  const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
  const top = Math.max(0, Math.min(window.innerHeight, header));
  const height = Math.max(1, window.innerHeight - top);
  const source = document.createElement('div');
  source.className = 'page-trace-source'; source.setAttribute('aria-hidden', 'true'); source.inert = true;
  Object.assign(source.style, { position: 'fixed', left: '-100000px', top: '0', width: `${width}px`, height: `${height}px`, overflow: 'hidden', opacity: '0', pointerEvents: 'none', background: getComputedStyle(document.body).backgroundColor });
  const computed = getComputedStyle(main);
  for (let index = 0; index < computed.length; index++) {
    const property = computed.item(index);
    if (property.startsWith('--')) source.style.setProperty(property, computed.getPropertyValue(property));
  }
  // Freeze the outgoing DOM synchronously, before routing can replace its content.
  const clone = main.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('form, input, textarea, select, [contenteditable], script, iframe, canvas, video, audio, [data-private]').forEach(node => node.remove());
  clone.querySelectorAll('[id], [data-three-ready], [autofocus]').forEach(node => {
    node.removeAttribute('id'); node.removeAttribute('data-three-ready'); node.removeAttribute('autofocus');
  });
  // A hidden second realm selector must not change the live page's :has() palette.
  clone.removeAttribute('id'); clone.removeAttribute('tabindex'); clone.removeAttribute('data-realm');
  clone.style.transform = `translateY(${main.getBoundingClientRect().top - top}px)`;
  clone.style.margin = '0'; clone.style.position = 'relative'; clone.style.zIndex = '1';
  const scenery = document.querySelector('.world-backdrop')?.cloneNode(true) as HTMLElement | undefined;
  if (scenery) { Object.assign(scenery.style, { position: 'absolute', inset: '0', zIndex: '0' }); source.append(scenery); }
  source.append(clone); document.body.append(source);
  const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  clone.querySelectorAll<HTMLImageElement>('img').forEach(image => {
    const box = image.getBoundingClientRect();
    if (box.bottom < 0 || box.top > height) { image.removeAttribute('srcset'); image.removeAttribute('sizes'); image.src = placeholder; }
  });
  const ratio = Math.min(1, Math.sqrt((compact ? 420_000 : 1_200_000) / (width * height)));
  const abort = new AbortController();
  let cancel: () => void = () => undefined;
  const cancelled = new Promise<null>(resolve => { cancel = () => { abort.abort(); source.remove(); resolve(null); }; });
  cancelCapture = cancel;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<null>(resolve => { timer = setTimeout(() => { abort.abort(); resolve(null); }, 550); });
    const capture = import('html-to-image').then(({ toCanvas }) => toCanvas(source, {
      width, height, canvasWidth: Math.max(1, Math.floor(width * ratio)), canvasHeight: Math.max(1, Math.floor(height * ratio)), pixelRatio: 1,
      preferredFontFormat: 'woff', fetchRequestInit: { signal: abort.signal },
      imagePlaceholder: placeholder,
      style: { position: 'relative', left: '0', top: '0', opacity: '1', transform: 'none' }
    })).catch(() => null);
    return await Promise.race([capture, deadline, cancelled]);
  } finally { if (cancelCapture === cancel) cancelCapture = undefined; if (timer) clearTimeout(timer); abort.abort(); source.remove(); }
}
