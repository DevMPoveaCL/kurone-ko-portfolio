import Link from "next/link";

export default function NotFound() {
  return (
    <main className="recovery-page" id="main-content">
      <p className="eyebrow">404 · RUTA NO ENCONTRADA</p>
      <h1>Esta puerta no existe.</h1>
      <p>La ruta solicitada no forma parte de la bóveda pública.</p>
      <Link className="button button-primary" href="/" prefetch={false}>
        Volver a la bóveda
      </Link>
    </main>
  );
}
