// 앱 화면·차트 라이브러리는 캐시 우선, 시세 데이터는 네트워크 우선(오프라인이면 마지막 데이터)
const SHELL='shell-v1',DATA='data-v1';
const SHELL_FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png',
 'https://cdn.jsdelivr.net/npm/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>Promise.all(SHELL_FILES.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==SHELL&&k!==DATA).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.hostname==='docs.google.com'||u.hostname.endsWith('googleusercontent.com')){
    const key=new Request(u.origin+u.pathname+'?format=csv');
    e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cl=r.clone();caches.open(DATA).then(c=>c.put(key,cl))}return r})
      .catch(()=>caches.open(DATA).then(c=>c.match(key)).then(m=>{if(!m)throw new Error('offline');const h=new Headers(m.headers);h.set('x-sw-cache','1');return m.blob().then(b=>new Response(b,{status:200,headers:h}))})));
    return;
  }
  if(u.origin===location.origin&&(u.pathname.endsWith('/')||u.pathname.endsWith('index.html'))){
    // 화면 파일: 네트워크 우선(업데이트 반영), 실패 시 캐시
    e.respondWith(fetch(e.request).then(r=>{const cl=r.clone();caches.open(SHELL).then(c=>c.put(e.request,cl));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{if(r.ok&&(u.origin===location.origin||u.hostname==='cdn.jsdelivr.net')){const cl=r.clone();caches.open(SHELL).then(c=>c.put(e.request,cl))}return r})));
});
