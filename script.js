const shopPanel = document.querySelector('.shop-panel');
const networkButtons = document.querySelectorAll('.network-button');
const cartButton = document.querySelector('.cart-button');
const cartPanel = document.querySelector('#cart-panel');
const cartClose = document.querySelector('.cart-close');
const cartItems = document.querySelector('#cart-items');
const cartCount = document.querySelector('#cart-count');
const cartTotal = document.querySelector('#cart-total');
const cartToast = document.querySelector('#cart-toast');
const cartToastMessage = document.querySelector('#cart-toast-message');
const cartCheckout = document.querySelector('#cart-checkout');
const paymentPanel = document.querySelector('#payment-panel');
const paymentTotal = document.querySelector('#payment-total');
const cashAppLink = document.querySelector('#cashapp-link');
const cashAppOpen = document.querySelector('#cashapp-open');
const cashAppTag = document.querySelector('#cashapp-tag');
const cashAppLinkWrap = document.querySelector('#cashapp-link-wrap');
const paymentTitle = document.querySelector('#payment-title');
const paymentCopy = document.querySelector('#payment-copy');
const binanceQr = document.querySelector('#binance-qr');
const paypalQr = document.querySelector('#paypal-qr');
const paymentMethodButtons = document.querySelectorAll('.payment-method');
const receiptButton = document.querySelector('#receipt-button');
const musicToggle = document.querySelector('#music-toggle');
const musicLabel = document.querySelector('#music-label');
const musicSymbol = document.querySelector('#music-symbol');
const backgroundMusic = document.querySelector('#background-music');
const languageToggle = document.querySelector('#language-toggle');
const baseUnits = 10000;
const basePrice = 90;
const likesBasePrice = 55;
const orderDiscountThreshold = 90;
const orderDiscountPercentage = 30;
const viewsPriceMultiplier = 0.5;
let selectedNetwork = '';
let selectedType = 'Seguidores';
let selectedPaymentMethod = 'cashapp';
let cartToastTimeout;
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
    yourOrder: 'Tu pedido', total: 'Total', checkout: 'Elegir método de pago',
    paymentMethod: 'Método de pago', payCashApp: 'Paga con Cash App',
    paymentCopy: 'Envía el total de tu pedido a este identificador de Cash App:',
    openCashApp: 'Abrir Cash App', sendReceipt: 'Enviar comprobante por WhatsApp',
    paymentNote: 'Después del pago, envía el comprobante para validar y procesar tu pedido.',
    choosePayment: 'Elige cómo pagar', payBinance: 'Paga con Binance BNB', payPayPal: 'Paga con PayPal',
    binanceCopy: 'Escanea este código QR desde Binance Pay y envía el total en BNB.',
    paypalCopy: 'Escanea este código QR con la cámara o la app de PayPal para enviar el total.',
    scanQr: 'Escanea el código QR',
    chooseService: 'Selecciona un servicio', followers: 'Seguidores', likes: 'Likes', views: 'Vistas',
    targetUsername: 'Usuario de la red social', targetVideoLink: 'Enlace del video',
    targetUsernameHelp: 'Escribe el usuario al que enviaremos los seguidores.',
    targetVideoHelp: 'Pega el enlace completo del video para recibir likes o vistas.',
    targetRequired: 'Completa el usuario o enlace antes de continuar.',
    targetUsernameInvalid: 'Escribe un usuario válido de la red social.',
    targetVideoInvalid: 'Escribe un enlace válido que empiece por http:// o https://.',
    quickBuy: 'Compra rápida', addToCart: 'Añadir al carrito', remove: 'Eliminar',
    quantity: '¿Cuántos quieres?', baseRate: '10.000 por $90 · $0,90 por cada 100', likesRate: '10.000 Likes por $55 · $0,55 por cada 100', viewsRate: '10.000 vistas por $45 · $0,45 por cada 100', discount: 'Descuento automático',
    discountFrom: 'desde', serviceAdded: 'Servicio añadido al carrito',
    emptyCart: 'Tu carrito está vacío.', addPackage: 'Agrega al menos un paquete al carrito.', cartAdded: 'Se añadió al carrito:',
    priceFor: 'Precio para tu pedido', regularPrice: 'Precio regular', youSave: 'Ahorras',
    discountTiers: '30% en pedidos superiores a $90', minimumQuantity: 'Mínimo 100', units: 'unidades'
  },
  en: {
    navServices: 'Services', navPrices: 'Pricing', navContact: 'Contact', cart: 'Cart',
    eyebrow: 'Simple social growth', heroTitle: 'Make your purchase', heroStrong: 'the easy way.',
    heroText: 'Choose a platform to buy Likes, Followers or Views in a few steps.',
    fast: 'Fast', inMinutes: 'In minutes.', safe: 'Secure', reliable: '100% trusted.',
    easy: 'Easy', simple: 'No complications.', choosePlatform: 'Choose a platform',
    whichPlatform: 'Which platform do you want to', grow: 'grow?', buy: '🛒 Shop',
    supportLine: 'Secure shopping · WhatsApp support', contact: '◔ Contact',
    yourOrder: 'Your order', total: 'Total', checkout: 'Choose payment method',
    paymentMethod: 'Payment method', payCashApp: 'Pay with Cash App',
    paymentCopy: 'Send your order total to this Cash App handle:',
    openCashApp: 'Open Cash App', sendReceipt: 'Send receipt on WhatsApp',
    paymentNote: 'After paying, send the receipt so we can validate and process your order.',
    choosePayment: 'Choose how to pay', payBinance: 'Pay with Binance BNB', payPayPal: 'Pay with PayPal',
    binanceCopy: 'Scan this QR code in Binance Pay and send the total in BNB.',
    paypalCopy: 'Scan this QR code with your camera or the PayPal app to send the total.',
    scanQr: 'Scan the QR code',
    chooseService: 'Choose a service', followers: 'Followers', likes: 'Likes', views: 'Views',
    targetUsername: 'Social media username', targetVideoLink: 'Video link',
    targetUsernameHelp: 'Enter the username that should receive the followers.',
    targetVideoHelp: 'Paste the full video link for likes or views.',
    targetRequired: 'Complete the username or link before continuing.',
    targetUsernameInvalid: 'Enter a valid social media username.',
    targetVideoInvalid: 'Enter a valid link starting with http:// or https://.',
    quickBuy: 'Quick purchase', addToCart: 'Add to cart', remove: 'Remove',
    quantity: 'How many do you want?', baseRate: '10,000 for $90 · $0.90 per 100', likesRate: '10,000 Likes for $55 · $0.55 per 100', viewsRate: '10,000 views for $45 · $0.45 per 100', discount: 'Automatic discount',
    discountFrom: 'from', serviceAdded: 'Service added to cart',
    emptyCart: 'Your cart is empty.', addPackage: 'Add at least one package to the cart.', cartAdded: 'Added to cart:',
    priceFor: 'Your order price', regularPrice: 'Regular price', youSave: 'You save',
    discountTiers: '30% on orders above $90', minimumQuantity: 'Minimum 100', units: 'units'
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
  updatePaymentMethod(selectedPaymentMethod);
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
  backgroundMusic.volume = 0.28;
  backgroundMusic.play().catch((error) => {
    console.warn('La música se activará al pulsar el botón de música.', error);
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
  return `$${value.toFixed(2)} USD`;
}

function showCartToast(message) {
  window.clearTimeout(cartToastTimeout);
  cartToastMessage.textContent = message;
  cartToast.classList.add('is-visible');
  cartToastTimeout = window.setTimeout(() => cartToast.classList.remove('is-visible'), 3200);
}

function getRateDescription(type) {
  if (type === 'Vistas') return t('viewsRate');
  if (type === 'Likes') return t('likesRate');
  return t('baseRate');
}

function getRegularPrice(amount, type) {
  const unitPrice = type === 'Likes'
    ? likesBasePrice
    : type === 'Vistas'
      ? basePrice * viewsPriceMultiplier
      : basePrice;
  return (amount / baseUnits) * unitPrice;
}

function getDiscountPercentage(amount, type) {
  return getRegularPrice(amount, type) > orderDiscountThreshold ? orderDiscountPercentage : 0;
}

function getPrice(amount, type) {
  const discount = getDiscountPercentage(amount, type);
  return getRegularPrice(amount, type) * (1 - discount / 100);
}

function targetField(type) {
  const isFollowers = type === 'Seguidores';
  return {
    label: isFollowers ? t('targetUsername') : t('targetVideoLink'),
    help: isFollowers ? t('targetUsernameHelp') : t('targetVideoHelp'),
    placeholder: isFollowers ? '@usuario' : 'https://...',
  };
}

function isValidTarget(target, type) {
  if (!target) return false;
  if (type === 'Seguidores') return /^@?[a-zA-Z0-9._-]{2,50}$/.test(target);
  try {
    const url = new URL(target);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function paymentMethodName(method = selectedPaymentMethod) {
  return method === 'binance' ? 'Binance BNB' : method === 'paypal' ? 'PayPal' : 'Cash App';
}

function updatePaymentMethod(method) {
  selectedPaymentMethod = method;
  const isCashApp = method === 'cashapp';
  const isBinance = method === 'binance';

  paymentMethodButtons.forEach((button) => {
    const isSelected = button.dataset.paymentMethod === method;
    button.classList.toggle('active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });

  paymentTitle.textContent = isCashApp ? t('payCashApp') : isBinance ? t('payBinance') : t('payPayPal');
  paymentCopy.textContent = isCashApp ? t('paymentCopy') : isBinance ? t('binanceCopy') : t('paypalCopy');
  cashAppTag.hidden = !isCashApp;
  cashAppLinkWrap.hidden = !isCashApp;
  cashAppOpen.hidden = !isCashApp;
  binanceQr.hidden = !isBinance;
  paypalQr.hidden = method !== 'paypal';
}

function renderShop() {
  shopPanel.classList.add('is-visible');
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
    <div class="custom-order">
      <label for="service-quantity">${t('quantity')} (${typeLabel(selectedType)})</label>
      <div class="quantity-control">
        <input id="service-quantity" type="number" min="100" step="100" value="10000" inputmode="numeric" aria-describedby="quantity-help" />
        <span>${t('units')}</span>
      </div>
      <small id="quantity-help" class="quantity-help">${t('minimumQuantity')} · ${getRateDescription(selectedType)}</small>
      <label for="service-target">${targetField(selectedType).label}</label>
      <input id="service-target" type="${selectedType === 'Seguidores' ? 'text' : 'url'}" placeholder="${targetField(selectedType).placeholder}" autocomplete="off" required />
      <small id="target-help" class="quantity-help">${targetField(selectedType).help}</small>
      <div class="price-summary">
        <span>${t('priceFor')}</span>
        <strong id="calculated-price">${money(getPrice(baseUnits, selectedType))}</strong>
      </div>
      <div class="price-details">
        <span>${t('regularPrice')} <b id="regular-price">${money(getRegularPrice(baseUnits, selectedType))}</b></span>
        <span id="saving-line" hidden>${t('youSave')} <b id="saving-price">$0.00 USD</b></span>
      </div>
      <small class="discount-note" id="discount-note">${t('discount')}: 0% · ${t('discountTiers')}</small>
      <button class="add-custom-order" type="button">${t('addToCart')}</button>
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

  const quantityInput = shopPanel.querySelector('#service-quantity');
  const targetInput = shopPanel.querySelector('#service-target');
  const calculatedPrice = shopPanel.querySelector('#calculated-price');
  const regularPrice = shopPanel.querySelector('#regular-price');
  const savingLine = shopPanel.querySelector('#saving-line');
  const savingPrice = shopPanel.querySelector('#saving-price');
  const discountNote = shopPanel.querySelector('#discount-note');
  const updatePrice = () => {
    const amount = Math.max(0, Number(quantityInput.value) || 0);
    const discount = getDiscountPercentage(amount, selectedType);
    const standard = getRegularPrice(amount, selectedType);
    const price = getPrice(amount, selectedType);
    calculatedPrice.textContent = money(price);
    regularPrice.textContent = money(standard);
    savingPrice.textContent = money(standard - price);
    savingLine.hidden = discount === 0;
    discountNote.textContent = `${t('discount')}: ${discount}% · ${t('discountTiers')}`;
  };

  quantityInput.addEventListener('input', updatePrice);
  shopPanel.querySelector('.add-custom-order').addEventListener('click', () => {
    const amount = Math.floor(Number(quantityInput.value) || 0);
    const target = targetInput.value.trim();
    if (amount < 100) {
      quantityInput.setCustomValidity('La cantidad mínima es 100.');
      quantityInput.reportValidity();
      return;
    }
    if (!target) {
      targetInput.setCustomValidity(t('targetRequired'));
      targetInput.reportValidity();
      return;
    }
    if (!isValidTarget(target, selectedType)) {
      targetInput.setCustomValidity(selectedType === 'Seguidores' ? t('targetUsernameInvalid') : t('targetVideoInvalid'));
      targetInput.reportValidity();
      return;
    }
    quantityInput.setCustomValidity('');
    targetInput.setCustomValidity('');
    cart.push({ network: selectedNetwork, type: selectedType, amount, target, price: getPrice(amount, selectedType) });
    renderCart();
    showCartToast(`${t('cartAdded')} ${typeLabel(selectedType)}`);
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
        <small>${money(item.price)} · ${item.target}</small>
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
  updatePaymentMethod(selectedPaymentMethod);
});

paymentMethodButtons.forEach((button) => {
  button.addEventListener('click', () => updatePaymentMethod(button.dataset.paymentMethod));
});

function orderMessage() {
  const summary = cart.map((item) => {
    const destinationLabel = item.type === 'Seguidores' ? 'Usuario' : 'Enlace del video';
    return `${item.network}: ${item.amount.toLocaleString('en-US')} ${item.type} - ${money(item.price)}\n${destinationLabel}: ${item.target}`;
  }).join('\n');
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  return `Hola SocialRise, ya realicé el pago por ${paymentMethodName()} de mi pedido:\n${summary}\nTotal enviado: ${money(total)}`;
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
