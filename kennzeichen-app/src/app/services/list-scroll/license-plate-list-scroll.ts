const STICKY_HEADER_OFFSET = 253;
const DOUBLE_CLICK_MS = 300;
const SCROLL_LOCK_MS = 600;

export interface ListScrollHost {
  listContainer?: { nativeElement: HTMLElement };
  isScrolling: boolean;
  lastClickTime: number;
  clickTimeout: ReturnType<typeof setTimeout> | null;
}

export function updateBackToTopVisibility(): boolean {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  return scrollTop > 500;
}

export function scrollToTopButton(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getSections(host: ListScrollHost): HTMLElement[] {
  const container = host.listContainer?.nativeElement;
  if (!container) return [];
  return Array.from(container.querySelectorAll('.group')) as HTMLElement[];
}

export function getCurrentSectionIndex(host: ListScrollHost): number {
  const sections = getSections(host);
  if (!sections.length) return 0;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  let currentIndex = 0;

  for (let i = sections.length - 1; i >= 0; i--) {
    const rect = sections[i].getBoundingClientRect();
    const absoluteTop = rect.top + scrollTop;

    if (absoluteTop <= scrollTop + STICKY_HEADER_OFFSET + 50) {
      currentIndex = i;
      break;
    }
  }

  return currentIndex;
}

function scrollToSection(section: HTMLElement): void {
  const rect = section.getBoundingClientRect();
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const absoluteTop = rect.top + scrollTop;

  window.scrollTo({
    top: absoluteTop - STICKY_HEADER_OFFSET,
    behavior: 'smooth',
  });
}

function scrollToTop(host: ListScrollHost): void {
  host.isScrolling = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => {
    host.isScrolling = false;
  }, SCROLL_LOCK_MS);
}

function scrollToBottom(host: ListScrollHost): void {
  host.isScrolling = true;
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  );
  window.scrollTo({ top: documentHeight, behavior: 'smooth' });
  setTimeout(() => {
    host.isScrolling = false;
  }, SCROLL_LOCK_MS);
}

function scrollToSectionLocked(host: ListScrollHost, section: HTMLElement): void {
  host.isScrolling = true;
  scrollToSection(section);
  setTimeout(() => {
    host.isScrolling = false;
  }, SCROLL_LOCK_MS);
}

export function scrollToNextSection(host: ListScrollHost): void {
  if (host.isScrolling) return;

  const now = Date.now();
  const timeSinceLastClick = now - host.lastClickTime;

  if (timeSinceLastClick < DOUBLE_CLICK_MS) {
    if (host.clickTimeout) clearTimeout(host.clickTimeout);
    scrollToBottom(host);
    host.lastClickTime = 0;
    return;
  }

  host.lastClickTime = now;

  host.clickTimeout = setTimeout(() => {
    const sections = getSections(host);
    const currentIndex = getCurrentSectionIndex(host);

    if (currentIndex < sections.length - 1) {
      scrollToSectionLocked(host, sections[currentIndex + 1]);
    }
  }, DOUBLE_CLICK_MS);
}

export function scrollToPreviousSection(host: ListScrollHost): void {
  if (host.isScrolling) return;

  const now = Date.now();
  const timeSinceLastClick = now - host.lastClickTime;

  if (timeSinceLastClick < DOUBLE_CLICK_MS) {
    if (host.clickTimeout) clearTimeout(host.clickTimeout);
    scrollToTop(host);
    host.lastClickTime = 0;
    return;
  }

  host.lastClickTime = now;

  host.clickTimeout = setTimeout(() => {
    const sections = getSections(host);
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const currentIndex = getCurrentSectionIndex(host);
    const currentSection = sections[currentIndex];
    const rect = currentSection.getBoundingClientRect();
    const absoluteTop = rect.top + scrollTop;

    if (absoluteTop < scrollTop + STICKY_HEADER_OFFSET - 50) {
      scrollToSectionLocked(host, currentSection);
    } else if (currentIndex > 0) {
      scrollToSectionLocked(host, sections[currentIndex - 1]);
    }
  }, DOUBLE_CLICK_MS);
}

export function canScrollNext(host: ListScrollHost): boolean {
  const sections = getSections(host);
  if (sections.length <= 1) return false;
  return getCurrentSectionIndex(host) < sections.length - 1;
}

export function canScrollPrevious(host: ListScrollHost): boolean {
  const sections = getSections(host);
  if (sections.length <= 1) return false;
  return getCurrentSectionIndex(host) > 0;
}