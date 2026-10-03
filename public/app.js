/* ── Config ──────────────────────────────────────────────── */
const API = '/api/v1';

/* ── State ───────────────────────────────────────────────── */
let state = {
  user: null,
  token: null,
  products: [],
  cart: { items: [], totalPrice: 0 },
  currentProduct: null,
  productQty: 1,
};

/* ── Init ────────────────────────────────────────────────── */
(async () => {
  const saved = localStorage.getItem('shoply_token');
  const savedUser = localStorage.getItem('shoply_user');
  if (saved && savedUser) {
    state.token = saved;
    state.user = JSON.parse(savedUser);
    updateAuthUI();
    await loadCart();
  }
  await loadProducts();
})();

/* ── Routing ─────────────────────────────────────────────── */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${name}`);
  if (page) page.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (name === 'cart') renderCart();
  if (name === 'orders') loadOrders();
}

function requireAuth(page) {
  if (!state.user) {
    toast('Sign in to continue', 'error');
    showPage('login');
    return false;
  }
  showPage(page);
  return true;
}

/* ── API Helper ──────────────────────────────────────────── */
async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

/* ── Toast ───────────────────────────────────────────────── */
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast-item ${type}`;
  el.textContent = msg;
  document.getElementById('toast').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ── Auth UI ─────────────────────────────────────────────── */
function updateAuthUI() {
  const loggedIn = !!state.user;
  document.getElementById('navAuth').style.display = loggedIn ? 'none' : 'flex';
  document.getElementById('navUser').style.display = loggedIn ? 'flex' : 'none';
  if (loggedIn) {
    document.getElementById('userGreeting').textContent = `Hi, ${state.user.name.split(' ')[0]}`;
  }
}

function togglePw(id, btn) {
  const el = document.getElementById(id);
  const show = el.type === 'password';
  el.type = show ? 'text' : 'password';
  btn.textContent = show ? 'Hide' : 'Show';
}

/* ── Register ────────────────────────────────────────────── */
async function register() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl = document.getElementById('registerError');
  errEl.style.display = 'none';

  if (!name || !email || !password) {
    errEl.textContent = 'All fields are required.';
    errEl.style.display = 'block';
    return;
  }
  try {
    const data = await api('POST', '/auth/register', { name, email, password });
    state.user = data.user;
    state.token = data.token;
    localStorage.setItem('shoply_token', data.token);
    localStorage.setItem('shoply_user', JSON.stringify(data.user));
    updateAuthUI();
    toast('Welcome to Shoply! 🎉');
    showPage('home');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  }
}

/* ── Login ───────────────────────────────────────────────── */
async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';

  if (!email || !password) {
    errEl.textContent = 'Email and password required.';
    errEl.style.display = 'block';
    return;
  }
  try {
    const data = await api('POST', '/auth/login', { email, password });
    state.user = data.user;
    state.token = data.token;
    localStorage.setItem('shoply_token', data.token);
    localStorage.setItem('shoply_user', JSON.stringify(data.user));
    updateAuthUI();
    await loadCart();
    toast(`Welcome back, ${state.user.name.split(' ')[0]}!`);
    showPage('home');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  }
}

/* ── Logout ──────────────────────────────────────────────── */
async function logout() {
  try { await api('POST', '/auth/logout'); } catch (_) {}
  state.user = null;
  state.token = null;
  state.cart = { items: [], totalPrice: 0 };
  localStorage.removeItem('shoply_token');
  localStorage.removeItem('shoply_user');
  updateAuthUI();
  updateCartBadge();
  toast('Signed out');
  showPage('home');
}

/* ── Products ────────────────────────────────────────────── */
async function loadProducts() {
  try {
    const data = await api('GET', '/products');
    state.products = data.products || data.data || data || [];
    renderProducts(state.products);
  } catch (e) {
    document.getElementById('productsGrid').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Couldn't load products</h3>
        <p>${e.message}</p>
      </div>`;
  }
}

function filterProducts() {
  const cat = document.getElementById('categoryFilter').value;
  const sort = document.getElementById('sortFilter').value;
  const search = document.getElementById('searchInput').value.toLowerCase();

  let filtered = [...state.products];
  if (cat) filtered = filtered.filter(p => p.category === cat);
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
  if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  if (sort === 'rating') filtered.sort((a, b) => (b.ratings || 0) - (a.ratings || 0));
  renderProducts(filtered);
}

function categoryEmoji(cat) {
  const map = {
    'Electronics': '💻', 'Clothing': '👕', 'Books': '📚',
    'Home & Garden': '🏡', 'Sports': '⚽', 'Toys': '🧸',
    'Beauty': '💄', 'Other': '📦',
  };
  return map[cat] || '📦';
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!products.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h3>No products found</h3><p>Try adjusting your filters.</p></div>`;
    return;
  }
  grid.innerHTML = products.map(p => {
    const img = p.images && p.images[0]
      ? `<img src="${p.images[0].url}" alt="${p.name}" loading="lazy" />`
      : categoryEmoji(p.category);
    const stars = renderStars(p.ratings || 0);
    const stockClass = p.stock > 0 ? 'in-stock' : 'out-stock';
    const stockLabel = p.stock > 0 ? `${p.stock} in stock` : 'Out of stock';
    return `
      <div class="product-card" onclick="openProduct('${p._id}')">
        <div class="product-img">${img}</div>
        <div class="product-body">
          <p class="product-category">${p.category}</p>
          <p class="product-name">${p.name}</p>
          <div class="product-rating">
            <span class="stars">${stars}</span>
            <span class="rating-count">(${p.numOfReviews || 0})</span>
          </div>
          <div class="product-footer">
            <span class="product-price">$${p.price.toFixed(2)}</span>
            <span class="stock-badge ${stockClass}">${stockLabel}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

/* ── Product Detail ──────────────────────────────────────── */
async function openProduct(id) {
  showPage('product');
  document.getElementById('productDetail').innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading…</p></div>`;
  try {
    const data = await api('GET', `/products/${id}`);
    state.currentProduct = data.product || data;
    state.productQty = 1;
    renderProductDetail();
  } catch (e) {
    document.getElementById('productDetail').innerHTML = `<p style="color:var(--error)">${e.message}</p>`;
  }
}

function renderProductDetail() {
  const p = state.currentProduct;
  const img = p.images && p.images[0]
    ? `<img src="${p.images[0].url}" alt="${p.name}" />`
    : categoryEmoji(p.category);
  const stars = renderStars(p.ratings || 0);
  const reviews = (p.reviews || []).map(r => `
    <div class="review-card">
      <div class="review-header">
        <span class="review-name">${r.name}</span>
        <span class="review-date">${new Date(r.createdAt).toLocaleDateString()}</span>
      </div>
      <div class="stars" style="font-size:.85rem;margin-bottom:.4rem">${renderStars(r.rating)}</div>
      <p class="review-text">${r.comment}</p>
    </div>`).join('') || '<p style="color:var(--muted)">No reviews yet.</p>';

  document.getElementById('productDetail').innerHTML = `
    <div class="product-detail">
      <div class="product-detail-img">${img}</div>
      <div>
        <p class="detail-category">${p.category}</p>
        <h1 class="detail-name">${p.name}</h1>
        <div class="detail-rating">
          <span class="stars">${stars}</span>
          <span style="color:var(--muted);font-size:.85rem">${p.numOfReviews || 0} reviews</span>
        </div>
        <div class="detail-price">$${p.price.toFixed(2)}</div>
        <p class="detail-desc">${p.description}</p>
        <div class="qty-row">
          <div class="qty-control">
            <button onclick="changeQty(-1)">−</button>
            <span id="qtyDisplay">1</span>
            <button onclick="changeQty(1)">+</button>
          </div>
          <span style="color:var(--muted);font-size:.85rem">${p.stock} available</span>
        </div>
        <button class="btn-primary btn-large" onclick="addToCartAction()"
          ${p.stock === 0 ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}>
          ${p.stock === 0 ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </div>
    <div class="reviews-section">
      <h3>Reviews</h3>
      ${reviews}
    </div>`;
}

function changeQty(delta) {
  const p = state.currentProduct;
  state.productQty = Math.max(1, Math.min(p.stock, state.productQty + delta));
  document.getElementById('qtyDisplay').textContent = state.productQty;
}

async function addToCartAction() {
  if (!requireAuth('cart')) return;
  const p = state.currentProduct;
  try {
    await api('POST', '/cart', { productId: p._id, quantity: state.productQty });
    toast(`"${p.name}" added to cart ✓`);
    await loadCart();
    showPage('cart');
  } catch (e) {
    toast(e.message, 'error');
  }
}

/* ── Cart ────────────────────────────────────────────────── */
async function loadCart() {
  if (!state.user) return;
  try {
    const data = await api('GET', '/cart');
    state.cart = data.cart || { items: [], totalPrice: 0 };
    updateCartBadge();
  } catch (_) {}
}

function updateCartBadge() {
  const count = (state.cart.items || []).reduce((sum, i) => sum + i.quantity, 0);
  document.getElementById('cartBadge').textContent = count;
}

function renderCart() {
  const el = document.getElementById('cartContent');
  const items = state.cart.items || [];

  if (!items.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><h3>Your cart is empty</h3><p>Add some products and they'll appear here.</p></div>`;
    return;
  }

  const itemsHtml = items.map(i => {
    const img = i.product?.images?.[0]?.url
      ? `<img src="${i.product.images[0].url}" alt="${i.name}" />`
      : categoryEmoji(i.product?.category || '');
    return `
      <div class="cart-item">
        <div class="cart-item-img">${img}</div>
        <div class="cart-item-info">
          <p class="cart-item-name">${i.name}</p>
          <p class="cart-item-price">$${i.price.toFixed(2)} × ${i.quantity}</p>
        </div>
        <div class="cart-item-actions">
          <div class="qty-control">
            <button onclick="updateCart('${i.product?._id || i.product}', ${i.quantity - 1})">−</button>
            <span>${i.quantity}</span>
            <button onclick="updateCart('${i.product?._id || i.product}', ${i.quantity + 1})">+</button>
          </div>
          <button class="btn-danger" onclick="removeFromCart('${i.product?._id || i.product}')">Remove</button>
        </div>
      </div>`;
  }).join('');

  const tax = (state.cart.totalPrice || 0) * 0.1;
  const shipping = (state.cart.totalPrice || 0) > 50 ? 0 : 5;
  const total = (state.cart.totalPrice || 0) + tax + shipping;

  el.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">${itemsHtml}</div>
      <div class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>$${(state.cart.totalPrice || 0).toFixed(2)}</span></div>
        <div class="summary-row"><span>Tax (10%)</span><span>$${tax.toFixed(2)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span></div>
        <div class="summary-row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
        <button class="btn-primary full-width" style="margin-top:1.25rem" onclick="goCheckout()">Proceed to checkout</button>
        <button class="btn-danger full-width" style="margin-top:.75rem" onclick="clearCart()">Clear cart</button>
      </div>
    </div>`;
}

async function updateCart(productId, qty) {
  if (qty < 1) { await removeFromCart(productId); return; }
  try {
    await api('PUT', `/cart/${productId}`, { quantity: qty });
    await loadCart();
    renderCart();
  } catch (e) { toast(e.message, 'error'); }
}

async function removeFromCart(productId) {
  try {
    await api('DELETE', `/cart/${productId}`);
    await loadCart();
    renderCart();
    toast('Item removed');
  } catch (e) { toast(e.message, 'error'); }
}

async function clearCart() {
  try {
    await api('DELETE', '/cart/clear');
    await loadCart();
    renderCart();
    toast('Cart cleared');
  } catch (e) { toast(e.message, 'error'); }
}

/* ── Checkout ────────────────────────────────────────────── */
function goCheckout() {
  if (!state.cart.items?.length) { toast('Your cart is empty', 'error'); return; }
  const items = state.cart.items || [];
  const tax = (state.cart.totalPrice || 0) * 0.1;
  const shipping = (state.cart.totalPrice || 0) > 50 ? 0 : 5;
  const total = (state.cart.totalPrice || 0) + tax + shipping;
  document.getElementById('checkoutSummary').innerHTML = `
    <h3>Order Summary</h3>
    ${items.map(i => `<div class="summary-row"><span>${i.name} ×${i.quantity}</span><span>$${(i.price * i.quantity).toFixed(2)}</span></div>`).join('')}
    <div class="summary-row"><span>Tax</span><span>$${tax.toFixed(2)}</span></div>
    <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span></div>
    <div class="summary-row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>`;
  showPage('checkout');
}

async function placeOrder() {
  const address = document.getElementById('coAddress').value.trim();
  const city = document.getElementById('coCity').value.trim();
  const postalCode = document.getElementById('coPostal').value.trim();
  const country = document.getElementById('coCountry').value.trim();
  const phone = document.getElementById('coPhone').value.trim();
  const method = document.querySelector('input[name="payment"]:checked')?.value || 'cod';
  const errEl = document.getElementById('checkoutError');
  errEl.style.display = 'none';

  if (!address || !city || !postalCode || !country || !phone) {
    errEl.textContent = 'Please fill in all shipping fields.';
    errEl.style.display = 'block';
    return;
  }

  const items = state.cart.items || [];
  const tax = (state.cart.totalPrice || 0) * 0.1;
  const shipping = (state.cart.totalPrice || 0) > 50 ? 0 : 5;
  const total = (state.cart.totalPrice || 0) + tax + shipping;

  const body = {
    orderItems: items.map(i => ({
      product: i.product?._id || i.product,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.product?.images?.[0]?.url || '',
    })),
    shippingInfo: { address, city, country, phone, postalCode },
    paymentInfo: { method, status: method === 'cod' ? 'pending' : 'paid' },
    itemsPrice: state.cart.totalPrice || 0,
    taxPrice: tax,
    shippingPrice: shipping,
    totalPrice: total,
  };

  try {
    await api('POST', '/orders', body);
    await clearCart();
    toast('Order placed successfully! 🎉');
    showPage('orders');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  }
}

/* ── Orders ──────────────────────────────────────────────── */
async function loadOrders() {
  const el = document.getElementById('ordersContent');
  el.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading orders…</p></div>`;
  try {
    const data = await api('GET', '/orders/my');
    const orders = data.orders || data || [];
    if (!orders.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><h3>No orders yet</h3><p>Your orders will appear here after you place one.</p></div>`;
      return;
    }
    el.innerHTML = orders.map(o => {
      const statusClass = `status-${o.orderStatus}`;
      return `
        <div class="order-card">
          <div class="order-header">
            <div>
              <p style="font-weight:600;font-family:var(--font-head)">Order #${o._id.slice(-6).toUpperCase()}</p>
              <p class="order-id">${new Date(o.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</p>
            </div>
            <span class="order-status ${statusClass}">${o.orderStatus}</span>
          </div>
          <div class="order-items-mini">
            ${o.orderItems.map(i => `
              <div class="order-item-row">
                <span>${i.name} × ${i.quantity}</span>
                <span>$${(i.price * i.quantity).toFixed(2)}</span>
              </div>`).join('')}
          </div>
          <div class="order-footer">
            <span style="color:var(--muted);font-size:.85rem">Payment: ${o.paymentInfo?.method?.toUpperCase() || 'COD'}</span>
            <span class="order-total">Total: $${o.totalPrice.toFixed(2)}</span>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = `<p style="color:var(--error)">${e.message}</p>`;
  }
}
