"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import type { Essenza } from "@/lib/personaggio/essenza";

/**
 * Personaggio 3D procedurale costruito dall'Essenza. È il "kit modulare" del documento di
 * design: istantaneo, gratis, sempre animabile. Nella Fase 0b verrà affiancato dal modello
 * GLB generato (Tripo o Meshy) con lo stesso set di azioni.
 */

export type Azione = "idle" | "attacco" | "lancio" | "colpito" | "ko" | "vittoria" | "schivata" | "difesa";

interface Props {
  essenza: Essenza;
  azione?: Azione;
  /** Cambia questo numero per far ripartire l'azione da capo. */
  azioneId?: number;
}

const LARGHEZZA: Record<Essenza["corporatura"], number> = { esile: 0.85, media: 1, robusta: 1.15, imponente: 1.3 };

function Toon({ color, emissive, children, opacity }: { color: string; emissive?: string; children?: ReactNode; opacity?: number }) {
  return (
    <>
      <meshToonMaterial
        color={color}
        emissive={emissive ?? "#000000"}
        emissiveIntensity={emissive ? 1.2 : 0}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
      {children}
    </>
  );
}

const CONTORNO = <Outlines thickness={0.012} color="#14121a" />;

function easeOut(x: number) {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
}

export function Personaggio({ essenza, azione = "idle", azioneId = 0 }: Props) {
  const w = LARGHEZZA[essenza.corporatura];
  const h = essenza.altezza * (essenza.corporatura === "imponente" ? 1.05 : 1);
  const { primario, secondario, accento } = essenza.palette;
  const segno = essenza.segnoDistintivo.tipo;
  const arma = essenza.arma.tipo;

  const radice = useRef<THREE.Group>(null);
  const corpo = useRef<THREE.Group>(null);
  const braccioDx = useRef<THREE.Group>(null);
  const braccioSx = useRef<THREE.Group>(null);
  const mantello = useRef<THREE.Mesh>(null);
  const aura = useRef<THREE.Mesh>(null);
  const inizio = useRef<{ id: number; t: number } | null>(null);

  const metallo = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8a8f98", metalness: 0.8, roughness: 0.35 }), []);

  useFrame(({ clock }) => {
    const ora = clock.getElapsedTime();
    if (!inizio.current || inizio.current.id !== azioneId) inizio.current = { id: azioneId, t: ora };
    const t = ora - inizio.current.t;
    const r = radice.current, c = corpo.current, dx = braccioDx.current, sx = braccioSx.current;
    if (!r || !c || !dx || !sx) return;

    // posa neutra
    let ry = 0, rz = 0, rx = 0, rotX = 0, dxX = 0, dxZ = 0.08, sxX = 0, sxZ = -0.08, corpoX = 0;
    const respiro = Math.sin(ora * 2.2) * 0.02;

    switch (azione) {
      case "idle":
        ry = respiro;
        dxX = Math.sin(ora * 1.6) * 0.06;
        sxX = -Math.sin(ora * 1.6) * 0.06;
        break;
      case "attacco": {
        const carica = easeOut(t / 0.3), colpo = easeOut((t - 0.3) / 0.15), ritorno = easeOut((t - 0.9) / 0.4);
        dxX = (-2.6 * carica + 3.3 * colpo) * (1 - ritorno);
        corpoX = (-0.15 * carica + 0.45 * colpo) * (1 - ritorno);
        rz = 0.35 * colpo * (1 - ritorno);
        break;
      }
      case "lancio": {
        const su = easeOut(t / 0.35), via = easeOut((t - 0.35) / 0.15), ritorno = easeOut((t - 1.1) / 0.4);
        dxX = (-1.2 * su - 0.5 * via) * (1 - ritorno);
        sxX = (-1.0 * su - 0.5 * via) * (1 - ritorno);
        dxZ = 0.08 + 0.25 * su * (1 - ritorno);
        sxZ = -0.08 - 0.25 * su * (1 - ritorno);
        corpoX = 0.15 * via * (1 - ritorno);
        ry = respiro;
        break;
      }
      case "colpito": {
        const k = Math.exp(-t * 5) * Math.min(1, t * 12);
        rotX = -0.35 * k;
        rz = -0.25 * k;
        dxX = -0.6 * k;
        sxX = -0.6 * k;
        break;
      }
      case "ko": {
        const caduta = easeOut((t - 0.15) / 0.6);
        rotX = -Math.PI / 2 * caduta;
        dxX = -2.5 * caduta;
        sxX = -2.5 * caduta;
        break;
      }
      case "vittoria":
        ry = Math.abs(Math.sin(t * 6)) * 0.25 * Math.max(0, 1 - t / 2);
        dxX = -2.8;
        sxX = -2.8;
        dxZ = 0.3;
        sxZ = -0.3;
        break;
      case "schivata": {
        const k = Math.sin(Math.min(1, t / 0.6) * Math.PI);
        rx = -0.6 * k;
        ry = 0.18 * k;
        corpoX = 0.2 * k;
        break;
      }
      case "difesa": {
        const k = easeOut(t / 0.3);
        dxX = -1.3 * k;
        sxX = -1.3 * k;
        dxZ = 0.08 - 0.7 * k;
        sxZ = -0.08 + 0.7 * k;
        ry = respiro;
        break;
      }
    }

    r.position.set(rx, ry, rz);
    r.rotation.x = rotX;
    c.rotation.x = corpoX;
    dx.rotation.set(dxX, 0, dxZ);
    sx.rotation.set(sxX, 0, sxZ);
    if (mantello.current) mantello.current.rotation.x = 0.12 + Math.sin(ora * 2.5) * 0.05 + (azione === "attacco" ? 0.3 : 0);
    if (aura.current) aura.current.scale.setScalar(1 + Math.sin(ora * 3) * 0.05);
  });

  const occhioLuminoso = segno === "occhio_luminoso";
  const braccioMeccanico = segno === "braccio_meccanico";

  const braccio = (lato: 1 | -1, meccanico: boolean) => (
    <>
      <mesh position={[0, -0.3, 0]} castShadow material={meccanico ? metallo : undefined}>
        <capsuleGeometry args={[0.065 * w, 0.42, 6, 12]} />
        {!meccanico && <Toon color={primario}>{CONTORNO}</Toon>}
        {meccanico && CONTORNO}
      </mesh>
      {meccanico &&
        [-0.15, -0.35].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.075 * w, 0.015, 8, 20]} />
            <meshBasicMaterial color={accento} toneMapped={false} />
          </mesh>
        ))}
      <mesh position={[0, -0.6, 0]} castShadow material={meccanico ? metallo : undefined}>
        <sphereGeometry args={[(arma === "pugni" ? 0.1 : 0.065) * w, 16, 12]} />
        {!meccanico && <Toon color={arma === "pugni" ? accento : essenza.pelle}>{CONTORNO}</Toon>}
      </mesh>
      {lato === 1 && <Arma tipo={arma} accento={accento} secondario={secondario} />}
      {lato === -1 && arma === "scudo" && (
        <mesh position={[0.04, -0.45, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.05, 24]} />
          <Toon color={secondario}>{CONTORNO}</Toon>
        </mesh>
      )}
    </>
  );

  return (
    <group scale={[h, h, h]}>
      <group ref={radice}>
        {/* gambe */}
        {[-1, 1].map((l) => (
          <mesh key={l} position={[0.12 * w * l, 0.45, 0]} castShadow>
            <capsuleGeometry args={[0.085 * w, 0.62, 6, 12]} />
            <Toon color={secondario}>{CONTORNO}</Toon>
          </mesh>
        ))}
        <group ref={corpo} position={[0, 0.9, 0]}>
          {/* busto */}
          <mesh position={[0, 0.27, 0]} castShadow>
            <capsuleGeometry args={[0.21 * w, 0.36, 8, 16]} />
            <Toon color={primario}>{CONTORNO}</Toon>
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.215 * w, 0.215 * w, 0.06, 20]} />
            <Toon color={secondario} />
          </mesh>
          {/* testa */}
          <group position={[0, 0.74, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.17, 24, 18]} />
              <Toon color={essenza.pelle}>{CONTORNO}</Toon>
            </mesh>
            {[-1, 1].map((l) => (
              <mesh key={l} position={[0.06 * l, 0.02, 0.152]}>
                <sphereGeometry args={[occhioLuminoso && l === 1 ? 0.03 : 0.022, 10, 8]} />
                {occhioLuminoso && l === 1 ? <meshBasicMaterial color={accento} toneMapped={false} /> : <meshBasicMaterial color="#15151c" />}
              </mesh>
            ))}
            {segno === "cicatrice" && (
              <mesh position={[-0.06, 0.04, 0.165]} rotation={[0, 0, 0.9]}>
                <boxGeometry args={[0.012, 0.13, 0.01]} />
                <meshBasicMaterial color="#8c2f2f" />
              </mesh>
            )}
            <Capelli stile={essenza.capelli.stile} colore={essenza.capelli.colore} primario={primario} accento={accento} />
            {segno === "corna" &&
              [-1, 1].map((l) => (
                <mesh key={l} position={[0.1 * l, 0.15, 0]} rotation={[0, 0, -0.5 * l]}>
                  <coneGeometry args={[0.035, 0.2, 10]} />
                  <Toon color="#e8dcc0">{CONTORNO}</Toon>
                </mesh>
              ))}
          </group>
          {/* braccia: perno alla spalla, il destro del personaggio è verso -x */}
          <group ref={braccioDx} position={[-0.3 * w, 0.48, 0]}>
            {braccio(1, false)}
          </group>
          <group ref={braccioSx} position={[0.3 * w, 0.48, 0]}>
            {braccio(-1, braccioMeccanico)}
          </group>
          {segno === "mantello" && (
            <mesh ref={mantello} position={[0, 0.05, -0.2 * w]} castShadow>
              <boxGeometry args={[0.55 * w, 1.0, 0.02]} />
              <Toon color={secondario}>{CONTORNO}</Toon>
            </mesh>
          )}
          {segno === "ali" &&
            [-1, 1].map((l) => (
              <mesh key={l} position={[0.35 * l, 0.45, -0.22]} rotation={[0.2, 0.5 * l, 0.5 * l]}>
                <boxGeometry args={[0.6, 0.35, 0.015]} />
                <Toon color={accento} opacity={0.75} />
              </mesh>
            ))}
        </group>
        {segno === "aura" && (
          <mesh ref={aura} position={[0, 0.95, 0]}>
            <sphereGeometry args={[0.85, 24, 18]} />
            <meshBasicMaterial color={accento} transparent opacity={0.12} depthWrite={false} toneMapped={false} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function Capelli({ stile, colore, primario, accento }: { stile: Essenza["capelli"]["stile"]; colore: string; primario: string; accento: string }) {
  switch (stile) {
    case "rasati":
      return (
        <mesh position={[0, 0.02, -0.005]}>
          <sphereGeometry args={[0.174, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
          <Toon color={colore} />
        </mesh>
      );
    case "corti":
      return (
        <mesh position={[0, 0.03, -0.01]}>
          <sphereGeometry args={[0.185, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Toon color={colore}>{CONTORNO}</Toon>
        </mesh>
      );
    case "lunghi":
      return (
        <group>
          <mesh position={[0, 0.03, -0.01]}>
            <sphereGeometry args={[0.188, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Toon color={colore}>{CONTORNO}</Toon>
          </mesh>
          <mesh position={[0, -0.18, -0.12]}>
            <boxGeometry args={[0.3, 0.42, 0.08]} />
            <Toon color={colore}>{CONTORNO}</Toon>
          </mesh>
        </group>
      );
    case "cresta":
      return (
        <group>
          <mesh position={[0, 0.02, -0.005]}>
            <sphereGeometry args={[0.174, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
            <Toon color="#3a3330" />
          </mesh>
          <mesh position={[0, 0.2, -0.02]}>
            <boxGeometry args={[0.05, 0.14, 0.3]} />
            <Toon color={colore}>{CONTORNO}</Toon>
          </mesh>
        </group>
      );
    case "cappuccio":
      return (
        <mesh position={[0, 0.02, -0.03]}>
          <sphereGeometry args={[0.21, 20, 14, Math.PI * 0.15, Math.PI * 1.7, 0, Math.PI * 0.62]} />
          <Toon color={primario}>{CONTORNO}</Toon>
        </mesh>
      );
    case "elmo":
      return (
        <group>
          <mesh position={[0, 0.03, 0]}>
            <sphereGeometry args={[0.195, 20, 14, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
            <meshStandardMaterial color="#9aa0a8" metalness={0.8} roughness={0.3} />
            {CONTORNO}
          </mesh>
          <mesh position={[0, 0.03, 0.17]}>
            <boxGeometry args={[0.22, 0.04, 0.04]} />
            <meshBasicMaterial color={accento} toneMapped={false} />
          </mesh>
        </group>
      );
  }
}

function Arma({ tipo, accento, secondario }: { tipo: Essenza["arma"]["tipo"]; accento: string; secondario: string }) {
  // L'arma è agganciata alla mano destra (y = -0.6 nel gruppo del braccio) e punta in avanti.
  switch (tipo) {
    case "spada":
      return (
        <group position={[0, -0.62, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.06, 0.8, 0.02]} />
            <meshStandardMaterial color="#dfe6ee" metalness={0.9} roughness={0.2} emissive={accento} emissiveIntensity={0.15} />
            {CONTORNO}
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.2, 0.04, 0.05]} />
            <Toon color={secondario}>{CONTORNO}</Toon>
          </mesh>
        </group>
      );
    case "bastone":
      return (
        <group position={[0, -0.62, 0]}>
          <mesh>
            <cylinderGeometry args={[0.025, 0.03, 1.5, 10]} />
            <Toon color="#6b4a2b">{CONTORNO}</Toon>
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <icosahedronGeometry args={[0.08, 0]} />
            <meshBasicMaterial color={accento} toneMapped={false} />
          </mesh>
        </group>
      );
    case "arco":
      return (
        <mesh position={[0, -0.62, 0.05]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.4, 0.02, 8, 24, Math.PI]} />
          <Toon color="#6b4a2b">{CONTORNO}</Toon>
        </mesh>
      );
    case "pistola":
      return (
        <group position={[0, -0.64, 0.08]}>
          <mesh>
            <boxGeometry args={[0.06, 0.12, 0.06]} />
            <Toon color="#2c2c34">{CONTORNO}</Toon>
          </mesh>
          <mesh position={[0, 0.03, 0.12]}>
            <boxGeometry args={[0.05, 0.06, 0.22]} />
            <Toon color="#3d3d48">{CONTORNO}</Toon>
          </mesh>
          <mesh position={[0, 0.03, 0.24]}>
            <sphereGeometry args={[0.02, 8, 6]} />
            <meshBasicMaterial color={accento} toneMapped={false} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}
