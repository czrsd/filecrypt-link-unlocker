export function initializeInteractions() {
  const dialog = document.getElementById('screenshot-dialog');
  let previousOverflow = null;
  let previousFocus = null;

  function restoreScroll() {
    if (previousOverflow !== null) {
      document.body.style.overflow = previousOverflow;
      previousOverflow = null;
    }
    previousFocus?.focus({ preventScroll: true });
    previousFocus = null;
  }

  function revealAnswer(hash = window.location.hash) {
    const target = document.getElementById(hash.slice(1));
    if (target?.matches('details')) {
      target.open = true;
      target.scrollIntoView({ block: 'start' });
    }
  }

  function onHashChange() { revealAnswer(); }

  function onClick(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.target.closest('[data-preview-trigger]') && dialog?.showModal) {
      event.preventDefault();
      if (dialog.open) return;
      const image = dialog.querySelector('[data-preview-image]');
      if (!image.hasAttribute('src')) image.src = image.dataset.src;
      previousFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else if (event.target.closest('[data-preview-close]') || event.target === dialog) {
      dialog.close();
    } else {
      const link = event.target.closest('a[href^="#"]');
      if (link) revealAnswer(link.getAttribute('href'));
    }
  }

  document.addEventListener('click', onClick);
  window.addEventListener('hashchange', onHashChange);
  dialog?.addEventListener('close', restoreScroll);
  revealAnswer();

  return () => {
    document.removeEventListener('click', onClick);
    window.removeEventListener('hashchange', onHashChange);
    dialog?.removeEventListener('close', restoreScroll);
    if (dialog?.open) dialog.close();
    if (previousOverflow !== null) restoreScroll();
  };
}
