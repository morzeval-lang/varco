"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Personaggio, type Azione } from "./Personaggio";
import type { Essenza } from "@/lib/personaggio/essenza";
import type { Copione, Elemento, Inquadratura } from "@/lib/rules/types";
import { famiglia } from "@/lib/rules/combat";

/**
 * Riproduce un copione di combattimento come scena 3D di pochi secondi.
 * Tutto quello che si vede deriva dal copione: la scena non decide niente.
 */

export const COLORI_ELEMENTO: Record<Elemento, string> = {
  fuoco: "#ff6a2b",
  gelo: "#8fe3ff",
  fulmine: "#ffe94a",
  tossico: "#8dff4a",
  luce: "#fff3b0",
  ombra: "#9b5cff",
  cinetico: "#f0f0f0",
  plasma: "#ff4ad8",
};

export interface Lottatore {
  id: string;
  essenza: Essenza;
  ko?: boolean;
}

interface Props {
  sinistra: Lottatore;
  destra: Lottatore;
  copione: Copione;
  onFine: () => void;
  /** Solo per il laboratorio: blocca la scena a questo istante (secondi). */
  tempoFisso?: number;
}

const X_SINISTRA = -2.2;
const X_DESTRA = 2.2;
const SU = new THREE.Vector3(0, 1, 0);
const LATO = new THREE.Vector3(0, 0, 1);

interface Tempi {
  impatto: number;
  lancio: number;
  fine: number;
}

function tempiPer(c: Copione): Tempi {
  switch (famiglia(c.archetipo)) {
    case "mischia":
      return { lancio: 0.35, impatto: 0.85, fine: 3.2 };
    case "distanza":
      return { lancio: 0.55, impatto: 1.2, fine: 3.4 };
    case "raggio":
      return { lancio: 0.5, impatto: 1.05, fine: 3.4 };
    case "area":
      return { lancio: 0.5, impatto: 1.35, fine: 3.6 };
    case "supporto":
      return { lancio: 0.3, impatto: 0.7, fine: 2.6 };
  }
}

export default function ArenaScena(props: Props) {
  return (
    <Canvas shadows camera={{ position: [0, 3, 9], fov: 45 }} dpr={[1, 2]}>
      <Ambiente arena={props.copione.arena} />
      <Regia {...props} />
    </Canvas>
  );
}

function Ambiente({ arena }: { arena: string }) {
  // Una sola arena nella Fase 0: un'autostrada in rovina della Post-apocalisse.
  void arena;
  const macerie = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const r = 7 + ((i * 37) % 5);
        return { x: Math.cos(a) * r, z: Math.sin(a) * r - 2, h: 0.6 + ((i * 53) % 30) / 10, ry: a };
      }),
    [],
  );
  return (
    <>
      <color attach="background" args={["#2d1f22"]} />
      <fog attach="fog" args={["#2d1f22", 9, 26]} />
      <hemisphereLight args={["#ffcf9e", "#2b1d1a", 0.8]} />
      <directionalLight position={[4, 8, 6]} intensity={2.4} color="#ffd9b0" castShadow shadow-mapSize={[1024, 1024]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[30, 48]} />
        <meshToonMaterial color="#6e5440" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[40, 3.2]} />
        <meshToonMaterial color="#3d3633" />
      </mesh>
      {[-6, -3, 0, 3, 6].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 0]}>
          <planeGeometry args={[1.2, 0.12]} />
          <meshBasicMaterial color="#c9b25a" />
        </mesh>
      ))}
      {macerie.map((m, i) => (
        <mesh key={i} position={[m.x, m.h / 2, m.z]} rotation={[0, m.ry, (i % 3) * 0.08]} castShadow>
          <boxGeometry args={[0.8 + (i % 3) * 0.4, m.h, 0.7]} />
          <meshToonMaterial color={i % 4 === 0 ? "#8a4b2a" : "#5b5552"} />
        </mesh>
      ))}
    </>
  );
}

function puntoCamera(nome: Inquadratura, A: THREE.Vector3, B: THREE.Vector3, proiettile: THREE.Vector3) {
  const dir = B.clone().sub(A).normalize();
  const mezzo = A.clone().add(B).multiplyScalar(0.5);
  const v = (...parti: THREE.Vector3[]) => parti.reduce((s, p) => s.add(p), new THREE.Vector3());
  switch (nome) {
    case "spalla_attore":
      return { pos: v(A.clone(), dir.clone().multiplyScalar(-1.9), SU.clone().multiplyScalar(1.9), LATO.clone().multiplyScalar(1.1)), guarda: v(B.clone(), SU.clone()) };
    case "primo_piano_attore":
      return { pos: v(A.clone(), dir.clone().multiplyScalar(1.7), LATO.clone().multiplyScalar(0.9), SU.clone().multiplyScalar(1.5)), guarda: v(A.clone(), SU.clone().multiplyScalar(1.2)) };
    case "carica":
      return { pos: v(mezzo.clone(), LATO.clone().multiplyScalar(3.2), SU.clone().multiplyScalar(1.3)), guarda: v(mezzo.clone(), SU.clone()) };
    case "segui_proiettile":
      return { pos: v(mezzo.clone(), LATO.clone().multiplyScalar(3.6), SU.clone().multiplyScalar(1.4)), guarda: proiettile.clone() };
    case "laterale":
      return { pos: v(mezzo.clone(), LATO.clone().multiplyScalar(4.6), SU.clone().multiplyScalar(1.7)), guarda: v(mezzo.clone(), SU.clone()) };
    case "impatto_bersaglio":
      return { pos: v(B.clone(), dir.clone().multiplyScalar(-1.7), LATO.clone().multiplyScalar(1.6), SU.clone().multiplyScalar(1.4)), guarda: v(B.clone(), SU.clone().multiplyScalar(0.9)) };
    case "aura":
      return { pos: v(A.clone(), LATO.clone().multiplyScalar(2.4), dir.clone().multiplyScalar(0.9), SU.clone().multiplyScalar(1.3)), guarda: v(A.clone(), SU.clone()) };
    case "larga":
      return { pos: v(mezzo.clone(), LATO.clone().multiplyScalar(7.5), SU.clone().multiplyScalar(3)), guarda: v(mezzo.clone(), SU.clone().multiplyScalar(0.8)) };
  }
}

function Regia({ sinistra, destra, copione, onFine, tempoFisso }: Props) {
  const { camera } = useThree();
  const attoreASinistra = copione.attore === sinistra.id;
  const A = useMemo(() => new THREE.Vector3(attoreASinistra ? X_SINISTRA : X_DESTRA, 0, 0), [attoreASinistra]);
  const B = useMemo(() => new THREE.Vector3(attoreASinistra ? X_DESTRA : X_SINISTRA, 0, 0), [attoreASinistra]);
  const tempi = useMemo(() => tempiPer(copione), [copione]);
  const fam = famiglia(copione.archetipo);
  const colore = COLORI_ELEMENTO[copione.elemento];
  const scala = 0.8 + copione.intensita * 0.35 + (copione.esito === "critico" ? 0.4 : 0);
  const colpito = copione.esito === "colpito" || copione.esito === "critico";
  const supporto = fam === "supporto";

  const inizio = useRef<number | null>(null);
  const finito = useRef(false);
  const fase = useRef(0);
  const gruppoAttore = useRef<THREE.Group>(null);
  const proiettile = useRef<THREE.Mesh>(null);
  const raggio = useRef<THREE.Mesh>(null);
  const esplosione = useRef<THREE.Mesh>(null);
  const fendente = useRef<THREE.Mesh>(null);
  const trappola = useRef<THREE.Mesh>(null);
  const evocato = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const luce = useRef<THREE.PointLight>(null);
  const posProiettile = useRef(new THREE.Vector3());
  const guardaCorrente = useRef(new THREE.Vector3(0, 1, 0));

  const [azioneAttore, setAzioneAttore] = useState<{ a: Azione; id: number }>({ a: "idle", id: 0 });
  const [azioneBersaglio, setAzioneBersaglio] = useState<{ a: Azione; id: number }>({ a: "idle", id: 0 });
  const [popup, setPopup] = useState(false);

  useEffect(() => {
    // Inquadratura iniziale immediata, poi le altre in dissolvenza.
    const p = puntoCamera(copione.camera[0], A, B, posProiettile.current);
    camera.position.copy(p.pos);
    guardaCorrente.current.copy(p.guarda);
    camera.lookAt(p.guarda);
  }, [A, B, camera, copione]);

  useFrame(({ clock }, delta) => {
    if (inizio.current === null) inizio.current = clock.getElapsedTime();
    const t = tempoFisso ?? clock.getElapsedTime() - inizio.current;

    // --- cambi di fase: poche chiamate a setState, non una per frame ---
    if (fase.current === 0 && t >= tempi.lancio) {
      fase.current = 1;
      const azione: Azione =
        copione.esito === "senza_energia" ? "idle"
        : fam === "mischia" ? "attacco"
        : supporto ? (copione.archetipo === "schivata" ? "schivata" : "difesa")
        : "lancio";
      setAzioneAttore({ a: copione.esito === "fallimento" ? "colpito" : azione, id: 1 });
    }
    if (fase.current === 1 && t >= tempi.impatto) {
      fase.current = 2;
      setPopup(true);
      if (!supporto && copione.esito !== "senza_energia") {
        setAzioneBersaglio({ a: copione.ko ? "ko" : colpito ? "colpito" : copione.esito === "mancato" ? "schivata" : "idle", id: 1 });
      }
    }
    if (fase.current === 2 && t >= tempi.fine - 0.8 && copione.ko) {
      fase.current = 3;
      setAzioneAttore({ a: "vittoria", id: 2 });
    }
    if (!finito.current && t >= tempi.fine) {
      finito.current = true;
      onFine();
    }

    // --- movimento dell'attore in mischia: corre verso il bersaglio e torna ---
    if (gruppoAttore.current) {
      let avanti = 0;
      if (fam === "mischia") {
        const andata = THREE.MathUtils.smoothstep(t, 0.05, 0.5);
        const ritorno = THREE.MathUtils.smoothstep(t, 1.5, 2.1);
        avanti = (Math.abs(B.x - A.x) - 1.3) * andata * (1 - ritorno);
      }
      gruppoAttore.current.position.x = A.x + Math.sign(B.x - A.x) * avanti;
    }

    // --- effetti ---
    const manoA = A.clone().add(new THREE.Vector3(Math.sign(B.x - A.x) * 0.5, 1.3, 0));
    const bersaglioY = B.clone().add(new THREE.Vector3(0, 1, copione.esito === "mancato" ? 0.9 : 0));
    const k = THREE.MathUtils.clamp((t - tempi.lancio) / (tempi.impatto - tempi.lancio), 0, 1);
    const dopo = t - tempi.impatto;

    if (proiettile.current) {
      const vis = fam === "distanza" && t >= tempi.lancio && t < tempi.impatto + (copione.esito === "mancato" ? 0.4 : 0);
      proiettile.current.visible = vis;
      const p = manoA.clone().lerp(bersaglioY, copione.esito === "mancato" ? Math.min(1.4, k * 1.2) : k);
      p.y += Math.sin(k * Math.PI) * 0.6;
      proiettile.current.position.copy(p);
      proiettile.current.rotation.x += delta * 10;
      posProiettile.current.copy(p);
    }
    if (fam !== "distanza") posProiettile.current.copy(fam === "raggio" ? bersaglioY : B.clone().add(SU));

    if (raggio.current) {
      const vis = fam === "raggio" && t >= tempi.lancio && t < tempi.impatto + 0.5 && copione.esito !== "senza_energia";
      raggio.current.visible = vis;
      const fine = manoA.clone().lerp(bersaglioY, Math.min(1, k * 1.15));
      const lunghezza = fine.distanceTo(manoA);
      raggio.current.position.copy(manoA.clone().add(fine).multiplyScalar(0.5));
      raggio.current.scale.set(scala * (1 + Math.sin(t * 40) * 0.15), Math.max(0.01, lunghezza), scala * (1 + Math.sin(t * 40) * 0.15));
      raggio.current.lookAt(fine);
      raggio.current.rotateX(Math.PI / 2);
    }
    if (esplosione.current) {
      const durata = 0.5;
      const vis = colpito && dopo >= 0 && dopo < durata;
      esplosione.current.visible = vis;
      esplosione.current.position.copy(B.clone().add(new THREE.Vector3(0, 1, 0)));
      const s = (fam === "area" ? 1.6 : 0.8) * scala * THREE.MathUtils.smoothstep(dopo, 0, durata);
      esplosione.current.scale.setScalar(Math.max(0.01, s));
      (esplosione.current.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - dopo / durata);
    }
    if (fendente.current) {
      const vis = fam === "mischia" && dopo >= -0.1 && dopo < 0.3 && copione.esito !== "senza_energia";
      fendente.current.visible = vis;
      fendente.current.position.copy(B.clone().add(new THREE.Vector3(0, 1.1, 0)));
      fendente.current.rotation.set(0, Math.PI / 2, -1 + (dopo + 0.1) * 8);
      fendente.current.scale.setScalar(scala * 0.8);
    }
    if (trappola.current) {
      const vis = copione.archetipo === "trappola" && t >= tempi.lancio && dopo < 0.6;
      trappola.current.visible = vis;
      trappola.current.position.set(B.x, 0.05, 0);
      trappola.current.scale.setScalar(dopo < 0 ? 0.4 + k * 0.8 : Math.max(0.05, 1.2 - dopo * 2));
    }
    if (evocato.current) {
      const vis = copione.archetipo === "evocazione" && t >= tempi.lancio && dopo < 0.4;
      evocato.current.visible = vis;
      evocato.current.position.set(B.x, 1 + (1 - k) * 5, copione.esito === "mancato" ? 1 : 0);
      evocato.current.rotation.y += delta * 6;
      evocato.current.scale.setScalar(scala * 0.6);
    }
    if (auraRef.current) {
      const vis = supporto && t >= tempi.lancio && t < tempi.fine - 0.3 && copione.esito === "riuscito";
      auraRef.current.visible = vis;
      auraRef.current.position.copy(A.clone().add(new THREE.Vector3(0, 1, 0)));
      auraRef.current.scale.setScalar(Math.max(0.01, THREE.MathUtils.smoothstep(t, tempi.lancio, tempi.impatto) * (1.1 + Math.sin(t * 6) * 0.06)));
    }
    if (luce.current) {
      const flash = dopo >= 0 ? Math.exp(-dopo * 4) * (colpito ? 12 : 4) : 0;
      const carica = t >= tempi.lancio && dopo < 0 ? 4 : 0;
      luce.current.intensity = flash + carica;
      luce.current.position.copy(dopo >= 0 ? B.clone().add(new THREE.Vector3(0, 1.4, 0.6)) : posProiettile.current);
    }

    // --- camera: sceglie l'inquadratura in base alla fase e si muove morbida ---
    const shots = copione.camera;
    const indice = t < tempi.lancio ? 0 : t < tempi.impatto ? 1 : t < tempi.impatto + 1 ? 2 : 3;
    const nome = shots[Math.min(indice, shots.length - 1)];
    const obiettivo = puntoCamera(nome, A, B, posProiettile.current);
    const morbidezza = 1 - Math.pow(0.02, delta);
    camera.position.lerp(obiettivo.pos, morbidezza);
    guardaCorrente.current.lerp(obiettivo.guarda, morbidezza);
    if (copione.esito === "critico" && dopo >= 0 && dopo < 0.35) {
      const forza = 0.12 * (1 - dopo / 0.35);
      camera.position.add(new THREE.Vector3((Math.random() - 0.5) * forza, (Math.random() - 0.5) * forza, 0));
    }
    camera.lookAt(guardaCorrente.current);
  });

  const sx = attoreASinistra ? azioneAttore : azioneBersaglio;
  const dx = attoreASinistra ? azioneBersaglio : azioneAttore;
  const testoPopup =
    copione.esito === "critico" ? `CRITICO −${copione.danno}`
    : copione.esito === "colpito" ? `−${copione.danno}`
    : copione.esito === "mancato" ? "MANCATO"
    : copione.esito === "fallimento" ? "FALLIMENTO"
    : copione.esito === "senza_energia" ? "SENZA ENERGIA"
    : copione.cura > 0 ? `+${copione.cura} PV`
    : copione.stati[0]?.replace("_", " ").toUpperCase() ?? "";
  const posPopup = supporto || copione.esito === "fallimento" || copione.esito === "senza_energia" ? A : B;

  return (
    <>
      <group ref={attoreASinistra ? gruppoAttore : undefined} position={[X_SINISTRA, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Personaggio essenza={sinistra.essenza} azione={sinistra.ko ? "ko" : sx.a} azioneId={sinistra.ko ? -1 : sx.id} />
      </group>
      <group ref={attoreASinistra ? undefined : gruppoAttore} position={[X_DESTRA, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Personaggio essenza={destra.essenza} azione={destra.ko ? "ko" : dx.a} azioneId={destra.ko ? -1 : dx.id} />
      </group>

      <mesh ref={proiettile} visible={false}>
        <icosahedronGeometry args={[0.13 * scala, 1]} />
        <meshBasicMaterial color={colore} toneMapped={false} />
      </mesh>
      <mesh ref={raggio} visible={false}>
        <cylinderGeometry args={[0.09, 0.09, 1, 12, 1, true]} />
        <meshBasicMaterial color={colore} transparent opacity={0.85} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={esplosione} visible={false}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color={colore} transparent opacity={0.8} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={fendente} visible={false}>
        <torusGeometry args={[0.8, 0.05, 6, 32, Math.PI * 0.9]} />
        <meshBasicMaterial color={colore} toneMapped={false} />
      </mesh>
      <mesh ref={trappola} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.8, 32]} />
        <meshBasicMaterial color={colore} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={evocato} visible={false}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshToonMaterial color={colore} emissive={colore} emissiveIntensity={0.4} />
      </mesh>
      <mesh ref={auraRef} visible={false}>
        <sphereGeometry args={[0.9, 24, 16]} />
        <meshBasicMaterial color={colore} transparent opacity={0.22} toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight ref={luce} color={colore} intensity={0} distance={8} />

      {popup && testoPopup && (
        <Html position={[posPopup.x, 2.4, 0]} center zIndexRange={[20, 0]}>
          <div className={`popup-danno ${copione.esito}`}>{testoPopup}</div>
        </Html>
      )}
    </>
  );
}
