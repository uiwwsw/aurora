# Web search architecture

The web preview uses one public origin: `https://aurora-two-virid.vercel.app`.

- `/` keeps the Korean interactive demo and includes a visible, static product overview that does not require JavaScript.
- `/en/` provides a static English overview and links to the Korean interactive interface.
- Each language has its own canonical URL, translated title and description, Open Graph and Twitter metadata, and reciprocal `hreflang` links for `ko`, `en` and `x-default`.
- `/sitemap.xml` lists only the public language pages. `/robots.txt` advertises that sitemap for production.
- Preview builds use `noindex,nofollow` and disallow crawling. Their canonical links still point to production.
- Public Google and Naver verification tags are part of the web HTML. They are ownership proofs intended for public delivery, not login credentials. Keep them in place when maintaining the site.
- WebPage and WebSite structured data describes visible product facts without fabricated ratings, reviews or prices. It does not promise eligibility for enhanced search results.
- Unknown routes return a real 404. The generated error document is marked `noindex`; the health endpoint also has a `noindex` response header.

`npm run build:web` creates `web-dist/` from `dist/`. It does not change the desktop app's HTML, protocol, request behavior or installation artifacts. Web pages self-host the shared SUITE font and its license. Vercel deploys `web-dist/`; GitHub Releases hosts desktop installers.

## Maintenance

Keep page copy consistent with the public release. When adding a translated page, update its canonical, reciprocal alternates, navigation and sitemap together. Avoid blanket redirects or rewrites that turn missing URLs into soft 404s. Keep public resource URLs stable and check the generated HTML without JavaScript as well as in a browser.

Ownership verification, sitemap submission, crawling and indexing are separate steps. Search engines can take time to process changes and decide whether to index or rank a page. Technical checks and submissions do not guarantee exposure or ranking.

References: [Google localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), [Google sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Naver preferred URLs and robots metadata](https://searchadvisor.naver.com/guide/markup-structure), [Naver SEO basics](https://searchadvisor.naver.com/guide/seo-basic-create).


## AI 학습·수집 고지 / AI training notice

사전 서면 동의 없는 AI 학습·미세조정·학습용 수집에 반대합니다. No AI training, fine-tuning or training-data collection without prior written consent. 기존 라이선스와 제삼자·사용자 콘텐츠의 권리는 유지됩니다. Existing licenses and third-party/user rights remain unchanged. [전체 고지 / Full notice](../AI-TRAINING-NOTICE.md)
