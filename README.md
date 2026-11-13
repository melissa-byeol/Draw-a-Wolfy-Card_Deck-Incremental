# 🐺 Draw a Wolfy Card: Deck Incremental

Un juego incremental de cartas donde revelas una baraja de **52 cartas** (o **104** con el perk *Barajas Gemelas*). Cada carta revela un Lobito y genera dinero. Cuando el mazo se agota, un **Lobito invisible** lo baraja y el ciclo comienza de nuevo… ¡infinitamente!

Revela cartas, gana dinero, compra mejoras, desbloquea **perks permanentes** y completa tu **Carddex**. 🃏✨

---

## 🎮 Cómo jugar

1. Haz **clic en el mazo** (o pulsa `Espacio` / `Enter`) para revelar una carta.
2. Cada carta genera dinero según su valor base, tus mejoras y tus perks activos.
3. Las últimas cartas quedan en la **Mesa / Historial**.
4. Al agotarse el mazo, el Lobito invisible baraja uno nuevo automáticamente.
5. Cada **50 cartas reveladas** recibes un **Paquete de Cartas Especial**: elige 1 de 3 perks permanentes.
6. ¡Descubre los **10 perks** y completa tu Carddex!

> 💡 Tu partida se guarda sola en el navegador. Puedes cerrar y volver cuando quieras.

---

## 🛒 Tienda de Mejoras

| Mejora | Efecto por nivel | Coste inicial | Máximo |
|---|---|---|---|
| 💰 **Valor Base** | +$0.2 al valor de cada carta | $10 | Sin límite |
| 🎲 **Prob. Crítico** | +0.5% de probabilidad de crítico | $25 | 90% |
| ⚡ **Mult. Crítico** | +0.25x al multiplicador crítico | $50 | Sin límite |

Los costes suben progresivamente con cada nivel comprado.

---

## ✨ Perks (10 en total)

Se desbloquean eligiendo paquetes cada 50 cartas. Son **permanentes** y se acumulan.

| Perk | Rareza | Efecto |
|---|---|---|
| ☀️ Cachorrito Mañanero | Común | Las primeras 10 cartas de cada mazo valen **x2** |
| 🐈‍⬛ Gatito Negro | Raro | Lunas 🌙 y Huesos 🦴 valen **x1.5** |
| 🪨 Instinto Paleolítico | Raro | 10% de convertir una carta en **Piedra (x2)** |
| 😤 Lobito Enojón | Épico | Todo vale **x3**, pero las últimas 5 cartas se **queman ($0)** |
| 🃏 Barajas Gemelas | Épico | El mazo pasa a **104 cartas**, todo vale **x1.5**, barajado más lento |
| 🦩 Flamenco | Legendario | Corazones/Esmeraldas **x1.5** + 5% de **Carta Lobito (x20)** |
| 🎭 Acto Final | Legendario | Últimas 13 cartas **x5** + 50% de **Carta Lobito (x20)** |
| 🎵 Cachorrito Trovador | Legendario | Tras un As (A), la siguiente carta se vuelve J/Q/K (o raro Lobito x20) |
| 🐔 Pollo Chillón | Mítico | 5% de **Estampida**: revela TODO el mazo restante al instante con **x2** |
| ⚡ Sobrecalentamiento | Mítico | Clics rápidos (<300ms) tienen 5% de **Electrificar (x10)** |

### 🎨 Imágenes personalizadas de perks
Cada perk acepta una propiedad `imgUrl` en `PERK_DATABASE` (`script.js`):

```js
{ id: 'early_bird', title: "Cachorrito Mañanero", icon: "☀️",
  imgUrl: "./assets/perks/sun.png", /* ... */ }
```

Si `imgUrl` está vacío o la imagen falla al cargar, se usa automáticamente el emoji `icon` como respaldo. No se rompe nada. 🐺

---

## 🎴 Palos y valores

La baraja usa 4 palos temáticos de lobito:

- ❤️ **Corazones**
- 💎 **Esmeraldas**
- 🌙 **Lunas**
- 🦴 **Huesos**

Rangos: `A, 2–10, J, Q, K` (13 por palo → 52 cartas).

---

## 📖 Carddex

La colección de perks. Los descubiertos muestran su nombre, descripción e imagen; los pendientes aparecen como `???` bloqueados. Ábrelo con el botón **📖 Carddex** de la barra superior.

---

## 💾 Gestión de partida

Desde el botón **💾 Partida** puedes:

- ⬇️ **Exportar** tu progreso a un archivo `.json`
- ⬆️ **Importar** una partida guardada
- 🗑️ **Reiniciar** la partida (con confirmación)

El guardado es automático en `localStorage` del navegador.

---

## 🔊 Sonido

Efectos generados con **WebAudio** (sin archivos externos): revelar carta, críticos, compra, estampida, nuevos perks, etc. Actívalo o siléncialo con el botón **🔊 / 🔇** de la barra superior.

---

## 🗂️ Estructura del proyecto

```
draw-a-wolfy-card/
├── index.html      # Estructura y modales
├── style.css       # Estilos, animaciones y responsive
├── script.js       # Lógica del juego (clase WolfyClicker)
└── assets/
    └── perks/      # (Opcional) PNGs personalizados de perks
```

---

## 🚀 Cómo ejecutar

No requiere instalación ni servidor. Solo:

1. Descarga los tres archivos en la misma carpeta.
2. Abre `index.html` en tu navegador.
3. ¡A revelar lobitos! 🐺

> Para desarrollo puedes usar cualquier servidor estático (ej. la extensión *Live Server* de VS Code).

---

## 🧩 Tecnologías

- **HTML5**
- **CSS3** (animaciones, grid, responsive, `prefers-reduced-motion`)
- **JavaScript vanilla** (sin librerías)
- **WebAudio API** (sonido procedural)
- **localStorage** (guardado automático)

---

## 🐛 Notas de la versión integrada

- Corrección del orden de carga: el mazo ahora respeta *Barajas Gemelas* al recargar.
- Historial protegido contra cartas corruptas al guardar/cargar.
- La estampida actualiza dinero, estadísticas e hitos correctamente.
- Los paquetes pendientes reaparecen si recargas justo al alcanzar un hito.
- Botón de Prob. Crítico se bloquea al llegar al 90%.

---

## 📜 Licencia

MIT © — Hecho con cariño para la comunidad lobuna. 🐺💛
