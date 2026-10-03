/* =========================================================
   E-LEAP U1.2 Private Image Resolver v1.0
   Resolves private Blob images without changing lesson engine.
   ========================================================= */

(function () {
  'use strict';

  const LESSON_PREFIX = 'u01/l02/';

  let mediaMap = null;
  let loadingMap = null;

  async function getMediaMap() {
    if (mediaMap) return mediaMap;

    if (loadingMap) return loadingMap;

    loadingMap = fetch('/media-map.json', {
      credentials: 'same-origin',
      cache: 'no-store'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(
            'Unable to load media-map.json'
          );
        }

        return response.json();
      })
      .then(data => {
        mediaMap = data || {};
        return mediaMap;
      })
      .catch(error => {
        console.warn(
          'E-LEAP private image map unavailable:',
          error
        );

        return {};
      })
      .finally(() => {
        loadingMap = null;
      });

    return loadingMap;
  }

  function fileNameFromSource(src) {
    if (!src) return null;

    try {
      const clean =
        src
          .split('?')[0]
          .split('#')[0];

      return clean
        .split('/')
        .filter(Boolean)
        .pop() || null;
    } catch (_) {
      return null;
    }
  }

  async function resolveImage(img) {
    if (!img || img.tagName !== 'IMG') {
      return;
    }

    if (
      img.dataset.eleapPrivateResolved === '1'
    ) {
      return;
    }

    const original =
      img.getAttribute('data-media-key') ||
      img.getAttribute('src') ||
      '';

    const filename =
      fileNameFromSource(original);

    if (!filename) return;

    /*
      Only resolve the three approved U1.2 images.
      slide01_img01.jpg is intentionally unused.
    */

    const allowed = new Set([
      'slide02_img02.png',
      'slide20_img09.png',
      'old_jeans_photo.png'
    ]);

    if (!allowed.has(filename)) {
      return;
    }

    const map =
      await getMediaMap();

    const key =
      LESSON_PREFIX + filename;

    const resolved =
      map[key];

    if (!resolved) {
      console.warn(
        'E-LEAP private image mapping missing:',
        key
      );

      return;
    }

    img.dataset.eleapPrivateResolved = '1';

    if (
      img.getAttribute('src') !== resolved
    ) {
      img.setAttribute(
        'src',
        resolved
      );
    }
  }

  function scanImages(root = document) {
    const images = [];

    if (
      root instanceof HTMLImageElement
    ) {
      images.push(root);
    }

    if (
      root.querySelectorAll
    ) {
      images.push(
        ...root.querySelectorAll('img')
      );
    }

    images.forEach(resolveImage);
  }

  /*
    Initial scan.
  */

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      () => scanImages()
    );
  } else {
    scanImages();
  }

  /*
    U1.2 re-renders screens dynamically.
    Watch for newly created images.
  */

  const observer =
    new MutationObserver(
      mutations => {
        mutations.forEach(
          mutation => {
            mutation.addedNodes.forEach(
              node => {
                if (
                  node.nodeType === 1
                ) {
                  scanImages(node);
                }
              }
            );
          }
        );
      }
    );

  observer.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true
    }
  );

  /*
    Public QA helper.
  */

  window.ELEAP_PRIVATE_IMAGES = {
    scan:
      scanImages
  };
})();
