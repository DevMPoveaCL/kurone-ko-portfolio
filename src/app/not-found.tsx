import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page" id="main-content">
      <div className="not-found-plaque">
        <div aria-hidden="true" className="not-found-marker">
          404
        </div>
        <div className="not-found-content">
          <p className="not-found-eyebrow">404 · RUTA FUERA DE LA BÓVEDA</p>
          <h1 className="not-found-title">
            <span>Esta puerta</span>{" "}
            <span>no existe.</span>
          </h1>
          <p className="not-found-description">
            La dirección solicitada no conduce a una sección pública del portfolio.
          </p>
          <Link className="not-found-cta" href="/" prefetch={false}>
            Volver a la bóveda
          </Link>
        </div>
      </div>
    </main>
  );
}
