/* eslint-env serviceworker */
/// <reference lib="webworker" />

const CACHE_NAME = "tabitalk-v1"
const OFFLINE_URL = "/offline.html"

/** 앱 셸(HTML, CSS, JS, 폰트) — 설치 시 프리캐시 */
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/fonts/NotoSansKR-Regular.ttf",
  "/fonts/NotoSansKR-Bold.ttf",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  // POST 등 mutation은 캐시하지 않음
  if (request.method !== "GET") return

  // 외부 API 요청은 캐시하지 않음 (supabase 등)
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // HTML 네비게이션: network-first, 실패하면 캐시 → offline 페이지
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)),
        ),
    )
    return
  }

  // 정적 자산(JS/CSS/폰트/이미지): cache-first
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        }),
    ),
  )
})
