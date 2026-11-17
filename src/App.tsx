import { useState } from 'react';
import { ChatPanel } from './agent/ChatPanel';
import { AgentGlow } from './components/AgentGlow';
import { CartDrawer } from './components/CartDrawer';
import { FiltersBar, ProductGrid } from './components/Catalog';
import { AgentToasts, ConfirmationDialog, OrderConfirmation } from './components/Overlays';
import { ProductDetail } from './components/ProductDetail';
import { STORE_INFO } from './data/products';
import { openCart } from './store/actions';
import { getCartSummary } from './store/selectors';
import { useStore } from './store/store';
import type { WebMcpMode } from './webmcp/polyfill';
import { storeTools } from './webmcp/tools';
import { useWebMcpTools } from './webmcp/useWebMcpTools';

const MODE_LABEL: Record<WebMcpMode, string> = {
  native: 'WebMCP nativo',
  'native-wrapped': 'WebMCP nativo (adaptado)',
  polyfill: 'WebMCP polyfill',
};

export function App({ webMcpMode }: { webMcpMode: WebMcpMode }) {
  const [chatOpen, setChatOpen] = useState(true);
  const cart = useStore((s) => s.cart);
  const couponCode = useStore((s) => s.couponCode);
  const itemCount = getCartSummary({ cart, couponCode }).itemCount;

  useWebMcpTools(storeTools);

  return (
    <div className={`layout${chatOpen ? ' layout--chat' : ''}`}>
      <div className="shop">
        <header className="topbar">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">
              R
            </span>
            <div>
              <h1>{STORE_INFO.name}</h1>
              <p className="brand__tagline">{STORE_INFO.tagline}</p>
            </div>
          </div>
          <div className="topbar__actions">
            <AgentGlow target="info" className="pill pill--mode">
              <span title="Cómo se expone document.modelContext en este navegador">{MODE_LABEL[webMcpMode]}</span>
            </AgentGlow>
            {!chatOpen ? (
              <button type="button" className="button button--ghost" onClick={() => setChatOpen(true)}>
                Asistente
              </button>
            ) : null}
            <AgentGlow target="cart" className="cart-button-wrap">
              <button type="button" className="button" onClick={openCart}>
                Carrito <span className="count">{itemCount}</span>
              </button>
            </AgentGlow>
          </div>
        </header>

        <main className="main">
          <section className="hero">
            <h2>Equipo certificado para rodar seguro</h2>
            <p>
              Usa el cupón <strong>BIENVENIDA10</strong> y obtén 10 % de descuento en tu primera compra.
            </p>
          </section>
          <FiltersBar />
          <ProductGrid />
        </main>
        <footer className="footer">
          <p>
            {STORE_INFO.name} es una tienda ficticia creada para el taller de WebMCP · DevFest Bogotá 2026. Marcas y productos
            ficticios.
          </p>
        </footer>
      </div>

      {chatOpen ? <ChatPanel onClose={() => setChatOpen(false)} /> : null}

      <ProductDetail />
      <CartDrawer />
      <OrderConfirmation />
      <ConfirmationDialog />
      <AgentToasts />
    </div>
  );
}
