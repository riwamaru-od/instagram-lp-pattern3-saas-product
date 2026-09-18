/* ================================================================
   main.js ／ パターン3
   ----------------------------------------------------------------
   [レクチャー] LPのJSは「無くても読める」ことが大前提。
   ここで書くのは体験を良くする上乗せ（プログレッシブエンハンスメント）だけ。
   ライブラリは使わず、標準APIで完結させている。
   ================================================================ */
(() => {
  'use strict';

  /* ------------------------------------------------------------
     1. ハンバーガーメニュー
     aria-expanded を必ず同期させる。見た目だけ変えるのはNG。
     ------------------------------------------------------------ */
  const navToggle = document.getElementById('navToggle');
  const gnav = document.getElementById('gnav');

  if (navToggle && gnav) {
    const closeNav = () => {
      gnav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'メニューを開く');
    };

    navToggle.addEventListener('click', () => {
      const isOpen = gnav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
    });

    // メニュー内のリンクを押したら閉じる
    gnav.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeNav();
    });

    // Escキーで閉じる（キーボード操作への配慮）
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ------------------------------------------------------------
     2. スクロール連動フェードイン
     scrollイベントで毎回計算すると重い。IntersectionObserverを使う。
     ------------------------------------------------------------ */
  const revealTargets = document.querySelectorAll('.js-reveal');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced || !('IntersectionObserver' in window)) {
    // アニメーションを望まないユーザー／非対応ブラウザには即表示
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // 一度出したら監視を外す＝無駄な処理をしない
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    revealTargets.forEach((el, i) => {
      // 同じ行に並ぶ要素を少しずつ遅らせて、順に現れる印象をつくる
      el.style.transitionDelay = `${Math.min(i % 4, 3) * 80}ms`;
      revealObserver.observe(el);
    });

    /* [レクチャー] 保険（フェイルセーフ）
       「初期状態を非表示にするアニメーション」は、観測が何らかの理由で
       動かなかった瞬間にコンテンツが永久に読めなくなる。
       LPでそれは売上の損失に直結するので、必ず逃げ道を用意しておく。 */
    window.setTimeout(() => {
      if (document.querySelectorAll('.js-reveal.is-visible').length === 0) {
        revealTargets.forEach((el) => {
          el.style.transitionDelay = '0ms';
          el.classList.add('is-visible');
        });
      }
    }, 2500);
  }

  /* ------------------------------------------------------------
     3. モバイル追従CTA
     ファーストビューを抜けたら出す。最終CTAに重なったら引っ込める。
     ------------------------------------------------------------ */
  const stickyCta = document.getElementById('stickyCta');
  const hero = document.getElementById('top');
  const finalCta = document.getElementById('contact');

  if (stickyCta && hero) {
    stickyCta.hidden = false;
    const sync = () => {
      const pastHero = hero.getBoundingClientRect().bottom < 0;
      const atFinal = finalCta ? finalCta.getBoundingClientRect().top < window.innerHeight : false;
      stickyCta.classList.toggle('is-visible', pastHero && !atFinal);
    };

    /* [レクチャー] scrollイベントは1スクロールで何十回も飛んでくる。
       そのたびにレイアウト計算をすると描画が詰まるので、
       requestAnimationFrame で1フレームに1回へ間引く（スロットリング）。 */
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => { sync(); ticking = false; });
    }, { passive: true });

    window.addEventListener('resize', sync, { passive: true });
    sync();
  }

  /* ------------------------------------------------------------
     4. ヘッダー分の余白を確保したページ内スクロール
     sticky headerがあると、アンカー遷移で見出しが隠れる。
     CSSの scroll-margin-top で解決する（JSでの座標計算は不要）。
     ------------------------------------------------------------ */
  const header = document.getElementById('siteHeader');
  const applyScrollMargin = () => {
    const h = header ? header.offsetHeight : 0;
    document.querySelectorAll('[id]').forEach((el) => {
      el.style.scrollMarginTop = `${h + 16}px`;
    });
  };
  applyScrollMargin();
  window.addEventListener('resize', applyScrollMargin, { passive: true });

  /* ------------------------------------------------------------
     5. CVポイントの計測フック
     data-cv 属性を付けたリンクのクリックを計測ツールへ送る。
     [レクチャー] 「どのボタンが押されたか」を分けて取らないと、
     LPは改善できない。実装時にGA4等へ差し替える。
     ------------------------------------------------------------ */
  document.querySelectorAll('[data-cv]').forEach((el) => {
    el.addEventListener('click', () => {
      const label = el.dataset.cv;
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'cta_click', { cta_position: label });
      }
      // 開発中の確認用（本番では削除する）
      console.info('[CV] cta_click:', label);
    });
  });
})();
