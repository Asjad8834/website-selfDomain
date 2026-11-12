import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Analytics } from "@vercel/analytics/react";

/* ---------- EDIT THESE ---------- */
const SITE = {
  name: "Asjad Iftakhar",
  city: "Bangalore",
  tz: "Asia/Kolkata",
  email: "asjadiftakhar8834@gmail.com",
  instagram: "iftakharasjad",
  github: "Asjad8834",
  linkedin: "asjadiftakhar",
};
const MAN = "/man.png";
const USE_CUTOUT = true; // lets the ring wrap fully around him. Set false if the cutout ever looks wrong.
/* -------------------------------- */

const LINKS = {
  instagram: `https://instagram.com/${SITE.instagram}`,
  dm: `https://ig.me/m/${SITE.instagram}`,
  github: `https://github.com/${SITE.github}`,
  linkedin: `https://linkedin.com/in/${SITE.linkedin}`,
  mail: `mailto:${SITE.email}`,
};

/* =========================================================
   ORBIT DATA  (letters every 5deg, ribbon in 60 pieces)
   ========================================================= */
const WORD = "Stay Tune".split("");
const STEP = 5;
const LETTERS = [];
for (let i = 0; i < WORD.length; i++) {
  if (WORD[i] === " ") continue;
  LETTERS.push({ ch: WORD[i], a: i * STEP });
  LETTERS.push({ ch: WORD[i], a: (36 + i) * STEP });
}
const SEGS = Array.from({ length: 60 }, (_, i) => i * 6);

/* =========================================================
   CUTOUT: finds the dark silhouette in the photo so the back
   of the ring can pass behind him instead of being hidden
   ========================================================= */
const CUT_LIMIT = 30; // 0-255. Pixels darker than this count as "the man"

function buildCutout(img) {
  return new Promise((resolve) => {
    const W = Math.min(960, img.naturalWidth);
    const H = Math.round((img.naturalHeight * W) / img.naturalWidth);
    const n = W * H;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0, W, H);
    const frame = g.getImageData(0, 0, W, H);
    const px = frame.data;

    const dark = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      const lum = 0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2];
      dark[i] = px[o + 3] > 128 && lum < CUT_LIMIT ? 1 : 0;
    }

    const stack = new Int32Array(n);
    const flood = (seeds, ok, mark) => {
      let sp = 0;
      for (const s of seeds) if (!mark[s] && ok(s)) { mark[s] = 1; stack[sp++] = s; }
      while (sp) {
        const i = stack[--sp];
        const x = i % W;
        if (x > 0 && !mark[i - 1] && ok(i - 1)) { mark[i - 1] = 1; stack[sp++] = i - 1; }
        if (x < W - 1 && !mark[i + 1] && ok(i + 1)) { mark[i + 1] = 1; stack[sp++] = i + 1; }
        if (i >= W && !mark[i - W] && ok(i - W)) { mark[i - W] = 1; stack[sp++] = i - W; }
        if (i < n - W && !mark[i + W] && ok(i + W)) { mark[i + W] = 1; stack[sp++] = i + W; }
      }
    };

    // seed: a dark pixel near the bottom centre (his torso)
    let seed = -1;
    for (const dx of [0, -0.05, 0.05, -0.1, 0.1]) {
      const x = Math.round(W / 2 + dx * W);
      for (let y = H - 1; y > H * 0.4 && seed < 0; y--) {
        if (dark[y * W + x]) seed = y * W + x;
      }
      if (seed >= 0) break;
    }
    if (seed < 0) return resolve(null);

    const man = new Uint8Array(n);
    flood([seed], (i) => dark[i] === 1, man);

    // everything reachable from the border without crossing him is background
    const ext = new Uint8Array(n);
    const border = [];
    for (let x = 0; x < W; x++) border.push(x, n - W + x);
    for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1);
    flood(border, (i) => man[i] === 0, ext);

    let shape = new Uint8Array(n);
    let area = 0;
    for (let i = 0; i < n; i++) if (!ext[i]) { shape[i] = 1; area++; }
    if (area / n > 0.55 || area / n < 0.03) return resolve(null); // looks wrong, skip it

    // grow 2px so the thin rim light is covered too
    for (let pass = 0; pass < 2; pass++) {
      const next = shape.slice();
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          if (!shape[i] && (shape[i - 1] || shape[i + 1] || shape[i - W] || shape[i + W])) next[i] = 1;
        }
      }
      shape = next;
    }

    for (let i = 0; i < n; i++) px[i * 4 + 3] = shape[i] ? 255 : 0;
    g.putImageData(frame, 0, 0);
    c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : null), "image/png");
  });
}

function useCutout(src) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!USE_CUTOUT) return;
    let dead = false;
    const run = () => {
      const img = new Image();
      img.onload = async () => {
        try {
          const u = await buildCutout(img);
          if (!dead && u) setUrl(u);
        } catch {}
      };
      img.src = src;
    };
    const idle = "requestIdleCallback" in window;
    const id = idle ? requestIdleCallback(run, { timeout: 1500 }) : setTimeout(run, 400);
    return () => {
      dead = true;
      idle ? cancelIdleCallback(id) : clearTimeout(id);
    };
  }, [src]);
  return url;
}

/* =========================================================
   CLOCK
   ========================================================= */
function useClock(timeZone) {
  const fmt = () =>
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone }).format(new Date());
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 15000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/* =========================================================
   PHONE SCROLL  (writes transforms directly + eases them,
   so scrolling stays smooth and nothing re-styles the page)
   ========================================================= */
function usePhoneScroll(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rig = el.querySelector(".phone-rig");
    const glare = el.querySelector(".glare");
    const about = el.querySelector(".about");
    const kids = about ? Array.from(about.children) : [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

    let ps = 1, cur = 0, target = 0, raf = 0;

    const measure = () => {
      const mobile = window.innerWidth < 860;
      const availH = mobile ? window.innerHeight * 0.46 : window.innerHeight - 70;
      ps = Math.min(1, availH / 650, (window.innerWidth - 32) / 340);
    };
    const progress = () => {
      const r = el.getBoundingClientRect();
      const lead = window.innerHeight * 0.5;
      return clamp((-r.top + lead) / (r.height - window.innerHeight + lead));
    };
    const render = (p) => {
      const e = 1 - Math.pow(1 - clamp(p / 0.42), 3);
      const s = clamp((p - 0.42) / 0.58);
      const ty = 700 * (1 - e);
      const rx = 58 * (1 - e) + 4;
      const ry = -52 * (1 - e) + (-16 + 26 * s);
      const sc = 0.7 + 0.3 * e;
      rig.style.transform = `translate3d(0,${ty.toFixed(1)}px,0) scale(${(sc * ps).toFixed(3)}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      glare.style.backgroundPosition = `${(50 + ry * 3).toFixed(1)}% 0`;
      const t = clamp((p - 0.3) / 0.3);
      about.style.opacity = clamp(t * 3).toFixed(3);
      about.style.transform = `translate3d(0,${((1 - t) * 28).toFixed(1)}px,0)`;
      kids.forEach((k, i) => (k.style.opacity = clamp(t * 2.4 - i * 0.22).toFixed(3)));
    };
    const tick = () => {
      cur += (target - cur) * 0.14;
      if (Math.abs(target - cur) < 0.0005) cur = target;
      render(cur);
      raf = cur === target ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = reduce ? 1 : progress();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    cur = target = reduce ? 1 : progress();
    render(cur);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [ref]);
}

/* =========================================================
   ICONS
   ========================================================= */
const Ig = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r=".6" fill="#fff" />
  </svg>
);
const Gh = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="#fff">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.96 10.96 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);
const Li = () => <b className="glyph">in</b>;
const Mail = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 8 8 6 8-6" />
  </svg>
);
const Wave = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
    <path d="M5 9v6M9 5v14M13 8v8M17 4v16M21 10v4" />
  </svg>
);
const Globe = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
  </svg>
);
const Chat = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="#fff">
    <path d="M12 3C6.5 3 2.5 6.6 2.5 11c0 2.4 1.2 4.4 3.1 5.8-.2 1.3-.8 2.5-1.6 3.4 1.9-.1 3.5-.8 4.6-1.6.9.2 1.8.4 2.9.4 5.5 0 9.5-3.6 9.5-8S17.5 3 12 3Z" />
  </svg>
);

/* =========================================================
   HERO
   ========================================================= */
function Hero() {
  const ref = useRef(null);
  const cut = useCutout(MAN);

  // pause the orbit while the hero is off screen
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("paused", !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="hero" id="top" ref={ref}>
      <header className="top">
        <span className="brand">{SITE.name}</span>
        <a className="top-link" href="#contact">Enter</a>
      </header>

      <img className="backdrop" src={MAN} alt="" decoding="async" />

      <div className="scene">
        <img className="plane" src={cut || MAN} alt="" decoding="async" />
        <div className="tilt" role="img" aria-label="Stay tuned">
          <div className="ring">
            {SEGS.map((a) => (
              <i key={a} className="seg" style={{ "--a": `${a}deg` }} />
            ))}
            {LETTERS.map((l, i) => (
              <span key={i} className="ch" style={{ "--a": `${l.a}deg` }}>
                {l.ch}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-message">
        <h1>
          LIVE
          <br />
          SOON.
        </h1>
        <p>A new space is coming.</p>
        <div className="scroll-indicator">
          <span />
        </div>
      </div>

      <div className="curtain" aria-hidden="true" />
    </section>
  );
}

/* =========================================================
   PHONE
   ========================================================= */
const GH_CELLS = [
  0,1,0,2,0,0,1,
  0,0,3,1,0,2,0,
  1,2,0,4,2,1,0,
  0,3,2,1,4,3,1,
  2,0,1,3,2,0,2,
  0,1,4,2,0,1,0,
  1,0,2,0,3,4,2,
];

function Phone({ time }) {
  const tiltRef = useRef(null);

  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    if (tiltRef.current)
      tiltRef.current.style.transform = `rotateY(${(x * 14).toFixed(2)}deg) rotateX(${(-y * 10).toFixed(2)}deg)`;
  };
  const leave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
  };

  // apps without a link are plain icons (no dead "#" tabs)
  const app = (href, label, cls, icon) => {
    const inner = (
      <>
        <i className={cls}>{icon}</i>
        <span>{label}</span>
      </>
    );
    return href ? (
      <a className="app" href={href} target={href.startsWith("mailto") ? undefined : "_blank"} rel="noreferrer">
        {inner}
      </a>
    ) : (
      <span className="app">{inner}</span>
    );
  };

  return (
    <div className="phone-scene" onMouseMove={move} onMouseLeave={leave}>
      <div className="phone-rig">
        <div className="halo" />
        <div className="tilt-m" ref={tiltRef}>
          <div className="phone">
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} className="layer" style={{ "--z": `${-i * 2.2}px` }} />
            ))}
            <span className="hw hw-a" />
            <span className="hw hw-v1" />
            <span className="hw hw-v2" />
            <span className="hw hw-p" />

            <div className="bezel">
              <div className="screen">
                <div className="wall" />
                <div className="island" />
                <div className="status">
                  <span>{time}</span>
                  <span>5G ▮▮▮</span>
                </div>

                <div className="widgets">
                  <div className="wcol">
                    <div className="w w-gh">
                      <div className="grid">
                        {GH_CELLS.map((v, i) => (
                          <u key={i} className={`c${v}`} />
                        ))}
                      </div>
                    </div>
                    <span className="wl">Activity</span>
                  </div>
                  <div className="wcol">
                    <div className="w w-now">
                      <small>COMING NEXT</small>
                      <strong>Something New</strong>
                      <em>Stay tuned</em>
                      <span className="bar"><i /></span>
                    </div>
                    <span className="wl">Preview</span>
                  </div>
                </div>

                <div className="icons">
                  {app(LINKS.instagram, "Instagram", "ig", <Ig />)}
                  {app(LINKS.github, "GitHub", "gh", <Gh />)}
                  {app(LINKS.linkedin, "LinkedIn", "li", <Li />)}
                  {app(LINKS.mail, "Mail", "ml", <Mail />)}
                  {app(null, "Signal", "p1", <Wave />)}
                  {app(null, "Studio", "p2", <b className="glyph">✦</b>)}
                  {app(null, "Notes", "p3", <b className="glyph">N</b>)}
                  {app(null, "Archive", "p4", <Globe />)}
                </div>

                <div className="search">Search</div>
                <div className="dock">
                  {app(LINKS.mail, "", "ml", <Mail />)}
                  {app(LINKS.instagram, "", "sf", <Ig />)}
                  {app(LINKS.dm, "", "ms", <Chat />)}
                </div>
                <div className="home-bar" />
              </div>
            </div>
            <div className="glare" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECOND SECTION
   ========================================================= */
function Contact() {
  const sec = useRef(null);
  const time = useClock(SITE.tz);
  usePhoneScroll(sec);

  return (
    <section className="phone-section" id="contact" ref={sec}>
      <div className="sticky">
        <Phone time={time} />

        <div className="about">
          <span className="section-kicker">THE NEXT CHAPTER</span>
          <h2>
            Something is
            <br />
            taking shape.
          </h2>
          <p>A new digital space is being built behind the scenes.</p>
          <p className="hide-m">
            Not another template. Not another portfolio. Just something designed to feel a little different.
          </p>
          <p className="hide-s">
            <a href={LINKS.mail}>Stay curious →</a>
          </p>

          <ul className="contact">
            <li>
              <a href={LINKS.instagram} target="_blank" rel="noreferrer">
                <span>Instagram</span>
                <span>@{SITE.instagram}</span>
              </a>
            </li>
            <li>
              <a href={LINKS.github} target="_blank" rel="noreferrer">
                <span>GitHub</span>
                <span>@{SITE.github}</span>
              </a>
            </li>
            <li>
              <a href={LINKS.linkedin} target="_blank" rel="noreferrer">
                <span>LinkedIn</span>
                <span>/in/{SITE.linkedin}</span>
              </a>
            </li>
            <li>
              <a href={LINKS.mail}>
                <span>Email</span>
                <span>{SITE.email}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   APP
   ========================================================= */
export default function App() {
  return (
    <>
      <Hero />
      <Contact />
      <Analytics />
      <footer className="footer">A little something is coming.</footer>
    </>
  );
}