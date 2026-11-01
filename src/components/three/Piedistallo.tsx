"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Personaggio, type Azione } from "./Personaggio";
import type { Essenza } from "@/lib/personaggio/essenza";

/** Il visore della creazione personaggio: piedistallo che ruota, si gira col dito. */
export default function Piedistallo({ essenza, azione, azioneId }: { essenza: Essenza; azione: Azione; azioneId: number }) {
  return (
    <Canvas shadows camera={{ position: [0, 1.4, 3.4], fov: 40 }} dpr={[1, 2]}>
      <color attach="background" args={["#14121c"]} />
      <hemisphereLight args={["#c9d4ff", "#2a2233", 0.9]} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} castShadow />
      <pointLight position={[-3, 2, -2]} intensity={8} color={essenza.palette.accento} />
      <Personaggio essenza={essenza} azione={azione} azioneId={azioneId} />
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[0.9, 1, 0.12, 48]} />
        <meshToonMaterial color="#2b2838" />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 0.86, 64]} />
        <meshBasicMaterial color={essenza.palette.accento} toneMapped={false} />
      </mesh>
      <ContactShadows position={[0, 0.005, 0]} opacity={0.5} scale={3} blur={2} far={2} />
      <OrbitControls target={[0, 1, 0]} autoRotate autoRotateSpeed={1.2} enablePan={false} minDistance={2} maxDistance={6} />
    </Canvas>
  );
}
