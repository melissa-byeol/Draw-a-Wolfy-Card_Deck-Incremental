/**
 * CONFIGURACIÓN Y DATOS BASE
 */
const SUITS = [
    { id: 'hearts', symbol: '❤️', name: 'Corazones' },
    { id: 'emeralds', symbol: '💎', name: 'Esmeraldas' },
    { id: 'moons', symbol: '🌙', name: 'Lunas' },
    { id: 'bones', symbol: '🦴', name: 'Huesos' }
];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Rarezas para UI
const RARITY_COLORS = {
    common: '#bdc3c7',
    rare: '#3498db',
    epic: '#9b59b6',
    legendary: '#f1c40f',
    mythic: '#e74c3c'
};

/**
 * DEFINICIÓN DE PERKS
 * IMPORTANTE PARA IMÁGENES: 
 * Añade la propiedad 'imgUrl' si quieres usar una imagen personalizada.
 * Si no existe o está vacía, usará el 'icon' (emoji).
 */
const PERK_DATABASE = [
    {
        id: 'early_bird',
        title: "Cachorrito Mañanero",
        description: "Las primeras 10 cartas de cada mazo valen x2.",
        icon: "☀️",
        imgUrl: "", // Ejemplo: "./assets/perks/sun.png"
        rarity: 'common',
        type: 'multiplier_by_position',
        params: { limit: 10, multiplier: 2 }
    },
    {
        id: 'black_cat',
        title: "Gatito Negro",
        description: "Cartas de Lunas 🌙 y Huesos 🦴 valen x1.5.",
        icon: "🐈‍⬛",
        imgUrl: "", // Ejemplo: "./assets/perks/cat.png"
        rarity: 'rare',
        type: 'multiplier_by_suit',
        params: { suits: ['moons', 'bones'], multiplier: 1.5 }
    },
    {
        id: 'paleolithic_instinct',
        title: "Instinto Paleolítico",
        description: "10% de chance de que cualquier carta sea 'Piedra' (x2 valor).",
        icon: "🪨",
        imgUrl: "",
        rarity: 'rare',
        type: 'chance_multiplier_global',
        params: { chance: 0.10, multiplier: 2 }
    },
    {
        id: 'angry_wolfy',
        title: "Lobito Enojón",
        description: "Todas las cartas valen x3. Las últimas 5 se queman ($0).",
        icon: "😤",
        imgUrl: "",
        rarity: 'epic',
        type: 'global_mult_with_penalty',
        params: { multiplier: 3, penaltyCount: 5 }
    },
    {
        id: 'twin_decks',
        title: "Barajas Gemelas",
        description: "El mazo tiene 104 cartas. Todas valen x1.5. Barajado lento.",
        icon: "🃏🃏",
        imgUrl: "",
        rarity: 'epic',
        type: 'structural_change',
        params: { doubleDeck: true, multiplier: 1.5 }
    },
    {
        id: 'flamingo_style',
        title: "Flamenco",
        description: "Corazones/Esmeraldas x1.5. 5% chance de invocar 'Carta Lobito' (x20).",
        icon: "🦩",
        imgUrl: "",
        rarity: 'legendary',
        type: 'premium_trigger',
        params: { premiumSuits: ['hearts', 'emeralds'], mult: 1.5, triggerChance: 0.05, jokerMult: 20 }
    },
    {
        id: 'act_final',
        title: "Acto Final",
        description: "Últimas 13 cartas: x5 valor. 50% chance de Carta Lobito (x20).",
        icon: "🎭",
        imgUrl: "",
        rarity: 'legendary',
        type: 'endgame_boost',
        params: { threshold: 13, multiplier: 5, jokerChance: 0.50, jokerMult: 20 }
    },
    {
        id: 'troubadour_cub',
        title: "Cachorrito Trovador",
        description: "Tras un As (A), la siguiente carta se vuelve J/Q/K (o raro Lobito).",
        icon: "🎵",
        imgUrl: "",
        rarity: 'legendary',
        type: 'sequence_modifier',
        params: { triggerRank: 'A', targetRanks: ['J','Q','K'] }
    },
    {
        id: 'chicken_stampede',
        title: "Pollo Chillón",
        description: "5% chance de Estampida: Revela TODO el mazo restante instantáneamente con x2.",
        icon: "🐔",
        imgUrl: "",
        rarity: 'mythic',
        type: 'instant_reveal_event',
        params: { chance: 0.05, multiplier: 2 }
    },
    {
        id: 'overheat',
        title: "Sobrecalentamiento",
        description: "Clicks rápidos (<300ms) tienen 5% chance de Electrificar (x10).",
        icon: "⚡",
        imgUrl: "",
        rarity: 'mythic',
        type: 'speed_based_chance',
        params: { chance: 0.05, multiplier: 10, speedThresholdMs: 300 }
    }
];

class WolfyClicker {
    constructor() {
        this.money = 0;
        this.deck = [];
        this.history = [];
        this.maxHistory = 5;
        
        // Progreso General
        this.cardsDrawnTotal = 0;
        this.nextMilestone = 50; 
        this.milestoneStep = 50; 
        
        // Estado de Perks
        this.activePerks = []; 
        this.currentDeckIndex = 0; 
        this.totalDeckSize = 52; 
        
        // Estado Secuencial (para Cachorrito Trovador)
        this.lastCardWasAce = false;
        
        // Estado de Velocidad (para Sobrecalentamiento)
        this.lastClickTime = 0;

        // Sistema de Upgrades
        this.upgrades = {
            baseValue: { level: 0, cost: 10, effect: 0 },       
            critChance: { level: 0, cost: 25, effect: 0.05 },   
            critMult: { level: 0, cost: 50, effect: 2.0 }       
        };

        this.initDeck();
        this.loadGame();
        this.bindEvents();
        this.updateUI();
        this.renderShop();
        this.renderCarddexInitial(); // Para mostrar total de perks
    }

    initDeck() {
        const hasTwins = this.activePerks.includes('twin_decks');
        this.totalDeckSize = hasTwins ? 104 : 52;
        
        this.deck = [];
        for (let suit of SUITS) {
            for (let rank of RANKS) {
                this.deck.push({ suit: suit, rank: rank });
                if (hasTwins) {
                    this.deck.push({ suit: suit, rank: rank });
                }
            }
        }
        this.shuffle(this.deck);
        this.currentDeckIndex = 0;
        this.lastCardWasAce = false;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    buyUpgrade(type) {
        const upg = this.upgrades[type];
        if (this.money >= upg.cost) {
            this.money -= upg.cost;
            upg.level++;
            
            if (type === 'baseValue') {
                upg.effect += 0.2;
                upg.cost = Math.floor(upg.cost * 1.15);
            } else if (type === 'critChance') {
                let newEffect = upg.effect + 0.005; 
                if (newEffect > 0.90) newEffect = 0.90;
                upg.effect = newEffect;
                upg.cost = Math.floor(upg.cost * 1.25);
            } else if (type === 'critMult') {
                upg.effect += 0.25;
                upg.cost = Math.floor(upg.cost * 1.20);
            }

            this.saveGame();
            this.updateUI();
            this.renderShop();
            this.showNotification(`¡Mejora comprada! Nivel ${upg.level}`);
        } else {
            this.showNotification("No tienes suficiente dinero.");
        }
    }

    renderShop() {
        document.getElementById('lvl-base-val').textContent = this.upgrades.baseValue.level;
        document.getElementById('eff-base-val').textContent = this.upgrades.baseValue.effect.toFixed(1);
        document.getElementById('cost-base-val').textContent = this.upgrades.baseValue.cost.toLocaleString();
        
        document.getElementById('lvl-crit-pct').textContent = this.upgrades.critChance.level;
        document.getElementById('eff-crit-pct').textContent = (this.upgrades.critChance.effect * 100).toFixed(1) + '%';
        document.getElementById('cost-crit-pct').textContent = this.upgrades.critChance.cost.toLocaleString();
        
        document.getElementById('lvl-crit-mult').textContent = this.upgrades.critMult.level;
        document.getElementById('eff-crit-mult').textContent = this.upgrades.critMult.effect.toFixed(2);
        document.getElementById('cost-crit-mult').textContent = this.upgrades.critMult.cost.toLocaleString();

        document.getElementById('buy-base-val').disabled = this.money < this.upgrades.baseValue.cost;
        document.getElementById('buy-crit-pct').disabled = this.money < this.upgrades.critChance.cost || this.upgrades.critChance.effect >= 0.90;
        document.getElementById('buy-crit-mult').disabled = this.money < this.upgrades.critMult.cost;
    }

    calculateCardValue(card, isInstantReveal = false) {
        let value = 1 + this.upgrades.baseValue.effect;
        
        let flags = {
            isBurned: false,
            isStone: false,
            triggeredJoker: false,
            isCritical: false,
            isElectrified: false,
            modifiedRank: null
        };

        for (let perkId of this.activePerks) {
            const perk = PERK_DATABASE.find(p => p.id === perkId);
            if (!perk) continue;

            switch (perk.type) {
                case 'multiplier_by_position':
                    if (this.currentDeckIndex < perk.params.limit) {
                        value *= perk.params.multiplier;
                    }
                    break;

                case 'multiplier_by_suit':
                    if (perk.params.suits.includes(card.suit.id)) {
                        value *= perk.params.multiplier;
                    }
                    break;

                case 'chance_multiplier_global':
                    if (Math.random() < perk.params.chance) {
                        value *= perk.params.multiplier;
                        flags.isStone = true;
                    }
                    break;

                case 'global_mult_with_penalty':
                    value *= perk.params.multiplier;
                    const remainingCards = this.totalDeckSize - this.currentDeckIndex;
                    if (remainingCards <= perk.params.penaltyCount) {
                        flags.isBurned = true;
                        value = 0;
                    }
                    break;

                case 'structural_change':
                     value *= perk.params.multiplier;
                     break;

                case 'premium_trigger':
                    if (perk.params.premiumSuits.includes(card.suit.id)) {
                        value *= perk.params.mult;
                        if (Math.random() < perk.params.triggerChance) {
                            flags.triggeredJoker = true;
                            value *= perk.params.jokerMult;
                        }
                    }
                    break;

                case 'endgame_boost':
                    const cardsLeftInEndgame = this.totalDeckSize - this.currentDeckIndex;
                    if (cardsLeftInEndgame <= perk.params.threshold) {
                        value *= perk.params.multiplier;
                        if (Math.random() < perk.params.jokerChance) {
                            flags.triggeredJoker = true;
                            value *= perk.params.jokerMult;
                        }
                    }
                    break;

                case 'sequence_modifier':
                    if (this.lastCardWasAce && !isInstantReveal) {
                        const options = [...perk.params.targetRanks];
                        if (Math.random() < 0.1) {
                             flags.triggeredJoker = true;
                             value *= 20;
                             flags.modifiedRank = "LOBITO";
                        } else {
                            const newRank = options[Math.floor(Math.random() * options.length)];
                            flags.modifiedRank = newRank;
                        }
                    }
                    break;

                case 'speed_based_chance':
                    const now = Date.now();
                    const timeDiff = now - this.lastClickTime;
                    
                    if (timeDiff < perk.params.speedThresholdMs && timeDiff > 0) {
                         if (Math.random() < perk.params.chance) {
                             flags.isElectrified = true;
                             value *= perk.params.multiplier;
                         }
                    }
                    this.lastClickTime = now;
                    break;
                
                case 'instant_reveal_event':
                    if (!isInstantReveal && Math.random() < perk.params.chance) {
                        this.triggerStampede(perk.params.multiplier);
                        return { finalValue: 0, flags: {}, skipped: true };
                    }
                    break;
            }
        }

        if (!flags.isBurned && Math.random() < this.upgrades.critChance.effect) {
            flags.isCritical = true;
            value *= this.upgrades.critMult.effect;
        }

        if (card.rank === 'A') {
            this.lastCardWasAce = true;
        } else {
            this.lastCardWasAce = false;
        }

        return {
            finalValue: Math.floor(value),
            flags: flags,
            originalCard: card
        };
    }

    triggerStampede(multiplier) {
        this.showNotification("🐔 ¡ESTAMPIDA DE CACHORRITOS!");
        
        while (this.deck.length > 0) {
            const card = this.deck.pop();
            this.currentDeckIndex++;
            this.cardsDrawnTotal++;
            
            let val = (1 + this.upgrades.baseValue.effect) * multiplier;
            if (Math.random() < this.upgrades.critChance.effect) {
                val *= this.upgrades.critMult.effect;
            }

            this.money += Math.floor(val);
            
            this.history.unshift({
                originalCard: card,
                finalValue: Math.floor(val),
                flags: { isStampeded: true },
                isStampeded: true
            });
            if (this.history.length > this.maxHistory) this.history.pop();
        }
        
        this.autoShuffle(true);
    }

    revealCard() {
        if (document.getElementById('reward-modal').classList.contains('hidden') === false) return;
        if (this.deck.length === 0) {
            this.autoShuffle();
            return;
        }

        const rawCard = this.deck.pop();
        this.currentDeckIndex++;
        this.cardsDrawnTotal++;
        
        const result = this.calculateCardValue(rawCard);
        
        if (result.skipped) return; 

        this.money += result.finalValue;
        
        this.addToHistory(result);
        this.showFloatingText(`+$${result.finalValue}`, rawCard.suit.id, result.flags);
        
        this.saveGame();
        this.updateUI();
        this.renderShop();

        if (this.cardsDrawnTotal >= this.nextMilestone) {
            this.triggerRewardSelection();
            this.nextMilestone += this.milestoneStep;
        }
    }

    triggerRewardSelection() {
        const modal = document.getElementById('reward-modal');
        const optionsContainer = document.getElementById('reward-options');
        optionsContainer.innerHTML = '';

        const availableRewards = PERK_DATABASE.filter(p => !this.activePerks.includes(p.id));

        if (availableRewards.length === 0) {
            this.showNotification("¡Todos los perks desbloqueados!");
            modal.classList.add('hidden');
            return;
        }

        const shuffled = [...availableRewards].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);

        selected.forEach(perk => {
            const btn = document.createElement('button');
            btn.className = 'reward-card-btn';
            btn.style.borderColor = RARITY_COLORS[perk.rarity] || '#fff';
            
            // Lógica para imagen vs emoji
            const visualContent = perk.imgUrl 
                ? `<img src="${perk.imgUrl}" alt="${perk.title}" style="width:30px;height:30px;margin-bottom:5px;">` 
                : `<div class="rc-icon">${perk.icon}</div>`;

            btn.innerHTML = `
                ${visualContent}
                <div class="rc-title" style="color:${RARITY_COLORS[perk.rarity]}">${perk.title}</div>
                <div class="rc-desc">${perk.description}</div>
                <small style="margin-top:5px; font-size:0.7rem; color:#888;">${perk.rarity.toUpperCase()}</small>
            `;
            btn.onclick = () => this.selectPerk(perk.id);
            optionsContainer.appendChild(btn);
        });

        modal.classList.remove('hidden');
    }

    selectPerk(perkId) {
        this.activePerks.push(perkId);
        document.getElementById('reward-modal').classList.add('hidden');
        
        const perkData = PERK_DATABASE.find(p => p.id === perkId);
        this.showNotification(`${perkData.icon} ¡Nuevo Perk: ${perkData.title}!`);
        
        if (perkId === 'twin_decks') {
             this.initDeck();
        }

        this.saveGame();
        this.renderPerksBar();
        this.updateUI();
        this.renderCarddexInitial(); // Actualizar contador de descubiertos
    }

    autoShuffle(fromStampede = false) {
        const btn = document.getElementById('btn-deck');
        btn.disabled = true;
        btn.innerHTML = '<div style="color:white; font-weight:bold;">BARAJANDO...</div>';
        
        const delay = this.activePerks.includes('twin_decks') ? 1500 : 800;

        setTimeout(() => {
            this.initDeck();
            btn.disabled = false;
            btn.innerHTML = `
                <div class="deck-back-design">
                    <span class="icon">🃏</span>
                    <span class="text">REVELAR</span>
                </div>
            `;
            if(!fromStampede) this.showNotification("Nuevo mazo listo");
            this.updateUI();
        }, delay);
    }

    addToHistory(resultObj) {
        this.history.unshift(resultObj);
        if (this.history.length > this.maxHistory) this.history.pop();
        this.renderHistory();
    }

    renderHistory() {
        const container = document.getElementById('recent-history');
        container.innerHTML = '';
        
        if(this.history.length === 0) {
            container.innerHTML = '<div class="empty-hint">Tu mesa está vacía</div>';
            return;
        }

        this.history.forEach((item, index) => {
            const div = document.createElement('div');
            const card = item.originalCard;
            
            let extraClasses = '';
            if (item.flags?.isBurned) extraClasses += ' burned';
            if (item.flags?.isStone) extraClasses += ' stone';
            if (item.flags?.triggeredJoker) extraClasses += ' joker-hit';
            if (item.flags?.isCritical) extraClasses += ' critical';
            if (item.flags?.isElectrified) extraClasses += ' electrified';
            if (item.isStampeded) extraClasses += ' stampeded';

            div.className = `mini-card ${card.suit.id} ${extraClasses}`;
            div.style.animationDelay = `${index * 0.05}s`; 
            
            let statusIcon = '';
            if (item.flags?.isBurned) statusIcon = '🔥';
            else if (item.flags?.isStone) statusIcon = '🪨';
            else if (item.flags?.triggeredJoker) statusIcon = '🦩';
            else if (item.flags?.isElectrified) statusIcon = '⚡';
            else if (item.flags?.isCritical) statusIcon = '💥';
            else if (item.isStampeded) statusIcon = '🐔';

            const displayRank = item.flags?.modifiedRank || card.rank;

            div.innerHTML = `
                <span>${displayRank}</span>
                <span>${card.suit.symbol}</span>
                <small style="font-size:0.6rem; color:#fff; background:rgba(0,0,0,0.5); padding:2px 4px; border-radius:3px; margin-top:2px;">
                    ${statusIcon} $${item.finalValue}
                </small>
            `;
            container.appendChild(div);
        });
    }

    showFloatingText(text, suitId, flags) {
        const floatEl = document.createElement('div');
        floatEl.textContent = text;
        floatEl.style.position = 'absolute';
        floatEl.style.left = '50%';
        floatEl.style.top = '50%';
        floatEl.style.transform = 'translate(-50%, -50%)';
        floatEl.style.fontSize = '2rem';
        floatEl.style.fontWeight = 'bold';
        floatEl.style.pointerEvents = 'none';
        floatEl.style.zIndex = '100';
        floatEl.style.transition = 'all 0.8s ease-out';
        
        if (flags.isBurned) {
            floatEl.style.color = '#e74c3c';
            floatEl.textContent = "¡QUEMADA!";
        } else if (flags.triggeredJoker) {
            floatEl.style.color = '#f1c40f';
            floatEl.textContent = `¡LOBITO! ${text}`;
        } else if (flags.isElectrified) {
            floatEl.style.color = '#00d2d3';
            floatEl.textContent = `¡ELECTRICIDAD! ${text}`;
        } else if (flags.isStone) {
            floatEl.style.color = '#95a5a6';
            floatEl.textContent = `PIEDRA ${text}`;
        } else if (flags.isCritical) {
            floatEl.style.color = '#ff9f43';
            floatEl.textContent = `CRÍTICO! ${text}`;
        } else {
            const colors = { hearts: '#e74c3c', emeralds: '#2ecc71', moons: '#9b59b6', bones: '#bdc3c7' };
            floatEl.style.color = colors[suitId] || '#fff';
        }

        document.body.appendChild(floatEl);

        requestAnimationFrame(() => {
            floatEl.style.top = '30%';
            floatEl.style.opacity = '0';
        });

        setTimeout(() => floatEl.remove(), 800);
    }

    showNotification(msg) {
        const hint = document.querySelector('.hint-text');
        if(!hint) return;
        const original = hint.innerText;
        hint.innerText = msg;
        hint.style.color = "#fbc531";
        setTimeout(() => {
            hint.innerText = original;
            hint.style.color = "#777";
        }, 2000);
    }

    updateUI() {
        document.getElementById('money').textContent = this.money.toLocaleString();
        document.getElementById('deck-count').textContent = this.deck.length;
        document.getElementById('crit-chance-display').textContent = (this.upgrades.critChance.effect * 100).toFixed(1) + '%';
        document.getElementById('cards-discovered').textContent = this.activePerks.length;
        this.renderPerksBar();
    }

    renderPerksBar() {
        const perksContainer = document.getElementById('active-perks-bar');
        if (!perksContainer) return;

        perksContainer.innerHTML = '';
        
        this.activePerks.forEach(perkId => {
            const perkData = PERK_DATABASE.find(p => p.id === perkId);
            if (perkData) {
                const span = document.createElement('span');
                span.className = 'perk-badge';
                span.style.borderColor = RARITY_COLORS[perkData.rarity];
                span.style.color = RARITY_COLORS[perkData.rarity];
                
                // Imagen o Emoji
                const visual = perkData.imgUrl 
                    ? `<img src="${perkData.imgUrl}" alt="">` 
                    : perkData.icon;
                    
                span.innerHTML = `${visual} ${perkData.title}`;
                span.title = perkData.description;
                perksContainer.appendChild(span);
            }
        });
    }

    renderCarddexInitial() {
        document.getElementById('total-perks').textContent = PERK_DATABASE.length;
    }

    openCarddex() {
        const grid = document.getElementById('carddex-grid');
        grid.innerHTML = '';
        
        PERK_DATABASE.forEach(perk => {
            const isDiscovered = this.activePerks.includes(perk.id);
            const entry = document.createElement('div');
            entry.className = `carddex-entry ${isDiscovered ? 'discovered' : 'locked'}`;
            
            const visual = perk.imgUrl 
                ? `<img src="${perk.imgUrl}" alt="${perk.title}">` 
                : `<div style="font-size:2rem;">${perk.icon}</div>`;

            entry.innerHTML = `
                ${visual}
                <div class="name">${isDiscovered ? perk.title : '???'}</div>
                <div class="desc">${isDiscovered ? perk.description : 'Bloqueado'}</div>
                <div class="status">${isDiscovered ? '✓ Activo' : '??? Pendiente'}</div>
            `;
            grid.appendChild(entry);
        });
        
        document.getElementById('carddex-modal').classList.remove('hidden');
    }

    saveGame() {
        localStorage.setItem('wolfyClickerSave_vFinal_Integrated', JSON.stringify({
            money: this.money,
            cardsDrawnTotal: this.cardsDrawnTotal,
            nextMilestone: this.nextMilestone,
            activePerks: this.activePerks,
            upgrades: this.upgrades,
            history: this.history.map(h => ({ 
                suitId: h.originalCard.suit.id, 
                rank: h.originalCard.rank, 
                finalValue: h.finalValue,
                flags: h.flags,
                isStampeded: h.isStampeded
            }))
        }));
    }

    loadGame() {
        const saved = localStorage.getItem('wolfyClickerSave_vFinal_Integrated');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.money = data.money || 0;
                this.cardsDrawnTotal = data.cardsDrawnTotal || 0;
                this.nextMilestone = data.nextMilestone || 50;
                this.activePerks = data.activePerks || [];
                
                if (data.upgrades) this.upgrades = data.upgrades;

                this.history = (data.history || []).map(h => {
                    const suitObj = SUITS.find(s => s.id === h.suitId);
                    return {
                        originalCard: { suit: suitObj, rank: h.rank },
                        finalValue: h.finalValue,
                        flags: h.flags || {},
                        isStampeded: h.isStampeded || false
                    };
                });
                
                this.renderHistory();
                this.renderPerksBar();
            } catch(e) {
                console.error("Error cargando partida", e);
            }
        }
    }

    bindEvents() {
        document.getElementById('btn-deck').addEventListener('click', () => this.revealCard());
        document.getElementById('buy-base-val').addEventListener('click', () => this.buyUpgrade('baseValue'));
        document.getElementById('buy-crit-pct').addEventListener('click', () => this.buyUpgrade('critChance'));
        document.getElementById('buy-crit-mult').addEventListener('click', () => this.buyUpgrade('critMult'));
        
        // Carddex Events
        document.getElementById('btn-carddex').addEventListener('click', () => this.openCarddex());
        document.querySelector('.close-btn').addEventListener('click', () => {
            document.getElementById('carddex-modal').classList.add('hidden');
        });
        document.getElementById('carddex-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('carddex-modal')) {
                document.getElementById('carddex-modal').classList.add('hidden');
            }
        });

        document.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.code === 'Enter') && document.getElementById('reward-modal').classList.contains('hidden')) {
                e.preventDefault();
                this.revealCard();
            }
        });
    }
}

window.onload = () => {
    new WolfyClicker();
};
