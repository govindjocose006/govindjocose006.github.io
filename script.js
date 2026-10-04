'use strict';
document.documentElement.classList.add('js');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
function closeNav() { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); });
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { closeNav(); toggle.focus(); } });
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const caption = document.querySelector('#lightbox-caption');
const position = document.querySelector('#photo-position');
let previousFocus;
let album = [];
let photoIndex = 0;
function showPhoto(index) {
  photoIndex = (index + album.length) % album.length;
  const button = album[photoIndex];
  lightboxImage.removeAttribute('style');
  lightboxImage.dataset.rotate = button.dataset.rotate || '0';
  lightboxImage.src = button.dataset.image;
  lightboxImage.alt = button.querySelector('img').alt;
  caption.textContent = button.dataset.caption;
  position.textContent = `${photoIndex + 1} / ${album.length}`;
  if (lightboxImage.complete) fitPhotographs();
}
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
  previousFocus = button;
  const gallery = button.closest('.gallery-expanded');
  const candidates = gallery ? [...gallery.querySelectorAll('figure:not([hidden]) [data-image]')] : [...document.querySelectorAll('[data-image]')];
  const seen = new Set();
  album = candidates.filter(item => { if (seen.has(item.dataset.image)) return false; seen.add(item.dataset.image); return true; });
  showPhoto(album.findIndex(item => item.dataset.image === button.dataset.image));
  lightbox.showModal();
  fitPhotographs();
  document.body.style.overflow = 'hidden';
}));
document.querySelector('#photo-previous').addEventListener('click', () => showPhoto(photoIndex - 1));
document.querySelector('#photo-next').addEventListener('click', () => showPhoto(photoIndex + 1));
lightbox.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); showPhoto(photoIndex + (e.key === 'ArrowRight' ? 1 : -1)); }
});
lightbox.querySelector('.close-dialog').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', e => { if (e.target === lightbox) { const rect = lightbox.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) lightbox.close(); } });
lightbox.addEventListener('close', () => { document.body.style.overflow = ''; previousFocus?.focus(); });
const filters = document.querySelectorAll('[data-filter]');
const galleryFigures = document.querySelectorAll('.gallery-expanded figure');
filters.forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  galleryFigures.forEach(figure => { figure.hidden = category !== 'all' && figure.dataset.category !== category; if (!figure.hidden) count++; });
  document.querySelector('#gallery-status').textContent = `${count} photographs`;
  fitPhotographs();
}));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { nav.querySelectorAll('a[href^="#"]').forEach(link => { if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }); } });
  }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
  document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
}

// Keep the original group photograph intact and orient it for display.
function fitRotatedImage(img, container, angle) {
  if (!angle) { img.removeAttribute('style'); return; }
  if (!img.naturalWidth || !container.clientWidth || !container.clientHeight) return;
  const scale = Math.min(container.clientWidth / img.naturalHeight, container.clientHeight / img.naturalWidth);
  Object.assign(img.style, { position: 'absolute', left: '50%', top: '50%', width: `${img.naturalWidth * scale}px`, height: `${img.naturalHeight * scale}px`, maxWidth: 'none', maxHeight: 'none', transform: `translate(-50%, -50%) rotate(${angle}deg)` });
}
const rotatedPhotos = [...document.querySelectorAll('.rotate-photo')];
function fitPhotographs() {
  rotatedPhotos.forEach(button => fitRotatedImage(button.querySelector('img'), button, Number(button.dataset.rotate)));
  if (lightbox.open) fitRotatedImage(lightboxImage, lightboxImage.parentElement, Number(lightboxImage.dataset.rotate || 0));
}
rotatedPhotos.forEach(button => button.querySelector('img').addEventListener('load', fitPhotographs));
lightboxImage.addEventListener('load', fitPhotographs);
window.addEventListener('resize', fitPhotographs);
if ('ResizeObserver' in window) {
  const photoResize = new ResizeObserver(fitPhotographs);
  rotatedPhotos.forEach(button => photoResize.observe(button));
  photoResize.observe(lightboxImage.parentElement);
}
fitPhotographs();

// Pause on focus, pointer hover, manual navigation, or a hidden browser tab.
const carousel = document.querySelector('.hero-carousel');
const slides = [...carousel.querySelectorAll('.hero-slide')];
const dots = [...carousel.querySelectorAll('[data-slide]')];
const pauseButton = document.querySelector('#slide-pause');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeSlide = 0;
let userPaused = motionPreference.matches;
let hovered = false;
let focused = false;
let slideTimer;
function scheduleSlides() {
  clearInterval(slideTimer);
  pauseButton.textContent = userPaused ? 'Play' : 'Pause';
  pauseButton.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
  carousel.querySelector('.hero-slides').setAttribute('aria-live', userPaused ? 'polite' : 'off');
  if (!userPaused && !hovered && !focused && !document.hidden) slideTimer = setInterval(() => selectSlide(activeSlide + 1), 6500);
}
function selectSlide(index, manual = false) {
  activeSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => { slide.hidden = i !== activeSlide; });
  dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === activeSlide)));
  if (manual) { userPaused = true; scheduleSlides(); }
}
document.querySelector('#slide-previous').addEventListener('click', () => selectSlide(activeSlide - 1, true));
document.querySelector('#slide-next').addEventListener('click', () => selectSlide(activeSlide + 1, true));
dots.forEach(dot => dot.addEventListener('click', () => selectSlide(Number(dot.dataset.slide), true)));
pauseButton.addEventListener('click', () => { userPaused = !userPaused; scheduleSlides(); });
carousel.addEventListener('mouseenter', () => { hovered = true; scheduleSlides(); });
carousel.addEventListener('mouseleave', () => { hovered = false; scheduleSlides(); });
carousel.addEventListener('focusin', () => { focused = true; scheduleSlides(); });
carousel.addEventListener('focusout', event => { if (!carousel.contains(event.relatedTarget)) { focused = false; scheduleSlides(); } });
document.addEventListener('visibilitychange', scheduleSlides);
motionPreference.addEventListener('change', event => { userPaused = event.matches; scheduleSlides(); });
scheduleSlides();
