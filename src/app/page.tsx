import { VaultShell } from "@/features/portfolio/VaultShell";

export default function Home() {
  return (
    <main id="main-content" className="vault-stage" aria-labelledby="vault-shell-title">
      <VaultShell />
      <noscript>
        <style>{`html, body { overflow: auto !important; } .vault-stage { min-height: auto; } .no-script-fallback { display: grid; position: relative; z-index: 1; }`}</style>
        <section className="no-script-fallback" aria-labelledby="no-script-title">
          <h1 id="no-script-title">Kurone Ko Portfolio</h1>
          <p>JavaScript no está disponible. Este portfolio sigue siendo accesible como una selección de proyectos en construcción.</p>
          <h2>Proyectos visibles</h2>
          <ul>
            <li>Software Engineering Playbook</li>
            <li>Kurone-ko Timer</li>
            <li>E-commerce Farmacia</li>
            <li>Elemental Queens</li>
            <li>Kurone-ko Alarm</li>
            <li>Kurone-ko FilterCalls</li>
            <li>Kurone-ko GitHub Activity</li>
          </ul>
        </section>
      </noscript>
    </main>
  );
}
