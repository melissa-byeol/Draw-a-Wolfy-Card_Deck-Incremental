/**
 * DRAW A WOLFY CARD — Deck Incremental
 * Versión integrada: perks, tienda, Carddex, sonido y reinicio con interfaz propia.
 */

const SUITS = [
    { id: 'hearts', symbol: '❤️', name: 'Corazones', color: '#ff4d5e' },
    { id: 'emeralds', symbol: '💎', name: 'Esmeraldas', color: '#2fe08a' },
    { id: 'moons', symbol: '🌙', name: 'Lunas', color: '#b06cff' },
    { id: 'bones', symbol: '🦴', name: 'Huesos', color: '#e8e3d5' }
];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

const RARITY_COLORS = {
    common: '#c9d3dd', rare: '#4da3ff', epic: '#b06cff',
    legendary: '#ffc93c', mythic: '#ff4d5e'
};
const RARITY_NAMES = {
    common: 'COMÚN', rare: 'RARO', epic: 'ÉPICO', legendary: 'LEGENDARIO', mythic: 'MÍTICO'
};

/**
 * PERKS — añade 'imgUrl' (ej: "./assets/perks/sun.png") para usar imagen propia.
 * Si imgUrl está vacío o falla al cargar, se usa el emoji 'icon'.
 */
const PERK_DATABASE = [
    { id:'early_bird', title:"Cachorrito Mañanero", description:"Las primeras 10 cartas de cada mazo valen x2.", icon:"☀️", imgUrl:"", rarity:'common', type:'multiplier_by_position', params:{ limit:10, multiplier:2 } },
    { id:'black_cat', title:"Gatito Negro", description:"Cartas de Lunas 🌙 y Huesos 🦴 valen x1.5.", icon:"🐈‍⬛", imgUrl:"", rarity:'rare', type:'multiplier_by_suit', params:{ suits:['moons','bones'], multiplier:1.5 } },
    { id:'paleolithic_instinct', title:"Instinto Paleolítico", description:"10% de chance de que cualquier carta sea 'Piedra' (x2 valor).", icon:"🪨", imgUrl:"", rarity:'rare', type:'chance_multiplier_global', params:{ chance:0.10, multiplier:2 } },
    { id:'angry_wolfy', title:"Lobito Enojón", description:"Todas las cartas valen x3. Las últimas 5 se queman ($0).", icon:"😤", imgUrl:"", rarity:'epic', type:'global_mult_with_penalty', params:{ multiplier:3, penaltyCount:5 } },
    { id:'twin_decks', title:"Barajas Gemelas", description:"El mazo tiene 104 cartas. Todas valen x1.5. Barajado lento.", icon:"🃏", imgUrl:"", rarity:'epic', type:'structural_change', params:{ doubleDeck:true, multiplier:1.5 } },
    { id:'flamingo_style', title:"Flamenco", description:"Corazones/Esmeraldas x1.5. 5% chance de Carta Lobito (x20).", icon:"🦩", imgUrl:"", rarity:'legendary', type:'premium_trigger', params:{ premiumSuits:['hearts','emeralds'], mult:1.5, triggerChance:0.05, jokerMult:20 } },
    { id:'act_final', title:"Acto Final", description:"Últimas 13 cartas: x5 valor. 50% chance de Carta Lobito (x20).", icon:"🎭", imgUrl:"", rarity:'legendary', type:'endgame_boost', params:{ threshold:13, multiplier:5, jokerChance:0.50, jokerMult:20 } },
    { id:'troubadour_cub', title:"Cachorrito Trovador", description:"Tras un As (A), la siguiente carta se vuelve J/Q/K (o raro Lobito x20).", icon:"🎵", imgUrl:"", rarity:'legendary', type:'sequence_modifier', params:{ triggerRank:'A', targetRanks:['J','Q','K'] } },
    { id:'chicken_stampede', title:"Pollo Chillón", description:"5% chance de Estampida: revela TODO el mazo restante al instante con x2.", icon:"🐔", imgUrl:"", rarity:'mythic', type:'instant_reveal_event', params:{ chance:0.05, multiplier:2 } },
    { id:'overheat', title:"Sobrecalentamiento", description:"Clicks rápidos (<300ms) tienen 5% chance de Electrificar (x10).", icon:"⚡", imgUrl:"", rarity:'mythic', type:'speed_based_chance', params:{ chance:0.05, multiplier:10, speedThresholdMs:300 } }
];

const SAVE_KEY = 'wolfyClickerSave_vFinal_Integrated';
const LEGACY_SAVE_KEYS = ['wolfyClickerSave_vFinal_Integrated', 'wolfyClickerSave_v2', 'wolfyClickerSave'];
const MODAL_IDS = ['reward-modal', 'carddex-modal', 'save-modal', 'reset-modal'];

function createDefaultUpgrades() {
    return {
        baseValue: { level: 0, cost: 10, effect: 0 },
        critChance: { level: 0, cost: 25, effect: 0.05 },
        critMult: { level: 0, cost: 50, effect: 2.0 }
    };
}

class WolfyClicker {
    constructor() {
        this.money = 0;
        this.deck = [];
        this.history = [];
        this.maxHistory = 5;

        this.cardsDrawnTotal = 0;
        this.nextMilestone = 50;
        this.milestoneStep = 50;
        this.prevMilestone = 0;

        this.activePerks = [];
        this.currentDeckIndex = 0;
        this.totalDeckSize = 52;

        this.lastCardWasAce = false;
        this.lastClickTime = 0;
        this.isShuffling = false;
        this.pendingReward = false;

        this.bestCard = 0;
        this.decksShuffled = 0;
        this.totalCrits = 0;
        this.soundOn = true;

        // Control de timers / reinicio
        this._resetting = false;
        this._shuffleTimer = null;
        this._rewardTimer = null;
        this._revealTimeout = null;
        this._toastTimeout = null;
        this._hintTimeout = null;
        this._lastFocused = null;

        this.upgrades = createDefaultUpgrades();

        this.loadGame();
        this.initDeck();
        this.bindEvents();
        this.initAudio();
        this.updateUI();
        this.renderShop();
        this.renderHistory();
        this.renderCarddexInitial();
        this.updateSoundButton();

        if (this.pendingReward) this.triggerRewardSelection();
    }

    /* ================= MAZO ================= */

    initDeck() {
        const hasTwins = this.activePerks.includes('twin_decks');
        this.totalDeckSize = hasTwins ? 104 : 52;
        this.deck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                this.deck.push({ suit, rank });
                if (hasTwins) this.deck.push({ suit, rank });
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

    /* ================= TIENDA ================= */

    buyUpgrade(type) {
        const upg = this.upgrades[type];
        if (!upg) return;
        if (type === 'critChance' && upg.effect >= 0.90) return;

        if (this.money >= upg.cost) {
            this.money -= upg.cost;
            upg.level++;
            if (type === 'baseValue') {
                upg.effect += 0.2;
                upg.cost = Math.floor(upg.cost * 1.15);
            } else if (type === 'critChance') {
                upg.effect = Math.min(0.90, upg.effect + 0.005);
                upg.cost = Math.floor(upg.cost * 1.25);
            } else if (type === 'critMult') {
                upg.effect += 0.25;
                upg.cost = Math.floor(upg.cost * 1.20);
            }
            this.playSound('buy');
            this.saveGame();
            this.updateUI();
            this.renderShop();
            this.showToast(`✨ ¡Mejora comprada! Nivel ${upg.level}`);
        } else {
            this.playSound('error');
            this.showToast('💸 No tienes suficiente dinero.');
        }
    }

    renderShop() {
        const u = this.upgrades;
        document.getElementById('lvl-base-val').textContent = u.baseValue.level;
        document.getElementById('eff-base-val').textContent = u.baseValue.effect.toFixed(1);
        document.getElementById('cost-base-val').textContent = u.baseValue.cost.toLocaleString('es');

        document.getElementById('lvl-crit-pct').textContent = u.critChance.level;
        document.getElementById('eff-crit-pct').textContent = (u.critChance.effect * 100).toFixed(1) + '%';
        document.getElementById('cost-crit-pct').textContent = u.critChance.cost.toLocaleString('es');

        document.getElementById('lvl-crit-mult').textContent = u.critMult.level;
        document.getElementById('eff-crit-mult').textContent = u.critMult.effect.toFixed(2);
        document.getElementById('cost-crit-mult').textContent = u.critMult.cost.toLocaleString('es');

        document.getElementById('buy-base-val').disabled = this.money < u.baseValue.cost;
        const critMaxed = u.critChance.effect >= 0.90;
        const btnCrit = document.getElementById('buy-crit-pct');
        btnCrit.disabled = this.money < u.critChance.cost || critMaxed;
        btnCrit.classList.toggle('maxed', critMaxed);
        btnCrit.innerHTML = critMaxed
            ? '🏆 MÁXIMO (90%)'
            : `Comprar ($<span id="cost-crit-pct">${u.critChance.cost.toLocaleString('es')}</span>)`;
        document.getElementById('buy-crit-mult').disabled = this.money < u.critMult.cost;
    }

    /* ================= CÁLCULO DE CARTA ================= */

    calculateCardValue(card, isInstantReveal = false) {
        let value = 1 + this.upgrades.baseValue.effect;
        const flags = {
            isBurned: false, isStone: false, triggeredJoker: false,
            isCritical: false, isElectrified: false, modifiedRank: null
        };

        for (const perkId of this.activePerks) {
            const perk = PERK_DATABASE.find(p => p.id === perkId);
            if (!perk) continue;

            switch (perk.type) {
                case 'multiplier_by_position':
                    if (this.currentDeckIndex <= perk.params.limit) value *= perk.params.multiplier;
                    break;

                case 'multiplier_by_suit':
                    if (perk.params.suits.includes(card.suit.id)) value *= perk.params.multiplier;
                    break;

                case 'chance_multiplier_global':
                    if (Math.random() < perk.params.chance) { value *= perk.params.multiplier; flags.isStone = true; }
                    break;

                case 'global_mult_with_penalty': {
                    value *= perk.params.multiplier;
                    const remaining = this.totalDeckSize - this.currentDeckIndex;
                    if (remaining < perk.params.penaltyCount) { flags.isBurned = true; value = 0; }
                    break;
                }

                case 'structural_change':
                    value *= perk.params.multiplier;
                    break;

                case 'premium_trigger':
                    if (perk.params.premiumSuits.includes(card.suit.id)) {
                        value *= perk.params.mult;
                        if (Math.random() < perk.params.triggerChance) { flags.triggeredJoker = true; value *= perk.params.jokerMult; }
                    }
                    break;

                case 'endgame_boost': {
                    const left = this.totalDeckSize - this.currentDeckIndex;
                    if (left < perk.params.threshold) {
                        value *= perk.params.multiplier;
                        if (Math.random() < perk.params.jokerChance) { flags.triggeredJoker = true; value *= perk.params.jokerMult; }
                    }
                    break;
                }

                case 'sequence_modifier':
                    if (this.lastCardWasAce && !isInstantReveal) {
                        if (Math.random() < 0.1) {
                            flags.triggeredJoker = true; value *= 20; flags.modifiedRank = '🐺';
                        } else {
                            const opts = perk.params.targetRanks;
                            flags.modifiedRank = opts[Math.floor(Math.random() * opts.length)];
                        }
                    }
                    break;

                case 'speed_based_chance': {
                    const now = performance.now();
                    const diff = now - this.lastClickTime;
                    if (diff < perk.params.speedThresholdMs && diff > 0 && !isInstantReveal) {
                        if (Math.random() < perk.params.chance) { flags.isElectrified = true; value *= perk.params.multiplier; }
                    }
                    break;
                }

                case 'instant_reveal_event':
                    if (!isInstantReveal && Math.random() < perk.params.chance) {
                        this.deck.push(card);
                        this.currentDeckIndex--;
                        this.cardsDrawnTotal--;
                        return { skipped: true };
                    }
                    break;
            }
        }

        if (!flags.isBurned && Math.random() < this.upgrades.critChance.effect) {
            flags.isCritical = true;
            value *= this.upgrades.critMult.effect;
        }

        this.lastCardWasAce = (card.rank === 'A');
        return { finalValue: Math.floor(value), flags, originalCard: card };
    }

    /* ================= ESTAMPIDA ================= */

    triggerStampede(multiplier) {
        this.showToast('🐔 ¡ESTAMPIDA DE CACHORRITOS! Todo el mazo revelado x2');
        this.playSound('stampede');
        this.screenFlash('#ffc93c');
        this.spawnParticles(24, '#ffc93c');

        let stampedeTotal = 0;
        while (this.deck.length > 0) {
            const card = this.deck.pop();
            this.currentDeckIndex++;
            this.cardsDrawnTotal++;

            let val = (1 + this.upgrades.baseValue.effect) * multiplier;
            const isCrit = Math.random() < this.upgrades.critChance.effect;
            if (isCrit) { val *= this.upgrades.critMult.effect; this.totalCrits++; }
            const finalVal = Math.floor(val);

            this.money += finalVal;
            stampedeTotal += finalVal;
            if (finalVal > this.bestCard) this.bestCard = finalVal;

            this.history.unshift({
                originalCard: card, finalValue: finalVal,
                flags: { isCritical: isCrit, isStampeded: true }, isStampeded: true
            });
            if (this.history.length > this.maxHistory) this.history.pop();
        }

        this.showFloatingText(`🐔 +$${stampedeTotal.toLocaleString('es')}`, '#ffc93c');
        this.checkMilestone();
        this.saveGame();
        this.updateUI();
        this.renderShop();
        this.renderHistory();
        this.autoShuffle(true);
    }

    /* ================= REVELAR ================= */

    revealCard() {
        if (this.isShuffling || this._resetting) return;
        if (MODAL_IDS.some(id => !document.getElementById(id).classList.contains('hidden'))) return;

        if (this.deck.length === 0) { this.autoShuffle(); return; }

        const rawCard = this.deck.pop();
        this.currentDeckIndex++;
        this.cardsDrawnTotal++;

        const result = this.calculateCardValue(rawCard);
        if (result.skipped) { this.triggerStampede(2); return; }

        this.lastClickTime = performance.now();
        this.money += result.finalValue;
        if (result.flags.isCritical) this.totalCrits++;
        if (result.finalValue > this.bestCard) this.bestCard = result.finalValue;

        this.addToHistory(result);
        this.renderRevealedCard(result);
        this.playCardSound(result.flags);

        const f = result.flags;
        let label = `+$${result.finalValue.toLocaleString('es')}`;
        let color = rawCard.suit.color;
        if (f.isBurned) { label = '🔥 ¡QUEMADA!'; color = '#ff4d5e'; }
        else if (f.triggeredJoker) { label = `🐺 ¡LOBITO! ${label}`; color = '#ffc93c'; this.screenFlash('#ffc93c'); this.spawnParticles(18, '#ffc93c'); }
        else if (f.isElectrified) { label = `⚡ ${label}`; color = '#35e0ff'; this.screenFlash('#35e0ff'); this.spawnParticles(14, '#35e0ff'); }
        else if (f.isStone) { label = `🪨 ${label}`; color = '#aab4bd'; }
        else if (f.isCritical) { label = `💥 ${label}`; color = '#ff8a3c'; this.spawnParticles(10, '#ff8a3c'); }
        else { this.spawnParticles(5, color); }

        this.showFloatingText(label, color);
        this.bumpMoney();

        this.checkMilestone();
        this.saveGame();
        this.updateUI();
        this.renderShop();

        if (this.deck.length === 0 && document.getElementById('reward-modal').classList.contains('hidden')) {
            this.autoShuffle();
        }
    }

    checkMilestone() {
        if (this.cardsDrawnTotal >= this.nextMilestone) {
            this.prevMilestone = this.nextMilestone;
            this.nextMilestone += this.milestoneStep;
            this.pendingReward = true;
            clearTimeout(this._rewardTimer);
            this._rewardTimer = setTimeout(() => {
                if (!this._resetting) this.triggerRewardSelection();
            }, 600);
        }
    }

    /* ================= RECOMPENSAS / PERKS ================= */

    triggerRewardSelection() {
        const available = PERK_DATABASE.filter(p => !this.activePerks.includes(p.id));
        if (available.length === 0) {
            this.pendingReward = false;
            this.showToast('🏆 ¡Todos los perks desbloqueados! El Lobito te da +$500 de propina.');
            this.money += 500;
            this.saveGame(); this.updateUI(); this.renderShop();
            return;
        }

        const container = document.getElementById('reward-options');
        container.innerHTML = '';

        const shuffled = [...available];
        this.shuffle(shuffled);
        const selected = shuffled.slice(0, 3);

        selected.forEach(perk => {
            const btn = document.createElement('button');
            btn.className = 'reward-card-btn';
            const rc = RARITY_COLORS[perk.rarity] || '#fff';
            btn.style.borderColor = rc;

            const visual = perk.imgUrl
                ? `<img src="${perk.imgUrl}" alt="" style="width:36px;height:36px;" onerror="this.outerHTML='<div class=rc-icon>${perk.icon}</div>'">`
                : `<div class="rc-icon">${perk.icon}</div>`;

            btn.innerHTML = `
                ${visual}
                <div class="rc-title" style="color:${rc}">${perk.title}</div>
                <div class="rc-desc">${perk.description}</div>
                <div class="rc-rarity" style="color:${rc}">${RARITY_NAMES[perk.rarity]}</div>`;
            btn.addEventListener('click', () => this.selectPerk(perk.id));
            container.appendChild(btn);
        });

        this.playSound('reward');
        this.openModal('reward-modal');
    }

    selectPerk(perkId) {
        if (this.activePerks.includes(perkId)) return;
        this.activePerks.push(perkId);
        this.pendingReward = false;
        this.closeModal('reward-modal');

        const perk = PERK_DATABASE.find(p => p.id === perkId);
        this.playSound('perk');
        this.screenFlash(RARITY_COLORS[perk.rarity]);
        this.showToast(`${perk.icon} ¡Nuevo perk: ${perk.title}!`);

        if (perkId === 'twin_decks') {
            this.initDeck();
            this.showToast('🃏 ¡Barajas Gemelas activadas! Mazo nuevo de 104 cartas.');
        }

        this.saveGame();
        this.updateUI();
        this.renderShop();

        if (this.deck.length === 0) this.autoShuffle();
    }

    /* ================= BARAJADO ================= */

    autoShuffle(fromStampede = false) {
        if (this.isShuffling || this._resetting) return;
        this.isShuffling = true;
        const btn = document.getElementById('btn-deck');
        btn.disabled = true;
        btn.classList.add('shuffling');
        btn.innerHTML = '<div class="deck-back-design"><span class="icon">🌀</span><span class="text" style="font-size:0.8rem;">BARAJANDO…</span></div>';
        this.playSound('shuffle');

        const delay = this.activePerks.includes('twin_decks') ? 1500 : 800;
        clearTimeout(this._shuffleTimer);
        this._shuffleTimer = setTimeout(() => {
            if (this._resetting) return;
            this.initDeck();
            this.decksShuffled++;
            this.isShuffling = false;
            btn.disabled = false;
            btn.classList.remove('shuffling');
            this.restoreDeckButton();
            if (!fromStampede) this.showToast('🌙 El Lobito invisible barajó un mazo nuevo');
            this.saveGame();
            this.updateUI();
        }, delay);
    }

    restoreDeckButton() {
        const btn = document.getElementById('btn-deck');
        btn.disabled = false;
        btn.classList.remove('shuffling');
        btn.innerHTML = `
            <div class="deck-back-design">
                <span class="icon">🐺</span>
                <span class="text">REVELAR</span>
                <span class="deck-hint-mini">clic · espacio · enter</span>
            </div>`;
    }

    /* ================= HISTORIAL / MESA ================= */

    addToHistory(resultObj) {
        this.history.unshift(resultObj);
        if (this.history.length > this.maxHistory) this.history.pop();
        this.renderHistory();
    }

    renderHistory() {
        const container = document.getElementById('recent-history');
        container.innerHTML = '';
        if (this.history.length === 0) {
            container.innerHTML = '<div class="empty-hint">Tu mesa está vacía</div>';
            return;
        }
        this.history.forEach((item, index) => {
            const card = item.originalCard;
            if (!card || !card.suit) return;
            const div = document.createElement('div');
            let extra = '';
            const f = item.flags || {};
            if (f.isBurned) extra += ' burned';
            if (f.isStone) extra += ' stone';
            if (f.triggeredJoker) extra += ' joker-hit';
            if (f.isCritical) extra += ' critical';
            if (f.isElectrified) extra += ' electrified';
            if (item.isStampeded) extra += ' stampeded';

            div.className = `mini-card ${card.suit.id}${extra}`;
            div.style.animationDelay = `${index * 0.05}s`;

            let statusIcon = '';
            if (f.isBurned) statusIcon = '🔥';
            else if (f.triggeredJoker) statusIcon = '🐺';
            else if (f.isElectrified) statusIcon = '⚡';
            else if (f.isStone) statusIcon = '🪨';
            else if (item.isStampeded) statusIcon = '🐔';
            else if (f.isCritical) statusIcon = '💥';

            const displayRank = f.modifiedRank || card.rank;
            div.innerHTML = `
                <span>${displayRank}</span>
                <span>${card.suit.symbol}</span>
                <small>${statusIcon} $${item.finalValue.toLocaleString('es')}</small>`;
            container.appendChild(div);
        });
    }

    renderRevealedCard(result) {
        const slot = document.getElementById('reveal-slot');
        slot.innerHTML = '';
        const card = result.originalCard;
        const f = result.flags;
        const el = document.createElement('div');
        const glow = (f.triggeredJoker || f.isElectrified || f.isCritical) ? ' special-glow' : '';
        el.className = `revealed-card ${card.suit.id}${glow}`;
        const rank = f.modifiedRank || card.rank;
        el.innerHTML = `
            <span class="rc-corner tl">${rank}${card.suit.symbol}</span>
            <span class="rc-rank">${rank}</span>
            <span class="rc-suit">${card.suit.symbol}</span>
            <span class="rc-value">${f.isBurned ? '🔥 $0' : '$' + result.finalValue.toLocaleString('es')}</span>
            <span class="rc-corner br">${rank}${card.suit.symbol}</span>`;
        slot.appendChild(el);
        clearTimeout(this._revealTimeout);
        this._revealTimeout = setTimeout(() => {
            el.classList.add('fade-out');
            setTimeout(() => el.remove(), 350);
        }, 900);
    }

    /* ================= FX ================= */

    showFloatingText(text, color) {
        const layer = document.getElementById('fx-layer');
        const el = document.createElement('div');
        el.className = 'float-text';
        el.textContent = text;
        el.style.color = color;
        layer.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    spawnParticles(count, color) {
        const layer = document.getElementById('fx-layer');
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.background = color;
            p.style.left = '50%';
            p.style.top = '50%';
            const angle = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * 90;
            p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
            p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
            p.style.animationDelay = `${Math.random() * 0.1}s`;
            layer.appendChild(p);
            setTimeout(() => p.remove(), 950);
        }
    }

    screenFlash(color) {
        const el = document.createElement('div');
        el.className = 'screen-flash';
        el.style.background = `radial-gradient(circle at 50% 45%, ${color}, transparent 70%)`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 500);
    }

    bumpMoney() {
        const el = document.querySelector('.money-display');
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
    }

    showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.remove('hidden');
        clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => toast.classList.add('hidden'), 2400);

        const hint = document.querySelector('.hint-text');
        if (hint) {
            hint.textContent = msg;
            hint.classList.add('flash');
            clearTimeout(this._hintTimeout);
            this._hintTimeout = setTimeout(() => {
                hint.textContent = 'Haz clic en el mazo para revelar una carta';
                hint.classList.remove('flash');
            }, 2400);
        }
    }

    /* ================= AUDIO ================= */

    initAudio() { this.audioCtx = null; }

    ensureAudio() {
        if (!this.audioCtx) {
            try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
            catch (e) { this.audioCtx = null; }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }

    tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
        if (!this.soundOn || !this.audioCtx) return;
        const t = this.audioCtx.currentTime + when;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.start(t); osc.stop(t + dur + 0.02);
    }

    playCardSound(flags) {
        this.ensureAudio();
        if (flags.isBurned) { this.tone(140, 0.25, 'sawtooth', 0.1); return; }
        if (flags.triggeredJoker) { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.14, i * 0.08)); return; }
        if (flags.isElectrified) { this.tone(1200, 0.08, 'square', 0.08); this.tone(1600, 0.12, 'square', 0.08, 0.06); return; }
        if (flags.isCritical) { this.tone(660, 0.1, 'triangle', 0.13); this.tone(880, 0.14, 'triangle', 0.13, 0.07); return; }
        this.tone(440 + Math.random() * 120, 0.09, 'triangle', 0.09);
    }

    playSound(kind) {
        this.ensureAudio();
        switch (kind) {
            case 'buy': this.tone(523, 0.1, 'triangle', 0.12); this.tone(784, 0.14, 'triangle', 0.12, 0.08); break;
            case 'error': this.tone(180, 0.18, 'sawtooth', 0.08); break;
            case 'shuffle': this.tone(300, 0.08, 'triangle', 0.07); this.tone(360, 0.08, 'triangle', 0.07, 0.1); this.tone(420, 0.1, 'triangle', 0.07, 0.2); break;
            case 'reward': [392, 523, 659].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.12, i * 0.1)); break;
            case 'perk': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.15, 'triangle', 0.13, i * 0.07)); break;
            case 'stampede': [330, 392, 494, 587, 740].forEach((f, i) => this.tone(f, 0.12, 'square', 0.07, i * 0.05)); break;
            case 'reset': [523, 392, 330, 262].forEach((f, i) => this.tone(f, 0.2, 'sine', 0.1, i * 0.12)); break;
        }
    }

    toggleSound() {
        this.soundOn = !this.soundOn;
        this.updateSoundButton();
        this.saveGame();
        if (this.soundOn) { this.ensureAudio(); this.tone(660, 0.1, 'triangle', 0.1); }
    }

    updateSoundButton() {
        const btn = document.getElementById('btn-sound');
        btn.textContent = this.soundOn ? '🔊 Sonido' : '🔇 Silencio';
        btn.classList.toggle('muted', !this.soundOn);
    }

    /* ================= UI GENERAL ================= */

    updateUI() {
        document.getElementById('money').textContent = this.money.toLocaleString('es');
        document.getElementById('deck-count').textContent = this.deck.length;
        document.getElementById('deck-total').textContent = this.totalDeckSize;
        document.getElementById('crit-chance-display').textContent = (this.upgrades.critChance.effect * 100).toFixed(1) + '%';
        document.getElementById('cards-discovered').textContent = this.activePerks.length;
        document.getElementById('cards-drawn-total').textContent = this.cardsDrawnTotal.toLocaleString('es');
        document.getElementById('best-card').textContent = '$' + this.bestCard.toLocaleString('es');
        document.getElementById('decks-shuffled').textContent = this.decksShuffled;
        document.getElementById('total-crits').textContent = this.totalCrits.toLocaleString('es');

        const span = this.nextMilestone - this.prevMilestone;
        const progress = Math.max(0, Math.min(1, (this.cardsDrawnTotal - this.prevMilestone) / span));
        document.getElementById('milestone-fill').style.width = (progress * 100) + '%';
        document.getElementById('milestone-current').textContent = this.cardsDrawnTotal.toLocaleString('es');
        document.getElementById('milestone-target').textContent = this.nextMilestone.toLocaleString('es');

        this.renderPerksBar();
    }

    renderPerksBar() {
        const container = document.getElementById('active-perks-bar');
        container.innerHTML = '';
        if (this.activePerks.length === 0) {
            container.innerHTML = '<span class="perks-empty">Aún no tienes perks activos — revela 50 cartas para tu primer paquete ✨</span>';
            return;
        }
        this.activePerks.forEach(perkId => {
            const perk = PERK_DATABASE.find(p => p.id === perkId);
            if (!perk) return;
            const span = document.createElement('span');
            span.className = 'perk-badge';
            const rc = RARITY_COLORS[perk.rarity];
            span.style.borderColor = rc;
            span.style.color = rc;
            const visual = perk.imgUrl
                ? `<img src="${perk.imgUrl}" alt="" onerror="this.outerHTML='${perk.icon}'">`
                : perk.icon;
            span.innerHTML = `${visual} ${perk.title}`;
            span.title = perk.description;
            container.appendChild(span);
        });
    }

    renderCarddexInitial() {
        document.getElementById('total-perks').textContent = PERK_DATABASE.length;
    }

    openCarddex() {
        const grid = document.getElementById('carddex-grid');
        grid.innerHTML = '';
        PERK_DATABASE.forEach(perk => {
            const discovered = this.activePerks.includes(perk.id);
            const entry = document.createElement('div');
            entry.className = `carddex-entry ${discovered ? 'discovered' : 'locked'}`;
            const rc = RARITY_COLORS[perk.rarity];
            if (discovered) entry.style.borderColor = rc;

            const visual = perk.imgUrl
                ? `<img src="${perk.imgUrl}" alt="" onerror="this.outerHTML='<div class=cd-icon>${perk.icon}</div>'">`
                : `<div class="cd-icon">${discovered ? perk.icon : '❓'}</div>`;

            entry.innerHTML = `
                ${visual}
                <div class="name" style="color:${discovered ? rc : 'inherit'}">${discovered ? perk.title : '???'}</div>
                <div class="desc">${discovered ? perk.description : 'Sigue revelando cartas para descubrirlo'}</div>
                <div class="status">${discovered ? '✓ Activo' : '🔒 Pendiente'}</div>`;
            grid.appendChild(entry);
        });
        this.openModal('carddex-modal');
    }

    /* ================= MODALES ================= */

    openModal(id) {
        const modal = document.getElementById(id);
        if (!modal.classList.contains('hidden')) return;
        this._lastFocused = document.activeElement;
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        const focusable = modal.querySelector('button:not([disabled]), input, [tabindex]');
        if (focusable) setTimeout(() => focusable.focus(), 60);
    }

    closeModal(id) {
        document.getElementById(id).classList.add('hidden');
        if (!MODAL_IDS.some(mid => !document.getElementById(mid).classList.contains('hidden'))) {
            document.body.classList.remove('modal-open');
            if (this._lastFocused && document.contains(this._lastFocused)) {
                this._lastFocused.focus();
            }
        }
    }

    closeAllModals() {
        MODAL_IDS.forEach(id => document.getElementById(id).classList.add('hidden'));
        document.body.classList.remove('modal-open');
    }

    /* ================= GUARDADO ================= */

    saveGame() {
        if (this._resetting) return;
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.serialize())); }
        catch (e) { console.warn('No se pudo guardar:', e); }
    }

    serialize() {
        return {
            version: 2,
            money: this.money,
            cardsDrawnTotal: this.cardsDrawnTotal,
            nextMilestone: this.nextMilestone,
            prevMilestone: this.prevMilestone,
            activePerks: this.activePerks,
            upgrades: this.upgrades,
            bestCard: this.bestCard,
            decksShuffled: this.decksShuffled,
            totalCrits: this.totalCrits,
            soundOn: this.soundOn,
            pendingReward: this.pendingReward,
            history: this.history
                .filter(h => h.originalCard && h.originalCard.suit)
                .map(h => ({
                    suitId: h.originalCard.suit.id,
                    rank: h.originalCard.rank,
                    finalValue: h.finalValue,
                    flags: h.flags || {},
                    isStampeded: !!h.isStampeded
                }))
        };
    }

    applySaveData(data) {
        this.money = Number(data.money) || 0;
        this.cardsDrawnTotal = Number(data.cardsDrawnTotal) || 0;
        this.nextMilestone = Number(data.nextMilestone) || 50;
        this.prevMilestone = Number.isFinite(Number(data.prevMilestone))
            ? Number(data.prevMilestone)
            : Math.max(0, this.nextMilestone - this.milestoneStep);
        this.activePerks = Array.isArray(data.activePerks)
            ? data.activePerks.filter(id => PERK_DATABASE.some(p => p.id === id)) : [];

        const defaults = createDefaultUpgrades();
        this.upgrades = defaults;
        if (data.upgrades) {
            for (const key of Object.keys(defaults)) {
                const src = data.upgrades[key];
                if (!src) continue;
                this.upgrades[key] = {
                    level: Number(src.level) || 0,
                    cost: Number(src.cost) || defaults[key].cost,
                    effect: Number.isFinite(Number(src.effect)) ? Number(src.effect) : defaults[key].effect
                };
            }
        }

        this.bestCard = Number(data.bestCard) || 0;
        this.decksShuffled = Number(data.decksShuffled) || 0;
        this.totalCrits = Number(data.totalCrits) || 0;
        this.soundOn = data.soundOn !== false;
        this.pendingReward = !!data.pendingReward;

        this.history = (Array.isArray(data.history) ? data.history : []).map(h => {
            const suitObj = SUITS.find(s => s.id === h.suitId);
            if (!suitObj) return null;
            return {
                originalCard: { suit: suitObj, rank: h.rank },
                finalValue: Number(h.finalValue) || 0,
                flags: h.flags || {},
                isStampeded: !!h.isStampeded
            };
        }).filter(Boolean);
    }

    loadGame() {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (saved) this.applySaveData(JSON.parse(saved));
        } catch (e) { console.error('Error cargando partida:', e); }
    }

    refreshSaveSummary() {
        const levels = Object.values(this.upgrades).reduce((sum, u) => sum + u.level, 0);
        document.getElementById('summary-money').textContent = '$' + this.money.toLocaleString('es');
        document.getElementById('summary-cards').textContent = this.cardsDrawnTotal.toLocaleString('es');
        document.getElementById('summary-perks').textContent = `${this.activePerks.length} / ${PERK_DATABASE.length}`;
        document.getElementById('summary-decks').textContent = this.decksShuffled.toLocaleString('es');
        document.getElementById('reset-money').textContent = '$' + this.money.toLocaleString('es');
        document.getElementById('reset-upgrades').textContent = levels + (levels === 1 ? ' nivel' : ' niveles');
        document.getElementById('reset-perks').textContent = `${this.activePerks.length} / ${PERK_DATABASE.length}`;
        document.getElementById('reset-cards').textContent = this.cardsDrawnTotal.toLocaleString('es');
    }

    exportSave() {
        const blob = new Blob([JSON.stringify(this.serialize(), null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wolfy-partida-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.showToast('⬇️ Partida exportada');
    }

    importSave(file) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (typeof data.money !== 'number') throw new Error('Formato inválido');
                this.applySaveData(data);
                this.initDeck();
                this.saveGame();
                this.updateUI(); this.renderShop(); this.renderHistory(); this.updateSoundButton();
                this.closeModal('save-modal');
                this.showToast('⬆️ ¡Partida importada correctamente!');
                if (this.pendingReward) this.triggerRewardSelection();
            } catch (e) {
                this.showToast('❌ Archivo de partida inválido');
            }
        };
        reader.readAsText(file);
    }

    /* ================= REINICIO CON INTERFAZ PROPIA ================= */

    resetGame() {
        this.refreshSaveSummary();
        const check = document.getElementById('reset-confirm-check');
        check.checked = false;
        check.parentElement.classList.remove('checked');
        document.getElementById('btn-confirm-reset').disabled = true;
        this.openModal('reset-modal');
    }

    cancelReset() {
        this.closeModal('reset-modal');
    }

    confirmReset() {
        if (!document.getElementById('reset-confirm-check').checked) return;
        this._resetting = true;

        clearTimeout(this._shuffleTimer);
        clearTimeout(this._rewardTimer);
        clearTimeout(this._revealTimeout);
        clearTimeout(this._toastTimeout);
        clearTimeout(this._hintTimeout);

        try { LEGACY_SAVE_KEYS.forEach(k => localStorage.removeItem(k)); }
        catch (e) { console.warn('No se pudo borrar localStorage:', e); }

        this.money = 0;
        this.deck = [];
        this.history = [];
        this.cardsDrawnTotal = 0;
        this.nextMilestone = 50;
        this.prevMilestone = 0;
        this.activePerks = [];
        this.currentDeckIndex = 0;
        this.totalDeckSize = 52;
        this.lastCardWasAce = false;
        this.lastClickTime = 0;
        this.isShuffling = false;
        this.pendingReward = false;
        this.bestCard = 0;
        this.decksShuffled = 0;
        this.totalCrits = 0;
        this.upgrades = createDefaultUpgrades();

        this.closeAllModals();
        document.getElementById('reveal-slot').innerHTML = '';
        document.getElementById('fx-layer').innerHTML = '';
        document.querySelectorAll('.screen-flash').forEach(el => el.remove());
        const toast = document.getElementById('toast');
        toast.textContent = '';
        toast.classList.add('hidden');
        const hint = document.querySelector('.hint-text');
        hint.textContent = 'Haz clic en el mazo para revelar una carta';
        hint.classList.remove('flash');

        this.restoreDeckButton();
        this.initDeck();
        this.updateUI();
        this.renderShop();
        this.renderHistory();
        this.renderCarddexInitial();

        this._resetting = false;
        this.saveGame();
        this.playSound('reset');
        this.screenFlash('#b06cff');
        this.showToast('🗑️ Partida reiniciada. ¡Mazo nuevo, lobitos nuevos! 🐺');
        document.getElementById('btn-deck').focus();
    }

    /* ================= EVENTOS ================= */

    bindEvents() {
        document.getElementById('btn-deck').addEventListener('click', () => { this.ensureAudio(); this.revealCard(); });
        document.getElementById('buy-base-val').addEventListener('click', () => this.buyUpgrade('baseValue'));
        document.getElementById('buy-crit-pct').addEventListener('click', () => this.buyUpgrade('critChance'));
        document.getElementById('buy-crit-mult').addEventListener('click', () => this.buyUpgrade('critMult'));

        document.getElementById('btn-carddex').addEventListener('click', () => this.openCarddex());
        document.getElementById('btn-sound').addEventListener('click', () => this.toggleSound());
        document.getElementById('btn-save-menu').addEventListener('click', () => {
            this.refreshSaveSummary();
            this.openModal('save-modal');
        });

        document.getElementById('btn-export').addEventListener('click', () => this.exportSave());
        document.getElementById('btn-import').addEventListener('click', () => document.getElementById('import-file').click());
        document.getElementById('import-file').addEventListener('change', (e) => {
            if (e.target.files[0]) this.importSave(e.target.files[0]);
            e.target.value = '';
        });

        document.getElementById('btn-reset').addEventListener('click', () => this.resetGame());
        document.getElementById('btn-cancel-reset').addEventListener('click', () => this.cancelReset());
        document.getElementById('btn-confirm-reset').addEventListener('click', () => this.confirmReset());

        const check = document.getElementById('reset-confirm-check');
        check.addEventListener('change', () => {
            document.getElementById('btn-confirm-reset').disabled = !check.checked;
            check.parentElement.classList.toggle('checked', check.checked);
        });

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(btn.dataset.close));
        });

        ['carddex-modal', 'save-modal', 'reset-modal'].forEach(id => {
            const modal = document.getElementById(id);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(id);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (!document.getElementById('reset-modal').classList.contains('hidden')) { this.cancelReset(); return; }
                if (!document.getElementById('save-modal').classList.contains('hidden')) { this.closeModal('save-modal'); return; }
                if (!document.getElementById('carddex-modal').classList.contains('hidden')) { this.closeModal('carddex-modal'); return; }
                return;
            }
            const anyModalOpen = MODAL_IDS.some(id => !document.getElementById(id).classList.contains('hidden'));
            if ((e.code === 'Space' || e.code === 'Enter') && !anyModalOpen) {
                e.preventDefault();
                this.ensureAudio();
                this.revealCard();
            }
        });

        window.addEventListener('beforeunload', () => this.saveGame());
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.wolfyGame = new WolfyClicker();
});
