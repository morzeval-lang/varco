#!/usr/bin/env python3
"""
Disegna le illustrazioni dei nemici come file SVG in public/immagini/nemici/<id>.svg.

Stile Varco: anime d'azione anni '80-'90, inchiostro deciso, ombre nette a due toni, luce da destra in alto.
Ogni nemico ha una sagoma tutta sua (non è la figura generica dei segnaposto).

Convenzioni del file: viewBox quadrato "-305 -605 610 610", piedi a (0,0) in basso al centro,
rivolto a destra, sfondo trasparente. Così `Cartoncino` lo appoggia sulla scena come un PNG generato.

Uso: python3 strumenti/illustrazioni/disegna_nemici.py
"""
import math
import os

CONTORNO = "#1b1622"
INK = 3.5
LUCE = (0.55, -0.83)
USCITA = os.path.join(os.path.dirname(__file__), "..", "..", "public", "immagini", "nemici")


# ——— colori ———

def _rgb(h):
    n = int(h[1:], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]


def _hex(c):
    return "#" + "".join(f"{max(0, min(255, round(v))):02x}" for v in c)


def scuro(h, f=0.72):
    return _hex([v * f for v in _rgb(h)])


def chiaro(h, f=0.35):
    return _hex([v + (255 - v) * f for v in _rgb(h)])


# ——— primitive ———

def p(x, y):
    return f"{x:.1f},{y:.1f}"


def tratto(w=INK):
    return f'stroke="{CONTORNO}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'


def _segmento(a, b, r1a, r1b, r2a, r2b, g1, g2):
    dx, dy = b[0] - a[0], b[1] - a[1]
    l = math.hypot(dx, dy) or 1
    d = (dx / l, dy / l)
    n = (-d[1], d[0])
    if n[0] * LUCE[0] + n[1] * LUCE[1] > 0:
        n = (-n[0], -n[1])

    def su(q, v, k):
        return (q[0] + v[0] * k, q[1] + v[1] * k)

    m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    A1, B1, B2, A2 = su(a, n, r1a), su(b, n, r1b), su(b, n, -r2b), su(a, n, -r2a)
    C1 = su(m, n, (r1a + r1b) / 2 + g1)
    C2 = su(m, n, -((r2a + r2b) / 2 + g2))
    capB = su(su(b, d, (r1b + r2b) / 2 * 1.6), n, (r1b - r2b) / 2)
    capA = su(su(a, d, -(r1a + r2a) / 2 * 1.6), n, (r1a - r2a) / 2)
    return f"M {p(*A1)} Q {p(*C1)} {p(*B1)} Q {p(*capB)} {p(*B2)} Q {p(*C2)} {p(*A2)} Q {p(*capA)} {p(*A1)} Z"


def parte(a, b, ra, rb, colore, g=0, f=0.72):
    """Segmento muscoloso a due toni con contorno."""
    pieno = _segmento(a, b, ra, rb, ra, rb, g, g * 0.6)
    ombra = _segmento(a, b, ra, rb, -ra * 0.15, -rb * 0.15, g, 0)
    return (f'<path d="{pieno}" fill="{colore}"/>'
            f'<path d="{ombra}" fill="{scuro(colore, f)}"/>'
            f'<path d="{pieno}" fill="none" {tratto()}/>')


def forma(d, colore, ombra=None, f=0.72, w=INK, opacita=None):
    o = f' opacity="{opacita}"' if opacita is not None else ""
    s = f'<g{o}><path d="{d}" fill="{colore}"/>'
    if ombra:
        s += f'<path d="{ombra}" fill="{scuro(colore, f)}"/>'
    return s + f'<path d="{d}" fill="none" {tratto(w)}/></g>'


def linea(d, colore=CONTORNO, w=2.5, extra=""):
    return f'<path d="{d}" fill="none" stroke="{colore}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"{extra}/>'


def bagliore(cx, cy, r, colore, opacita=0.6):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{colore}" opacity="{opacita}" filter="url(#sfoca)"/>'


def svg(corpo):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-305 -605 610 610" width="610" height="610">'
        '<defs><filter id="sfoca" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>'
        '<filter id="nebbia" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>'
        + corpo + "</svg>\n"
    )


def pugno(x, y, r, colore):
    d = f"M {p(x - r, y - r * .7)} Q {p(x - r * .2, y - r * 1.15)} {p(x + r, y - r * .8)} Q {p(x + r * 1.3, y)} {p(x + r * .9, y + r * .8)} Q {p(x, y + r * 1.2)} {p(x - r, y + r * .6)} Z"
    om = f"M {p(x - r, y - r * .7)} Q {p(x - r * .6, y)} {p(x - r * .2, y + r)} Q {p(x - r * .8, y + r * .9)} {p(x - r, y + r * .6)} Z"
    return forma(d, colore, om) + linea(f"M {p(x + r * .2, y - r * .9)} L {p(x + r * .3, y + r * .2)} M {p(x + r * .65, y - r * .75)} L {p(x + r * .7, y + r * .3)}", w=2)


def occhio(x, y, iride="#1d2233", luce=None, scala=1.0):
    """Occhio stretto e tagliente, di tre quarti."""
    k = scala
    s = f'<path d="M {p(x - 8 * k, y)} L {p(x + 8 * k, y - 2 * k)} L {p(x + 6 * k, y + 5 * k)} L {p(x - 5 * k, y + 6 * k)} Z" fill="#fff" {tratto(1.5)}/>'
    s += f'<path d="M {p(x, y - 1.5 * k)} L {p(x + 6 * k, y - 2 * k)} L {p(x + 5 * k, y + 5.5 * k)} L {p(x, y + 5.8 * k)} Z" fill="{luce or iride}"/>'
    if luce:
        s += bagliore(x + 3 * k, y + 2 * k, 12 * k, luce, 0.8)
    s += linea(f"M {p(x - 10 * k, y - 1 * k)} L {p(x + 9 * k, y - 4 * k)}", w=3.5 * k)
    return s


# ——— i nemici ———

def goblin():
    pelle, vestito, cuoio, acc = "#6b8e3d", "#6b4423", "#4a3a2e", "#d4ff4a"
    s = ""
    # sacco di stivali rubati sulla schiena
    s += forma("M -40,-230 Q -120,-250 -118,-170 Q -112,-110 -50,-120 Q -20,-160 -40,-230 Z", "#9a7a50",
               "M -40,-230 Q -120,-250 -118,-170 Q -112,-110 -50,-120 Q -80,-160 -60,-226 Z")
    s += forma("M -96,-238 L -84,-276 L -66,-272 L -70,-236 Z", "#5a3a22", "M -96,-238 L -84,-276 L -78,-274 L -86,-236 Z")
    s += forma("M -66,-246 L -40,-286 L -24,-276 L -46,-240 Z", "#7a2e2e", "M -66,-246 L -40,-286 L -34,-282 L -56,-242 Z")
    # gamba dietro e piede scalzo
    s += parte((-14, -120), (-44, -60), 13, 10, scuro(vestito, .85), 3)
    s += parte((-44, -60), (-62, -16), 10, 8, scuro(pelle, .9), 3)
    s += forma("M -84,-20 L -50,-24 L -28,-6 L -24,2 L -88,2 Z", scuro(pelle, .9), "M -84,-20 L -64,-22 L -66,2 L -88,2 Z")
    # braccio dietro: mano ad artiglio
    s += parte((-26, -196), (-62, -150), 10, 8, pelle, 3)
    s += parte((-62, -150), (-40, -112), 8, 6, pelle, 2)
    s += linea("M -42,-108 L -48,-96 M -36,-108 L -36,-94 M -30,-112 L -24,-100", w=3)
    # busto curvo
    s += forma("M -36,-212 Q 0,-232 34,-206 Q 44,-160 26,-118 L -26,-112 Q -46,-160 -36,-212 Z", vestito,
               "M -36,-212 Q -16,-222 -6,-222 Q -16,-160 -6,-114 L -26,-112 Q -46,-160 -36,-212 Z")
    s += linea("M -20,-200 L -10,-150 M 10,-210 L 18,-160", scuro(vestito, .5), 2)
    s += forma("M -30,-128 L 30,-132 L 32,-112 L -30,-106 Z", cuoio)
    s += forma("M -28,-112 L 30,-114 L 22,-80 L 4,-92 L -14,-78 L -24,-92 Z", scuro(vestito, .8))
    # gamba davanti con l'unico stivale (spaiato)
    s += parte((14, -118), (54, -66), 14, 11, vestito, 4)
    s += parte((54, -66), (46, -26), 11, 9, pelle, 3)
    s += forma("M 30,-46 L 62,-48 L 64,-12 Q 100,-10 104,0 L 28,2 Z", "#7a2e2e", "M 30,-46 L 44,-47 L 42,2 L 28,2 Z")
    s += linea("M 30,-38 L 63,-40", w=2.5)
    # testa: orecchie enormi, naso lungo, ghigno
    s += forma("M -10,-262 L -96,-300 L -60,-262 L -78,-254 L -20,-236 Z", pelle, "M -10,-262 L -96,-300 L -60,-262 L -30,-250 Z")
    s += linea("M -84,-292 L -76,-284 L -86,-280", w=2)  # orecchio morsicato
    s += forma("M -26,-236 Q -34,-292 10,-296 Q 46,-296 50,-262 L 82,-250 L 52,-238 L 50,-224 Q 36,-206 8,-208 Q -18,-212 -26,-236 Z", pelle,
               "M -26,-236 Q -34,-292 10,-296 Q -10,-270 -6,-212 Q -18,-214 -26,-236 Z")
    s += forma("M 36,-282 L 70,-312 L 54,-270 Z", pelle, "M 36,-282 L 70,-312 L 50,-284 Z")
    s += occhio(28, -264, luce=acc, scala=1.1)
    s += f'<path d="M 18,-282 L 46,-272 L 46,-277 L 20,-288 Z" fill="{scuro(pelle, .5)}" {tratto(1.5)}/>'
    s += f'<path d="M 18,-230 Q 34,-222 50,-232 L 46,-224 Q 32,-216 20,-224 Z" fill="#f4ecd0" {tratto(2)}/>'
    s += linea("M 26,-228 L 26,-222 M 34,-226 L 34,-220 M 42,-228 L 42,-222", w=1.5)
    s += f'<path d="M -24,-262 Q -4,-300 40,-282 Q 10,-292 -12,-262 Z" fill="#2b2420" {tratto(2)}/>'
    # braccio davanti col coltellaccio impugnato al contrario
    s += parte((20, -200), (64, -170), 11, 8, pelle, 4)
    s += parte((64, -170), (96, -196), 9, 7, pelle, 3)
    s += forma("M 96,-188 L 100,-120 L 90,-112 L 86,-188 Z", "#c9c2b0", "M 96,-188 L 98,-140 L 91,-120 L 91,-188 Z")
    s += linea("M 92,-176 L 95,-150", "#8a5a3a", 2)
    s += f'<rect x="84" y="-214" width="14" height="24" rx="3" fill="#4a3020" {tratto(2.5)}/>'
    s += pugno(96, -198, 11, pelle)
    return svg(f'<g transform="translate(0 0) scale(1.15)">{s}</g>')


def cavaliere():
    ferro, scuroF, gelo = "#5a647a", "#2a2f3e", "#8fe3ff"
    s = ""
    # nebbia gelida al posto delle gambe
    s += f'<ellipse cx="0" cy="-30" rx="150" ry="40" fill="{gelo}" opacity="0.35" filter="url(#sfoca)"/>'
    s += f'<path d="M -70,-250 Q -120,-120 -60,-40 Q -20,-10 30,-36 Q 90,-70 70,-250 Z" fill="{gelo}" opacity="0.18" filter="url(#nebbia)"/>'
    for i, (x, y) in enumerate([(-60, -60), (-10, -40), (40, -70), (-30, -110), (20, -130)]):
        s += linea(f"M {x},{y} q 20,-30 0,-60 q -20,-30 0,-60", chiaro(gelo, .3), 4, ' opacity="0.45"')
    # mantello lacero
    s += forma("M -56,-420 Q -150,-300 -170,-120 L -140,-140 L -136,-90 L -110,-130 L -96,-70 L -80,-130 Q -60,-280 -10,-420 Z", "#2a2236",
               "M -56,-420 Q -150,-300 -170,-120 L -140,-140 L -136,-90 L -110,-130 Q -100,-280 -40,-416 Z")
    # corpo dell'armatura che sfuma in basso
    s += '<defs><linearGradient id="sfuma" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
    s += '<mask id="svanisce"><rect x="-300" y="-600" width="600" height="600" fill="url(#sfuma)"/></mask></defs>'
    corpo = ""
    corpo += forma("M -40,-250 L 44,-252 L 70,-120 Q 10,-90 -60,-118 Z", scuroF, "M -40,-250 L 0,-251 L -4,-100 Q -40,-104 -60,-118 Z")
    for k in range(4):
        corpo += linea(f"M {-46 - k * 4},{-220 + k * 30} L {50 + k * 5},{-222 + k * 30}", chiaro(scuroF, .2), 2.5)
    s += f'<g mask="url(#svanisce)">{corpo}</g>'
    # braccio dietro
    s += parte((-44, -400), (-70, -330), 22, 18, scuro(ferro, .85), 4)
    s += parte((-70, -330), (-10, -300), 18, 15, scuro(ferro, .85), 3)
    # corazza del torso
    s += forma("M -56,-420 Q 0,-440 64,-420 L 70,-370 Q 60,-300 40,-256 L -40,-252 Q -66,-320 -66,-380 Z", ferro,
               "M -56,-420 Q -24,-432 -10,-432 Q -26,-340 -10,-254 L -40,-252 Q -66,-320 -66,-380 Z")
    s += linea("M 4,-430 Q 14,-340 6,-256", CONTORNO, 2.5)
    s += linea("M 30,-414 Q 54,-380 50,-330", chiaro(ferro, .55), 4)
    s += forma("M -48,-262 L 46,-264 L 48,-244 L -46,-240 Z", "#3a2a2a")
    # stemma cancellato
    s += f'<path d="M 18,-380 L 44,-380 L 42,-350 L 31,-336 L 20,-350 Z" fill="{scuroF}" {tratto(2)}/>'
    s += linea("M 20,-376 L 42,-344", "#7a3a3a", 3)
    # elmo a secchio con la feritoia luminosa
    s += forma("M -16,-430 L -18,-500 Q 16,-520 52,-500 L 54,-432 Q 20,-420 -16,-430 Z", ferro,
               "M -16,-430 L -18,-500 Q -2,-508 8,-510 Q 0,-470 4,-424 Q -6,-426 -16,-430 Z")
    s += f'<path d="M 14,-478 L 56,-480 L 56,-470 L 16,-468 Z" fill="#0c0e14" {tratto(2)}/>'
    s += linea("M 22,-474 L 52,-475", gelo, 3) + bagliore(38, -474, 16, gelo, 0.9)
    s += linea("M 30,-462 L 30,-440 M 40,-462 L 40,-440 M 50,-462 L 50,-442", CONTORNO, 2)
    s += forma("M -14,-500 Q -40,-540 -6,-560 Q -10,-530 8,-512 Z", "#7a2e3a", "M -14,-500 Q -40,-540 -6,-560 Q -20,-530 -4,-506 Z")
    # spallacci
    s += forma("M -78,-410 Q -60,-446 -20,-430 Q -24,-390 -50,-380 Q -74,-384 -78,-410 Z", ferro, "M -78,-410 Q -66,-430 -50,-432 Q -56,-400 -50,-380 Q -74,-384 -78,-410 Z")
    # spadone tenuto a due mani, punta in avanti e in basso
    s += forma("M 40,-318 L 230,-180 L 252,-168 L 226,-166 L 32,-302 Z", "#dfe7f2", "M 36,-310 L 238,-172 L 32,-302 Z")
    s += linea("M 46,-314 L 236,-176", "#ffffff", 2)
    s += bagliore(150, -240, 30, gelo, 0.35)
    s += linea("M 28,-344 L 58,-282", CONTORNO, 12) + linea("M 28,-344 L 58,-282", "#3a3a4a", 7)
    s += linea("M -6,-334 L 34,-312", CONTORNO, 10) + linea("M -6,-334 L 34,-312", "#4a4a5a", 5)
    s += f'<circle cx="-10" cy="-336" r="8" fill="{gelo}" {tratto(2)}/>'
    s += parte((56, -404), (80, -330), 22, 18, ferro, 4)
    s += parte((80, -330), (30, -316), 18, 15, ferro, 3)
    s += pugno(28, -318, 16, scuroF)
    return svg(s)


def strega():
    pelle, abito, scialle, acc = "#9fb58a", "#2e4a3a", "#5a3a52", "#8dff4a"
    s = ""
    # capelli lunghi e radi dietro
    s += forma("M -40,-390 Q -90,-320 -80,-220 L -66,-240 L -60,-200 L -46,-236 L -36,-210 Q -40,-300 -10,-370 Z", "#8a8a7a",
               "M -40,-390 Q -90,-320 -80,-220 L -66,-240 Q -66,-320 -30,-380 Z")
    # gonna ampia e stracciata
    s += forma("M -50,-230 Q -110,-120 -120,-10 L -90,-24 L -70,4 L -44,-20 L -20,6 L 6,-18 L 34,4 L 56,-20 L 86,0 Q 80,-120 46,-232 Z", abito,
               "M -50,-230 Q -110,-120 -120,-10 L -90,-24 L -70,4 L -44,-20 Q -50,-130 -24,-232 Z")
    s += linea("M -20,-200 Q -40,-110 -40,-30 M 20,-200 Q 30,-110 40,-30", scuro(abito, .5), 2)
    # piedi a punta
    s += forma("M 40,-12 L 100,-14 L 120,-28 L 112,-2 L 40,2 Z", "#2a2420")
    # busto curvo e scialle
    s += forma("M -50,-330 Q 0,-350 40,-320 Q 60,-270 46,-226 L -50,-226 Q -64,-280 -50,-330 Z", abito)
    s += forma("M -60,-340 Q 0,-366 52,-330 L 46,-286 Q 20,-266 0,-250 Q -20,-266 -64,-282 Z", scialle,
               "M -60,-340 Q -30,-354 -14,-356 Q -20,-300 0,-250 Q -20,-266 -64,-282 Z")
    s += linea("M -40,-300 L -30,-290 L -20,-300 M 0,-320 L 10,-310 L 20,-320", chiaro(scialle, .3), 2)
    # braccio dietro: regge una boccetta fumante
    s += parte((-40, -320), (-70, -260), 12, 9, scialle, 3)
    s += parte((-70, -260), (-50, -214), 9, 7, pelle, 2)
    s += forma("M -62,-212 Q -76,-190 -56,-178 Q -36,-190 -50,-212 Z", "#4a8a6a", "M -62,-212 Q -76,-190 -56,-178 Q -64,-196 -56,-212 Z")
    s += linea("M -56,-216 q -8,-20 4,-36 q 10,-14 0,-30", acc, 3, ' opacity="0.7"')
    # testa: naso adunco, mento sporgente
    s += forma("M -26,-360 Q -32,-410 6,-414 Q 38,-414 42,-390 L 66,-366 L 44,-362 L 46,-350 Q 52,-336 38,-332 Q 16,-326 -4,-336 Q -24,-344 -26,-360 Z", pelle,
               "M -26,-360 Q -32,-410 6,-414 Q -16,-380 -2,-334 Q -24,-344 -26,-360 Z")
    s += f'<circle cx="54" cy="-372" r="4" fill="{scuro(pelle, .7)}" {tratto(1.5)}/>'
    s += occhio(24, -388, luce=acc, scala=1.15)
    s += occhio(46, -390, scala=0.6)
    s += linea("M 20,-348 Q 32,-344 42,-350", w=2.5)
    s += linea("M 6,-364 Q 12,-356 20,-358 M 0,-404 Q 10,-410 22,-406", scuro(pelle, .65), 1.8)
    # cappello a punta afflosciato con una rana sopra
    s += forma("M -70,-394 Q 0,-420 90,-396 Q 60,-382 0,-384 Q -40,-382 -70,-394 Z", "#2a2a30", "M -70,-394 Q -20,-408 0,-408 Q -10,-394 -6,-384 Q -40,-382 -70,-394 Z")
    s += forma("M -36,-404 Q -20,-500 20,-540 Q 40,-560 60,-536 Q 34,-534 34,-500 Q 40,-450 50,-404 Z", "#2a2a30",
               "M -36,-404 Q -20,-500 20,-540 Q 4,-490 6,-406 Z")
    s += forma("M -30,-412 Q 8,-424 46,-412 L 48,-398 Q 8,-410 -32,-398 Z", "#6b4423")
    s += forma("M 24,-436 Q 30,-456 46,-450 Q 60,-450 58,-434 Q 42,-426 24,-436 Z", "#5a8a3a", "M 24,-436 Q 30,-456 46,-450 Q 34,-440 30,-430 Z")
    s += f'<circle cx="50" cy="-450" r="4" fill="#ffe94a" {tratto(1.5)}/>'
    # braccio davanti col mestolo gigante alzato
    s += linea("M 60,-200 L 120,-470", CONTORNO, 15) + linea("M 60,-200 L 120,-470", "#7a5532", 9)
    s += forma("M 100,-470 Q 90,-530 128,-540 Q 170,-540 166,-500 Q 160,-466 120,-466 Z", "#8a8a96", "M 100,-470 Q 90,-530 128,-540 Q 116,-500 120,-466 Z")
    s += f'<path d="M 108,-500 Q 130,-480 160,-500 Q 150,-470 120,-472 Q 104,-478 108,-500 Z" fill="{acc}" opacity="0.85"/>'
    s += bagliore(134, -500, 26, acc, 0.5)
    s += parte((30, -326), (70, -290), 12, 9, scialle, 4)
    s += parte((70, -290), (88, -330), 9, 7, pelle, 3)
    s += pugno(92, -336, 11, pelle)
    return svg(s)


def troll():
    pelle, muschio, cuoio, oro = "#7d8288", "#5f7a3a", "#5b3b22", "#ffd24a"
    s = ""
    # braccio dietro, nocche a terra
    s += parte((-60, -380), (-120, -230), 42, 32, scuro(pelle, .88), 10)
    s += parte((-120, -230), (-110, -70), 32, 26, scuro(pelle, .88), 8)
    s += pugno(-108, -50, 36, scuro(pelle, .88))
    # gamba dietro, corta e tozza
    s += parte((-40, -170), (-70, -70), 42, 34, scuro(pelle, .85), 6)
    s += forma("M -120,-60 Q -110,-90 -60,-84 Q -20,-80 -20,-40 L -14,2 L -130,2 Z", scuro(pelle, .78), "M -120,-60 Q -110,-90 -80,-86 L -90,2 L -130,2 Z")
    # corpo enorme e gobbo
    s += forma("M -100,-380 Q -60,-470 40,-450 Q 130,-420 130,-320 Q 130,-210 70,-160 Q 0,-130 -70,-160 Q -130,-240 -100,-380 Z", pelle,
               "M -100,-380 Q -60,-470 0,-458 Q -60,-380 -40,-150 Q -54,-152 -70,-160 Q -130,-240 -100,-380 Z")
    s += linea("M 10,-380 Q 50,-360 90,-370 M 30,-320 Q 50,-300 60,-260 M 40,-250 Q 60,-240 80,-250", scuro(pelle, .55), 3)
    for x, y in [(-60, -420), (-20, -444), (30, -440), (-80, -360)]:
        s += f'<ellipse cx="{x}" cy="{y}" rx="18" ry="9" fill="{muschio}" {tratto(2)}/>'
    s += linea("M 60,-420 Q 90,-400 110,-360", chiaro(pelle, .45), 5)
    # perizoma e cintura con catena
    s += forma("M -76,-180 Q 0,-200 80,-176 L 70,-120 L 40,-90 L 10,-122 L -20,-86 L -50,-120 Z", cuoio, "M -76,-180 Q -40,-190 -20,-190 L -20,-86 L -50,-120 Z")
    s += forma("M -80,-190 Q 0,-212 86,-186 L 84,-168 Q 0,-192 -80,-170 Z", "#3a2a1a")
    s += linea("M -60,-176 q 10,12 20,0 q 10,12 20,0 q 10,12 20,0 q 10,12 20,0", "#9a9aa6", 4)
    # gamba davanti
    s += parte((40, -170), (80, -70), 44, 36, pelle, 6)
    s += forma("M 30,-60 Q 40,-96 90,-90 Q 140,-80 150,-20 L 156,2 L 26,2 Z", scuro(pelle, .92), "M 30,-60 Q 40,-96 70,-92 L 66,2 L 26,2 Z")
    s += linea("M 110,-8 L 112,2 M 130,-10 L 132,2", w=2)
    # testa piccola, incassata tra le spalle, con zanne e corona storta sulle corna
    s += forma("M 40,-440 Q 40,-500 90,-500 Q 136,-498 138,-456 L 150,-440 L 136,-430 Q 140,-404 112,-398 Q 70,-394 50,-410 Z", pelle,
               "M 40,-440 Q 40,-500 90,-500 Q 64,-470 70,-398 Q 56,-400 50,-410 Z")
    s += forma("M 52,-488 Q 28,-520 44,-556 Q 50,-524 70,-500 Z", "#d9cdb0", "M 52,-488 Q 28,-520 44,-556 Q 44,-520 60,-494 Z")
    s += forma("M 100,-500 Q 112,-534 140,-550 Q 126,-524 122,-498 Z", "#d9cdb0", "M 100,-500 Q 112,-534 140,-550 Q 118,-526 112,-498 Z")
    s += forma("M 66,-506 L 72,-536 L 84,-516 L 94,-542 L 102,-516 L 116,-534 L 116,-502 Q 90,-494 66,-506 Z", oro, "M 66,-506 L 72,-536 L 84,-516 L 86,-500 Z", f=0.75)
    s += f'<circle cx="94" cy="-514" r="4" fill="#c0392b" {tratto(1.5)}/>'
    s += f'<transform/>' if False else ""
    s += occhio(112, -458, iride="#c9a227", scala=1.0)
    s += f'<path d="M 96,-476 L 132,-464 L 132,-470 L 100,-484 Z" fill="{scuro(pelle, .45)}" {tratto(1.5)}/>'
    s += linea("M 104,-418 L 136,-420", w=3)
    s += forma("M 110,-420 L 114,-440 L 120,-420 Z", "#f4ecd0", w=2) + forma("M 126,-420 L 132,-436 L 134,-420 Z", "#f4ecd0", w=2)
    # braccio davanti, pugno grande come un'incudine pronto a colpire
    s += parte((90, -400), (170, -310), 44, 34, pelle, 10)
    s += parte((170, -310), (200, -380), 34, 28, pelle, 8)
    s += forma("M 168,-344 L 228,-354 L 232,-326 L 172,-316 Z", "#3a2a1a")
    s += pugno(210, -400, 40, pelle)
    return svg(s)


def ghoul():
    pelle, tuta, acc = "#8a9a5b", "#d4a017", "#8dff4a"
    s = bagliore(0, -240, 120, acc, 0.22)
    # gamba dietro
    s += parte((-16, -210), (-60, -110), 16, 12, scuro(tuta, .82), 4)
    s += parte((-60, -110), (-110, -30), 12, 9, scuro(tuta, .82), 3)
    s += forma("M -134,-34 L -96,-40 L -74,-10 L -72,2 L -136,2 Z", "#2a2a2a")
    # braccio dietro: artiglio proteso in basso
    s += parte((-30, -330), (-90, -280), 13, 10, scuro(tuta, .82), 3)
    s += parte((-90, -280), (-120, -220), 10, 7, scuro(pelle, .9), 2)
    s += linea("M -124,-216 L -140,-190 M -116,-214 L -126,-184 M -108,-216 L -110,-188", "#e8e0c8", 3)
    # busto scarno e piegato in avanti, tuta strappata
    s += forma("M -40,-350 Q 10,-370 50,-340 Q 56,-280 30,-206 L -30,-200 Q -50,-280 -40,-350 Z", tuta,
               "M -40,-350 Q -16,-360 -6,-360 Q -16,-280 0,-202 L -30,-200 Q -50,-280 -40,-350 Z")
    s += forma("M 0,-310 L 30,-296 L 20,-270 L 34,-250 L 6,-240 L -8,-270 Z", pelle)
    for x, y in [(12, -290), (20, -262)]:
        s += f'<circle cx="{x}" cy="{y}" r="4" fill="{acc}"/>' + bagliore(x, y, 8, acc, 0.9)
    s += linea("M 6,-296 Q 16,-280 10,-254", acc, 2)
    s += f'<rect x="-36" y="-334" width="22" height="14" rx="2" fill="#1b1622"/><path d="M -32,-330 L -24,-322 L -18,-332" fill="none" stroke="{tuta}" stroke-width="2"/>'
    s += forma("M -34,-214 L 32,-218 L 34,-198 L -34,-194 Z", "#3a3a3a")
    # cappuccio abbassato e maschera rotta al collo
    s += forma("M -50,-356 Q -40,-390 0,-382 Q 30,-376 34,-352 L 0,-340 Z", scuro(tuta, .85))
    s += forma("M 26,-352 Q 50,-356 54,-332 Q 46,-314 26,-322 Z", "#4a4a52", "M 26,-352 Q 34,-340 30,-322 L 26,-322 Z")
    s += f'<circle cx="42" cy="-334" r="6" fill="#1d2233" {tratto(1.5)}/>'
    # gamba davanti
    s += parte((14, -210), (64, -126), 16, 12, tuta, 4)
    s += parte((64, -126), (56, -34), 12, 9, tuta, 3)
    s += forma("M 36,-40 L 70,-42 L 104,-12 L 104,2 L 34,2 Z", "#2a2a2a")
    s += forma("M 36,-104 L 76,-120 L 72,-96 L 42,-84 Z", pelle)  # strappo sul ginocchio
    # testa scavata, chinata in avanti, vene luminose
    s += forma("M 20,-376 Q 14,-430 56,-432 Q 92,-430 92,-400 L 100,-384 L 90,-378 L 92,-362 Q 84,-344 62,-346 Q 34,-350 20,-376 Z", pelle,
               "M 20,-376 Q 14,-430 56,-432 Q 38,-400 50,-348 Q 30,-356 20,-376 Z")
    s += linea("M 60,-430 Q 52,-410 60,-396 M 36,-414 Q 44,-400 40,-384", acc, 2, ' opacity="0.9"')
    s += occhio(74, -400, luce=acc, scala=1.0)
    s += linea("M 66,-366 L 90,-364", w=2.5)
    s += forma("M 70,-366 L 74,-356 L 78,-366 Z", "#f4ecd0", w=1.5) + forma("M 82,-365 L 86,-356 L 89,-364 Z", "#f4ecd0", w=1.5)
    s += linea("M 30,-420 L 26,-440 M 44,-430 L 46,-446 M 60,-432 L 70,-446", "#5a5a4a", 2)
    # braccio davanti: artigli lunghi protesi verso il nemico
    s += parte((40, -334), (100, -296), 13, 10, tuta, 3)
    s += parte((100, -296), (156, -310), 10, 7, pelle, 2)
    s += pugno(160, -310, 10, pelle)
    s += linea("M 166,-318 L 200,-336 M 170,-310 L 206,-314 M 166,-302 L 198,-290", "#e8e0c8", 4)
    s += linea("M 166,-318 L 200,-336 M 170,-310 L 206,-314 M 166,-302 L 198,-290", acc, 1.5, ' opacity="0.6"')
    return svg(s)


def bruno():
    pelle, giacca, ferro, acc = "#e0b590", "#6b4423", "#7d8288", "#ffb347"
    s = ""
    # gamba dietro
    s += parte((-30, -220), (-70, -120), 34, 26, scuro("#4a4a52", .9), 6)
    s += parte((-70, -120), (-90, -40), 26, 20, scuro("#4a4a52", .9), 5)
    s += forma("M -128,-50 L -60,-56 L -50,-4 L -50,2 L -132,2 Z", "#2a2420", "M -128,-50 L -100,-53 L -102,2 L -132,2 Z")
    # braccio dietro con guanto corazzato
    s += parte((-60, -400), (-110, -320), 30, 24, scuro(giacca, .85), 6)
    s += parte((-110, -320), (-80, -250), 24, 20, scuro(pelle, .9), 5)
    s += pugno(-76, -240, 26, scuro(ferro, .85))
    # pancione e giacca senza maniche
    s += forma("M -80,-420 Q 10,-450 90,-414 Q 120,-330 100,-250 Q 70,-200 0,-196 Q -70,-200 -96,-260 Q -110,-340 -80,-420 Z", pelle,
               "M -80,-420 Q -40,-436 -20,-438 Q -50,-330 -20,-196 Q -70,-200 -96,-260 Q -110,-340 -80,-420 Z")
    s += linea("M 20,-370 Q 50,-360 80,-372 M 30,-300 Q 50,-290 70,-300", scuro(pelle, .6), 2.5)
    s += forma("M -84,-420 Q -60,-436 -20,-436 L -30,-260 Q -70,-250 -96,-262 Q -110,-340 -84,-420 Z", giacca,
               "M -84,-420 Q -70,-430 -56,-432 L -64,-254 Q -84,-254 -96,-262 Q -110,-340 -84,-420 Z")
    s += forma("M 40,-430 Q 80,-424 94,-410 Q 110,-340 100,-290 L 60,-300 Z", giacca, "M 40,-430 L 60,-300 L 50,-302 Z")
    # catene incrociate e cinturone
    s += linea("M -70,-410 L 90,-260", "#5a5a64", 8) + linea("M -70,-410 L 90,-260", "#9a9aa6", 4, ' stroke-dasharray="8 6"')
    s += forma("M -100,-250 Q 0,-266 104,-246 L 100,-210 Q 0,-226 -100,-212 Z", "#3a2a1a")
    s += f'<rect x="-8" y="-256" width="30" height="30" rx="4" fill="{acc}" {tratto(2.5)}/>'
    # spallacci fatti di copertoni
    s += forma("M -120,-420 Q -110,-470 -60,-460 Q -40,-430 -60,-396 Q -100,-386 -120,-420 Z", "#2a2a2a", "M -120,-420 Q -110,-470 -80,-462 Q -86,-420 -72,-392 Q -104,-390 -120,-420 Z")
    s += linea("M -110,-440 L -100,-432 M -96,-452 L -88,-442 M -80,-456 L -76,-444", "#5a5a5a", 3)
    # gamba davanti
    s += parte((40, -220), (90, -120), 36, 28, "#4a4a52", 6)
    s += parte((90, -120), (80, -40), 28, 22, "#4a4a52", 5)
    s += forma("M 46,-52 L 110,-58 Q 150,-40 154,-10 L 154,2 L 44,2 Z", "#3a2a22", "M 46,-52 L 76,-55 L 74,2 L 44,2 Z")
    # testa con la pentola come elmo
    s += parte((10, -420), (20, -450), 22, 20, pelle)
    s += forma("M -10,-460 Q -16,-520 30,-522 Q 70,-522 74,-486 L 82,-470 L 72,-462 L 72,-446 Q 64,-430 40,-432 Q 6,-436 -10,-460 Z", pelle,
               "M -10,-460 Q -16,-520 30,-522 Q 10,-490 20,-434 Q 0,-440 -10,-460 Z")
    s += occhio(52, -480, scala=1.0)
    s += f'<path d="M 38,-496 L 70,-488 L 70,-494 L 40,-504 Z" fill="#3a2a20" {tratto(1.5)}/>'
    s += linea("M 42,-452 L 66,-450", w=3)
    s += linea("M 26,-470 L 40,-454", "#9a4a3a", 3)  # cicatrice sulla guancia
    s += forma("M -2,-454 Q 20,-436 50,-436 L 52,-428 Q 20,-424 -6,-446 Z", "#5a3a22")  # barba corta
    s += forma("M -22,-500 L -18,-552 Q 30,-566 78,-552 L 80,-500 Q 30,-490 -22,-500 Z", ferro,
               "M -22,-500 L -18,-552 Q 0,-558 12,-560 Q 6,-530 10,-494 Q -6,-496 -22,-500 Z")
    s += forma("M -36,-504 Q 30,-490 94,-506 L 94,-494 Q 30,-478 -36,-492 Z", scuro(ferro, .8))
    s += forma("M -50,-536 L -18,-534 L -18,-524 L -50,-522 Z", "#2a2a2a")  # manico della pentola
    s += linea("M 50,-552 Q 66,-540 70,-512", chiaro(ferro, .55), 3)
    # braccio davanti: pugno corazzato alzato
    s += parte((70, -410), (140, -360), 30, 24, giacca, 6)
    s += parte((140, -360), (170, -420), 24, 20, pelle, 5)
    s += forma("M 150,-404 L 196,-412 L 200,-380 L 154,-374 Z", "#3a3a3a")
    s += pugno(176, -436, 30, ferro)
    s += linea("M 168,-462 L 168,-474 M 182,-462 L 184,-474 M 196,-458 L 200,-468", "#d0d0d8", 4)
    return svg(s)


def androide():
    corazza, giunti, acc = "#e6e6ea", "#3d3d48", "#ff4a4a"
    s = ""
    # gamba dietro a pistoni
    s += parte((-20, -230), (-60, -130), 16, 12, scuro(giunti, .9), 2)
    s += parte((-60, -130), (-80, -40), 14, 12, scuro(corazza, .8), 3)
    s += forma("M -112,-44 L -50,-48 L -40,-6 L -40,2 L -116,2 Z", scuro(giunti, .9))
    # braccio dietro: palmo aperto, "lo scontrino, prego"
    s += parte((-40, -400), (-80, -330), 18, 14, scuro(corazza, .82), 3)
    s += parte((-80, -330), (-60, -270), 13, 11, scuro(giunti, .9), 2)
    s += forma("M -70,-270 L -40,-276 L -36,-250 L -64,-246 Z", scuro(corazza, .82))
    # torso a corazza arrotondata, usurata
    s += forma("M -60,-420 Q 0,-444 70,-420 Q 86,-340 60,-260 Q 0,-240 -54,-260 Q -80,-340 -60,-420 Z", corazza,
               "M -60,-420 Q -30,-434 -10,-436 Q -30,-340 -14,-248 Q -40,-250 -54,-260 Q -80,-340 -60,-420 Z")
    s += linea("M 6,-436 L 10,-250", CONTORNO, 2)
    s += linea("M 40,-416 Q 64,-380 60,-320", "#ffffff", 4)
    s += forma("M 16,-400 L 56,-400 L 54,-372 L 18,-372 Z", "#2f5fa7")
    s += f'<text x="36" y="-382" font-family="monospace" font-size="9" fill="#fff" text-anchor="middle" font-weight="bold">SICUREZZA</text>'
    s += linea("M -40,-350 L -20,-340 M 30,-300 L 48,-310", "#a65a3a", 3)  # ruggine
    s += f'<circle cx="-30" cy="-300" r="5" fill="#a65a3a" opacity="0.8"/>'
    s += forma("M -56,-268 L 62,-270 L 56,-230 L -50,-228 Z", giunti)
    for x in (-30, 0, 30):
        s += f'<rect x="{x - 6}" y="-262" width="12" height="22" rx="3" fill="{scuro(giunti, .6)}"/>'
    # gamba davanti
    s += parte((20, -230), (70, -130), 16, 12, giunti, 2)
    s += parte((70, -130), (62, -40), 16, 13, corazza, 3)
    s += linea("M 64,-120 L 60,-60", "#9a9aa6", 5)
    s += forma("M 36,-46 L 96,-50 L 112,-14 L 112,2 L 32,2 Z", giunti, "M 36,-46 L 60,-48 L 58,2 L 32,2 Z")
    # testa: casco da guardia giurata, visore rosso
    s += parte((6, -420), (10, -446), 10, 10, giunti)
    s += forma("M -26,-450 Q -30,-510 20,-512 Q 66,-512 70,-470 L 74,-444 Q 30,-430 -24,-440 Z", corazza,
               "M -26,-450 Q -30,-510 20,-512 Q 0,-480 2,-436 Q -14,-438 -24,-440 Z")
    s += f'<path d="M 10,-482 L 74,-484 L 72,-460 L 14,-458 Z" fill="#1a0c10" {tratto(2.5)}/>'
    s += linea("M 24,-472 L 66,-473", acc, 4) + bagliore(48, -472, 18, acc, 0.9)
    s += forma("M -36,-504 Q 20,-534 80,-506 L 100,-494 L 76,-494 Q 20,-512 -32,-494 Z", "#1f2a44")
    s += f'<path d="M 18,-518 L 26,-528 L 34,-518 L 30,-508 L 22,-508 Z" fill="#ffd24a" {tratto(1.5)}/>'
    s += linea("M -24,-470 L -40,-500", CONTORNO, 3) + f'<circle cx="-42" cy="-504" r="5" fill="{acc}" {tratto(1.5)}/>'
    # braccio davanti: cannone storditore
    s += parte((54, -404), (110, -360), 18, 14, corazza, 3)
    s += forma("M 100,-380 L 200,-388 L 204,-350 L 104,-338 Z", giunti, "M 100,-380 L 104,-338 L 140,-342 L 140,-382 Z")
    s += forma("M 196,-394 L 222,-396 L 224,-344 L 200,-342 Z", corazza)
    s += f'<circle cx="224" cy="-370" r="8" fill="{acc}" {tratto(2)}/>' + bagliore(230, -370, 20, acc, 0.8)
    s += linea("M 120,-370 L 180,-374 M 120,-356 L 180,-360", "#6a6a78", 2)
    return svg(s)


def regina():
    pelle, abito, acc, rosa = "#c68642", "#5b3b82", "#ffd24a", "#ff4ad8"
    s = ""
    # rottami che le fluttuano intorno
    for x, y, a, c in [(-200, -420, 20, "#7d8288"), (-170, -260, -30, "#a65a3a"), (180, -500, 40, "#9a9aa6"), (220, -220, -15, "#6a6a74"), (-230, -120, 10, "#8a6430")]:
        s += f'<g transform="translate({x} {y}) rotate({a})">' + forma("M -26,-14 L 22,-18 L 30,10 L -20,16 Z", c, "M -26,-14 L -2,-16 L 0,14 L -20,16 Z") + linea("M -10,-6 L 14,-8", w=2) + "</g>"
        s += linea(f"M {x - 10},{y + 24} l 6,10 l -6,8 l 6,10", "#8fe3ff", 2, ' opacity="0.8"')
    # mantello di targhe cucite
    targhe = "".join(
        f'<g transform="translate({-170 + (i % 4) * 46 + (i // 4) * 8} {-380 + (i // 4) * 60}) rotate({(i * 37) % 20 - 10})">'
        f'<rect x="-22" y="-12" width="44" height="24" rx="3" fill="{["#e6e2d0", "#e8c14a", "#9ac0e0", "#e6e2d0"][i % 4]}" {tratto(2)}/>'
        f'<path d="M -14,0 L 14,0" stroke="#3a3a4a" stroke-width="5" stroke-dasharray="4 3"/></g>'
        for i in range(20)
    )
    s += forma("M -60,-430 Q -170,-330 -200,-60 L -60,-40 Q -60,-250 20,-430 Z", "#3a2a4a")
    s += f'<clipPath id="manto"><path d="M -60,-430 Q -170,-330 -200,-60 L -60,-40 Q -60,-250 20,-430 Z"/></clipPath><g clip-path="url(#manto)">{targhe}</g>'
    s += f'<path d="M -60,-430 Q -170,-330 -200,-60 L -60,-40 Q -60,-250 20,-430 Z" fill="none" {tratto()}/>'
    # gambe lunghe in stivali alti
    s += parte((-16, -240), (-50, -130), 20, 15, scuro(abito, .8), 4)
    s += parte((-50, -130), (-80, -40), 15, 12, "#2a2a30", 3)
    s += forma("M -110,-50 L -64,-54 L -50,-8 L -50,2 L -112,2 Z", "#2a2a30")
    s += parte((20, -240), (70, -140), 21, 15, abito, 4)
    s += parte((70, -140), (62, -40), 15, 12, "#2a2a30", 3)
    s += forma("M 40,-50 L 82,-54 L 116,-14 L 116,2 L 38,2 Z", "#2a2a30", "M 40,-50 L 58,-52 L 56,2 L 38,2 Z")
    s += linea("M 46,-110 L 80,-112 M 48,-90 L 80,-92", "#9a9aa6", 3)
    # braccio dietro sul fianco
    s += parte((-34, -410), (-70, -330), 13, 10, abito, 3)
    s += parte((-70, -330), (-34, -280), 10, 8, pelle, 2)
    s += pugno(-30, -276, 11, pelle)
    # busto: corpetto di lamiera
    s += forma("M -40,-420 Q 0,-436 50,-420 L 52,-380 Q 40,-310 30,-250 L -30,-250 Q -50,-330 -48,-390 Z", abito,
               "M -40,-420 Q -20,-430 -6,-430 Q -20,-330 -4,-250 L -30,-250 Q -50,-330 -48,-390 Z")
    s += forma("M -30,-380 L 40,-384 L 34,-330 L 4,-310 L -26,-330 Z", "#7d8288", "M -30,-380 L 0,-382 L 4,-310 L -26,-330 Z")
    s += linea("M -20,-370 L -16,-364 M 30,-372 L 26,-366 M -14,-336 L -10,-330 M 22,-338 L 18,-332", "#3a3a4a", 3)
    s += forma("M -36,-262 L 34,-264 L 40,-236 L -40,-232 Z", "#2a2420")
    s += f'<circle cx="0" cy="-248" r="9" fill="{acc}" {tratto(2)}/>'
    # collo e testa fiera, mento alto
    s += parte((6, -420), (14, -446), 9, 9, pelle)
    s += forma("M -10,-456 Q -14,-506 22,-508 Q 56,-508 58,-480 L 62,-470 L 66,-460 L 60,-458 L 60,-450 Q 54,-436 34,-436 Q 4,-440 -10,-456 Z", pelle,
               "M -10,-456 Q -14,-506 22,-508 Q 2,-480 12,-438 Q -2,-444 -10,-456 Z")
    s += occhio(40, -478, iride="#3a1a3a", scala=1.0)
    s += f'<path d="M 30,-494 L 58,-488 L 58,-492 L 32,-500 Z" fill="#2a1a2a" {tratto(1.5)}/>'
    s += f'<path d="M 46,-452 Q 54,-448 60,-452" stroke="#7a1a4a" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
    s += linea("M 50,-470 L 56,-468", w=1.5)
    # cresta rosa e corona di candele d'accensione
    s += forma("M -20,-480 L -40,-520 L -12,-512 L -16,-560 L 8,-524 L 20,-576 L 30,-524 L 54,-556 L 46,-506 Q 10,-516 -20,-480 Z", rosa,
               "M -20,-480 L -40,-520 L -12,-512 L -16,-560 L 4,-526 L 0,-500 Z")
    for i, x in enumerate([-6, 10, 26, 42]):
        s += f'<rect x="{x - 3}" y="{-528 - (i % 2) * 6}" width="6" height="16" fill="#e6e2d0" {tratto(1.5)}/>'
        s += f'<rect x="{x - 4}" y="{-512 - (i % 2) * 6}" width="8" height="8" fill="{acc}" {tratto(1.5)}/>'
    s += forma("M -14,-500 Q 20,-516 56,-500 L 56,-490 Q 20,-504 -14,-490 Z", acc)
    # braccio davanti con lo scettro-marmitta e la calamita che sfrigola
    s += linea("M 110,-120 L 140,-470", CONTORNO, 16) + linea("M 110,-120 L 140,-470", "#8a8a96", 10)
    s += linea("M 113,-160 L 138,-440", "#c9c9d2", 3)
    for y in (-200, -300, -400):
        s += linea(f"M {108 + (y + 120) * -0.086},{y} l 16,0", CONTORNO, 6)
    s += forma("M 112,-470 L 112,-530 Q 112,-552 140,-552 Q 168,-552 168,-530 L 168,-470 L 152,-470 L 152,-528 Q 140,-536 128,-528 L 128,-470 Z", "#c0392b",
               "M 112,-470 L 112,-530 Q 112,-552 140,-552 Q 124,-540 128,-470 Z")
    s += forma("M 110,-470 L 130,-470 L 130,-456 L 110,-456 Z", "#e6e6ea") + forma("M 150,-470 L 170,-470 L 170,-456 L 150,-456 Z", "#e6e6ea")
    s += linea("M 120,-450 l 6,16 l -8,10 l 8,14 M 160,-450 l -6,18 l 8,8 l -6,16", "#8fe3ff", 2.5)
    s += bagliore(140, -460, 30, "#8fe3ff", 0.6)
    s += parte((40, -410), (90, -350), 13, 10, abito, 3)
    s += parte((90, -350), (124, -300), 10, 8, pelle, 2)
    s += pugno(128, -296, 12, pelle)
    return svg(s)


NEMICI = {
    "goblin_razziatore": goblin,
    "cavaliere_spettrale": cavaliere,
    "strega_palude": strega,
    "re_troll": troll,
    "ghoul_radioattivo": ghoul,
    "grosso_bruno": bruno,
    "androide_custode": androide,
    "regina_rottami": regina,
}

if __name__ == "__main__":
    os.makedirs(USCITA, exist_ok=True)
    for nome, disegna in NEMICI.items():
        with open(os.path.join(USCITA, f"{nome}.svg"), "w", encoding="utf-8") as f:
            f.write(disegna())
        print("disegnato", nome)
