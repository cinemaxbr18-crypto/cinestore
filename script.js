// Função auxiliar para carregar os dados do apps.json
async function carregarApps() {
    try {
        const response = await fetch('apps.json');
        if (!response.ok) {
            throw new Error('Falha ao carregar apps.json');
        }
        return await response.json();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        return [];
    }
}

// === LÓGICA DE FAVORITOS (localStorage) ===

// Pega a lista de IDs de apps favoritados do armazenamento local
function getFavoritos() {
    const favoritos = localStorage.getItem('cinestore_favoritos');
    return favoritos ? JSON.parse(favoritos) : [];
}

// Salva a lista de IDs de apps favoritados no armazenamento local
function setFavoritos(favoritos) {
    localStorage.setItem('cinestore_favoritos', JSON.stringify(favoritos));
}

// Adiciona ou remove um app dos favoritos
function toggleFavorito(appId) {
    let favoritos = getFavoritos();
    const id = parseInt(appId);

    if (favoritos.includes(id)) {
        // Remover
        favoritos = favoritos.filter(favId => favId !== id);
    } else {
        // Adicionar
        favoritos.push(id);
    }
    setFavoritos(favoritos);
    return favoritos.includes(id); // Retorna o novo status
}

// === RENDERIZAÇÃO DE CARDS ===

// Cria o HTML para um único card de aplicativo
function criarCardApp(app, isFavorito) {
    return `
        <div class="app-card">
            <img src="${app.icone}" alt="Ícone do ${app.nome}" class="app-icon">
            <h3>${app.nome}</h3>
            <p>${app.descricao.substring(0, 70)}...</p>
            <div class="card-actions">
                <a href="detalhes.html?id=${app.id}" class="btn-detalhes">Detalhes</a>
                <button 
                    class="btn-favorito ${isFavorito ? 'favoritado' : ''}" 
                    data-app-id="${app.id}"
                >
                    ${isFavorito ? '⭐ Favorito' : '🤍 Favoritar'}
                </button>
            </div>
        </div>
    `;
}

// Renderiza a lista de apps em um container HTML
function renderizarApps(apps, containerId, favoritosIds) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // Limpa o container
    if (apps.length === 0) {
        if (containerId === 'favoritos-container') {
             container.innerHTML = '<p>Você ainda não adicionou nenhum aplicativo aos favoritos.</p>';
        } else {
             container.innerHTML = '<p>Nenhum aplicativo encontrado.</p>';
        }
        return;
    }

    apps.forEach(app => {
        const isFavorito = favoritosIds.includes(app.id);
        container.innerHTML += criarCardApp(app, isFavorito);
    });

    // Adiciona o evento de clique aos botões de favorito
    document.querySelectorAll(`#${containerId} .btn-favorito`).forEach(button => {
        button.addEventListener('click', (e) => {
            const appId = e.currentTarget.dataset.appId;
            const novoStatus = toggleFavorito(appId);
            
            // Atualiza o texto e a classe do botão
            e.currentTarget.classList.toggle('favoritado', novoStatus);
            e.currentTarget.textContent = novoStatus ? '⭐ Favorito' : '🤍 Favoritar';

            // Se estiver na página inicial, atualiza também a seção de favoritos
            if (containerId === 'apps-container') {
                 renderizarFavoritos();
            }
        });
    });
}

// === FUNÇÕES DE INICIALIZAÇÃO ===

// Inicializa a página principal (index.html)
async function inicializarIndex() {
    const todosApps = await carregarApps();
    const favoritosIds = getFavoritos();

    // 1. Renderiza o catálogo completo
    renderizarApps(todosApps, 'apps-container', favoritosIds);

    // 2. Renderiza a seção de favoritos
    renderizarFavoritos(todosApps, favoritosIds);
}

// Renderiza apenas os favoritos na seção da página principal
function renderizarFavoritos(todosApps = null, favoritosIds = null) {
    // Se não carregou, carrega os dados
    if (!todosApps) {
        carregarApps().then(apps => {
            const ids = getFavoritos();
            const appsFavoritos = apps.filter(app => ids.includes(app.id));
            renderizarApps(appsFavoritos, 'favoritos-container', ids);
        });
        return;
    }

    // Se já tem os dados (chamado de dentro de inicializarIndex)
    const appsFavoritos = todosApps.filter(app => favoritosIds.includes(app.id));
    renderizarApps(appsFavoritos, 'favoritos-container', favoritosIds);
}

// Inicializa a página de detalhes (detalhes.html)
async function inicializarDetalhes() {
    const urlParams = new URLSearchParams(window.location.search);
    const appId = parseInt(urlParams.get('id'));

    if (isNaN(appId)) {
        // Redireciona ou exibe erro se o ID não for válido
        document.querySelector('.container').innerHTML = '<h2>Aplicativo não encontrado.</h2><p>ID inválido na URL.</p>';
        return;
    }

    const todosApps = await carregarApps();
    const app = todosApps.find(a => a.id === appId);

    if (!app) {
        document.querySelector('.container').innerHTML = '<h2>Aplicativo não encontrado.</h2><p>O ID não corresponde a nenhum app na base de dados.</p>';
        return;
    }
    
    // Atualiza o título da página
    document.getElementById('app-title').textContent = app.nome;

    // Checa se já está favoritado
    const isFavorito = getFavoritos().includes(app.id);

    // Constrói o HTML de detalhes
    document.getElementById('detalhes-app').innerHTML = `
        <img src="${app.icone}" alt="Ícone do ${app.nome}" class="detalhes-icon">
        <div class="detalhes-info">
            <h1>${app.nome}</h1>
            <p class="descricao">${app.descricao}</p>
            <div class="detalhes-acoes">
                <a href="${app.link_apk}" class="btn-download" target="_blank" rel="noopener noreferrer">
                    ⬇️ Baixar APK
                </a>
                <button 
                    id="btn-favorito-detalhe" 
                    class="btn-favorito ${isFavorito ? 'favoritado' : ''}" 
                    data-app-id="${app.id}"
                >
                    ${isFavorito ? '⭐ Favorito' : '🤍 Favoritar'}
                </button>
            </div>
        </div>
    `;

    // Configura o formulário do Formspree
    document.getElementById('form-subject').value = `Novo Comentário para: ${app.nome}`;
    document.getElementById('app-id-comentario').value = app.id;

    // Adiciona o evento de clique ao botão de favorito na página de detalhes
    document.getElementById('btn-favorito-detalhe').addEventListener('click', (e) => {
        const appId = e.currentTarget.dataset.appId;
        const novoStatus = toggleFavorito(appId);
        
        // Atualiza o texto e a classe do botão
        e.currentTarget.classList.toggle('favoritado', novoStatus);
        e.currentTarget.textContent = novoStatus ? '⭐ Favorito' : '🤍 Favoritar';
    });
}

// Determina qual função de inicialização chamar
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('catalogo')) {
        inicializarIndex();
    } else if (document.getElementById('detalhes-app')) {
        inicializarDetalhes();
    }
});
