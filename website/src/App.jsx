import { useEffect } from 'react';
import { Copy, FileDown, FolderGit2 as Github, MousePointer2, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initializeInteractions } from './interactions';

const REPO = 'https://github.com/czrsd/filecrypt-link-unlocker';
const INSTALL = 'https://greasyfork.org/en/scripts/548711-filecrypt-link-unlocker';
const PREVIEW_IMAGE = '/filecrypt-preview.webp';

function Icon({ icon: IconComponent, className = '', ...props }) {
  return <IconComponent aria-hidden="true" className={className} strokeWidth={1.75} {...props} />;
}

function ScreenshotPreview() {
  return (
    <figure className="screenshot-preview min-w-0" data-nosnippet>
      <a href={PREVIEW_IMAGE} data-preview-trigger className="screenshot-trigger" aria-label="Enlarge FileCrypt Link Unlocker screenshot" aria-haspopup="dialog" aria-controls="screenshot-dialog">
        <img src="/filecrypt-preview-512.webp" srcSet="/filecrypt-preview-512.webp 512w, /filecrypt-preview.webp 991w" sizes="(min-width: 1136px) 512px, (min-width: 1024px) calc((100vw - 112px) / 2), (min-width: 560px) 512px, (max-width: 480px) calc(100vw - 32px), calc(100vw - 48px)" width="991" height="1065" fetchPriority="high" decoding="async" alt="FileCrypt Link Unlocker displaying extracted download links with Copy all links and Export .txt controls." className="screenshot-thumbnail" />
      </a>
      <dialog id="screenshot-dialog" className="screenshot-lightbox" aria-labelledby="preview-title">
        <div className="lightbox-content">
          <div className="lightbox-toolbar"><h2 id="preview-title" className="text-sm font-medium">Script preview</h2><Button variant="ghost" size="sm" data-preview-close autoFocus aria-label="Close screenshot">Close <span aria-hidden="true">×</span></Button></div>
          <img data-preview-image data-src={PREVIEW_IMAGE} width="991" height="1065" decoding="async" alt="Full-size screenshot of FileCrypt Link Unlocker on a FileCrypt container page." className="lightbox-image" />
        </div>
      </dialog>
    </figure>
  );
}

const questions = [
  ['Which FileCrypt domains are supported?', <>The userscript is configured for container pages on filecrypt.cc, filecrypt.to, and filecrypt.co.</>],
  ['Can I extract Rapidgator or Ddownload links?', <>If Filecrypt exposes those links through supported Click’n’Load data or link pages, they can appear in the list. You still download from the original host.</>],
  ['Does it bypass CAPTCHAs or passwords?', <>No. Complete any CAPTCHA or password prompt first. The script needs access to the container’s supported link data. DLC-only containers cannot be decrypted by this script.</>],
  ['Does this unlock premium downloads?', <>No. You get the original filehost links. The host’s account requirements, download limits, and waiting times still apply.</>],
  ['Nothing shows up. What should I check?', <>Check that your userscript manager and this script are enabled, then reload the container page. In Chrome, also check that the extension is allowed to run userscripts. Look for the panel near the buttons or floating at the bottom. Complete any page prompts, then use Retry. Export diagnostics if it still fails, and <a className="inline-link" href={`${REPO}/issues`}>report it on GitHub</a>.</>],
];

export default function App() {
  useEffect(initializeInteractions, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="border-b border-border/70">
        <div className="site-header-inner page-width flex min-h-20 items-center justify-between gap-6">
          <a href="#" className="flex items-center gap-2.5 font-semibold" aria-label="FileCrypt Link Unlocker home"><img src="/filecrypt-link-unlocker-32.webp" srcSet="/filecrypt-link-unlocker-32.webp 1x, /filecrypt-link-unlocker.webp 2x" width="32" height="32" decoding="async" fetchPriority="low" alt="" className="size-8 object-contain" /><span>FileCrypt Link Unlocker</span></a>
          <nav aria-label="Main navigation" className="flex items-center gap-5 text-sm text-muted-foreground sm:gap-7">
            <a href="#features" className="hidden hover:text-foreground sm:inline">Features</a>
            <a href="#install" className="hover:text-foreground">Install</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <a href={REPO} className="text-foreground" aria-label="View source on GitHub"><Icon icon={Github} className="size-5" /></a>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="page-width grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title" className="text-4xl font-semibold leading-tight sm:text-5xl">FileCrypt link extractor.<br /><span className="text-muted-foreground">Straight to your links.</span></h1>
            <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">Turn a FileCrypt container into a list of original download links, right on the page. Pick one link or grab the whole pack and get on with it.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="hero-cta"><a href={INSTALL}><Icon icon={Puzzle} />Install userscript</a></Button>
              <Button asChild variant="outline" size="lg" className="hero-cta"><a href={REPO}><Icon icon={Github} />View on GitHub</a></Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Free and open source. A userscript manager is required.</p>
          </div>
          <ScreenshotPreview />
        </section>

        <section id="features" aria-labelledby="features-title" className="page-width scroll-mt-8 border-t border-border py-12 sm:py-14">
          <h2 id="features-title" className="mb-9 text-2xl font-semibold">Links, without the busywork.</h2>
          <div className="grid gap-9 sm:grid-cols-3 sm:gap-8">
            <article className="feature-item"><Icon icon={Copy} className="mb-4 size-6 text-primary" /><h3 className="font-semibold">Grab the whole lot.</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Copy every link in one go, then toss them into JDownloader. No copying one part at a time.</p></article>
            <article className="feature-item"><Icon icon={FileDown} className="mb-4 size-6 text-primary" /><h3 className="font-semibold">Save it for later.</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Export the links as a little .txt file. Handy to stash away for next time.</p></article>
            <article className="feature-item"><Icon icon={MousePointer2} className="mb-4 size-6 text-primary" /><h3 className="font-semibold">It pops right up.</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Compatible containers show their links on the page. If the normal button area is missing, the panel floats at the bottom.</p></article>
          </div>
        </section>

        <section id="install" aria-labelledby="install-title" className="border-y border-border bg-card">
          <div className="page-width grid gap-10 py-12 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div><h2 id="install-title" className="text-2xl font-semibold">Install the FileCrypt userscript.</h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Already have Tampermonkey or Violentmonkey? You can skip straight to step two.</p></div>
            <ol className="space-y-7">
              <li className="flex gap-5"><span className="pt-0.5 text-sm text-primary" aria-hidden="true">01</span><div><h3 className="font-medium">Get a userscript manager</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Install <a className="inline-link" href="https://www.tampermonkey.net/">Tampermonkey</a> or <a className="inline-link" href="https://violentmonkey.github.io/">Violentmonkey</a> for your browser.</p></div></li>
              <li className="flex gap-5"><span className="pt-0.5 text-sm text-primary" aria-hidden="true">02</span><div><h3 className="font-medium"><a className="inline-link" href={INSTALL}>Install FileCrypt Link Unlocker</a></h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Open the Greasy Fork page, choose “Install this script,” and confirm in your extension.</p></div></li>
              <li className="flex gap-5"><span className="pt-0.5 text-sm text-primary" aria-hidden="true">03</span><div><h3 className="font-medium">Open a FileCrypt container</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Your link list shows up on the container page.</p></div></li>
            </ol>
          </div>
        </section>

        <section id="faq" aria-labelledby="faq-title" className="page-width grid gap-7 py-12 sm:py-14">
          <div><h2 id="faq-title" className="text-2xl font-semibold">FileCrypt bypass: what to expect.</h2></div>
          <div className="min-w-0">
            {questions.map(([question, answer]) => (
              <details className="faq-item border-b border-border" key={question}>
                <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-left font-medium transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{question}<span aria-hidden="true" className="faq-toggle text-xl text-muted-foreground">+</span></summary>
                <div className="pb-5 text-sm leading-relaxed text-muted-foreground">{answer}</div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="page-width flex flex-wrap items-center justify-between gap-4 py-7 text-sm text-muted-foreground"><p className="flex items-center gap-2">Made by <a className="hover:text-foreground" href="https://github.com/czrsd" target='_blank'>Cursed</a></p><div className="flex gap-6"><a className="hover:text-foreground" href={`${INSTALL}/feedback`} target='_blank'>Give feedback</a><a className="hover:text-foreground" href={`${REPO}/issues`}>Report an issue</a><a className="hover:text-foreground" href={REPO} target='_blank'>Source code</a></div></div>
      </footer>
    </>
  );
}
