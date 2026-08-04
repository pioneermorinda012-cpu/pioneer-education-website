"use client";

import { useRef, useState, useEffect } from "react";
import Chatbot from "../components/Chatbot";

function Barcode() {
  // Purely decorative — generated client-side only, after mount, so the
  // random heights don't cause a server/client hydration mismatch.
  const [bars, setBars] = useState<number[] | null>(null);
  useEffect(() => {
    setBars(Array.from({ length: 40 }, () => 30 + Math.random() * 50));
  }, []);
  return (
    <div className="pass-barcode">
      {bars?.map((h, i) => (
        <div key={i} style={{ height: h + "%" }} />
      ))}
    </div>
  );
}

export default function Home() {
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const courseRef = useRef<HTMLSelectElement>(null);

  // Opens WhatsApp with the lead's details pre-filled.
  // NOTE: this does not save the lead anywhere on its own — see the
  // note in chat about wiring this to Firebase/Google Sheets for real
  // lead capture and follow-up.
  function submitLead() {
    const name = nameRef.current?.value.trim() || "";
    const phone = phoneRef.current?.value.trim() || "";
    const course = courseRef.current?.value || "";
    if (!name || !phone) {
      alert("Please enter your name and mobile number.");
      return;
    }
    const msg = `Hi Pioneer Education, I'd like to book a free demo class.%0A%0AName: ${name}%0AMobile: ${phone}%0ACourse: ${course}`;
    window.open("https://wa.me/917380261308?text=" + msg, "_blank");
  }

  return (
    <>
<nav>
  <div className="nav-inner">
    <div className="logo"><div className="logo-mark">P</div>Pioneer Education</div>
    <div className="nav-links">
      <a href="#courses">Courses</a>
      <a href="#results">Results</a>
      <a href="#pricing">Pricing</a>
      <a href="#app">Lexio App</a>
      <a href="/writing-analyzer">Writing Analyzer</a>
      <a href="#reviews">Reviews</a>
      <a href="#demo">Free Demo</a>
      <a href="#contact">Contact</a>
    </div>
    <div className="nav-cta">
      <a href="#demo" className="btn btn-coral">Book Free Demo</a>
    </div>
  </div>
</nav>

<section className="hero">
  <div className="wrap hero-grid">
    <div>
      <div className="eyebrow">Prem Nagar, Morinda · Since 2017</div>
      <h1>Your next stop is <em>Band 7.5</em>, not another classroom.</h1>
      <p className="lede">IELTS, PTE, Spoken English &amp; German coaching built on nine years of watching exactly where Punjabi students lose marks — and fixing it before test day.</p>
      <div className="hero-ctas">
        <a href="#demo" className="btn btn-coral">Book a Free Demo Class</a>
        <a href="#app" className="btn btn-outline">Try the Lexio App</a>
      </div>
      <div className="trust-row">
        <div className="trust-item"><div className="num">9+</div><div className="lbl">Years Coaching</div></div>
        <div className="trust-item"><div className="num">4</div><div className="lbl">Courses Offered</div></div>
        <div className="trust-item"><div className="num">125+</div><div className="lbl">Google Reviews</div></div>
        <div className="trust-item"><div className="num">5.0★</div><div className="lbl">Google Rating</div></div>
      </div>
    </div>

    <div className="pass">
      <div className="pass-seal"><span>PIONEER<br />VERIFIED</span></div>
      <div className="pass-top">
        <div className="pass-brand">
          <div className="name">PIONEER EDUCATION</div>
          <div className="tag mono">TEST-READY PASS</div>
        </div>
        <div className="pass-route">
          <div className="pass-loc">
            <div className="code">MOR</div>
            <div className="city">Morinda, PB</div>
          </div>
          <div className="pass-arrow">
            <svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="10" x2="180" y2="10" stroke="white" strokeDasharray="4 5" strokeWidth="1.5"/><path d="M180 4 L192 10 L180 16" stroke="white" strokeWidth="1.5" fill="none"/></svg>
          </div>
          <div className="pass-loc" style={{textAlign: 'right'}}>
            <div className="code">IELTS</div>
            <div className="city">Band 7.5+</div>
          </div>
        </div>
      </div>
      <div className="pass-bottom">
        <div className="pass-fields">
          <div className="pass-field"><div className="k">Student</div><div className="v">You, starting today</div></div>
          <div className="pass-field"><div className="k">Course</div><div className="v">IELTS Academic</div></div>
          <div className="pass-field"><div className="k">Coach</div><div className="v">Narinder Singh</div></div>
          <div className="pass-field"><div className="k">Practice Mode</div><div className="v">App + In-Person</div></div>
        </div>
        <Barcode />
        <div className="pass-footer">
          <div className="band">TARGET: 7.5</div>
          <div className="status">SEAT AVAILABLE</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="courses">
  <div className="wrap">
    <div className="section-head">
      <div className="section-eyebrow">What We Teach</div>
      <h2>Four courses. One goal — get you where you're going.</h2>
      <p>Every course pairs in-person coaching with practice on the Lexio app, so what you learn in class gets reinforced every single day, not just once a week.</p>
    </div>
    <div className="courses-grid">
      <div className="course-card">
        <div className="stamp-num mono">01</div>
        <div className="course-icon" style={{background: 'var(--coral-light)', color: 'var(--coral-dark)'}}>✈️</div>
        <h3>IELTS</h3>
        <p>Academic &amp; General Training — full preparation for Reading, Writing, Listening &amp; Speaking with mock tests and personalized feedback.</p>
        <ul className="course-feats">
          <li>All 4 modules covered</li>
          <li>Weekly mock tests every Friday</li>
          <li>Detailed written feedback</li>
          <li>Expected writing topics</li>
        </ul>
        <span className="go">Explore IELTS →</span>
      </div>
      <div className="course-card">
        <div className="stamp-num mono">02</div>
        <div className="course-icon" style={{background: 'var(--teal-light)', color: 'var(--teal)'}}>💻</div>
        <h3>PTE</h3>
        <p>Complete PTE preparation covering all zones — Listening, Speaking, Reading and Writing with timed practice.</p>
        <ul className="course-feats">
          <li>All PTE task types</li>
          <li>Speaking zone practice</li>
          <li>Listening labs</li>
          <li>Exam filling guidance</li>
        </ul>
        <span className="go">Explore PTE →</span>
      </div>
      <div className="course-card">
        <div className="stamp-num mono">03</div>
        <div className="course-icon" style={{background: 'var(--gold-light)', color: 'var(--coral-dark)'}}>💬</div>
        <h3>Spoken English</h3>
        <p>From Beginner to Advanced. Grammar, vocabulary, pronunciation, and everyday conversation. Stop translating from Hindi!</p>
        <ul className="course-feats">
          <li>250+ vocabulary words</li>
          <li>850 phrases &amp; idioms</li>
          <li>Visual presentations</li>
          <li>Everyday English</li>
        </ul>
        <span className="go">Explore Spoken English →</span>
      </div>
      <div className="course-card">
        <div className="stamp-num mono">04</div>
        <div className="course-icon" style={{background: 'var(--navy)', color: '#fff'}}>🇩🇪</div>
        <h3>German A1–B1</h3>
        <p>Full German language curriculum from scratch to B1 level — grammar, vocabulary, and exam preparation.</p>
        <ul className="course-feats">
          <li>A1 to B1 levels</li>
          <li>Grammar &amp; vocabulary</li>
          <li>Speaking practice</li>
          <li>Exam preparation</li>
        </ul>
        <span className="go">Explore German →</span>
      </div>
    </div>
  </div>
</section>

<section id="why" className="why">
  <div className="wrap">
    <div className="section-head" style={{maxWidth: '100%'}}>
      <div className="section-eyebrow" style={{color: 'var(--gold)'}}>Why Pioneer Education</div>
      <h2 style={{color: '#fff'}}>We deliver more than you ask for.</h2>
    </div>
    <div className="why-features-grid">
      <div className="why-feat"><div className="wf-icon">⏰</div><h4>4–5 Hours Daily</h4><p>Intensive classes from 9 AM to 1 PM, with evening batches available.</p></div>
      <div className="why-feat"><div className="wf-icon">👤</div><h4>Individual Attention</h4><p>Maximum 8 students per batch, so every student gets personal focus.</p></div>
      <div className="why-feat"><div className="wf-icon">📊</div><h4>3 Level Material</h4><p>Beginner, Intermediate &amp; Advanced practice material designed for all levels.</p></div>
      <div className="why-feat"><div className="wf-icon">📝</div><h4>Weekly Mock Tests</h4><p>Every Friday mock test plus detailed feedback to track your progress.</p></div>
      <div className="why-feat"><div className="wf-icon">🖥️</div><h4>Visual Learning</h4><p>Every Saturday — visual presentations and vocabulary-building games.</p></div>
      <div className="why-feat"><div className="wf-icon">☎️</div><h4>24/7 Support</h4><p>Telegram channel + website + app support with daily sample answers.</p></div>
      <div className="why-feat"><div className="wf-icon">🌐</div><h4>Online &amp; Offline</h4><p>Live classes across India — join from anywhere with a phone or laptop.</p></div>
      <div className="why-feat"><div className="wf-icon">🏆</div><h4>Proven Results</h4><p>Students achieving 7.5+ in IELTS and 80+ in PTE consistently.</p></div>
    </div>
  </div>
</section>

<section id="results" style={{paddingTop: '0'}}>
  <div className="wrap">
    <div className="results-band">
      <h2>🏆 Recent student results</h2>
      <div className="rb-sub">Real scores from students who prepared with us — not stock numbers.</div>
      <div className="results-grid">
        <div className="result-chip">
          <div className="score">8.5</div>
          <div className="band-lbl">Listening</div>
          <div className="who">Arsh</div>
          <div className="exam">IELTS</div>
        </div>
        <div className="result-chip">
          <div className="score">7.5</div>
          <div className="band-lbl">Overall</div>
          <div className="who">Harshdeep Kaur</div>
          <div className="exam">IELTS</div>
        </div>
        <div className="result-chip">
          <div className="score">7.0</div>
          <div className="band-lbl">Overall</div>
          <div className="who">Sukhman Kaur</div>
          <div className="exam">IELTS</div>
        </div>
        <div className="result-chip">
          <div className="score">9.0</div>
          <div className="band-lbl">Listening</div>
          <div className="who">Harpreet Singh</div>
          <div className="exam">IELTS</div>
        </div>
        <div className="result-chip">
          <div className="score">9.0</div>
          <div className="band-lbl">Bands</div>
          <div className="who">Rai Sandeep</div>
          <div className="exam">IELTS</div>
        </div>
        <div className="result-chip">
          <div className="score">84</div>
          <div className="band-lbl">Score</div>
          <div className="who">Sunpreet Singh</div>
          <div className="exam">PTE</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="how-it-works" style={{paddingTop: '0'}}>
  <div className="wrap">
    <div className="section-head">
      <div className="section-eyebrow">How Classes Actually Run</div>
      <h2>The specifics, not the sales pitch.</h2>
      <p>What you actually get when you enroll — the details most institutes leave vague until after you've paid.</p>
    </div>
    <div className="facts-grid">
      <div className="fact-card">
        <h4>⏰ 4–5 hours daily</h4>
        <p>Intensive classes from 9 AM to 1 PM, with evening batches available for working students.</p>
      </div>
      <div className="fact-card">
        <h4>👤 Max 8 per batch</h4>
        <p>Small batches by design, so every student gets personal attention and speaking time.</p>
      </div>
      <div className="fact-card">
        <h4>📊 3-level material</h4>
        <p>Beginner, Intermediate and Advanced practice material — you start where you actually are.</p>
      </div>
      <div className="fact-card">
        <h4>📝 Weekly mock tests</h4>
        <p>Full mock test every Friday plus detailed written feedback to track real progress.</p>
      </div>
      <div className="fact-card">
        <h4>🖥️ Online &amp; offline</h4>
        <p>Attend in Morinda or join live from anywhere in India by phone or laptop.</p>
      </div>
      <div className="fact-card">
        <h4>💬 Daily app practice</h4>
        <p>The Lexio app keeps you practising between classes — vocabulary, quizzes, pronunciation.</p>
      </div>
      <div className="fact-card">
        <h4>🎨 Visual learning Saturdays</h4>
        <p>Every Saturday: visual presentations and vocabulary games instead of standard drills.</p>
      </div>
      <div className="fact-card">
        <h4>🏆 Proven results</h4>
        <p>Students consistently achieving 7.5+ in IELTS and 80+ in PTE — see recent scores above.</p>
      </div>
    </div>
    <div style={{marginTop: '20px', borderRadius: '20px', overflow: 'hidden', position: 'relative'}}>
      <img src="/images/ielts-classroom.jpg" alt="IELTS Writing Task 1 class in progress at Pioneer Education Center, Morinda" style={{width: '100%', display: 'block'}} />
      <div style={{position: 'absolute', left: '0', right: '0', bottom: '0', padding: '40px 24px 18px', background: 'linear-gradient(transparent,rgba(0,0,0,0.75))', color: '#fff', fontSize: '0.88rem', fontWeight: '600'}}>A real IELTS Writing Task 1 session — Prem Nagar, Morinda</div>
    </div>
  </div>
</section>

<section id="pricing">
  <div className="wrap">
    <div className="section-head">
      <div className="section-eyebrow">Investment</div>
      <h2>Simple, honest pricing.</h2>
      <p>First demo class always free · Sibling discount 20% · Refer &amp; Earn ₹500</p>
    </div>
    <div className="pricing-grid">
      <div className="price-card">
        <div className="pc-name">Material Access</div>
        <div className="pc-price">₹499<span>/month</span></div>
        <ul className="course-feats">
          <li>Study material &amp; resources</li>
          <li>Practice exercises &amp; quizzes</li>
          <li>Self-paced learning</li>
        </ul>
        <a href="#contact" className="btn btn-outline" style={{width: '100%', justifyContent: 'center'}}>Enroll Now</a>
      </div>
      <div className="price-card featured">
        <div className="pc-badge">Most Popular</div>
        <div className="pc-name" style={{color: 'rgba(255,255,255,0.8)'}}>Group Class</div>
        <div className="pc-price" style={{color: '#fff'}}>₹2,499<span style={{color: 'rgba(255,255,255,0.7)'}}>/month</span></div>
        <ul className="course-feats" style={{color: 'rgba(255,255,255,0.85)'}}>
          <li style={{color: 'rgba(255,255,255,0.9)'}}>Live classes 5 days/week</li>
          <li style={{color: 'rgba(255,255,255,0.9)'}}>Max 8 students per batch</li>
          <li style={{color: 'rgba(255,255,255,0.9)'}}>Online + Offline</li>
          <li style={{color: 'rgba(255,255,255,0.9)'}}>Weekly progress feedback</li>
          <li style={{color: 'rgba(255,255,255,0.9)'}}>Certificate on completion</li>
        </ul>
        <a href="#contact" className="btn" style={{width: '100%', justifyContent: 'center', background: '#fff', color: 'var(--coral-dark)'}}>Enroll Now</a>
      </div>
      <div className="price-card">
        <div className="pc-name">1-to-1 Coaching</div>
        <div className="pc-price">₹4,999<span>/month</span></div>
        <ul className="course-feats">
          <li>Dedicated personal sessions</li>
          <li>Custom curriculum</li>
          <li>Flexible timings</li>
          <li>Interview prep</li>
          <li>Priority WhatsApp support</li>
        </ul>
        <a href="#contact" className="btn btn-outline" style={{width: '100%', justifyContent: 'center'}}>Enroll Now</a>
      </div>
    </div>
    <div className="price-note">📞 &nbsp;IELTS, PTE &amp; German fees — contact us on WhatsApp for custom pricing based on your requirement and batch type. <strong>WhatsApp: +91 73802 61308</strong></div>
  </div>
</section>

<section id="difference" className="why">
  <div className="wrap why-grid">
    <div>
      <div className="section-eyebrow" style={{color: 'var(--gold)'}}>The Pioneer Difference</div>
      <h2>Nine years of mistakes, already mapped.</h2>
      <p className="why-lede">Most institutes teach the test. We've spent nearly a decade cataloguing exactly where students from this region lose marks — and built that into every lesson and every app quiz.</p>
      <div className="why-list">
        <div className="why-item">
          <div className="n mono">01</div>
          <div><h4>Pattern-based correction</h4><p>Grammar explanations in Punjabi, targeted at mistakes we've seen hundreds of times — not generic textbook rules.</p></div>
        </div>
        <div className="why-item">
          <div className="n mono">02</div>
          <div><h4>Practice that doesn't stop at the classroom door</h4><p>The Lexio app extends every lesson into daily quizzes, vocabulary, and pronunciation practice — with streaks that keep you consistent.</p></div>
        </div>
        <div className="why-item">
          <div className="n mono">03</div>
          <div><h4>Real mock tests, real feedback</h4><p>Full-length simulations scored and reviewed by a real instructor — not just an answer key.</p></div>
        </div>
      </div>
    </div>
    <div className="why-panel">
      <div className="stat-grid">
        <div className="stat"><div className="num">9+</div><div className="lbl">Years teaching IELTS &amp; PTE</div></div>
        <div className="stat"><div className="num">47</div><div className="lbl">Structured app lessons</div></div>
        <div className="stat"><div className="num">1,434+</div><div className="lbl">App quiz questions</div></div>
        <div className="stat"><div className="num">4</div><div className="lbl">Courses — IELTS to German</div></div>
      </div>
    </div>
  </div>
</section>

<section id="app">
  <div className="wrap">
    <div className="app-cta">
      <div>
        <div className="eyebrow" style={{background: 'rgba(255,255,255,0.2)', color: '#fff'}}>Free To Start</div>
        <h2>Meet Lexio — practice that follows you home.</h2>
        <p>Our own learning app, built specifically for Pioneer Education students. Vocabulary, grammar, and full IELTS practice — with real progress tracking and a coach who can see how you're doing.</p>
        <div className="app-feats">
          <div>🔥 &nbsp;Daily streaks that actually build a habit</div>
          <div>🔊 &nbsp;Tap-to-hear pronunciation on every word</div>
          <div>📚 &nbsp;47 structured lessons, Beginner to IELTS</div>
          <div>🎯 &nbsp;1,434+ practice questions with Punjabi explanations</div>
        </div>
        <div style={{marginTop: '28px', display: 'flex', gap: '14px'}}>
          <a href="#" className="btn" style={{background: '#fff', color: 'var(--coral-dark)'}}>Get the App</a>
          <a href="#contact" className="btn btn-ghost-light">Ask About Access</a>
        </div>
      </div>
      <div className="phone-mock">
        <div className="phone-screen">
          <div className="ps-header">🔥 14 Day Streak</div>
          <div className="ps-row"><span>Word of the Day</span><span className="tag">🔊</span></div>
          <div className="ps-row"><span>IELTS · Writing Task 2</span><span className="tag">3/3 ✓</span></div>
          <div className="ps-row"><span>Grammar · Conditionals</span><span className="tag">In progress</span></div>
          <div className="ps-row"><span>XP earned this week</span><span className="tag">+340</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="instructor">
  <div className="wrap instructor">
    <div>
      <div style={{borderRadius: '22px', overflow: 'hidden', marginBottom: '0'}}>
        <img src="/images/instructor.jpg" alt="Narinder Singh, founder of Pioneer Education Center, Morinda" style={{width: '100%', display: 'block'}} />
      </div>
    </div>
    <div>
      <div className="role">Meet Your Instructor</div>
      <div className="name">Narinder Singh</div>
      <blockquote>"Every mistake a student makes has been made by someone before them. My job is to make sure you don't repeat it."</blockquote>
      <p className="bio">Narinder Singh founded Pioneer Education in 2017 as a TEFL-certified instructor, and has built a teaching approach rooted in pattern recognition — identifying exactly where each student's English breaks down, and fixing that specific gap rather than teaching generically. Today he leads a team of instructors delivering the same method across all four courses.</p>
      <div className="cred-row">
        <div className="cred"><div className="cred-icon">🎓</div><span>TEFL Certified</span></div>
        <div className="cred"><div className="cred-icon">⭐</div><span>5.0★ Google Rating</span></div>
        <div className="cred"><div className="cred-icon">📍</div><span>Prem Nagar, Morinda</span></div>
      </div>
    </div>
  </div>
</section>

<section id="reviews">
  <div className="wrap">
    <div className="section-head">
      <div className="section-eyebrow">From Our Students</div>
      <h2>5.0★ on Google, from 125+ real reviews.</h2>
    </div>
    <div className="reviews-strip">
      <div className="review-card">
        <div className="review-stars">★★★★★</div>
        <p>"Narinder Dhiman is the best teacher I have ever seen. I achieved my band scores only because of him. Anyone who thinks they can't achieve bands in IELTS must visit here."</p>
        <div className="reviewer"><div className="reviewer-avatar">HS</div><div><div className="rn">Harmeet Singh</div><div className="rr">Google Review</div></div></div>
      </div>
      <div className="review-card">
        <div className="review-stars">★★★★★</div>
        <p>"Pioneer Education is the best place to learn English. Staff is highly educated and polite. Visual presentations are very interesting. Sir also teaches life skills too."</p>
        <div className="reviewer"><div className="reviewer-avatar">RK</div><div><div className="rn">Ramneet Kang</div><div className="rr">Google Review</div></div></div>
      </div>
      <div className="review-card">
        <div className="review-stars">★★★★★</div>
        <p>"All teachers are highly qualified, very helpful and kind. I built my confidence and communication skills here. I learned important lessons and met inspiring teachers."</p>
        <div className="reviewer"><div className="reviewer-avatar">PK</div><div><div className="rn">Pavanpreet Kaur</div><div className="rr">Google Review</div></div></div>
      </div>
      <div className="review-card">
        <div className="review-stars">★★★★★</div>
        <p>"You can see the difference in the first 2 to 3 classes. They give suggestions to take good bands in IELTS and provide personal attention to every student."</p>
        <div className="reviewer"><div className="reviewer-avatar">HS</div><div><div className="rn">Harman Singh</div><div className="rr">Google Review</div></div></div>
      </div>
    </div>
  </div>
</section>

<section id="demo" style={{paddingBottom: '0'}}>
  <div className="wrap">
    <div className="lead-wrap">
      <div>
        <div className="section-eyebrow">Book a Free Demo</div>
        <h2>Try one class before you pay anything.</h2>
        <p>Leave your details and we'll message you on WhatsApp with the next available demo slot. No payment, no commitment.</p>
        <div className="lead-perks">
          <div>✓ &nbsp;First demo class always free</div>
          <div>✓ &nbsp;Sibling discount 20%</div>
          <div>✓ &nbsp;Refer &amp; Earn ₹500</div>
        </div>
      </div>
      <div className="lead-form">
        <div>
          <label htmlFor="lead-name">Your Name</label>
          <input type="text" id="lead-name" ref={nameRef} placeholder="e.g. Gurpreet Singh" required />
        </div>
        <div>
          <label htmlFor="lead-phone">Mobile Number</label>
          <input type="tel" id="lead-phone" ref={phoneRef} placeholder="10-digit mobile number" required />
        </div>
        <div>
          <label htmlFor="lead-course">Course You're Interested In</label>
          <select id="lead-course" ref={courseRef}>
            <option>IELTS</option>
            <option>PTE</option>
            <option>Spoken English</option>
            <option>German A1–B1</option>
            <option>Not sure yet</option>
          </select>
        </div>
        <button type="button" className="btn btn-coral" style={{width: '100%', justifyContent: 'center', marginTop: '6px'}} onClick={submitLead}>Request Free Demo Class</button>
        <div className="lead-note">We'll only use your number to contact you about classes.</div>
      </div>
    </div>
  </div>
</section>

<section id="chat" style={{paddingBottom: '0'}}>
  <div className="wrap" style={{textAlign: 'center', maxWidth: '600px'}}>
    <div className="section-eyebrow">Have Questions?</div>
    <h2 style={{fontSize: '1.9rem', color: 'var(--navy)', fontWeight: 600, marginBottom: '10px'}}>Our AI assistant answers instantly.</h2>
    <p style={{color: 'var(--grey)', fontSize: '0.98rem', marginBottom: '28px'}}>Or WhatsApp us directly at 73802-61308 if you'd rather talk to a person.</p>
    <Chatbot />
  </div>
</section>

<section id="contact">
  <div className="wrap">
    <div className="section-head">
      <div className="section-eyebrow">Visit Us</div>
      <h2>Find us in Prem Nagar, Morinda.</h2>
    </div>
    <div className="branches-grid" style={{gridTemplateColumns: '1fr', maxWidth: '520px'}}>
      <div className="branch-card">
        <div className="branch-name">📍 Morinda Centre</div>
        <p>1st Floor, Kalsi Cafe,<br />Opp. Khalsa Girls College,<br />Prem Nagar, Morinda 140101, Punjab</p>
        <p style={{fontSize: '0.85rem', marginBottom: '12px'}}>Mon–Sat · 8:30 AM – 7:00 PM &nbsp;·&nbsp; Sunday closed</p>
        <a href="tel:+917380261308" className="branch-phone">📞 +91 73802-61308</a>
      </div>
    </div>

    <div className="final-cta">
      <h2>Your test date is closer than you think.</h2>
      <p>Book a free demo class in Morinda, or start practicing on Lexio today — either way, let's get you moving.</p>
      <div className="btns">
        <a href="https://wa.me/917380261308" className="btn btn-coral">Message Us on WhatsApp</a>
        <a href="#app" className="btn" style={{background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)'}}>Get the Lexio App</a>
      </div>
    </div>
  </div>
</section>

<footer>
  <div className="wrap">
    <div className="footer-grid">
      <div>
        <div className="logo" style={{marginBottom: '14px'}}><div className="logo-mark">P</div>Pioneer Education</div>
        <p style={{color: 'var(--grey)', fontSize: '0.88rem', maxWidth: '260px'}}>IELTS, PTE, Spoken English &amp; German coaching in Prem Nagar, Morinda, Punjab. Since 2017.</p>
      </div>
      <div>
        <h5>Courses</h5>
        <a href="#courses">IELTS</a>
        <a href="#courses">PTE</a>
        <a href="#courses">Spoken English</a>
        <a href="#courses">German A1–B1</a>
      </div>
      <div>
        <h5>Company</h5>
        <a href="#why">Why Pioneer</a>
        <a href="#instructor">Instructor</a>
        <a href="#reviews">Reviews</a>
        <a href="#app">Lexio App</a>
      </div>
      <div>
        <h5>Contact</h5>
        <a href="https://wa.me/917380261308">WhatsApp: 73802-61308</a>
        <a href="#">Morinda, Prem Nagar</a>
        <a href="https://maps.google.com/?q=Pioneer+Spoken+English+IELTS+Morinda" target="_blank" rel="noopener noreferrer">Opp. Khalsa Girls College</a>
        <a href="#">@ielts_pioneer</a>
      </div>
    </div>
    <div className="footer-bottom">
      <div>© 2026 Pioneer Education Center. All rights reserved.</div>
      <div>#IELTSwithNarinderSir</div>
    </div>
  </div>
</footer>

<Chatbot />
    </>
  );
}
