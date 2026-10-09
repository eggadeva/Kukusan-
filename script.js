// ===== DATA AWAL =====
const DEFAULT_PRODUCTS = [
  { id: 1, name: "Kukusan Bambu Size S", desc: "Diameter 18cm. Cocok untuk mengukus sayuran & camilan kecil.", price: 25000, stock: 15, emoji: "🧺", badge: "Terlaris" },
  { id: 2, name: "Kukusan Bambu Size M", desc: "Diameter 22cm. Ideal untuk keluarga kecil.", price: 35000, stock: 12, emoji: "🧺", badge: null },
  { id: 3, name: "Kukusan Bambu Size L", desc: "Diameter 28cm. Muat banyak, cocok untuk acara.", price: 48000, stock: 8, emoji: "🧺", badge: "Populer" },
  { id: 4, name: "Kukusan Stainless 3 Susun", desc: "Tahan lama, mudah dibersihkan, cocok untuk rumah tangga modern.", price: 95000, stock: 6, emoji: "🍲", badge: null },
  { id: 5, name: "Kukusan Bambu Set (S+M)", desc: "Paket hemat 2 ukuran. Praktis untuk berbagai kebutuhan.", price: 55000, stock: 10, emoji: "🎁", badge: "Hemat" },
  { id: 6, name: "Tutup Kukusan Bambu", desc: "Tutup cadangan ukuran universal (cocok size M & L).", price: 15000, stock: 20, emoji: "🪵", badge: null }
];

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'kukusanku123';

let products = [];
let cart = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadCart();
  loadUser();
  renderProducts();
  updateCartUI();
  updateAuthButton();
  if (currentUser && currentUser.isAdmin) showAdminPanel(true);
});

function loadProducts() {
  const saved = localStorage.getItem('kukusanku_products');
  products = saved ? JSON.parse(saved) : [...DEFAULT_PRODUCTS];
  if (!saved) localStorage.setItem('kukusanku_products', JSON.stringify(products));
}
function saveProducts() {
  localStorage.setItem('kukusanku_products', JSON.stringify(products));
}
function loadCart() {
  cart = JSON.parse(localStorage.getItem('kukusanku_cart') || '[]');
}
function saveCart() {
  localStorage.setItem('kukusanku_cart', JSON.stringify(cart));
}
function loadUser() {
  currentUser = JSON.parse(localStorage.getItem('kukusanku_user') || 'null');
}
function saveUser() {
  if (currentUser) localStorage.setItem('kukusanku_user', JSON.stringify(currentUser));
  else localStorage.removeItem('kukusanku_user');
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  if (products.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:#666;grid-column:1/-1;padding:40px 0;">Belum ada produk</p>';
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img">
        ${p.emoji || '🧺'}
        ${p.badge ? '<span class="product-badge">' + p.badge + '</span>' : ''}
      </div>
      <div class="product-body">
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.desc)}</p>
        <div class="product-meta">
          <span class="product-price">Rp ${formatNumber(p.price)}</span>
          <span class="product-stock ${p.stock <= 0 ? 'habis' : ''}">
            ${p.stock > 0 ? 'Stok: ' + p.stock : 'Habis'}
          </span>
        </div>
        <button class="btn-add" onclick="addToCart(${p.id})" ${p.stock <= 0 ? 'disabled' : ''}>
          ${p.stock <= 0 ? 'Stok Habis' : '+ Keranjang'}
        </button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product || product.stock <= 0) return;
  const existing = cart.find(c => c.id === id);
  if (existing) {
    if (existing.qty >= product.stock) { alert('Stok tidak mencukupi!'); return; }
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, emoji: product.emoji, qty: 1 });
  }
  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  const product = products.find(p => p.id === id);
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
  else if (product && item.qty > product.stock) { item.qty = product.stock; alert('Stok maksimal tercapai'); }
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  const countEl = document.getElementById('cart-count');
  const itemsEl = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + c.price * c.qty, 0);
  if (countEl) countEl.textContent = totalQty;
  if (totalEl) totalEl.textContent = 'Rp ' + formatNumber(totalPrice);
  if (!itemsEl) return;
  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="empty-cart">Keranjang masih kosong</div>';
    return;
  }
  itemsEl.innerHTML = cart.map(c => `
    <div class="cart-item">
      <div class="cart-item-img">${c.emoji || '🧺'}</div>
      <div class="cart-item-info">
        <h4>${escapeHtml(c.name)}</h4>
        <p>Rp ${formatNumber(c.price)}</p>
        <div class="cart-item-qty">
          <button onclick="changeQty(${c.id}, -1)">−</button>
          <span>${c.qty}</span>
          <button onclick="changeQty(${c.id}, 1)">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleCart() {
  document.getElementById('cart-sidebar').classList.toggle('active');
  document.getElementById('cart-overlay').classList.toggle('active');
}

function openCheckout() {
  if (cart.length === 0) { alert('Keranjang masih kosong!'); return; }
  const summary = document.getElementById('order-summary');
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  summary.innerHTML = '<strong>Ringkasan Pesanan:</strong><br>' +
    cart.map(c => '• ' + escapeHtml(c.name) + ' x' + c.qty + ' = Rp ' + formatNumber(c.price * c.qty)).join('<br>') +
    '<br><br><strong>Total: Rp ' + formatNumber(total) + '</strong>';
  if (currentUser && currentUser.name) document.getElementById('order-name').value = currentUser.name;
  document.getElementById('checkout-modal').classList.add('active');
  document.getElementById('cart-sidebar').classList.remove('active');
  document.getElementById('cart-overlay').classList.remove('active');
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('active');
}

function submitOrder(e) {
  e.preventDefault();
  const name = document.getElementById('order-name').value.trim();
  const phone = document.getElementById('order-phone').value.trim();
  const address = document.getElementById('order-address').value.trim();
  const note = document.getElementById('order-note').value.trim();
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const itemsText = cart.map(c => '• ' + c.name + ' x' + c.qty + ' = Rp ' + formatNumber(c.price * c.qty)).join('\n');

  const orders = JSON.parse(localStorage.getItem('kukusanku_orders') || '[]');
  orders.unshift({ id: Date.now(), name, phone, address, note, items: [...cart], total, date: new Date().toLocaleString('id-ID'), status: 'Baru' });
  localStorage.setItem('kukusanku_orders', JSON.stringify(orders));

  cart.forEach(c => {
    const p = products.find(pr => pr.id === c.id);
    if (p) p.stock = Math.max(0, p.stock - c.qty);
  });
  saveProducts();
  renderProducts();
  if (currentUser && currentUser.isAdmin) renderAdminTables();

  const message = encodeURIComponent('Halo Kukusanku! Saya ingin pesan:\n\n' + itemsText + '\n\n*Total: Rp ' + formatNumber(total) + '*\n\nNama: ' + name + '\nWhatsApp: ' + phone + '\nAlamat: ' + address + (note ? '\nCatatan: ' + note : '') + '\n\nTerima kasih!');
  const waNumber = '6285755324969';
  window.open('https://wa.me/' + waNumber + '?text=' + message, '_blank');

  cart = [];
  saveCart();
  updateCartUI();
  closeCheckout();
  document.getElementById('checkout-form').reset();
  alert('Pesanan berhasil! Anda akan diarahkan ke WhatsApp.');
}

function toggleAuthModal() {
  document.getElementById('auth-modal').classList.toggle('active');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const tabs = document.querySelectorAll('.auth-tab');
  const title = document.getElementById('auth-title');
  tabs.forEach(t => t.classList.remove('active'));
  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    tabs[0].classList.add('active');
    title.textContent = 'Masuk';
  } else {
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
    tabs[1].classList.add('active');
    title.textContent = 'Daftar';
  }
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const users = JSON.parse(localStorage.getItem('kukusanku_users') || '[]');
  if (users.find(u => u.email === email)) { alert('Email sudah terdaftar!'); return; }
  users.push({ name, email, password: pass });
  localStorage.setItem('kukusanku_users', JSON.stringify(users));
  currentUser = { name, email, isAdmin: false };
  saveUser();
  alert('Pendaftaran berhasil! Selamat datang, ' + name);
  toggleAuthModal();
  updateAuthButton();
}

function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    currentUser = { name: 'Admin', email: 'admin', isAdmin: true };
    saveUser();
    alert('Login admin berhasil!');
    toggleAuthModal();
    updateAuthButton();
    showAdminPanel(true);
    return;
  }

  const users = JSON.parse(localStorage.getItem('kukusanku_users') || '[]');
  const found = users.find(u => (u.email === user || u.name === user) && u.password === pass);
  if (!found) { alert('Email/Username atau password salah!'); return; }
  currentUser = { name: found.name, email: found.email, isAdmin: false };
  saveUser();
  alert('Selamat datang, ' + found.name + '!');
  toggleAuthModal();
  updateAuthButton();
  showAdminPanel(false);
}

function logout() {
  currentUser = null;
  saveUser();
  showAdminPanel(false);
  updateAuthButton();
  alert('Anda sudah keluar.');
}

function updateAuthButton() {
  const btn = document.getElementById('btn-auth');
  if (!btn) return;
  if (currentUser) {
    btn.textContent = currentUser.isAdmin ? 'Admin' : currentUser.name.split(' ')[0];
    btn.onclick = () => {
      if (currentUser.isAdmin) {
        const panel = document.getElementById('admin-panel');
        if (panel && !panel.classList.contains('hidden')) {
          if (confirm('Keluar dari akun admin?')) logout();
        } else {
          showAdminPanel(true);
        }
      } else {
        if (confirm('Keluar dari akun?')) logout();
      }
    };
  } else {
    btn.textContent = 'Masuk';
    btn.onclick = toggleAuthModal;
  }
}

function showAdminPanel(show) {
  const panel = document.getElementById('admin-panel');
  if (!panel) return;
  if (show && currentUser && currentUser.isAdmin) {
    panel.classList.remove('hidden');
    renderAdminTables();
    panel.scrollIntoView({ behavior: 'smooth' });
  } else {
    panel.classList.add('hidden');
  }
}

function renderAdminTables() {
  const prods = JSON.parse(localStorage.getItem('kukusanku_products') || '[]');
  const orders = JSON.parse(localStorage.getItem('kukusanku_orders') || '[]');
  const totalStock = prods.reduce((s, p) => s + p.stock, 0);
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const stats = document.getElementById('admin-stats');
  if (stats) {
    stats.innerHTML =
      '<div class="stat-card"><h4>Total Produk</h4><p>' + prods.length + '</p></div>' +
      '<div class="stat-card"><h4>Total Stok</h4><p>' + totalStock + '</p></div>' +
      '<div class="stat-card"><h4>Pesanan</h4><p>' + orders.length + '</p></div>' +
      '<div class="stat-card"><h4>Omzet</h4><p>Rp ' + formatNumber(totalRevenue) + '</p></div>';
  }

  const pBody = document.getElementById('admin-product-body');
  if (pBody) {
    pBody.innerHTML = prods.map(p =>
      '<tr><td>' + (p.emoji || '') + ' ' + escapeHtml(p.name) + '</td><td>Rp ' + formatNumber(p.price) +
      '</td><td>' + p.stock + '</td><td>' +
      '<button class="btn-sm btn-edit" onclick="editProduct(' + p.id + ')">Edit</button> ' +
      '<button class="btn-sm btn-delete" onclick="deleteProduct(' + p.id + ')">Hapus</button></td></tr>'
    ).join('') || '<tr><td colspan="4" style="text-align:center;color:#999;">Belum ada produk</td></tr>';
  }

  const oBody = document.getElementById('admin-order-body');
  if (oBody) {
    oBody.innerHTML = orders.map(o =>
      '<tr><td>' + o.date + '</td><td><strong>' + escapeHtml(o.name) + '</strong><br><small>' + escapeHtml(o.phone) +
      '</small></td><td>Rp ' + formatNumber(o.total) + '</td><td>' + o.status + '</td><td>' +
      '<button class="btn-sm btn-edit" onclick="viewOrder(' + o.id + ')">Detail</button> ' +
      (o.status === 'Baru' ? '<button class="btn-sm btn-edit" onclick="updateOrderStatus(' + o.id + ',\\'Proses\\')">Proses</button>' : '') +
      (o.status === 'Proses' ? '<button class="btn-sm btn-edit" onclick="updateOrderStatus(' + o.id + ',\\'Selesai\\')">Selesai</button>' : '') +
      '</td></tr>'
    ).join('') || '<tr><td colspan="5" style="text-align:center;color:#999;">Belum ada pesanan</td></tr>';
  }
}

function openProductForm(id) {
  document.getElementById('product-modal').classList.add('active');
  document.getElementById('product-modal-title').textContent = id ? 'Edit Produk' : 'Tambah Produk';
  if (id) {
    const p = products.find(pr => pr.id === id);
    document.getElementById('product-id').value = p.id;
    document.getElementById('product-name').value = p.name;
    document.getElementById('product-desc').value = p.desc;
    document.getElementById('product-price').value = p.price;
    document.getElementById('product-stock').value = p.stock;
    document.getElementById('product-emoji').value = p.emoji || '🧺';
    document.getElementById('product-badge').value = p.badge || '';
  } else {
    document.getElementById('product-id').value = '';
    document.getElementById('product-name').value = '';
    document.getElementById('product-desc').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-stock').value = '';
    document.getElementById('product-emoji').value = '🧺';
    document.getElementById('product-badge').value = '';
  }
}

function closeProductForm() {
  document.getElementById('product-modal').classList.remove('active');
}

function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('product-id').value;
  const data = {
    name: document.getElementById('product-name').value.trim(),
    desc: document.getElementById('product-desc').value.trim(),
    price: parseInt(document.getElementById('product-price').value, 10),
    stock: parseInt(document.getElementById('product-stock').value, 10),
    emoji: document.getElementById('product-emoji').value || '🧺',
    badge: document.getElementById('product-badge').value.trim() || null
  };
  if (id) {
    const idx = products.findIndex(p => p.id === parseInt(id, 10));
    products[idx] = Object.assign({}, products[idx], data);
  } else {
    const newId = products.length ? Math.max.apply(null, products.map(p => p.id)) + 1 : 1;
    products.push(Object.assign({ id: newId }, data));
  }
  saveProducts();
  renderProducts();
  renderAdminTables();
  closeProductForm();
  alert('Produk berhasil disimpan!');
}

function editProduct(id) { openProductForm(id); }

function deleteProduct(id) {
  if (!confirm('Yakin hapus produk ini?')) return;
  products = products.filter(p => p.id !== id);
  saveProducts();
  renderProducts();
  renderAdminTables();
  alert('Produk dihapus.');
}

function viewOrder(id) {
  const orders = JSON.parse(localStorage.getItem('kukusanku_orders') || '[]');
  const order = orders.find(o => o.id === id);
  if (!order) return;
  const items = order.items.map(i => '• ' + i.name + ' x' + i.qty + ' = Rp ' + formatNumber(i.price * i.qty)).join('\n');
  alert('Detail Pesanan\n\nPembeli: ' + order.name + '\nWA: ' + order.phone + '\nAlamat: ' + order.address + (order.note ? '\nCatatan: ' + order.note : '') + '\n\n' + items + '\n\nTotal: Rp ' + formatNumber(order.total) + '\nStatus: ' + order.status);
}

function updateOrderStatus(id, status) {
  const orders = JSON.parse(localStorage.getItem('kukusanku_orders') || '[]');
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    orders[idx].status = status;
    localStorage.setItem('kukusanku_orders', JSON.stringify(orders));
    renderAdminTables();
  }
}

function showAdminSection(name) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('admin-section-' + name);
  if (el) el.classList.add('active');
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  if (typeof event !== 'undefined' && event.target) event.target.classList.add('active');
}

function loadMap() {
  const container = document.getElementById('map-container');
  if (!container || container.querySelector('iframe')) return;
  container.innerHTML = '<iframe src="https://maps.google.com/maps?q=-8.054694,112.206255&t=&z=16&ie=UTF8&iwloc=&output=embed" width="100%" height="280" style="border:0;border-radius:16px;" allowfullscreen loading="lazy"></iframe>';
}

function shareLocation() {
  const text = 'Lokasi Kukusanku: Klampok, Jiwut, Kec. Nglegok, Kabupaten Blitar, Jawa Timur 66181\nhttps://maps.app.goo.gl/a1gGdvex9oayL79e8';
  if (navigator.share) navigator.share({ title: 'Lokasi Kukusanku', text: text });
  else navigator.clipboard.writeText(text).then(function() { alert('Lokasi disalin!'); });
}

function toggleMobileMenu() {
  const links = document.getElementById('nav-links');
  if (links) links.classList.toggle('open');
}
function closeMobileMenu() {
  const links = document.getElementById('nav-links');
  if (links) links.classList.remove('open');
}
function formatNumber(num) {
  return Number(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
