// TMDB API bilan ishlash sozlamalari
const API_KEY = 'b7ca309087c9dfbfad7cf20e8b4e85ef'; // Haqiqiy ishchi kalit
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

// 1. API-DAN MA'LUMOTLARNI YUKLASH FUNKSIYASI
async function fetchMovies(endpoint, containerId, isVideo = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '<p style="padding:20px; color:#666;">Yuklanmoqda...</p>';

  try {
    const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US&page=1`);
    const data = await response.json();
    
    container.innerHTML = ''; // Tozalash
    
    data.results.forEach(movie => {
      const title = movie.title || movie.name;
      const releaseDate = movie.release_date || movie.first_air_date || 'Tez kunda';
      const posterPath = movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : 'https://placehold.co/150x225?text=No+Image';
      
      if (isVideo) {
        // Treylerlar qismi uchun (Rasm eniga kattaroq kartochka)
        const backdropPath = movie.backdrop_path ? `${IMAGE_URL}${movie.backdrop_path}` : posterPath;
        container.innerHTML += `
          <div class="card video-card" onclick="loadMovieDetailData(${movie.id}, 'movie')">
            <div class="image-wrap">
              <img src="${backdropPath}" alt="${title}">
              <div class="play-icon">▶</div>
              <button class="opt-btn" onclick="event.stopPropagation()">•••</button>
            </div>
            <div class="info-wrap">
              <h3>${title}</h3>
              <p>Rating: ${Math.round(movie.vote_average * 10)}%</p>
            </div>
          </div>`;
      } else {
        // Standart Gorizontal Kino ro'yxati (Trend va Ommabop uchun)
        const mediaType = movie.media_type || (containerId.includes('tv') ? 'tv' : 'movie');
        container.innerHTML += `
          <div class="card" onclick="loadMovieDetailData(${movie.id}, '${mediaType}')">
            <div class="image-wrap">
              <img src="${posterPath}" alt="${title}">
              <button class="opt-btn" onclick="event.stopPropagation()">•••</button>
            </div>
            <div class="info-wrap">
              <h3>${title}</h3>
              <p>${releaseDate}</p>
            </div>
          </div>`;
      }
    });
  } catch (error) {
    container.innerHTML = '<p style="padding:20px; color:red;">Maʼlumot yuklashda xatolik yuz berdi.</p>';
    console.error(error);
  }
}

// 2. USER TANLAGAN FILMNING BARCHA DETALLARINI API-DAN OLISH
async function loadMovieDetailData(id, type) {
  try {
    // Bir vaqtning o'zida film detallari va aktyorlarni chaqiramiz
    const [detailRes, creditsRes] = await Promise.all([
      fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=en-US`),
      fetch(`${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}`)
    ]);
    
    const movie = await detailRes.json();
    const credits = await creditsRes.json();
    
    // Asosiy sahifani yashirib, Detal sahifani ochamiz
    document.getElementById('main-page').classList.remove('active');
    document.getElementById('detail-page').classList.add('active');
    
    // Ma'lumotlarni HTML ga joylash
    const title = movie.title || movie.name;
    const year = (movie.release_date || movie.first_air_date || '2026').substring(0, 4);
    document.getElementById('detail-title').innerHTML = `${title} <span>(${year})</span>`;
    document.getElementById('detail-date').innerText = movie.release_date || movie.first_air_date || '-';
    
    // Reyting foizi
    const score = Math.round(movie.vote_average * 10);
    document.getElementById('detail-score').innerText = `${score}%`;
    
    // Janrlar matni
    const genres = movie.genres.map(g => g.name).join(', ');
    document.getElementById('detail-genres').innerText = genres || 'Drama';
    
    document.getElementById('detail-tagline').innerText = movie.tagline || '';
    document.getElementById('detail-desc').innerText = movie.overview || 'Bu film uchun qisqacha mazmun kiritilmagan.';
    document.getElementById('detail-lang').innerText = movie.original_language ? movie.original_language.toUpperCase() : 'EN';
    
    // Byudjet formatlash
    const budget = movie.budget ? '$' + movie.budget.toLocaleString() : '$12,000,000.00';
    document.getElementById('detail-budget').innerText = budget;

    // Poster va katta orqa fon (Banner)
    document.getElementById('detail-img').src = movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : 'https://placehold.co/300x450';
    const bgImg = movie.backdrop_path ? `${BACKDROP_URL}${movie.backdrop_path}` : `${BACKDROP_URL}${movie.poster_path}`;
    document.getElementById('movie-banner').style.backgroundImage = `url('${bgImg}')`;

    // Rejissyor va ssenaristni topish
    const director = credits.crew.find(c => c.job === 'Director');
    const writer = credits.crew.find(c => c.job === 'Writer' || c.job === 'Screenplay');
    document.getElementById('detail-director').innerText = director ? director.name : 'Kane Parsons';
    document.getElementById('detail-writer').innerText = writer ? writer.name : 'Will Soodik';

    // Aktyorlarni skrollerga joylash
    const castContainer = document.getElementById('cast-container');
    castContainer.innerHTML = '';
    
    const mainCast = credits.cast.slice(0, 8); // Dastlabki 8 ta asosiy aktyor
    if(mainCast.length === 0) {
      castContainer.innerHTML = '<p style="color:#fff; padding:10px;">Aktyorlar roʻyxati topilmadi.</p>';
    } else {
      mainCast.forEach(actor => {
        const actorImg = actor.profile_path ? `${IMAGE_URL}${actor.profile_path}` : 'https://placehold.co/130x175?text=No+Photo';
        castContainer.innerHTML += `
          <div class="cast-card">
            <img class="cast-img" src="${actorImg}" alt="${actor.name}">
            <div class="cast-info">
              <h4>${actor.name}</h4>
              <p>${actor.character}</p>
            </div>
          </div>`;
      });
    }

    window.scrollTo(0, 0); // Sahifani tepaga qaytarish
  } catch (error) {
    alert("Kino tafsilotlarini yuklashda xatolik yuz berdi!");
    console.error(error);
  }
}

// 3. ORQAGA QAYTISH
function backToMain() {
  document.getElementById('detail-page').classList.remove('active');
  document.getElementById('main-page').classList.add('active');
}

// SWITCHER TUGMALARINI BOSHQARISH
function setupToggle(btnId, endpoint, containerId, isVideo = false) {
  const btn = document.getElementById(btnId);
  if(!btn) return;
  btn.addEventListener('click', (e) => {
    const parent = e.target.parentElement;
    parent.querySelector('.anchor.active').classList.remove('active');
    e.target.classList.add('active');
    fetchMovies(endpoint, containerId, isVideo);
  });
}

// SAHIFA ILK BOR YUKLANGANDA ISHLAYDIGAN START QISMI
document.addEventListener('DOMContentLoaded', () => {
  // Dastlabki ma'lumotlarni yuklash (Trend, Treyler, Ommabop)
  fetchMovies('/trending/movie/day', 'trend-scroller');
  fetchMovies('/movie/upcoming', 'video-scroller', true);
  fetchMovies('/tv/popular', 'popular-scroller');

  // Tugmalar bosilganda API so'rovlarini almashtirish
  setupToggle('trend-today', '/trending/movie/day', 'trend-scroller');
  setupToggle('trend-week', '/trending/movie/week', 'trend-scroller');
  
  setupToggle('trailer-popular', '/movie/upcoming', 'video-scroller', true);
  setupToggle('trailer-theaters', '/movie/now_playing', 'video-scroller', true);
  
  setupToggle('pop-tv', '/tv/popular', 'popular-scroller');
  setupToggle('pop-movie', '/movie/popular', 'popular-scroller');
});