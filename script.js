// Estado del juego
let money = 0;
let cardsOnTable = 0;
let cardsInDeck = 20;
const maxCards = 20;

// Cartas descubiertas (Carddex)
let discoveredCards = new Set();

// Elementos del DOM
const deckElement = document.getElementById('deck');
const tableElement = document.getElementById('table');
const moneyElement = document.getElementById('money');
const cardsOnTableElement = document.getElementById('cards-on-table');
const cardsDiscoveredElement = document.getElementById('cards-discovered');
const cardAnimationElement = document.getElementById('card-animation');
const carddexModal = document.getElementById('carddex-modal');
const carddexGrid = document.getElementById('carddex-grid');
const btnCarddex = document.getElementById('btn-carddex');
const closeBtn = document.querySelector('.close-btn');

// Tipos de cartas - solo pon el rarityValue y se genera [1/X] automáticamente
const cardTypes = [
    {
        id: 'lobito',
        name: 'Lobito',
        rarityValue: 2,  // Genera [1/2]
        value: 1,
        color: '#3498db'
    },
    {
        id: 'lobito-arquero',
        name: 'Lobito Arquero',
        rarityValue: 4,  // Genera [1/4]
        value: 2,
        color: '#e74c3c'
    }
];

// Función para generar texto de rareza automáticamente
function getRarityText(rarityValue) {
    return `[1/${rarityValue}]`;
}

// Función para seleccionar carta aleatoria basada en rareza inversa
function selectRandomCard() {
    // Calcular probabilidad inversa (menor rarityValue = más común)
    const probabilities = cardTypes.map(card => 1 / card.rarityValue);
    const totalProbability = probabilities.reduce((sum, p) => sum + p, 0);
    
    let random = Math.random() * totalProbability;
    
    for (let i = 0; i < cardTypes.length; i++) {
        random -= probabilities[i];
        if (random <= 0) {
            return cardTypes[i];
        }
    }
    
    return cardTypes[0]; // Fallback
}

// Función para actualizar la UI
function updateUI() {
    moneyElement.textContent = money;
    cardsOnTableElement.textContent = cardsOnTable;
    cardsDiscoveredElement.textContent = discoveredCards.size;
    deckElement.innerHTML = `<div class="deck-card">Baraja<br>(${cardsInDeck})</div>`;
}

// Función para crear una carta visual
function createCard(cardType) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.borderColor = cardType.color;
    card.innerHTML = `
        <div class="card-name">${cardType.name}</div>
        <div class="card-rarity">${getRarityText(cardType.rarityValue)}</div>
        <div class="card-value">$${cardType.value}</div>
    `;
    return card;
}

// Función para mostrar animación de carta revelada
function showCardAnimation(cardType) {
    cardAnimationElement.innerHTML = `
        <div class="card-name">${cardType.name}</div>
        <div class="card-rarity">${getRarityText(cardType.rarityValue)}</div>
        <div class="card-value">$${cardType.value}</div>
    `;
    cardAnimationElement.classList.remove('hidden');
    
    setTimeout(() => {
        cardAnimationElement.classList.add('hidden');
    }, 1000);
}

// Función para añadir carta al Carddex
function addToCarddex(cardType) {
    if (!discoveredCards.has(cardType.id)) {
        discoveredCards.add(cardType.id);
        console.log(`¡Nueva carta descubierta: ${cardType.name}!`);
    }
}

// Función para renderizar el Carddex
function renderCarddex() {
    carddexGrid.innerHTML = '';
    
    cardTypes.forEach(cardType => {
        const entry = document.createElement('div');
        const isDiscovered = discoveredCards.has(cardType.id);
        
        entry.className = `carddex-entry ${isDiscovered ? 'discovered' : ''}`;
        entry.innerHTML = `
            <div class="card-name">${cardType.name}</div>
            <div class="card-rarity">${getRarityText(cardType.rarityValue)}</div>
            <div class="card-value">$${cardType.value}</div>
            <div class="status">${isDiscovered ? '✓ Descubierto' : '??? Bloqueado'}</div>
        `;
        
        carddexGrid.appendChild(entry);
    });
}

// Función para revelar una carta
function revealCard() {
    if (cardsInDeck <= 0) {
        shuffleDeck();
        return;
    }
    
    // Seleccionar carta aleatoria
    const cardType = selectRandomCard();
    
    // Mostrar animación
    showCardAnimation(cardType);
    
    // Añadir dinero
    money += cardType.value;
    
    // Añadir al Carddex
    addToCarddex(cardType);
    
    // Crear carta en la mesa
    const card = createCard(cardType);
    tableElement.appendChild(card);
    cardsOnTable++;
    
    // Reducir cartas en baraja
    cardsInDeck--;
    
    // Actualizar UI
    updateUI();
}

// Función para revolver la baraja (Lobito invisible)
function shuffleDeck() {
    // Animación de barajado
    deckElement.classList.add('shuffling');
    
    setTimeout(() => {
        // Limpiar mesa
        tableElement.innerHTML = '';
        cardsOnTable = 0;
        
        // Resetear baraja
        cardsInDeck = maxCards;
        
        // Quitar animación
        deckElement.classList.remove('shuffling');
        
        // Actualizar UI
        updateUI();
        
        console.log('¡Lobito invisible barajó las cartas!');
    }, 500);
}

// Event listeners
deckElement.addEventListener('click', revealCard);

btnCarddex.addEventListener('click', () => {
    renderCarddex();
    carddexModal.classList.remove('hidden');
});

closeBtn.addEventListener('click', () => {
    carddexModal.classList.add('hidden');
});

carddexModal.addEventListener('click', (e) => {
    if (e.target === carddexModal) {
        carddexModal.classList.add('hidden');
    }
});

// Inicializar UI
updateUI();
