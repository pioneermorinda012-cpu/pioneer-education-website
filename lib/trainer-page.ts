/* SERVER ONLY. Sends a whole trainer page (English, German, PTE, the IELTS
 * labs) with two things added: a back button, and the student's progress.
 *
 * The trainers save where a student has got to in the browser's storage, and
 * the browser can forget it — another phone, a link opened inside WhatsApp or
 * Instagram, private mode, cleared history. So the page is sent with the copy
 * kept in the student's account (lib/progress.ts) already inside it, and a
 * small script at the very top of <head> puts it back into storage before the
 * trainer's own code reads it. Every time the trainer saves, the script sends
 * a copy back (a few seconds later, and again when the page is left).
 *
 * The trainer files are not changed at all.
 */
import { ENGLISH } from "@/lib/english";
import { GERMAN } from "@/lib/german";
import { FRENCH } from "@/lib/french";
import { PTE } from "@/lib/pte";
import { LABS } from "@/lib/labs";
import { getProgress, progressReady, type Saved } from "@/lib/progress";
import type { Session } from "@/lib/session";

/** Every trainer whose progress is kept, as "section/id". */
export const TRAINERS = new Set<string>([
  ...ENGLISH.map((x) => `english/${x.id}`),
  ...GERMAN.map((x) => `german/${x.id}`),
  ...FRENCH.map((x) => `french/${x.id}`),
  ...PTE.map((x) => `pte/${x.id}`),
  ...LABS.map((x) => `lab/${x.id}`),
]);

/* JSON that is safe inside <script>: no "</script>", no "<!--". */
const js = (v: unknown) =>
  JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

/* Runs before anything else on the page. Plain ES5, so it works on old phones. */
function syncScript(trainer: string, sid: string, saved: Saved | null): string {
  return `<script>(function(){
var T=${js(trainer)},U=${js(sid)},S=${js(saved)},P="__pp:"+T+":",API="/api/practice/progress";
var real=null;try{real=window.localStorage;real.setItem("__pp_t","1");real.removeItem("__pp_t");}catch(e){real=null;}
var store=real;
if(!store){var m={};store={getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null;},setItem:function(k,v){m[k]=String(v);},removeItem:function(k){delete m[k];},clear:function(){m={};},key:function(i){return Object.keys(m)[i]||null;}};
try{Object.defineProperty(store,"length",{get:function(){return Object.keys(m).length;}});}catch(e){}
try{Object.defineProperty(window,"localStorage",{value:store,configurable:true});}catch(e){}}
var SP=window.Storage&&Storage.prototype,oSet=SP&&SP.setItem,oRem=SP&&SP.removeItem;
function rs(k,v){try{if(real)oSet.call(real,k,v);else store.setItem(k,v);}catch(e){}}
function rr(k){try{if(real)oRem.call(real,k);else store.removeItem(k);}catch(e){}}
function g(k){try{return store.getItem(k);}catch(e){return null;}}
var keys={};try{var kk=JSON.parse(g(P+"keys")||"[]");for(var i=0;i<kk.length;i++)keys[kk[i]]=1;}catch(e){}
var owner=g(P+"owner"),at=+(g(P+"at")||0),push=false;
if(owner&&owner!==U){for(var k in keys)rr(k);keys={};at=0;}
if(S&&S.data&&S.at>=at){for(var k2 in S.data){rs(k2,S.data[k2]);keys[k2]=1;}at=S.at;}
else if(at>0)push=true;
function meta(){rs(P+"owner",U);rs(P+"at",String(at));try{rs(P+"keys",JSON.stringify(Object.keys(keys)));}catch(e){}}
meta();
function body(){var d={};for(var k in keys){var v=g(k);if(v!==null)d[k]=v;}return JSON.stringify({trainer:T,at:at,data:d});}
var timer=null,dirty=false;
function send(leaving){if(!dirty)return;dirty=false;clearTimeout(timer);timer=null;var b=body();
try{if(leaving&&navigator.sendBeacon&&b.length<60000&&navigator.sendBeacon(API,new Blob([b],{type:"application/json"})))return;}catch(e){}
try{fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:b,credentials:"same-origin",keepalive:b.length<60000}).catch(function(){dirty=true;});}catch(e){dirty=true;}}
function changed(k,gone){if(typeof k!=="string"||k.indexOf("__pp")===0)return;if(gone)delete keys[k];else keys[k]=1;at=Date.now();meta();dirty=true;clearTimeout(timer);timer=setTimeout(function(){send(false);},2500);}
if(real&&SP){SP.setItem=function(k,v){oSet.call(this,k,v);if(this===real)changed(String(k));};SP.removeItem=function(k){oRem.call(this,k);if(this===real)changed(String(k),true);};}
else{var ss=store.setItem,sr=store.removeItem;store.setItem=function(k,v){ss(k,v);changed(String(k));};store.removeItem=function(k){sr(k);changed(String(k),true);};}
window.addEventListener("pagehide",function(){send(true);});
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")send(true);});
if(push){dirty=true;setTimeout(function(){send(false);},1500);}
})();</script>`;
}

const backButton = (href: string, label: string) => `
<a href="${href}" style="position:fixed;left:14px;bottom:14px;z-index:2147483647;
  background:#1b1b1b;color:#fff;font:700 13px/1 -apple-system,Segoe UI,Roboto,Arial,sans-serif;
  padding:11px 15px;border-radius:100px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.25)">
  ${label}</a>`;

/**
 * The finished response for one trainer. `trainer` is "section/id" from
 * TRAINERS. A teacher opening a trainer gets it as before, with nothing kept.
 */
export async function trainerResponse(opts: {
  html: string; trainer: string; session: Session; back: { href: string; label: string };
  /** extra CSS added to <head>, for a page that needs a fix on phones */
  css?: string;
}): Promise<Response> {
  let html = opts.html;

  /* A page with no viewport tag is drawn at desktop width on a phone and
   * shrunk to fit — tiny text. Add one if the file has none. */
  const extra =
    (/<meta[^>]+name=["']?viewport/i.test(html) ? "" : '<meta name="viewport" content="width=device-width, initial-scale=1">') +
    (opts.css ? `<style>${opts.css}</style>` : "");
  if (extra) {
    const close = html.search(/<\/head>/i);
    html = close >= 0 ? html.slice(0, close) + extra + html.slice(close) : extra + html;
  }

  if (opts.session.role === "student" && TRAINERS.has(opts.trainer)) {
    let saved: Saved | null = null;
    if (progressReady()) {
      try { saved = await getProgress(opts.session.sid, opts.trainer); }
      catch (e) { console.error("read progress", opts.trainer, e); }
    }
    const script = syncScript(opts.trainer, opts.session.sid, saved);
    const head = html.search(/<head[^>]*>/i);
    if (head >= 0) {
      const end = html.indexOf(">", head) + 1;
      html = html.slice(0, end) + script + html.slice(end);
    } else {
      html = script + html;
    }
  }

  const back = backButton(opts.back.href, opts.back.label);
  const at = html.search(/<\/body>/i);
  html = at >= 0 ? html.slice(0, at) + back + html.slice(at) : html + back;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
