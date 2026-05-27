import {
  getClawLogo,
  getIconDownload,
  getIconShield,
  getIconCpu,
  getIconZap,
  getIconGlobe,
  getIconTerminal,
  getIconMonitor,
  getIconLock,
  getIconPuzzle,
  getIconSmartphone,
  getIconLanguages,
} from './icons';
import {
  tSync,
  getCurrentLocale,
  setLocale,
  getDemosSync,
  getSupportedLocales,
  preloadAllLocales,
  type Locale
} from './i18n';

interface FeatureItem {
  icon: string;
  title: string;
  desc: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: getIconTerminal(),
    title: '自主执行任务',
    desc: '真正能自主干活的 AI 助手，独立分析、调用工具、输出结果，无需你时刻盯着。',
  },
  {
    icon: getIconLock(),
    title: '隐私优先，数据本地',
    desc: '所有数据存储在本地，不经云端中转。你的文件、对话、操作记录完全由你掌控。',
  },
  {
    icon: getIconGlobe(),
    title: '国产模型全支持',
    desc: '兼容通义千问、文心一言、Kimi、DeepSeek 等国产大模型，也支持 OpenAI、Claude 等海外模型。',
  },
  {
    icon: getIconPuzzle(),
    title: '全平台集成',
    desc: '无缝连接企业微信、飞书、钉钉等办公工具，打通工作流最后一公里。',
  },
  {
    icon: getIconMonitor(),
    title: '远程监控',
    desc: '通过手机助手，远程监控电脑端龙虾任务，第一手掌握龙虾一举一动。',
  },
  {
    icon: getIconCpu(),
    title: '智能体自动进化',
    desc: '集成 Claude Code 与 Hermes Agent，支持智能体自动进化，智能化能力全面升级。',
  },
];

interface ChannelItem {
  img: string;
  name: string;
}

const CHANNELS: ChannelItem[] = [
  { img: '/assets/swiper1-CezJ9WaC.png', name: '飞书' },
  { img: '/assets/swiper2-DsSH7pad.png', name: 'WhatsApp' },
  { img: '/assets/swiper3-CN2sfjm5.png', name: 'Telegram' },
  { img: '/assets/swiper4-A0AiQ6lt.png', name: 'Discord' },
  { img: '/assets/swiper5-D2Ftzx4E.png', name: 'Slack' },
  { img: '/assets/swiper6-BSu4L5z0.png', name: 'iMessage' },
  { img: '/assets/swiper7-BM8cpif4.png', name: 'Mattermost' },
  { img: '/assets/swiper8-GZRGy4Ez.png', name: 'Signal' },
  { img: '/assets/swiper9-64LbEE0X.png', name: '钉钉' },
  { img: '/assets/swiper10-BKnikVhF.png', name: '企业微信' },
];

type Platform = 'windows' | 'linux' | 'arm' | 'intel';

// ===== Platform Detection =====

function detectPlatform(): Platform {
  const platform = navigator.platform.toLowerCase();
  const ua = navigator.userAgent.toLowerCase();

  if (/linux/.test(platform) || /linux/.test(ua)) return 'linux';
  if (!(/mac/.test(platform) || /mac/.test(ua))) return 'windows';

  const oscpu = (navigator as unknown as { oscpu?: string }).oscpu?.toLowerCase() || '';
  if (/arm64|aarch64|apple silicon/.test(ua) || /arm64|aarch64/.test(oscpu)) return 'arm';

  // Try WebGL detection
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

// ===== App Init =====

export async function initApp(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) {
    console.error('App element not found');
    return;
  }

  const currentPlatform = detectPlatform();

  // Set initial language
  document.documentElement.lang = getCurrentLocale();

  // Preload locales for better performance
  await preloadAllLocales();

  renderApp(currentPlatform);
  setupInteractions(currentPlatform);
}

function renderApp(platform: Platform): void {
  const app = document.getElementById('app');
  if (!app) return;

  const platformLabel = getPlatformLabel(platform);
  const terminalDemos = getDemosSync();
  const currentLocale = getCurrentLocale();
  const supportedLocales = getSupportedLocales();

  app.innerHTML = `
    <div class="min-h-screen relative">
      <!-- Background decorative image placeholder (gradient overlay) -->
      <div class="fixed inset-0 pointer-events-none" style="background: radial-gradient(ellipse at 50% 0%, rgba(240,77,90,0.06) 0%, transparent 60%);"></div>

      <!-- ===== Navigation ===== -->
      <header class="nav-blur fixed top-0 left-0 right-0 z-50">
        <div class="container flex items-center justify-between" style="height: 65px;">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center" style="width:36px;height:36px;">
              <img src="/assets/logo.svg" alt="utechai-logo">
            </div>
            <span class="text-lg font-bold tracking-tight">UTECHAI</span>
          </div>
          <ul class="hidden sm:flex items-center gap-8 text-sm text-[#9CA3AF]">
            <li class="nav-link" data-scroll="main">${tSync('nav.home')}</li>
            <li class="nav-link" data-scroll="channel">${tSync('nav.channel')}</li>
            <li class="nav-link" data-scroll="features">${tSync('nav.features')}</li>
          </ul>
          <div class="flex items-center gap-4">
            <!-- Language Switcher Dropdown -->
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
            <button class="nav-download-btn" id="nav-download">${tSync('nav.download')}</button>
          </div>
        </div>
      </header>

      <!-- ===== Hero Section ===== -->
      <section class="main pt-[120px] pb-[100px]">
        <div class="container flex flex-col items-center">
          <!-- Tag pulse -->
          <div class="tag animate-fade-in-up">
            <div class="circle"></div>
            <span>${tSync('hero.tag')}</span>
          </div>

          <!-- Main Title -->
          <div class="animate-fade-in-up animate-delay-100 mt-8 flex items-center gap-4 flex-wrap justify-center">
            <img class="brand-logo" src="/openclaw.webp" alt="OpenClaw Logo" />
            <h1 class="hero-title">${tSync('hero.title')}</h1>
          </div>

          <!-- Subtitle -->
          <div class="animate-fade-in-up animate-delay-200 mt-4 text-center max-w-2xl px-4">
            <p class="text-[#9CA3AF] text-lg leading-relaxed">
              ${tSync('hero.subtitle')}
            </p>
          </div>

          <!-- Download CTA -->
          <div class="animate-fade-in-up animate-delay-300 flex flex-col items-center mt-8">
            <div class="download-btn" id="hero-download">
              ${getIconDownload()}
              <span>${tSync('hero.download', { platform: platformLabel })}</span>
            </div>
            <p class="text-[#9CA3AF] text-xs mt-4">${tSync('hero.support')}</p>
          </div>

          <!-- Terminal Demo -->
          <div class="animate-fade-in-up animate-delay-400 terminal-box">
            <div class="terminal-title">
              <div class="terminal-dots">
                <div></div><div></div><div></div>
              </div>
              <span>${tSync('terminal.title')}</span>
            </div>
            <ul class="terminal-tabs" id="terminal-tabs">
              ${terminalDemos.map((_, i) => `
                <li class="${i === 0 ? 'active' : ''}" data-tab="${i}">${tSync('terminal.tab', { number: i + 1 })}</li>
              `).join('')}
            </ul>
            <div class="terminal-content" id="terminal-content">
              <!-- Content injected by JS -->
            </div>
          </div>
        </div>
      </section>

      <!-- ===== Model Integration Section ===== -->
      <section class="model">
        <div class="title">${tSync('models.title', { count: 10 })}</div>
        <div class="imgAll">
          <img src="/assets/2x-DBIKywGK.png" alt="">
          <img src="/assets/2x-DVNXKV1m.png" alt="">
          <img src="/assets/2x-B-jYOJ6n.png" alt="">
          <img src="/assets/2x-DCl1iigS.png" alt="">
          <img src="/assets/2x-CpyfWUZa.png" alt="">
          <img src="/assets/2x-C3t4Ki5G.png" alt="">
          <img src="/assets/2x-BvUbJesF.png" alt="">
          <img src="/assets/2x-CImHEFYV.png" alt="">
          <img src="/assets/2x-zmYPPCEz.png" alt="">
          <img src="/assets/2x-B8CBD9_h.png" alt="">
        </div>
      </section>

      <!-- ===== Message Channel Section ===== -->
      <section class="messagechannel" id="channel-section">
        <div class="container">
          <div class="title">${tSync('channels.title')}</div>
          <div class="swiper_container">
            <ul class="swiper_box">
              ${CHANNELS.map(c => `
                <li>
                  <img src="${c.img}" alt="${c.name}">
                  <h3>${c.name}</h3>
                </li>
              `).join('')}
              ${CHANNELS.map(c => `
                <li>
                  <img src="${c.img}" alt="${c.name}">
                  <h3>${c.name}</h3>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </section>

      <!-- ===== Features Section ===== -->
      <section class="features py-[80px]" id="features-section" style="background-color: rgba(255,255,255,0.02);">
        <div class="container">
          <div class="flex flex-col items-center">
            <h2 class="text-2xl sm:text-[32px] font-bold">
              ${tSync('features.title')}
            </h2>
            <p class="text-[#9CA3AF] mt-2 text-base">${tSync('features.subtitle')}</p>
          </div>
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px] mt-[60px]">
            ${FEATURES.map((f, i) => `
              <li class="feature-card">
                <div class="icon-wrap">${f.icon}</div>
                <h3>${tSync(`features.items.${i}.title`)}</h3>
                <p>${tSync(`features.items.${i}.desc`)}</p>
              </li>
            `).join('')}
          </ul>
        </div>
      </section>

      <!-- ===== CTA Section ===== -->
      <section class="cta-section">
        <div class="container flex flex-col items-center justify-center">
          <h2 class="text-2xl sm:text-[36px] font-bold text-center">
            ${tSync('cta.title')}
          </h2>
          <p class="text-[#9CA3AF] text-center mt-4 max-w-[600px]">${tSync('cta.subtitle')}</p>
          <div class="download-btn mt-10" id="cta-download">
            ${getIconDownload()}
            <span>${tSync('cta.download')}</span>
          </div>
          <p class="text-[#9CA3AF] text-xs mt-4">${tSync('cta.free')}</p>
        </div>
      </section>

      <!-- ===== Footer ===== -->
      <footer>
        <div class="container flex flex-col items-center gap-2">
          <p class="text-[#6b7280] text-xs mt-1">${tSync('footer.copyright')}</p>
        </div>
      </footer>

    </div>
  `;
}

function setupInteractions(platform: Platform): void {
  setupLanguageSwitcher(platform);
  setupTerminalDemos();
  setupDownloadButtons(platform);
  setupSmoothScroll();
  setupScrollAnimations();
}

// ===== Language Switcher =====

function setupLanguageSwitcher(platform: Platform): void {
  const trigger = document.getElementById('lang-trigger');
  const menu = document.getElementById('lang-menu');
  const items = document.querySelectorAll<HTMLElement>('.lang-dropdown-item');

  if (!trigger || !menu) return;

  // Toggle dropdown
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    menu.classList.remove('open');
  });

  // Prevent closing when clicking inside menu
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Language change
  items.forEach(item => {
    item.addEventListener('click', () => {
      const newLang = item.dataset.lang as Locale;
      if (newLang && newLang !== getCurrentLocale()) {
        setLocale(newLang);

        // Update active state
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Close menu
        menu.classList.remove('open');

        // Re-render app with new language
        renderApp(platform);
        setupInteractions(platform);
      }
    });
  });
}

// ===== Terminal Demo Logic =====

let terminalTimer: ReturnType<typeof setInterval> | null = null;
let currentTab = 0;

function setupTerminalDemos(): void {
  renderTerminalContent(0);
  startTerminalAutoPlay();

  const tabs = document.querySelectorAll<HTMLElement>('#terminal-tabs li');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const index = parseInt(tab.dataset.tab || '0', 10);
      currentTab = index;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTerminalContent(index);
      stopTerminalAutoPlay();
      startTerminalAutoPlay();
    });
  });

  // Pause on hover
  const terminalBox = document.querySelector('.terminal-box');
  if (terminalBox) {
    terminalBox.addEventListener('mouseenter', stopTerminalAutoPlay);
    terminalBox.addEventListener('mouseleave', startTerminalAutoPlay);
  }
}

function renderTerminalContent(index: number): void {
  const terminalDemos = getDemosSync();
  const demo = terminalDemos[index];
  const content = document.getElementById('terminal-content');
  if (!content || !demo) return;

  content.innerHTML = `
    <div class="user-label">${tSync('terminal.userLabel')}</div>
    <div class="user-text">${demo.user}</div>
    <div class="ai-label">${tSync('terminal.aiLabel')}</div>
    <div class="think-text">${demo.think}</div>
    <div class="result-text">${demo.result}</div>
    <div class="time-label">${tSync('terminal.timeLabel', { time: demo.time })}</div>
  `;
}

function startTerminalAutoPlay(): void {
  stopTerminalAutoPlay();
  const terminalDemos = getDemosSync();
  terminalTimer = setInterval(() => {
    currentTab = (currentTab + 1) % terminalDemos.length;
    const tabs = document.querySelectorAll<HTMLElement>('#terminal-tabs li');
    tabs.forEach(t => t.classList.remove('active'));
    if (tabs[currentTab]) tabs[currentTab].classList.add('active');
    renderTerminalContent(currentTab);
  }, 4000);
}

function stopTerminalAutoPlay(): void {
  if (terminalTimer) {
    clearInterval(terminalTimer);
    terminalTimer = null;
  }
}

// ===== Download Buttons =====

function setupDownloadButtons(platform: Platform): void {
  const downloadUrl = getDownloadUrl(platform);

  const startDownload = (): void => {
    showDownloadToast(tSync('toast.preparing', { platform: getPlatformLabel(platform) }));
    setTimeout(() => {
      window.location.href = downloadUrl;
      showDownloadToast(tSync('toast.started', { platform: getPlatformLabel(platform) }), 'success');
    }, 800);
  };

  document.getElementById('nav-download')?.addEventListener('click', startDownload);
  document.getElementById('hero-download')?.addEventListener('click', startDownload);
  document.getElementById('cta-download')?.addEventListener('click', startDownload);
  document.getElementById('floating-download')?.addEventListener('click', startDownload);
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
    background: ${type === 'success' ? 'rgba(17,24,39,0.95)' : 'rgba(17,24,39,0.95)'};
    border: 1px solid ${type === 'success' ? 'rgba(255,77,77,0.4)' : 'rgba(255,255,255,0.1)'};
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  toast.innerHTML = `
    <span style="color: ${type === 'success' ? '#00E5CC' : '#F04D5A'}; font-size: 16px;">${type === 'success' ? '✓' : '⏳'}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== Smooth Scroll =====

function setupSmoothScroll(): void {
  document.querySelectorAll<HTMLElement>('.nav-link[data-scroll]').forEach(link => {
    link.addEventListener('click', () => {
      const target = link.dataset.scroll;
      if (!target) return;
      const selector = target === 'main' ? '.main' : `#${target}-section`;
      const el = document.querySelector(selector);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ===== Scroll Animations =====

function setupScrollAnimations(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll<HTMLElement>('#model-section h2, #model-section p, #channel-section .title, #features-section h2, #features-section p, .feature-card').forEach(el => {
    if (!el.classList.contains('animate-fade-in-up')) {
      el.style.opacity = '0';
      observer.observe(el);
    }
  });
}