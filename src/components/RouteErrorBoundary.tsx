import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  readonly failed: boolean;
}

/**
 * Captura fallos de carga de chunks lazy (p. ej. tras un despliegue nuevo el hash cambia
 * o la red falla) y ofrece recargar en vez de mostrar una pantalla en blanco.
 */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-md py-24 text-center">
        <p className="text-4xl" aria-hidden="true">🌧️</p>
        <h1 className="mt-4 text-xl font-bold">No pudimos cargar esta sección</h1>
        <p className="mt-2 text-sm text-stone-600">Puede deberse a tu conexión o a una nueva versión del sitio.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Recargar
        </button>
      </div>
    );
  }
}
