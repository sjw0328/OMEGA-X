(() => {
  const t = localStorage.getItem('omx_theme');
  const dark = t ? t === 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeBtn');
    if (btn) btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark';
      if (cur) document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('omx_theme', cur ? 'light' : 'dark');
    });
  });

  /* ===== 최신 릴리스 EXE 자동 다운로드 =====
     a[data-dl-latest] 클릭 시 GitHub API로 최신 릴리스를 조회해
     .exe 자산을 찾아 받게 한다. 실패 시 href(릴리스 페이지)로 폴백. */
  const REPO = 'sjw0328/Lite';
  let _latestUrl = null; // 세션 내 캐시

  async function resolveLatestAsset() {
    if (_latestUrl) return _latestUrl;
    const r = await fetch('https://api.github.com/repos/' + REPO + '/releases/latest', {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!r.ok) throw new Error('release fetch failed: ' + r.status);
    const data = await r.json();
    const assets = Array.isArray(data.assets) ? data.assets : [];
    // 가장 최신 릴리스의 .exe → 없으면 .msi → .zip 순으로 폴백
    const pick = assets.find(a => /\.exe$/i.test(a.name))
              || assets.find(a => /\.msi$/i.test(a.name))
              || assets.find(a => /\.zip$/i.test(a.name));
    if (!pick || !pick.browser_download_url) throw new Error('no downloadable asset');
    _latestUrl = pick.browser_download_url;
    return _latestUrl;
  }

  document.addEventListener('click', async (e) => {
    const a = e.target.closest && e.target.closest('a[data-dl-latest]');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.dlBusy) return;
    a.dataset.dlBusy = '1';
    const fallback = a.getAttribute('href'); // 릴리스 페이지
    try {
      const url = await resolveLatestAsset();
      window.location.href = url;
    } catch (err) {
      // API 실패(레이트리밋·네트워크 등) → 릴리스 페이지로 안전 폴백
      window.location.href = fallback;
    } finally {
      delete a.dataset.dlBusy;
    }
  });
})();
