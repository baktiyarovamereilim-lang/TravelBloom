'use strict';
// Display the actual site URL when hosted publicly (including GitHub Pages).
if (!['localhost', '127.0.0.1', ''].includes(window.location.hostname)) {
  const liveLink = document.createElement('a');
  const liveUrl = new URL('index.html', window.location.href).href;
  liveLink.href = liveUrl;
  liveLink.textContent = 'Live website: ' + liveUrl;
  document.querySelector('footer').append(liveLink);
}
// Replace this placeholder with your email address before publishing.
const CONTACT_EMAIL = 'hello@example.com';
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const results = document.getElementById('results');
const status = document.getElementById('searchStatus');
let dataPromise;
let searchVersion = 0;

// Fetch once, reuse the JSON, and allow a retry if loading fails.
function loadDestinations() {
  if (!dataPromise) {
    dataPromise = fetch('travel_recommendation_api.json').then(response => {
      if (!response.ok) throw new Error('Unable to load destinations.');
      return response.json();
    }).catch(error => { dataPromise = undefined; throw error; });
  }
  return dataPromise;
}
function findRecommendations(data, keyword) {
  const query = keyword.trim().toLowerCase();
  if (/^beach(es)?$/.test(query)) return data.beaches;
  if (/^temples?$/.test(query)) return data.temples;
  if (/^(country|countries)$/.test(query)) return data.countries;
  const destinations = [...data.beaches, ...data.temples, ...data.countries,
    ...data.countries.flatMap(country => country.cities)];
  return destinations.filter(place => place.name.toLowerCase().includes(query));
}
function renderRecommendations(places) {
  results.replaceChildren();
  places.forEach(place => {
    const card = document.createElement('article');
    card.className = 'destination';
    const image = document.createElement('img');
    image.src = place.imageUrl;
    image.alt = `Illustration of ${place.name}`;
    const body = document.createElement('div');
    body.className = 'card-body';
    const title = document.createElement('h3');
    title.textContent = place.name;
    const description = document.createElement('p');
    description.textContent = place.description;
    const time = document.createElement('p');
    time.className = 'local-time';
    time.textContent = 'Local time: ' + new Intl.DateTimeFormat('en-US', {
      timeZone: place.timeZone, hour: '2-digit', minute: '2-digit'
    }).format(new Date());
    const visit = document.createElement('a');
    visit.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place.name);
    visit.target = '_blank';
    visit.rel = 'noopener noreferrer';
    visit.textContent = 'View destination on map ↗';
    body.append(title, description, time, visit);
    card.append(image, body);
    results.append(card);
  });
}
async function searchDestinations(keyword) {
  const version = ++searchVersion;
  results.replaceChildren();
  if (!keyword.trim()) {
    status.textContent = 'Enter a keyword such as beach, temple or country.';
    searchInput.focus();
    return;
  }
  status.textContent = 'Loading recommendations…';
  try {
    const data = await loadDestinations();
    // An earlier request must not restore results after Clear or a new search.
    if (version !== searchVersion) return;
    const places = findRecommendations(data, keyword);
    renderRecommendations(places);
    status.textContent = places.length ? `${places.length} recommendations for “${keyword.trim()}”.`
      : 'No destinations found. Try beach, temple, country, or a destination name.';
  } catch (error) {
    if (version !== searchVersion) return;
    status.textContent = 'Could not load recommendations. Please retry. Run this project on a web server so the JSON file can load.';
  }
}
searchForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!results) { window.location.href = 'index.html?q=' + encodeURIComponent(searchInput.value); return; }
  searchDestinations(searchInput.value);
  document.getElementById('recommendations').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('clearButton').addEventListener('click', () => {
  ++searchVersion;
  searchInput.value = '';
  if (results) {
    results.replaceChildren();
    status.textContent = 'Search above or choose a category to discover your next destination.';
    history.replaceState(null, '', window.location.pathname);
  }
  searchInput.focus();
});
document.querySelectorAll('[data-query]').forEach(button => {
  button.addEventListener('click', () => {
    searchInput.value = button.dataset.query;
    searchDestinations(searchInput.value);
  });
});
document.getElementById('exploreButton')?.addEventListener('click', () => searchInput.focus({ preventScroll: true }));
const incomingQuery = new URLSearchParams(window.location.search).get('q');
if (results && incomingQuery !== null) {
  searchInput.value = incomingQuery;
  searchDestinations(incomingQuery);
  document.getElementById('recommendations').scrollIntoView();
}
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach(link => {
  if (link.getAttribute('href') === currentPage || (currentPage === 'travel_recommendation.html' && link.getAttribute('href') === 'index.html')) link.setAttribute('aria-current', 'page');
});
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  const emailLink = document.getElementById('contactEmailLink');
  emailLink.textContent = CONTACT_EMAIL;
  emailLink.href = 'mailto:' + CONTACT_EMAIL;
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const contactStatus = document.getElementById('contactStatus');
    if (!name || !email || message.length < 5) {
      contactStatus.textContent = 'Please enter your name, email and a message of at least five characters.';
      return;
    }
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const draft = document.getElementById('emailDraft');
    draft.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('TravelBloom enquiry from ' + name)}&body=${encodeURIComponent(body)}`;
    draft.hidden = false;
    contactStatus.textContent = 'Your draft is ready. Click below to open your email app, review it and send.';
  });
}
