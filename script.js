const shopPanel = document.querySelector('.shop-panel');
const networkButtons = document.querySelectorAll('.network-button');
const cartButton = document.querySelector('.cart-button');
const cartPanel = document.querySelector('#cart-panel');
const cartClose = document.querySelector('.cart-close');
const cartItems = document.querySelector('#cart-items');
const cartCount = document.querySelector('#cart-count');
const cartTotal = document.querySelector('#cart-total');
const cartCheckout = document.querySelector('#cart-checkout');
const paymentPanel = document.querySelector('#payment-panel');
const paymentTotal = document.querySelector('#payment-total');
const cashAppLink = document.querySelector('#cashapp-link');
const cashAppOpen = document.querySelector('#cashapp-open');
const receiptButton = document.querySelector('#receipt-button');
const musicToggle = document.querySelector('#music-toggle');
const musicLabel = document.querySelector('#music-label');
const musicSymbol = document.querySelector('#music-symbol');
const backgroundMusic = document.querySelector('#background-music');
const languageToggle = document.querySelector('#language-toggle');
const offers = [500, 1000, 2000, 5000, 10000];
let selectedNetwork = '';
let selectedType = 'Seguidores';
const cart = [];
const musicPreferenceKey = 'socialrise-music-enabled';
const languageKey = 'socialrise-language';
let language = localStorage.getItem(languageKey) === 'en' ? 'en' : 'es';
let musicPlaying = localStorage.getItem(musicPreferenceKey) !== 'false';

const translations = {
  es: {
    navServices: 'Servicios', navPrices: 'Precios', navContact: 'Contacto', cart: 'Carrito',
    eyebrow: 'Crecimiento social simple', heroTitle: 'Haz tu compra de', heroStrong: 'forma sencilla.',
    heroText: 'Selecciona una plataforma para comprar Likes, Seguidores o Vistas en pocos pasos.',
    fast: 'Rápido', inMinutes: 'En minutos.', safe: 'Seguro', reliable: '100% confiable.',
    easy: 'Fácil', simple: 'Sin complicaciones.', choosePlatform: 'Selecciona una plataforma',
    whichPlatform: '¿Qué plataforma quieres', grow: 'hacer crecer?', buy: '🛒 Comprar',
    supportLine: 'Compra segura · Atención por WhatsApp', contact: '◔ Contactar',
    yourOrder: 'Tu pedido', total: 'Total', checkout: 'Continuar con Cash App',
    paymentMethod: 'Método de pago', payCashApp: 'Paga con Cash App',
    paymentCopy: 'Envía el total de tu pedido a este identificador de Cash App:',
    openCashApp: 'Abrir Cash App', sendReceipt: 'Enviar comprobante por WhatsApp',
    paymentNote: 'Después del pago, envía el comprobante para validar y procesar tu pedido.',
    chooseService: 'Selecciona un servicio', followers: 'Seguidores', likes: 'Likes', views: 'Vistas',
    quickBuy: 'Compra rápida', addToCart: 'Añadir al carrito', remove: 'Eliminar',
    emptyCart: 'Tu carrito está vacío.', addPackage: 'Agrega al menos un paquete al carrito.'
  },
  en: {
    navServices: 'Services', navPrices: 'Pricing', navContact: 'Contact', cart: 'Cart',
    eyebrow: 'Simple social growth', heroTitle: 'Make your purchase', heroStrong: 'the easy way.',
    heroText: 'Choose a platform to buy Likes, Followers or Views in a few steps.',
    fast: 'Fast', inMinutes: 'In minutes.', safe: 'Secure', reliable: '100% trusted.',
    easy: 'Easy', simple: 'No complications.', choosePlatform: 'Choose a platform',
    whichPlatform: 'Which platform do you want to', grow: 'grow?', buy: '🛒 Shop',
    supportLine: 'Secure shopping · WhatsApp support', contact: '◔ Contact',
    yourOrder: 'Your order', total: 'Total', checkout: 'Continue with Cash App',
    paymentMethod: 'Payment method', payCashApp: 'Pay with Cash App',
    paymentCopy: 'Send your order total to this Cash App handle:',
    openCashApp: 'Open Cash App', sendReceipt: 'Send receipt on WhatsApp',
    paymentNote: 'After paying, send the receipt so we can validate and process your order.',
    chooseService: 'Choose a service', followers: 'Followers', likes: 'Likes', views: 'Views',
    quickBuy: 'Quick purchase', addToCart: 'Add to cart', remove: 'Remove',
    emptyCart: 'Your cart is empty.', addPackage: 'Add at least one package to the cart.'
  }
};

function t(key) {
  return translations[language][key] || key;
}

function typeLabel(type) {
  return type === 'Seguidores' ? t('followers') : type === 'Likes' ? t('likes') : t('views');
}

function applyTranslations() {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  languageToggle.textContent = language === 'es' ? 'EN' : 'ES';
  languageToggle.setAttribute('aria-label', language === 'es' ? 'Switch to English' : 'Cambiar a español');
  if (selectedNetwork) renderShop();
  renderCart();
}

function updateMusicButton() {
  musicToggle.classList.toggle('is-playing', musicPlaying);
  musicToggle.classList.toggle('is-muted', !musicPlaying);
  musicToggle.setAttribute('aria-pressed', String(musicPlaying));
  musicToggle.setAttribute('aria-label', musicPlaying ? 'Silenciar música' : 'Activar música');
  musicLabel.textContent = musicPlaying ? 'Mute' : 'Música';
  musicSymbol.textContent = musicPlaying ? '♫' : '♪';
}

function startMusic() {
  backgroundMusic.volume = 0.35;
  backgroundMusic.muted = false;
  backgroundMusic.play().catch(() => {
    backgroundMusic.muted = true;
  });
}

function setMusicState(shouldPlay) {
  musicPlaying = shouldPlay;
  localStorage.setItem(musicPreferenceKey, String(shouldPlay));
  updateMusicButton();

  if (shouldPlay) {
    startMusic();
  } else {
    backgroundMusic.pause();
  }
}

function money(value) {
  return `$${value} USD`;
}

function renderShop() {
  shopPanel.classList.add('is-visible');
  const price = (amount) => amount / 100;
  shopPanel.innerHTML = `
    <div class="shop-heading">
      <div>
        <h2>${selectedNetwork}</h2>
        <span>${t('chooseService')}</span>
      </div>
      <button class="shop-close" type="button" aria-label="Cerrar ofertas">×</button>
    </div>
    <div class="type-tabs">
      <button class="type-tab ${selectedType === 'Seguidores' ? 'active' : ''}" data-type="Seguidores">${t('followers')}</button>
      <button class="type-tab ${selectedType === 'Likes' ? 'active' : ''}" data-type="Likes">${t('likes')}</button>
      <button class="type-tab ${selectedType === 'Vistas' ? 'active' : ''}" data-type="Vistas">${t('views')}</button>
    </div>
    <div class="offer-grid">
      ${offers.map((amount) => `
        <button class="offer" data-amount="${amount}">
          <strong>${amount.toLocaleString('en-US')}</strong>
          <small>${typeLabel(selectedType)}</small>
          <span>${money(price(amount))}</span>
          <em>${t('addToCart')}</em>
        </button>
      `).join('')}
    </div>
    <div class="cart-bar">
      <div><strong>${t('quickBuy')}</strong><span> · ${selectedNetwork} · ${typeLabel(selectedType)}</span></div>
      <button class="checkout" type="button">${t('checkout')}</button>
    </div>
  `;

  shopPanel.querySelector('.shop-close').addEventListener('click', (event) => {
    event.stopPropagation();
    closeShop();
  });

  shopPanel.querySelectorAll('.type-tab').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      selectedType = button.dataset.type;
      renderShop();
    });
  });

  shopPanel.querySelectorAll('.offer').forEach((button) => {
    button.addEventListener('click', () => {
      const amount = Number(button.dataset.amount);
      cart.push({ network: selectedNetwork, type: selectedType, amount, price: amount / 100 });
      renderCart();
    });
  });

  shopPanel.querySelector('.checkout').addEventListener('click', () => {
    cartPanel.classList.add('is-open');
  });
}

function closeShop() {
  shopPanel.classList.remove('is-visible');
  networkButtons.forEach((item) => item.classList.remove('active'));
}

function renderCart() {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartCount.textContent = cart.length;
  cartTotal.textContent = money(total);

  if (!cart.length) {
    cartItems.innerHTML = `<p class="cart-empty">${t('emptyCart')}</p>`;
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <div>
        <strong>${item.network} · ${item.amount.toLocaleString('en-US')} ${typeLabel(item.type)}</strong>
        <small>${money(item.price)}</small>
      </div>
      <button class="cart-remove" type="button" data-index="${index}">${t('remove')}</button>
    </div>
  `).join('');

  cartItems.querySelectorAll('.cart-remove').forEach((button) => {
    button.addEventListener('click', () => {
      cart.splice(Number(button.dataset.index), 1);
      renderCart();
    });
  });
}

networkButtons.forEach((button) => {
  button.addEventListener('click', () => {
    networkButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    selectedNetwork = button.dataset.network;
    renderShop();
  });
});

document.addEventListener('click', (event) => {
  if (
    shopPanel.classList.contains('is-visible')
    && !shopPanel.contains(event.target)
    && !event.target.closest('.network-button')
  ) {
    closeShop();
  }
});

cartButton.addEventListener('click', () => cartPanel.classList.toggle('is-open'));
cartClose.addEventListener('click', () => cartPanel.classList.remove('is-open'));

cartCheckout.addEventListener('click', () => {
  if (!cart.length) {
    alert(t('addPackage'));
    return;
  }
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const cashAppUrl = `https://cash.app/$SocialRise/${total.toFixed(2)}`;
  paymentTotal.textContent = money(total);
  cashAppLink.href = cashAppUrl;
  cashAppOpen.href = cashAppUrl;
  paymentPanel.classList.add('is-open');
  paymentPanel.setAttribute('aria-hidden', 'false');
});

function orderMessage() {
  const summary = cart.map((item) => `${item.network}: ${item.amount.toLocaleString('en-US')} ${item.type} - ${money(item.price)}`).join('\n');
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  return `Hola SocialRise, ya realicé el pago por Cash App de mi pedido:\n${summary}\nTotal enviado: ${money(total)}\nMi usuario/enlace: `;
}

receiptButton.addEventListener('click', () => {
  if (!cart.length) return;
  const message = orderMessage();
  window.open(`https://wa.me/14323419865?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
});

renderCart();
updateMusicButton();

if (musicPlaying) {
  startMusic();
  const resumeSavedMusic = () => {
    if (musicPlaying) {
      backgroundMusic.muted = false;
      startMusic();
    }
    document.removeEventListener('pointerdown', resumeSavedMusic);
    document.removeEventListener('keydown', resumeSavedMusic);
    document.removeEventListener('touchstart', resumeSavedMusic);
  };
  document.addEventListener('pointerdown', resumeSavedMusic, { once: true });
  document.addEventListener('keydown', resumeSavedMusic, { once: true });
  document.addEventListener('touchstart', resumeSavedMusic, { once: true, passive: true });
} else {
  backgroundMusic.pause();
}

musicToggle.addEventListener('click', () => setMusicState(!musicPlaying));
languageToggle.addEventListener('click', (event) => {
  event.stopPropagation();
  language = language === 'es' ? 'en' : 'es';
  localStorage.setItem(languageKey, language);
  applyTranslations();
});

applyTranslations();
