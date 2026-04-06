/* ═══════════════════════════════════════════════════════════
   PORTFOLIO — main.js
   Handles: navbar, mobile menu, scroll reveal, contact form
   ═══════════════════════════════════════════════════════════ */

/* ── Navbar: add 'scrolled' class after scrolling down ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

/* ── Mobile hamburger menu ── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  // Animate hamburger → ✕
  const spans = hamburger.querySelectorAll('span');
  if (navLinks.classList.contains('open')) {
    spans[0].style.cssText = 'transform: rotate(45deg) translate(5px, 5px)';
    spans[1].style.cssText = 'opacity: 0; transform: scaleX(0)';
    spans[2].style.cssText = 'transform: rotate(-45deg) translate(5px, -5px)';
  } else {
    spans.forEach(s => s.style.cssText = '');
  }
});

// Close menu when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(s => s.style.cssText = '');
  });
});

/* ── Scroll Reveal ── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        // Stagger sibling items
        const siblings = entry.target.parentElement.querySelectorAll('.reveal');
        let delay = 0;
        siblings.forEach((sib, i) => { if (sib === entry.target) delay = i * 80; });
        setTimeout(() => entry.target.classList.add('visible'), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── Active nav link highlight on scroll ── */
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navAnchors.forEach(a => {
          a.style.color = '';
          if (a.getAttribute('href') === `#${id}` && !a.classList.contains('nav-cta')) {
            a.style.color = 'var(--accent)';
          }
        });
      }
    });
  },
  { rootMargin: '-45% 0px -45% 0px' }
);
sections.forEach(s => sectionObserver.observe(s));

/* ── Profile photo fallback ── */
const profilePhoto = document.getElementById('profilePhoto');
if (profilePhoto) {
  profilePhoto.addEventListener('error', () => {
    profilePhoto.src = '';
    profilePhoto.style.display = 'none';
    const frame = profilePhoto.parentElement;
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      width: 100%; height: 100%;
      border-radius: 20px;
      background: var(--surface-2);
      display: flex; align-items: center; justify-content: center;
      font-size: 4rem; color: var(--accent);
      position: relative; z-index: 1;
    `;
    placeholder.innerHTML = '<i class="fa-solid fa-user"></i>';
    frame.insertBefore(placeholder, profilePhoto);
  });
}

/* ── Contact form (opens mailto — no backend needed) ── */
function handleContact() {
  const name    = document.getElementById('name').value.trim();
  const email   = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();
  const note    = document.getElementById('formNote');

  if (!name || !email || !message) {
    note.textContent = '⚠ Please fill in all fields.';
    note.style.color = '#f87171';
    return;
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    note.textContent = '⚠ Please enter a valid email address.';
    note.style.color = '#f87171';
    return;
  }

  // Opens the user's email client with pre-filled info
  const subject  = encodeURIComponent(`Portfolio Contact: ${name}`);
  const body     = encodeURIComponent(`From: ${name}\nEmail: ${email}\n\n${message}`);
  window.location.href = `mailto:victorm.br@outlook.com?subject=${subject}&body=${body}`;

  note.textContent = '✓ Opening your email client…';
  note.style.color = 'var(--accent-3)';

  // Clear form after short delay
  setTimeout(() => {
    document.getElementById('name').value    = '';
    document.getElementById('email').value   = '';
    document.getElementById('message').value = '';
    note.textContent = '';
  }, 3000);
}

/* ── Smooth scroll for anchor links (fallback for older Safari) ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

function createBinaryBackground() {
  const container = document.getElementById("binaryBg");
  if (!container) return;

  const totalDigits = 45;
  const colors = ["", "alt", "green"];

  for (let i = 0; i < totalDigits; i++) {
    const digit = document.createElement("span");
    digit.classList.add("binary-digit");

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    if (randomColor) digit.classList.add(randomColor);

    digit.textContent = Math.random() > 0.5 ? "1" : "0";

    digit.style.left = `${Math.random() * 100}%`;
    digit.style.top = `${20 + Math.random() * 80}%`;
    digit.style.fontSize = `${0.8 + Math.random() * 1.2}rem`;
    digit.style.animationDuration = `${8 + Math.random() * 8}s`;
    digit.style.animationDelay = `${Math.random() * 8}s`;

    container.appendChild(digit);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  createBinaryBackground();
});
/* ── Cursor glow effect (desktop only) ── */
if (window.matchMedia('(pointer: fine)').matches) {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed; pointer-events: none; z-index: 9999;
    width: 300px; height: 300px; border-radius: 50%;
    background: radial-gradient(circle, rgba(56,189,248,.06) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: opacity .4s ease;
  `;
  document.body.appendChild(glow);
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
  document.addEventListener('mouseleave', () => glow.style.opacity = '0');
  document.addEventListener('mouseenter', () => glow.style.opacity = '1');
}

document.addEventListener('DOMContentLoaded', () => {
  createBinaryBackground();
});
