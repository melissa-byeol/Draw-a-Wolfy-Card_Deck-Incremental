// Estado del juego
let money = 0;
let cardsOnTable = 0;
let cardsInDeck = 20;
const maxCards = 20;

// Elementos del DOM
const deckElement = document.getElementById('deck');
const tableElement = document.getElementById('table');
const moneyElement = document.getElementById('money');
const cardsOnTableElement = document.getElementById('cards-on-table');
const cardAnimationElement = document.getElementById('card-animation');

// Tipos de cartas (por ahora solo Lobito [1/2])
const cardTypes = [
    {
        name: 'Lobito',
        rarity: '[1/2]',
        value: 1,
        color: '#3498db'
    }
];

// Función para actualizar la UI
function updateUI() {
    moneyElement.textContent = money;
    cardsOnTableElement.textContent = cardsOnTable;
    deckElement.innerHTML = `<div class="deck-card">Baraja<br>(${cardsInDeck})</div>`;
}

// Función para crear una carta
function createCard(cardType) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="card-name">${cardType.name}</div>
        <div class="card-rarity">${cardType.rarity}</div>
        <div class="card-value">$${cardType.value}</div>
    `;
    return card;
}

// Función para mostrar animación de carta revelada
function showCardAnimation(cardType) {
    cardAnimationElement.innerHTML = `
        <div class="card-name">${cardType.name}</div>
        <div class="card-rarity">${cardType.rarity}</div>
        <div class="card-value">$${cardType.value}</div>
    `;
    cardAnimationElement.classList.remove('hidden');
    
    setTimeout(() => {
        cardAnimationElement.classList.add('hidden');
    }, 1000);
}

// Función para revelar una carta
function revealCard() {
    if (cardsInDeck <= 0) {
        shuffleDeck();
        return;
    }
    
    // Seleccionar carta aleatoria (por ahora siempre Lobito)
    const cardType = cardTypes[0];
    
    // Mostrar animación
    showCardAnimation(cardType);
    
    // Añadir dinero
    money += cardType.value;
    
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

// Event listener para el click en la baraja
deckElement.addEventListener('click', revealCard);

// Inicializar UI
updateUI();
