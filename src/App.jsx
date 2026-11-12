import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Analytics } from '@vercel/analytics/react';

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

/* -------------------------------- */

const LINKS = {
  instagram: `https://instagram.com/${SITE.instagram}`,
  dm: `https://ig.me/m/${SITE.instagram}`,
  github: `https://github.com/${SITE.github}`,
  linkedin: `https://linkedin.com/in/${SITE.linkedin}`,
  mail: `mailto:${SITE.email}`,
};


/* =========================================================
   LIVE SOON ORBIT
   ========================================================= */

const WORD = "Stay Tune".split("");
const N = 72;
const STEP = 360 / N;

const LETTERS = [];

for (let i = 0; i < 9; i++) {
  LETTERS.push({
    ch: WORD[i],
    a: i * STEP,
    back: false,
  });

  LETTERS.push({
    ch: WORD[i],
    a: (36 + i) * STEP,
    back: false,
  });
}

const SEGS = Array.from({ length: N }, (_, i) => i * STEP);


/* =========================================================
   CLOCK
   ========================================================= */

function useClock(timeZone) {
  const fmt = () =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(new Date());

  const [t, setT] = useState(fmt);

  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 15000);
    return () => clearInterval(id);
  }, []);

  return t;
}


/* =========================================================
   PHONE SCROLL
   ========================================================= */

function usePhoneScroll(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const clamp = (v, a = 0, b = 1) =>
      Math.min(b, Math.max(a, v));

    let raf = 0;

    const apply = () => {
      const r = el.getBoundingClientRect();

      const lead = window.innerHeight * 0.5;

      const total =
        r.height - window.innerHeight + lead;

      const p = reduce
        ? 1
        : clamp((-r.top + lead) / total);

      const e =
        1 - Math.pow(1 - clamp(p / 0.42), 3);

      const s =
        clamp((p - 0.42) / 0.58);

      const mobile =
        window.innerWidth < 860;

      const avail = mobile
        ? window.innerHeight * 0.5
        : window.innerHeight - 70;

      const ps = Math.min(
        1,
        avail / 660,
        (window.innerWidth - 40) / 340
      );

      const set = (k, v) =>
        el.style.setProperty(k, v);

      set("--ty", (700 * (1 - e)).toFixed(1));
      set("--rx", (58 * (1 - e) + 4).toFixed(2));

      set(
        "--ry",
        (-52 * (1 - e) + (-16 + 26 * s)).toFixed(2)
      );

      set("--sc", (0.7 + 0.3 * e).toFixed(3));
      set("--ps", ps.toFixed(3));
      set("--t", clamp((p - 0.3) / 0.3).toFixed(3));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    apply();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);

      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
}


/* =========================================================
   ICONS
   ========================================================= */

const Ig = () => (
  <svg
    viewBox="0 0 24 24"
    width="30"
    height="30"
    fill="none"
    stroke="#fff"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle
      cx="17.3"
      cy="6.7"
      r=".6"
      fill="#fff"
    />
  </svg>
);

const Gh = () => (
  <svg
    viewBox="0 0 24 24"
    width="30"
    height="30"
    fill="#fff"
  >
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.96 10.96 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

const Li = () => (
  <b className="glyph">in</b>
);

const Mail = () => (
  <svg
    viewBox="0 0 24 24"
    width="30"
    height="30"
    fill="none"
    stroke="#fff"
    strokeWidth="2"
    strokeLinejoin="round"
    strokeLinecap="round"
  >
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 8 8 6 8-6" />
  </svg>
);

const Wave = () => (
  <svg
    viewBox="0 0 24 24"
    width="28"
    height="28"
    stroke="#fff"
    strokeWidth="2.4"
    strokeLinecap="round"
  >
    <path d="M5 9v6M9 5v14M13 8v8M17 4v16M21 10v4" />
  </svg>
);

const Globe = () => (
  <svg
    viewBox="0 0 24 24"
    width="28"
    height="28"
    fill="none"
    stroke="#fff"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
  </svg>
);

const Chat = () => (
  <svg
    viewBox="0 0 24 24"
    width="30"
    height="30"
    fill="#fff"
  >
    <path d="M12 3C6.5 3 2.5 6.6 2.5 11c0 2.4 1.2 4.4 3.1 5.8-.2 1.3-.8 2.5-1.6 3.4 1.9-.1 3.5-.8 4.6-1.6.9.2 1.8.4 2.9.4 5.5 0 9.5-3.6 9.5-8S17.5 3 12 3Z" />
  </svg>
);


/* =========================================================
   HERO
   ========================================================= */

function Hero() {
  return (
    <section className="hero" id="top">

      <header className="top">
        <span className="brand">
          {SITE.name}
        </span>

        <a className="top-link" href="#contact">
          Enter
        </a>
      </header>


      <div className="scene">

        <img
          className="man"
          src="/man.png"
          alt=""
        />

        <div
          className="tilt"
          role="img"
          aria-label="Live soon"
        >

          <div className="ring">

            {SEGS.map((a) => (
              <i
                key={a}
                className="seg"
                style={{
                  "--a": `${a}deg`,
                }}
              />
            ))}

            {LETTERS.map((l, i) =>
              l.ch === " " ? null : (
                <span
                  key={i}
                  className={`ch ${l.back ? "in" : ""}`}
                  style={{
                    "--a": `${l.a}deg`,
                  }}
                >
                  {l.ch}
                </span>
              )
            )}

          </div>
        </div>
      </div>


      <div className="hero-message">

        {/* <span className="eyebrow">
          SOMETHING NEW IS TAKING SHAPE
        </span> */}

        <h1>
          LIVE
          <br />
          SOON.
        </h1>

        <p>
          A new space is coming.
        </p>

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
  1,0,2,0,3,4,2
];


function Phone() {

  const tiltRef = useRef(null);

  const move = (e) => {

    const r =
      e.currentTarget.getBoundingClientRect();

    const x =
      (e.clientX - r.left) / r.width - 0.5;

    const y =
      (e.clientY - r.top) / r.height - 0.5;

    tiltRef.current?.style.setProperty(
      "--mx",
      (x * 14).toFixed(2)
    );

    tiltRef.current?.style.setProperty(
      "--my",
      (-y * 10).toFixed(2)
    );
  };


  const leave = () => {

    tiltRef.current?.style.setProperty(
      "--mx",
      "0"
    );

    tiltRef.current?.style.setProperty(
      "--my",
      "0"
    );
  };


  const app = (
    href,
    label,
    cls,
    icon
  ) => (

    <a
      className="app"
      href={href}
      target="_blank"
      rel="noreferrer"
    >

      <i className={cls}>
        {icon}
      </i>

      <span>
        {label}
      </span>

    </a>
  );


  return (

    <div
      className="phone-scene"
      onMouseMove={move}
      onMouseLeave={leave}
    >

      <div className="phone-rig">

        <div className="halo" />

        <div
          className="tilt-m"
          ref={tiltRef}
        >

          <div className="phone">

            {Array.from(
              { length: 15 },
              (_, i) => (
                <i
                  key={i}
                  className="layer"
                  style={{
                    "--z": `${-i * 1.5}px`,
                  }}
                />
              )
            )}

            <span className="hw hw-a" />
            <span className="hw hw-v1" />
            <span className="hw hw-v2" />
            <span className="hw hw-p" />


            <div className="bezel">

              <div className="screen">

                <div className="wall" />

                <div className="island" />

                <div className="status">
                  <span>03:45</span>

                  <span>
                    5G ▮▮▮
                  </span>
                </div>


                <div className="widgets">

                  <div className="wcol">

                    <div className="w w-gh">

                      <div className="grid">

                        {GH_CELLS.map(
                          (v, i) => (
                            <u
                              key={i}
                              className={`c${v}`}
                            />
                          )
                        )}

                      </div>

                    </div>

                    <span className="wl">
                      Activity
                    </span>

                  </div>


                  <div className="wcol">

                    <div className="w w-now">

                      <small>
                        COMING NEXT
                      </small>

                      <strong>
                        Something New
                      </strong>

                      <em>
                        Stay tuned
                      </em>

                      <span className="bar">
                        <i />
                      </span>

                    </div>

                    <span className="wl">
                      Preview
                    </span>

                  </div>

                </div>


                <div className="icons">

                  {app(
                    LINKS.instagram,
                    "Instagram",
                    "ig",
                    <Ig />
                  )}

                  {app(
                    LINKS.github,
                    "GitHub",
                    "gh",
                    <Gh />
                  )}

                  {app(
                    LINKS.linkedin,
                    "LinkedIn",
                    "li",
                    <Li />
                  )}

                  {app(
                    LINKS.mail,
                    "Mail",
                    "ml",
                    <Mail />
                  )}

                  {app(
                    "#",
                    "Signal",
                    "p1",
                    <Wave />
                  )}

                  {app(
                    "#",
                    "Studio",
                    "p2",
                    <b className="glyph">
                      ✦
                    </b>
                  )}

                  {app(
                    "#",
                    "Notes",
                    "p3",
                    <b className="glyph">
                      N
                    </b>
                  )}

                  {app(
                    "#",
                    "Archive",
                    "p4",
                    <Globe />
                  )}

                </div>


                <div className="search">
                  Search
                </div>


                <div className="dock">

                  {app(
                    LINKS.mail,
                    "",
                    "ml",
                    <Mail />
                  )}

                  {app(
                    LINKS.instagram,
                    "",
                    "sf",
                    <Ig />
                  )}

                  {app(
                    LINKS.dm,
                    "",
                    "ms",
                    <Chat />
                  )}

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

  usePhoneScroll(sec);

  return (

    <section
      className="phone-section"
      id="contact"
      ref={sec}
    >

      <div className="sticky">

        <Phone />

        <div className="about">

          <span className="section-kicker">
            THE NEXT CHAPTER
          </span>

          <h2>
            Something is
            <br />
            taking shape.
          </h2>

          <p>
            A new digital space is being built
            behind the scenes.
          </p>

          <p>
            Not another template. Not another
            portfolio. Just something designed
            to feel a little different.
          </p>

          <p>
            <a href={LINKS.mail}>
              Stay curious →
            </a>
          </p>


          <ul className="contact">

            <li>
              <a
                href={LINKS.instagram}
                target="_blank"
                rel="noreferrer"
              >
                <span>Instagram</span>
                <span>
                  @{SITE.instagram}
                </span>
              </a>
            </li>

            <li>
              <a
                href={LINKS.github}
                target="_blank"
                rel="noreferrer"
              >
                <span>GitHub</span>
                <span>
                  @{SITE.github}
                </span>
              </a>
            </li>

            <li>
              <a
                href={LINKS.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                <span>LinkedIn</span>
                <span>
                  /in/{SITE.linkedin}
                </span>
              </a>
            </li>

            <li>
              <a href={LINKS.mail}>
                <span>Email</span>
                <span>
                  {SITE.email}
                </span>
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

      <footer className="footer">
        A little something is coming.
      </footer>
    </>
  );
}