const API_URL = window.location.protocol === "file:" ? "http://localhost:3000/api" : "/api";
const PROFILE_KEY = "cupcakeshop_usuario";
const ORDERS_KEY = "cupcakeshop_pedidos_sessao";
let memorySessionId = "";

const produtos = [
  {
    id: 1,
    nome: "Cupcake de Morango",
    categoria: "Frutas",
    preco: 8.5,
    imagem: "assets/cupcake-morango.png",
    destaque: true,
    descricao:
      "Massa de baunilha, recheio cremoso de morango e cobertura suave com fruta fresca.",
  },
  {
    id: 2,
    nome: "Cupcake de Chocolate",
    categoria: "Chocolate",
    preco: 7.9,
    imagem: "assets/cupcake-chocolate.png",
    destaque: true,
    descricao:
      "Massa de cacau, brigadeiro artesanal e confeitos coloridos para uma opção clássica.",
  },
  {
    id: 3,
    nome: "Cupcake Red Velvet",
    categoria: "Especiais",
    preco: 9.5,
    imagem: "assets/cupcake-redvelvet.png",
    destaque: true,
    descricao:
      "Massa red velvet com recheio leve, cobertura cremosa e toque de frutas vermelhas.",
  },
  {
    id: 4,
    nome: "Cupcake de Limão",
    categoria: "Frutas",
    preco: 7.5,
    imagem: "assets/cupcake-limao.png",
    destaque: false,
    descricao:
      "Cupcake cítrico com massa macia, creme de limão e finalização refrescante.",
  },
  {
    id: 5,
    nome: "Cupcake de Baunilha",
    categoria: "Clássicos",
    preco: 6.9,
    imagem: "assets/cupcake-morango.png",
    destaque: false,
    descricao:
      "Receita tradicional de baunilha com cobertura leve e decoração delicada.",
  },
  {
    id: 6,
    nome: "Cupcake de Brigadeiro",
    categoria: "Chocolate",
    preco: 8.9,
    imagem: "assets/cupcake-chocolate.png",
    destaque: true,
    descricao:
      "Massa de chocolate com brigadeiro cremoso, ideal para pedidos de festa.",
  },
  {
    id: 7,
    nome: "Cupcake de Coco",
    categoria: "Clássicos",
    preco: 7.2,
    imagem: "assets/cupcake-limao.png",
    destaque: false,
    descricao:
      "Massa branca com coco ralado, recheio suave e cobertura equilibrada.",
  },
  {
    id: 8,
    nome: "Cupcake Doce de Leite",
    categoria: "Especiais",
    preco: 9.2,
    imagem: "assets/cupcake-redvelvet.png",
    destaque: false,
    descricao:
      "Massa amanteigada com recheio de doce de leite e cobertura cremosa.",
  },
  {
    id: 9,
    nome: "Cupcake de Maracujá",
    categoria: "Frutas",
    preco: 8.2,
    imagem: "assets/cupcake-limao.png",
    destaque: false,
    descricao:
      "Sabor tropical com recheio de maracujá e cobertura levemente azedinha.",
  },
  {
    id: 10,
    nome: "Cupcake de Cenoura",
    categoria: "Clássicos",
    preco: 7.8,
    imagem: "assets/cupcake-chocolate.png",
    destaque: false,
    descricao:
      "Massa de cenoura fofinha com cobertura de chocolate e sabor caseiro.",
  },
];

const state = {
  route: "home",
  produtoAtual: 1,
  quantidadeDetalhe: 1,
  busca: "",
  filtro: "Todos",
  loading: true,
  apiOnline: true,
};

const store = {
  usuario: loadLocalUser(),
  carrinho: [],
  pedidos: loadSessionOrders(),
};

const app = document.querySelector("#app");
const shell = document.querySelector(".app-shell");
const toast = document.querySelector("#toast");
const modal = document.querySelector("#modal");
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getCartSession(),
      ...(options.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.erro || "Erro ao acessar a API");
  return data;
}

async function loadFromApi() {
  try {
    const [apiProdutos, carrinho] = await Promise.all([
      api("/produtos"),
      api("/carrinho"),
    ]);

    produtos.splice(
      0,
      produtos.length,
      ...apiProdutos.map((produto) => ({
        ...produto,
        imagem: `assets/${produto.imagem || "cupcake-morango.png"}`,
      }))
    );
    store.usuario = loadLocalUser();
    syncCart(carrinho);
    store.pedidos = loadSessionOrders();
    state.apiOnline = true;
  } catch (error) {
    state.apiOnline = false;
    showToast("Inicie o backend em http://localhost:3000");
  } finally {
    state.loading = false;
    render();
  }
}

function syncCart(apiCart) {
  store.carrinho = apiCart.itens.map((item) => ({
    produtoId: item.produto.id,
    quantidade: item.quantidade,
  }));
}

function normalizeOrder(pedido) {
  if (!Array.isArray(pedido.itens)) return pedido;
  const quantidade = pedido.itens.reduce((total, item) => total + item.quantidade, 0);
  return {
    ...pedido,
    itens: `${quantidade} cupcake(s)`,
  };
}

function loadSessionOrders() {
  try {
    const saved = sessionStorage.getItem(ORDERS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveSessionOrders() {
  try {
    sessionStorage.setItem(ORDERS_KEY, JSON.stringify(store.pedidos));
  } catch {}
}

function emptyUser() {
  return {
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
  };
}

function loadLocalUser() {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    return saved ? { ...emptyUser(), ...JSON.parse(saved) } : emptyUser();
  } catch {
    return emptyUser();
  }
}

function saveLocalUser(usuario) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(usuario));
}

function createSessionId() {
  const value = window.crypto && window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}${Math.random()}`;
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
}

function getCartSession() {
  if (!memorySessionId) memorySessionId = createSessionId();
  return memorySessionId;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[char];
  });
}

function go(route, produtoId) {
  state.route = route;
  if (produtoId) {
    state.produtoAtual = Number(produtoId);
    state.quantidadeDetalhe = 1;
  }
  render();
}

function produtoPorId(id) {
  return produtos.find((produto) => produto.id === Number(id));
}

function totalItens() {
  return store.carrinho.reduce((total, item) => total + item.quantidade, 0);
}

function subtotalCarrinho() {
  return store.carrinho.reduce((total, item) => {
    const produto = produtoPorId(item.produtoId);
    return total + produto.preco * item.quantidade;
  }, 0);
}

function descontoCarrinho() {
  return totalItens() >= 6 ? subtotalCarrinho() * 0.1 : 0;
}

function totalCarrinho() {
  return subtotalCarrinho() - descontoCarrinho();
}

async function addToCart(produtoId, quantidade = 1) {
  const carrinho = await api("/carrinho/itens", {
    method: "POST",
    body: JSON.stringify({ produtoId: Number(produtoId), quantidade }),
  });
  syncCart(carrinho);
  showToast("Cupcake adicionado ao carrinho");
}

async function updateCart(produtoId, delta) {
  const carrinho = await api(`/carrinho/itens/${produtoId}`, {
    method: "PATCH",
    body: JSON.stringify({ delta }),
  });
  syncCart(carrinho);
  render();
}

async function removeCartItem(produtoId) {
  const carrinho = await api(`/carrinho/itens/${produtoId}`, {
    method: "DELETE",
  });
  syncCart(carrinho);
  render();
}

function productCard(produto) {
  const itemCarrinho = store.carrinho.find((item) => item.produtoId === produto.id);
  const quantidade = itemCarrinho ? itemCarrinho.quantidade : 0;

  return `
    <article class="product-card">
      <button class="product-main" data-action="open-product" data-product-id="${produto.id}">
        <img src="${produto.imagem}" alt="${escapeHTML(produto.nome)}" />
        <div class="product-info">
          <h3>${escapeHTML(produto.nome)}</h3>
          <div class="product-footer">
            <span class="price">${money.format(produto.preco)}</span>
          </div>
        </div>
      </button>
      ${
        quantidade
          ? `
            <div class="card-counter" aria-label="Quantidade de ${escapeHTML(produto.nome)} no carrinho">
              <button data-action="card-minus" data-product-id="${produto.id}" aria-label="Subtrair ${escapeHTML(produto.nome)}">−</button>
              <strong>${quantidade}</strong>
              <button data-action="card-plus" data-product-id="${produto.id}" aria-label="Somar ${escapeHTML(produto.nome)}">+</button>
            </div>
          `
          : `<button class="cart-round" data-action="add-card" data-product-id="${produto.id}" aria-label="Adicionar ${escapeHTML(produto.nome)} ao carrinho">+</button>`
      }
    </article>
  `;
}

function renderHome() {
  const populares = produtos.filter((produto) => produto.destaque).slice(0, 4);
  app.innerHTML = `
    <section class="promo-card">
      <small>Oferta especial</small>
      <h1>Promoção de Cupcakes</h1>
      <p>Na compra de 6 cupcakes ganhe 10% de desconto.</p>
      <button class="primary-button" data-action="navigate" data-route="catalog">Ver catálogo</button>
    </section>

    <section class="section">
      <div class="row-between">
        <div>
          <h2>Mais Populares</h2>
          <p class="section-note">Os favoritos dos nossos clientes</p>
        </div>
        <button class="text-button" data-action="navigate" data-route="catalog">Ver todos</button>
      </div>
      <div class="product-grid">${populares.map(productCard).join("")}</div>
    </section>
  `;
}

function renderLoading() {
  app.innerHTML = `
    <section class="empty-state">
      <div class="empty-card">
        <h1 class="page-title">CupcakeShop</h1>
        <p class="page-subtitle">Carregando dados do backend...</p>
      </div>
    </section>
  `;
}

function renderApiOffline() {
  app.innerHTML = `
    <section class="empty-state">
      <div class="empty-card">
        <h1 class="page-title">Backend desligado</h1>
        <p class="page-subtitle">Rode o backend em http://localhost:3000 e tente novamente.</p>
        <button class="primary-button" data-action="reload-api">Tentar novamente</button>
      </div>
    </section>
  `;
}

function produtosFiltrados() {
  const termo = state.busca.trim().toLowerCase();
  return produtos.filter((produto) => {
    const matchBusca = produto.nome.toLowerCase().includes(termo);
    const matchFiltro = state.filtro === "Todos" || produto.categoria === state.filtro;
    return matchBusca && matchFiltro;
  });
}

function renderCatalogGrid() {
  const lista = produtosFiltrados();
  const count = document.querySelector("#result-count");
  const grid = document.querySelector("#catalog-grid");
  if (!count || !grid) return;
  count.textContent = `${lista.length} cupcakes encontrados`;
  grid.innerHTML = lista.length
    ? lista.map(productCard).join("")
    : `<div class="empty-card"><strong>Nenhum cupcake encontrado</strong><p class="page-subtitle">Tente outro nome ou filtro.</p></div>`;
}

function renderCatalog() {
  const categorias = ["Todos", "Frutas", "Chocolate", "Clássicos", "Especiais"];
  app.innerHTML = `
    <h1 class="page-title">Catálogo de Cupcakes</h1>
    <div class="search-line">
      <input id="search" class="search-field" type="search" placeholder="Buscar cupcakes..." value="${escapeHTML(state.busca)}" />
      <button class="icon-button" data-action="clear-filter" aria-label="Limpar busca e filtros">≡</button>
    </div>
    <div class="filter-row" aria-label="Filtros do catálogo">
      ${categorias
        .map(
          (categoria) => `
            <button class="chip ${state.filtro === categoria ? "is-active" : ""}" data-action="filter" data-filter="${categoria}">
              ${categoria}
            </button>
          `
        )
        .join("")}
    </div>
    <p id="result-count" class="section-note"></p>
    <div id="catalog-grid" class="product-grid"></div>
  `;
  renderCatalogGrid();
}

function renderProductDetail() {
  const produto = produtoPorId(state.produtoAtual) || produtos[0];
  const total = produto.preco * state.quantidadeDetalhe;
  app.innerHTML = `
    <div class="topbar">
      <button class="icon-button" data-action="navigate" data-route="catalog" aria-label="Voltar para catálogo">←</button>
      <h1>Detalhes do Produto</h1>
      <span></span>
    </div>

    <section class="product-hero">
      <img src="${produto.imagem}" alt="${escapeHTML(produto.nome)}" />
    </section>

    <section class="product-detail-head">
      <div>
        <h2 class="page-title">${escapeHTML(produto.nome)}</h2>
        ${produto.destaque ? `<span class="badge">★ Popular</span>` : `<span class="badge">${escapeHTML(produto.categoria)}</span>`}
      </div>
      <div>
        <strong class="price">${money.format(produto.preco)}</strong>
        <p class="section-note">por unidade</p>
      </div>
    </section>

    <p class="detail-copy">${escapeHTML(produto.descricao)}</p>

    <section class="quantity-panel">
      <div class="row-between">
        <strong>Quantidade</strong>
        <div class="stepper" aria-label="Quantidade do produto">
          <button data-action="detail-minus" aria-label="Diminuir quantidade">−</button>
          <strong>${state.quantidadeDetalhe}</strong>
          <button data-action="detail-plus" aria-label="Aumentar quantidade">+</button>
        </div>
      </div>
      <p class="section-note">Total</p>
      <strong class="price">${money.format(total)}</strong>
    </section>

    <div class="product-actions">
      <button class="primary-button" data-action="add-detail" data-product-id="${produto.id}">
        + Adicionar ao carrinho
      </button>
    </div>
  `;
}

function renderCart() {
  if (!store.carrinho.length) {
    app.innerHTML = `
      <h1 class="page-title">Carrinho</h1>
      <section class="empty-state">
        <div class="empty-card">
          <span class="empty-icon" aria-hidden="true"></span>
          <h2>Seu carrinho está vazio</h2>
          <p class="page-subtitle">Adicione cupcakes deliciosos ao seu carrinho e faça seu pedido.</p>
          <button class="primary-button" data-action="navigate" data-route="catalog">Ver catálogo</button>
        </div>
      </section>
    `;
    return;
  }

  const itens = store.carrinho
    .map((item) => {
      const produto = produtoPorId(item.produtoId);
      return `
        <article class="cart-item">
          <img src="${produto.imagem}" alt="${escapeHTML(produto.nome)}" />
          <div>
            <h3>${escapeHTML(produto.nome)}</h3>
            <span class="price">${money.format(produto.preco)}</span>
            <div class="stepper">
              <button data-action="cart-minus" data-product-id="${produto.id}" aria-label="Diminuir ${escapeHTML(produto.nome)}">−</button>
              <strong>${item.quantidade}</strong>
              <button data-action="cart-plus" data-product-id="${produto.id}" aria-label="Aumentar ${escapeHTML(produto.nome)}">+</button>
            </div>
          </div>
          <button class="icon-button" data-action="remove-item" data-product-id="${produto.id}" aria-label="Remover ${escapeHTML(produto.nome)}">×</button>
        </article>
      `;
    })
    .join("");

  const faltam = Math.max(0, 6 - totalItens());
  const desconto = descontoCarrinho();

  app.innerHTML = `
    <h1 class="page-title">Carrinho</h1>
    <p class="page-subtitle">${totalItens()} ${totalItens() === 1 ? "item" : "itens"} no carrinho</p>

    <section class="cart-list">${itens}</section>

    <section class="coupon-box">
      <div class="row-between">
        <div>
          <strong>Cupom de desconto</strong>
          <p class="section-note">${
            desconto > 0 ? "Desconto de 10% aplicado na promoção." : `Faltam ${faltam} cupcake(s) para ganhar 10%.`
          }</p>
        </div>
        <button class="secondary-button" data-action="navigate" data-route="catalog">Adicionar</button>
      </div>
    </section>

    <section class="checkout-box">
      <h2>Entrega e pagamento</h2>
      <div class="form-grid">
        <label class="field">
          <span>Endereço</span>
          <input id="checkout-address" value="${escapeHTML(store.usuario.endereco)}" />
        </label>
        <label class="field">
          <span>Pagamento</span>
          <select id="checkout-payment">
            <option>Cartão de crédito</option>
            <option>Pix</option>
            <option>Dinheiro na entrega</option>
          </select>
        </label>
      </div>
    </section>

    <section class="summary-box">
      <div class="summary-row"><span>Subtotal</span><strong>${money.format(subtotalCarrinho())}</strong></div>
      <div class="summary-row"><span>Taxa de entrega</span><strong>Grátis</strong></div>
      <div class="summary-row"><span>Desconto</span><strong>${money.format(desconto)}</strong></div>
      <div class="summary-row summary-total"><span>Total</span><strong>${money.format(totalCarrinho())}</strong></div>
      <button class="primary-button" data-action="finish-order">Finalizar compra</button>
    </section>
  `;
}

function renderProfile() {
  const usuario = store.usuario;
  app.innerHTML = `
    <section class="profile-hero">
      <span class="avatar">${escapeHTML(usuario.nome ? usuario.nome.charAt(0) : "?")}</span>
      <div>
        <h1>${escapeHTML(usuario.nome || "Perfil do cliente")}</h1>
        <p>${escapeHTML(usuario.email || "Dados ainda nao preenchidos")}</p>
      </div>
    </section>

    <section class="section">
      <div class="row-between">
        <h2>Meus Dados</h2>
        <button class="text-button" data-action="edit-profile">Editar</button>
      </div>
      <div class="profile-card">
        ${dataRow("○", "Nome", usuario.nome)}
        ${dataRow("@", "Email", usuario.email)}
        ${dataRow("☎", "Telefone", usuario.telefone)}
        ${dataRow("⌖", "Endereço", usuario.endereco)}
      </div>
    </section>

    <section class="section">
      <h2>Histórico de Pedidos</h2>
      <div class="order-list">
        ${store.pedidos.length ? store.pedidos.map(orderCard).join("") : emptyOrders()}
      </div>
    </section>
  `;
}

function dataRow(icon, label, value) {
  return `
    <div class="data-row">
      <span class="data-icon">${icon}</span>
      <div>
        <small>${label}</small>
        <span>${escapeHTML(value)}</span>
      </div>
    </div>
  `;
}

function emptyOrders() {
  return `
    <article class="order-card">
      <p>Nenhum pedido realizado nesta sessao.</p>
    </article>
  `;
}

function orderCard(pedido) {
  return `
    <article class="order-card">
      <div class="row-between">
        <div>
          <strong>Pedido ${escapeHTML(pedido.id)}</strong>
          <small>${escapeHTML(pedido.data)} • ${escapeHTML(pedido.itens)}</small>
        </div>
        <span class="status-pill">${escapeHTML(pedido.status)}</span>
      </div>
      <div class="summary-row summary-total">
        <span>Total</span>
        <strong>${money.format(pedido.total)}</strong>
      </div>
    </article>
  `;
}

function render() {
  shell.classList.toggle("detail-mode", state.route === "product");
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === state.route);
  });
  updateCartBadge();

  if (state.loading) {
    renderLoading();
    return;
  }

  if (!state.apiOnline) {
    renderApiOffline();
    return;
  }

  if (state.route === "catalog") renderCatalog();
  else if (state.route === "product") renderProductDetail();
  else if (state.route === "cart") renderCart();
  else if (state.route === "profile") renderProfile();
  else renderHome();
}

function updateCartBadge() {
  const badge = document.querySelector("#cart-badge");
  const count = totalItens();
  badge.hidden = count === 0;
  badge.textContent = count;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function openModal(content) {
  modal.innerHTML = `<section class="modal-panel">${content}</section>`;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = "";
}

function editProfile() {
  const usuario = store.usuario;
  openModal(`
    <h2>Editar dados</h2>
    <form id="profile-form" class="form-grid">
      <label class="field"><span>Nome</span><input name="nome" value="${escapeHTML(usuario.nome)}" required /></label>
      <label class="field"><span>Email</span><input name="email" type="email" value="${escapeHTML(usuario.email)}" required /></label>
      <label class="field"><span>Telefone</span><input name="telefone" value="${escapeHTML(usuario.telefone)}" required /></label>
      <label class="field"><span>Endereço</span><input name="endereco" value="${escapeHTML(usuario.endereco)}" required /></label>
      <div class="modal-actions">
        <button type="button" class="secondary-button" data-action="close-modal">Cancelar</button>
        <button type="submit" class="primary-button">Salvar</button>
      </div>
    </form>
  `);
}

async function finishOrder() {
  const endereco = document.querySelector("#checkout-address").value.trim();
  const pagamento = document.querySelector("#checkout-payment").value;
  if (!endereco) {
    showToast("Informe o endereço de entrega");
    return;
  }

  const novoPedido = await api("/pedidos", {
    method: "POST",
    body: JSON.stringify({ endereco, pagamento }),
  });

  store.pedidos = [normalizeOrder(novoPedido), ...store.pedidos];
  saveSessionOrders();
  syncCart(await api("/carrinho"));
  store.usuario.endereco = endereco;
  saveLocalUser(store.usuario);
  updateCartBadge();

  openModal(`
    <h2>Pedido confirmado</h2>
    <p class="page-subtitle">Pedido ${novoPedido.id} recebido para entrega em ${escapeHTML(endereco)}.</p>
    <p class="section-note">Pagamento: ${escapeHTML(pagamento)}</p>
    <div class="modal-actions">
      <button class="primary-button" data-action="order-profile">Ver histórico</button>
    </div>
  `);
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  try {
    if (action === "reload-api") {
      state.loading = true;
      render();
      await loadFromApi();
    }
    if (action === "navigate") go(target.dataset.route);
    if (action === "open-product") go("product", target.dataset.productId);
    if (action === "add-card") {
      await addToCart(target.dataset.productId);
      render();
    }
    if (action === "card-minus") await updateCart(target.dataset.productId, -1);
    if (action === "card-plus") await updateCart(target.dataset.productId, 1);
    if (action === "add-detail") {
      await addToCart(target.dataset.productId, state.quantidadeDetalhe);
      go("cart");
    }
    if (action === "detail-minus") {
      state.quantidadeDetalhe = Math.max(1, state.quantidadeDetalhe - 1);
      renderProductDetail();
    }
    if (action === "detail-plus") {
      state.quantidadeDetalhe += 1;
      renderProductDetail();
    }
    if (action === "cart-minus") await updateCart(target.dataset.productId, -1);
    if (action === "cart-plus") await updateCart(target.dataset.productId, 1);
    if (action === "remove-item") await removeCartItem(target.dataset.productId);
    if (action === "filter") {
      state.filtro = target.dataset.filter;
      renderCatalog();
    }
    if (action === "clear-filter") {
      state.busca = "";
      state.filtro = "Todos";
      renderCatalog();
    }
    if (action === "edit-profile") editProfile();
    if (action === "close-modal") closeModal();
    if (action === "finish-order") await finishOrder();
    if (action === "order-profile") {
      closeModal();
      go("profile");
    }
  } catch (error) {
    showToast(error.message);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "search") {
    state.busca = event.target.value;
    renderCatalogGrid();
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id !== "profile-form") return;
  event.preventDefault();
  const data = new FormData(event.target);
  store.usuario = {
    nome: data.get("nome").trim(),
    email: data.get("email").trim(),
    telefone: data.get("telefone").trim(),
    endereco: data.get("endereco").trim(),
  };
  saveLocalUser(store.usuario);
  closeModal();
  render();
  showToast("Dados atualizados");
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

render();
loadFromApi();
