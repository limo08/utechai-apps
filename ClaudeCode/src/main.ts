import {
  getIconTerminal,
  getIconCode2,
  getIconGitBranch,
  getIconPuzzle,
  getIconBrain,
  getIconZapFeature,
  getIconZapSmall,
  getIconCopy,
  getIconCheck,
  getIconChevronRight,
  getIconMonitor,
  getIconApple,
  getIconLaptop,
  getIconArrowDown,
  getIconVsCode,
  getIconJetBrains,
  getIconLanguages,
} from './icons';
import {
  tSync,
  tRaw,
  getCurrentLocale,
  setLocale,
  getSupportedLocales,
  preloadAllLocales,
  type Locale,
} from './i18n';

const NPM_INSTALL_CMD = 'npm install -g @anthropic-ai/claude-code';

type Platform = 'windows' | 'linux' | 'arm' | 'intel';

// ===== Platform Detection =====

function detectPlatform(): Platform {
  const platform = navigator.platform.toLowerCase();
  const ua = navigator.userAgent.toLowerCase();

  if (/linux/.test(platform) || /linux/.test(ua)) return 'linux';
  if (!(/mac/.test(platform) || /mac/.test(ua))) return 'windows';

  const oscpu = (navigator as unknown as { oscpu?: string }).oscpu?.toLowerCase() || '';
  if (/arm64|aarch64|apple silicon/.test(ua) || /arm64|aarch64/.test(oscpu)) return 'arm';

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo ? (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '').toLowerCase() : '';
      if (gl.getExtension('WEBGL_compressed_texture_astc')) return 'arm';
      if (/apple m|apple silicon/.test(renderer)) return 'arm';
    }
  } catch (_e) {
    // WebGL detection failed
  }

  return 'intel';
}

function getPlatformLabel(platform: Platform): string {
  switch (platform) {
    case 'windows': return 'Windows';
    case 'linux': return 'Linux';
    case 'arm': return 'macOS (Apple Silicon)';
    case 'intel': return 'macOS (Intel)';
  }
}

function getDownloadUrl(platform: Platform): string {
  return `/api/releases/download?platform=${platform}`;
}

let currentInstallTab = 'macos';
let _terminalAnimTimer: ReturnType<typeof setTimeout> | null = null;
let terminalVisibleLines = 0;

// ===== App Init =====

export async function initApp(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) {
    console.error('App element not found');
    return;
  }

  const currentPlatform = detectPlatform();

  document.documentElement.lang = getCurrentLocale();
  await preloadAllLocales();

  renderApp(currentPlatform);
  setupInteractions(currentPlatform);
}

// ===== Build Terminal Lines from i18n =====

function buildTerminalLines(): Array<{ type: string; text: string }> {
  return [
    { type: 'prompt', text: tSync('terminalLines.prompt1') },
    { type: 'output', text: '' },
    { type: 'header', text: tSync('terminalLines.header1') },
    { type: 'header', text: tSync('terminalLines.header2') },
    { type: 'header', text: tSync('terminalLines.header3') },
    { type: 'output', text: '' },
    { type: 'info', text: tSync('terminalLines.info1') },
    { type: 'info', text: tSync('terminalLines.info2') },
    { type: 'output', text: '' },
    { type: 'prompt', text: tSync('terminalLines.prompt2') },
    { type: 'output', text: '' },
    { type: 'action', text: tSync('terminalLines.action1') },
    { type: 'action', text: tSync('terminalLines.action2') },
    { type: 'success', text: tSync('terminalLines.success1') },
    { type: 'success', text: tSync('terminalLines.success2') },
    { type: 'action', text: tSync('terminalLines.action3') },
    { type: 'success', text: tSync('terminalLines.success3') },
  ];
}

function getInstallSteps(): Record<string, { prereq: string; install: string; verify: string }> {
  return {
    macos: {
      prereq: tSync('installCodes.macosPrereq'),
      install: tSync('installCodes.macosInstall'),
      verify: tSync('installCodes.macosVerify'),
    },
    linux: {
      prereq: tSync('installCodes.linuxPrereq'),
      install: tSync('installCodes.linuxInstall'),
      verify: tSync('installCodes.linuxVerify'),
    },
    windows: {
      prereq: tSync('installCodes.windowsPrereq'),
      install: tSync('installCodes.windowsInstall'),
      verify: tSync('installCodes.windowsVerify'),
    },
  };
}

// ===== Render App =====

function renderApp(platform: Platform): void {
  const app = document.getElementById('app');
  if (!app) return;

  const platformLabel = getPlatformLabel(platform);
  const currentLocale = getCurrentLocale();
  const supportedLocales = getSupportedLocales();

  app.innerHTML = `
    <div class="min-h-screen">

      <!-- ===== Navigation ===== -->
      <nav class="nav-bar" id="nav-bar">
        <div class="container" style="display:flex;align-items:center;justify-content:space-between;height:64px;">
          <div class="nav-logo">
            <img src="/logo.png" alt="UTECHAI">
            <span>ClaudeCode</span>
          </div>
          <div class="nav-links">
            <a href="#features">${tSync('nav.features')}</a>
            <a href="#install">${tSync('nav.install')}</a>
            <a href="#ide">${tSync('nav.ide')}</a>
          </div>
          <div style="display:flex;align-items:center;gap:16px;">
            <div class="language-dropdown">
              <button class="lang-dropdown-trigger" id="lang-trigger" aria-label="Change language">
                ${getIconLanguages()}
              </button>
              <div class="lang-dropdown-menu" id="lang-menu">
                ${supportedLocales.map(locale => `
                  <button class="lang-dropdown-item ${currentLocale === locale.code ? 'active' : ''}" data-lang="${locale.code}">
                    <span class="lang-item-flag">${locale.flag}</span>
                    <span class="lang-item-name">${locale.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>
            <button class="nav-download-btn" id="nav-download">${tSync('nav.download', { platform: platformLabel })}</button>
          </div>
        </div>
      </nav>

      <!-- ===== Hero Section ===== -->
      <section class="hero-glow" style="padding-top:128px;padding-bottom:80px;position:relative;overflow:hidden;">
        <div class="container" style="display:grid;align-items:center;gap:48px;grid-template-columns:1fr 1fr;">

          <!-- Left: Text -->
          <div>
            <div class="hero-tag" style="margin-bottom:24px;">
              ${getIconZapSmall()}
              <span>${tSync('hero.tag')}</span>
            </div>
            <h1 style="font-size:60px;font-weight:700;line-height:1.1;letter-spacing:-0.025em;color:var(--fg);margin-bottom:24px;">
              ${tSync('hero.title1')}<br><span class="gradient-text">${tSync('hero.title2')}</span>
            </h1>
            <p style="font-size:18px;line-height:1.75;color:var(--muted);max-width:480px;margin-bottom:32px;">
              ${tSync('hero.subtitle')}
            </p>
            <div style="display:flex;flex-direction:row;gap:16px;">
              <button id="hero-download" style="display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;background-color:var(--accent);padding:14px 24px;font-size:16px;font-weight:600;color:#fff;transition:all 0.3s;border:none;cursor:pointer;">
                ${getIconArrowDown()}
                ${tSync('hero.downloadBtn', { platform: platformLabel })}
              </button>
              <a href="https://docs.anthropic.com/en/docs/claude-code" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;border:1px solid var(--border-hover);background-color:rgba(255,255,255,0.04);padding:14px 24px;font-size:16px;font-weight:600;color:var(--fg);transition:all 0.3s;">
                ${tSync('hero.docBtn')} ${getIconChevronRight()}
              </a>
            </div>
            <!-- Quick install -->
            <div class="code-block" style="display:flex;align-items:center;gap:12px;border-radius:8px;padding:12px 16px;margin-top:32px;position:relative;">
              <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:var(--muted);">$</span>
              <code style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:var(--terminal-green);">${NPM_INSTALL_CMD}</code>
              <button class="copy-btn" data-copy="${NPM_INSTALL_CMD}">${getIconCopy()} ${tSync('copyBtn')}</button>
            </div>
          </div>

          <!-- Right: Terminal demo -->
          <div style="position:relative;">
            <div style="position:absolute;inset:-16px;border-radius:16px;background-color:rgba(212,112,78,0.05);filter:blur(32px);"></div>
            <div class="code-block terminal-box" id="terminal-demo" style="position:relative;">
              <div class="terminal-titlebar">
                <div class="terminal-dots"><div></div><div></div><div></div></div>
                <span class="terminal-titlebar-label">${tSync('terminal.titlebar')}</span>
              </div>
              <div class="terminal-content" id="terminal-content"></div>
            </div>
          </div>

        </div>
      </section>

      <!-- ===== Features Section ===== -->
      <section id="features" style="padding:96px 0;">
        <div class="container">
          <div style="text-align:center;margin-bottom:64px;">
            <h2 style="font-size:32px;font-weight:700;color:var(--fg);margin-bottom:16px;">${tSync('features.title')}</h2>
            <p style="font-size:18px;color:var(--muted);max-width:640px;margin:0 auto;">${tSync('features.subtitle')}</p>
          </div>
          <div style="display:grid;gap:24px;grid-template-columns:repeat(3,1fr);">
            ${[
              getIconBrain(),
              getIconCode2(),
              getIconGitBranch(),
              getIconTerminal(),
              getIconPuzzle(),
              getIconZapFeature(),
            ].map((icon, i) => `
              <div class="feature-card">
                <div class="feature-icon-wrap">${icon}</div>
                <h3 style="font-size:18px;font-weight:600;color:var(--fg);margin-bottom:8px;">${tSync(`features.items.${i}.title`)}</h3>
                <p style="font-size:14px;line-height:1.75;color:var(--muted);">${tSync(`features.items.${i}.desc`)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- ===== Install Section ===== -->
      <section id="install" style="padding:96px 0;background-color:rgba(22,33,62,0.3);">
        <div class="container" style="max-width:896px;">
          <div style="text-align:center;margin-bottom:64px;">
            <h2 style="font-size:32px;font-weight:700;color:var(--fg);margin-bottom:16px;">${tSync('install.title')}</h2>
            <p style="font-size:18px;color:var(--muted);max-width:640px;margin:0 auto;">${tSync('install.subtitle')}</p>
          </div>

          <div class="install-tabs" id="install-tabs">
            <button class="install-tab ${currentInstallTab === 'macos' ? 'active' : ''}" data-tab="macos">
              ${getIconApple()} ${tSync('install.tabMacos')}
            </button>
            <button class="install-tab ${currentInstallTab === 'linux' ? 'active' : ''}" data-tab="linux">
              ${getIconMonitor()} ${tSync('install.tabLinux')}
            </button>
            <button class="install-tab ${currentInstallTab === 'windows' ? 'active' : ''}" data-tab="windows">
              ${getIconLaptop()} ${tSync('install.tabWindows')}
            </button>
          </div>

          <div id="install-steps" style="display:flex;flex-direction:column;gap:24px;"></div>

          <div style="margin-top:48px;border-radius:12px;border:1px solid var(--border);background-color:rgba(26,26,46,0.4);padding:24px;">
            <h4 style="font-weight:600;color:var(--fg);margin-bottom:16px;">${tSync('install.requirementsTitle')}</h4>
            <div style="display:grid;gap:16px;grid-template-columns:repeat(3,1fr);">
              <div style="display:flex;align-items:start;gap:12px;">
                <div style="width:8px;height:8px;border-radius:50%;background-color:var(--terminal-green);margin-top:2px;flex-shrink:0;"></div>
                <div>
                  <p style="font-size:14px;font-weight:500;color:var(--fg);">${tSync('install.reqNode')}</p>
                  <p style="font-size:12px;color:var(--muted);">${tSync('install.reqNodeDesc')}</p>
                </div>
              </div>
              <div style="display:flex;align-items:start;gap:12px;">
                <div style="width:8px;height:8px;border-radius:50%;background-color:var(--terminal-green);margin-top:2px;flex-shrink:0;"></div>
                <div>
                  <p style="font-size:14px;font-weight:500;color:var(--fg);">${tSync('install.reqNpm')}</p>
                  <p style="font-size:12px;color:var(--muted);">${tSync('install.reqNpmDesc')}</p>
                </div>
              </div>
              <div style="display:flex;align-items:start;gap:12px;">
                <div style="width:8px;height:8px;border-radius:50%;background-color:var(--terminal-green);margin-top:2px;flex-shrink:0;"></div>
                <div>
                  <p style="font-size:14px;font-weight:500;color:var(--fg);">${tSync('install.reqClaude')}</p>
                  <p style="font-size:12px;color:var(--muted);">${tSync('install.reqClaudeDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== IDE Integration Section ===== -->
      <section id="ide" style="padding:96px 0;">
        <div class="container">
          <div style="text-align:center;margin-bottom:64px;">
            <h2 style="font-size:32px;font-weight:700;color:var(--fg);margin-bottom:16px;">${tSync('ide.title')}</h2>
            <p style="font-size:18px;color:var(--muted);max-width:640px;margin:0 auto;">${tSync('ide.subtitle')}</p>
          </div>

          <div style="display:grid;gap:32px;grid-template-columns:repeat(2,1fr);">
            <!-- VS Code -->
            <div class="ide-card">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
                <div class="ide-icon-wrap" style="background-color:rgba(0,122,204,0.15);">
                  ${getIconVsCode()}
                </div>
                <div>
                  <h3 style="font-size:20px;font-weight:700;color:var(--fg);">${tSync('ide.vscodeName')}</h3>
                  <p style="font-size:14px;color:var(--muted);">${tSync('ide.vscodeDesc')}</p>
                </div>
              </div>
              <p style="font-size:14px;line-height:1.75;color:var(--muted);margin-bottom:16px;">
                ${tSync('ide.vscodeText')}
              </p>
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
                ${(tRaw('ide.vscodeTags') as string[]).map(tag =>
                  `<span class="tag-pill">${tag}</span>`
                ).join('')}
              </div>
              <div class="code-block" style="position:relative;">
                <div class="code-block-title">${tSync('ide.vscodeFilename')}</div>
                <div class="code-block-content" style="position:relative;">
                  <button class="copy-btn" data-copy="${tSync('ide.vscodeCode')}">${getIconCopy()} ${tSync('copyBtn')}</button>
                  <pre style="overflow-x:auto;">${tSync('ide.vscodeCode')}</pre>
                </div>
              </div>
            </div>

            <!-- JetBrains -->
            <div class="ide-card">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
                <div class="ide-icon-wrap" style="background-color:rgba(252,128,29,0.15);">
                  ${getIconJetBrains()}
                </div>
                <div>
                  <h3 style="font-size:20px;font-weight:700;color:var(--fg);">${tSync('ide.jetbrainsName')}</h3>
                  <p style="font-size:14px;color:var(--muted);">${tSync('ide.jetbrainsDesc')}</p>
                </div>
              </div>
              <p style="font-size:14px;line-height:1.75;color:var(--muted);margin-bottom:16px;">
                ${tSync('ide.jetbrainsText')}
              </p>
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
                ${(tRaw('ide.jetbrainsTags') as string[]).map(tag =>
                  `<span class="tag-pill">${tag}</span>`
                ).join('')}
              </div>
              <div class="code-block" style="position:relative;">
                <div class="code-block-title">${tSync('ide.jetbrainsFilename')}</div>
                <div class="code-block-content" style="position:relative;">
                  <button class="copy-btn" data-copy="${tSync('ide.jetbrainsCode')}">${getIconCopy()} ${tSync('copyBtn')}</button>
                  <pre style="overflow-x:auto;">${tSync('ide.jetbrainsCode')}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== CTA Section ===== -->
      <section style="padding:96px 0;position:relative;overflow:hidden;background-color:rgba(22,33,62,0.5);">
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(212,112,78,0.08),transparent 70%);"></div>
        <div class="container" style="position:relative;max-width:768px;text-align:center;">
          <h2 style="font-size:32px;font-weight:700;color:var(--fg);margin-bottom:24px;">${tSync('cta.title')}</h2>
          <p style="font-size:18px;color:var(--muted);margin-bottom:40px;">${tSync('cta.subtitle')}</p>
          <div style="display:flex;flex-direction:column;align-items:center;gap:24px;">
            <button id="cta-download" style="display:flex;align-items:center;gap:8px;border-radius:12px;background-color:var(--accent);padding:16px 32px;font-size:18px;font-weight:600;color:#fff;transition:all 0.3s;border:none;cursor:pointer;">
              ${getIconArrowDown(20)}
              ${tSync('cta.downloadBtn', { platform: platformLabel })}
            </button>
          </div>
          <div class="code-block" style="display:flex;align-items:center;gap:12px;border-radius:8px;padding:12px 20px;margin-top:32px;position:relative;">
            <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:var(--muted);">$</span>
            <code style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:var(--terminal-green);">${NPM_INSTALL_CMD}</code>
            <button class="copy-btn" data-copy="${NPM_INSTALL_CMD}">${getIconCopy()} ${tSync('copyBtn')}</button>
          </div>
        </div>
      </section>

      <!-- ===== Footer ===== -->
      <footer style="border-top:1px solid var(--border);padding:48px 0;">
        <div class="container" style="display:flex;align-items:center;justify-content:center;">
          <p style="font-size:14px;color:var(--muted);">${tSync('footer.copyright')}</p>
        </div>
      </footer>

    </div>
  `;

  renderInstallSteps();
}

function renderInstallSteps(): void {
  const stepsEl = document.getElementById('install-steps');
  if (!stepsEl) return;

  const stepsData = getInstallSteps();
  const steps = stepsData[currentInstallTab];
  if (!steps) return;

  const stepItems = [
    { step: 1, title: tSync('install.step1Title'), code: steps.prereq, filename: tSync('install.step1Filename') },
    { step: 2, title: tSync('install.step2Title'), code: steps.install, filename: tSync('install.step2Filename') },
    { step: 3, title: tSync('install.step3Title'), code: steps.verify, filename: tSync('install.step3Filename') },
  ];

  stepsEl.innerHTML = stepItems.map(item => `
    <div style="display:flex;gap:16px;">
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div class="step-number">${item.step}</div>
        ${item.step < 3 ? '<div class="step-connector" style="flex:1;"></div>' : ''}
      </div>
      <div style="flex:1;">
        <h4 style="font-weight:600;color:var(--fg);margin-bottom:12px;">${item.title}</h4>
        <div class="code-block" style="position:relative;">
          <div class="code-block-title">${item.filename}</div>
          <div class="code-block-content" style="position:relative;">
            <button class="copy-btn" data-copy="${item.code}">${getIconCopy()} ${tSync('copyBtn')}</button>
            <pre style="overflow-x:auto;">${item.code}</pre>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  setupCopyButtons();
}

// ===== Interactions Setup =====

function setupInteractions(platform: Platform): void {
  setupLanguageSwitcher(platform);
  setupNavScroll();
  setupTerminalAnimation();
  setupInstallTabs();
  setupCopyButtons();
  setupSmoothScroll();
  setupScrollAnimations();
  setupDownloadButtons(platform);
}

// ===== Language Switcher =====

function setupLanguageSwitcher(platform: Platform): void {
  const trigger = document.getElementById('lang-trigger');
  const menu = document.getElementById('lang-menu');
  const items = document.querySelectorAll<HTMLElement>('.lang-dropdown-item');

  if (!trigger || !menu) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    menu.classList.remove('open');
  });

  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  items.forEach(item => {
    item.addEventListener('click', () => {
      const newLang = item.dataset.lang as Locale;
      if (newLang && newLang !== getCurrentLocale()) {
        setLocale(newLang);

        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        menu.classList.remove('open');

        renderApp(platform);
        setupInteractions(platform);
      }
    });
  });
}

function setupNavScroll(): void {
  const nav = document.getElementById('nav-bar');
  if (!nav) return;

  const handleScroll = (): void => {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

function setupTerminalAnimation(): void {
  terminalVisibleLines = 0;
  const contentEl = document.getElementById('terminal-content');
  if (!contentEl) return;

  contentEl.innerHTML = '';
  revealNextLine();
}

function revealNextLine(): void {
  const lines = buildTerminalLines();
  if (terminalVisibleLines >= lines.length) {
    const contentEl = document.getElementById('terminal-content');
    if (contentEl) {
      contentEl.innerHTML += `<div style="margin-top:4px;display:flex;align-items:center;color:var(--terminal-green);"><span>&gt; </span><span class="cursor-blink"></span></div>`;
    }
    return;
  }

  const line = lines[terminalVisibleLines];
  const contentEl = document.getElementById('terminal-content');
  if (!contentEl) return;

  const colorClass = `line-${line.type}`;
  contentEl.innerHTML += `<div class="${colorClass} fade-up">${line.text || '&nbsp;'}</div>`;

  terminalVisibleLines++;

  let delay: number;
  if (terminalVisibleLines === 1) {
    delay = 800;
  } else if (line.type === 'header') {
    delay = 120;
  } else {
    delay = 200;
  }

  _terminalAnimTimer = setTimeout(revealNextLine, delay);
}

function setupInstallTabs(): void {
  const tabs = document.querySelectorAll<HTMLElement>('.install-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      if (!tabId) return;

      currentInstallTab = tabId;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderInstallSteps();
    });
  });
}

function setupCopyButtons(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.copy-btn');
  buttons.forEach(btn => {
    const newBtn = btn.cloneNode(true) as HTMLButtonElement;
    btn.parentNode?.replaceChild(newBtn, btn);

    const copyText = newBtn.dataset.copy || '';
    newBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyText);
        newBtn.classList.add('copied');
        newBtn.innerHTML = `${getIconCheck()} ${tSync('copyBtnDone')}`;
        setTimeout(() => {
          newBtn.classList.remove('copied');
          newBtn.innerHTML = `${getIconCopy()} ${tSync('copyBtn')}`;
        }, 2000);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = copyText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        newBtn.classList.add('copied');
        newBtn.innerHTML = `${getIconCheck()} ${tSync('copyBtnDone')}`;
        setTimeout(() => {
          newBtn.classList.remove('copied');
          newBtn.innerHTML = `${getIconCopy()} ${tSync('copyBtn')}`;
        }, 2000);
      }
    });
  });
}

function setupSmoothScroll(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href');
      if (!targetId) return;
      const target = document.querySelector(targetId);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

function setupScrollAnimations(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-up');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  const targets = document.querySelectorAll<HTMLElement>('.feature-card, #features h2, #features p, #install h2, #install p, #ide h2, #ide p');
  targets.forEach(el => {
    if (!el.classList.contains('fade-up')) {
      el.style.opacity = '0';
      observer.observe(el);
    }
  });
}

// ===== Download Buttons =====

function setupDownloadButtons(platform: Platform): void {
  const downloadUrl = getDownloadUrl(platform);

  const startDownload = (): void => {
    showDownloadToast(tSync('toast.preparing', { platform: getPlatformLabel(platform) }));
    const link = document.createElement('a');
    link.href = downloadUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showDownloadToast(tSync('toast.started', { platform: getPlatformLabel(platform) }), 'success');
  };

  document.getElementById('nav-download')?.addEventListener('click', startDownload);
  document.getElementById('hero-download')?.addEventListener('click', startDownload);
  document.getElementById('cta-download')?.addEventListener('click', startDownload);
}

function showDownloadToast(message: string, type: 'info' | 'success' = 'info'): void {
  const existing = document.getElementById('download-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'download-toast';
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 9999;
    display: flex; align-items: center; gap: 10px; padding: 12px 24px; border-radius: 12px;
    font-size: 14px; font-weight: 500; color: #fff;
    background: rgba(17,24,39,0.95);
    border: 1px solid ${type === 'success' ? 'rgba(74,222,128,0.4)' : 'rgba(212,112,78,0.4)'};
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  toast.innerHTML = `
    <span style="color: ${type === 'success' ? 'var(--terminal-green)' : 'var(--accent)'}; font-size: 16px;">${type === 'success' ? '✓' : '⏳'}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}