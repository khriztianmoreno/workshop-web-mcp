import { useState, type FormEvent } from 'react';
import { applyCoupon, checkout, closeCart, removeCoupon, removeFromCart, setLineQuantity } from '../store/actions';
import { formatCop, getCartSummary } from '../store/selectors';
import { useStore } from '../store/store';
import { AgentGlow } from './AgentGlow';

export function CartDrawer() {
  const open = useStore((s) => s.cartOpen);
  const cart = useStore((s) => s.cart);
  const couponCode = useStore((s) => s.couponCode);
  const summary = getCartSummary({ cart, couponCode });
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const onCoupon = (event: FormEvent) => {
    event.preventDefault();
    // Same action the apply_coupon tool calls.
    const result = applyCoupon(code);
    setError(result.ok ? null : result.message);
    if (result.ok) setCode('');
  };

  const onCheckout = () => {
    // A human clicking this button IS the confirmation.
    const result = checkout();
    if (!result.ok) setError(result.message);
  };

  return (
    <div className="drawer-backdrop" onClick={closeCart}>
      <AgentGlow target="cart" as="section" className="drawer">
        <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cart-title" className="drawer__inner">
          <header className="drawer__header">
            <h2 id="cart-title">Tu carrito</h2>
            <button type="button" className="icon-button" onClick={closeCart} aria-label="Cerrar carrito">
              ×
            </button>
          </header>

          {summary.lines.length === 0 ? (
            <p className="empty">Tu carrito está vacío.</p>
          ) : (
            <ul className="cart-lines">
              {summary.lines.map((line) => (
                <li key={line.lineId} className="cart-line">
                  <div>
                    <p className="cart-line__name">{line.name}</p>
                    <p className="muted">
                      Talla {line.size} · {line.color} · {formatCop(line.unitPrice)}
                    </p>
                  </div>
                  <div className="cart-line__qty">
                    <button type="button" className="icon-button" aria-label="Quitar una unidad" onClick={() => setLineQuantity(line.lineId, line.quantity - 1)}>
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Agregar una unidad"
                      onClick={() => {
                        const result = setLineQuantity(line.lineId, line.quantity + 1);
                        setError(result.ok ? null : result.message);
                      }}
                    >
                      +
                    </button>
                  </div>
                  <p className="cart-line__total">{formatCop(line.lineTotal)}</p>
                  <button type="button" className="link-button" onClick={() => removeFromCart(line.lineId)}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="coupon" onSubmit={onCoupon}>
            <label className="field field--grow">
              <span>Cupón</span>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BIENVENIDA10" />
            </label>
            <button type="submit" className="button button--ghost" disabled={!code.trim()}>
              Aplicar
            </button>
          </form>
          {summary.couponCode ? (
            <p className="notice notice--ok">
              Cupón <strong>{summary.couponCode}</strong> aplicado.{' '}
              <button type="button" className="link-button" onClick={removeCoupon}>
                Quitar
              </button>
            </p>
          ) : null}
          {error ? (
            <p className="notice notice--error" role="alert">
              {error}
            </p>
          ) : null}

          <dl className="totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCop(summary.subtotal)}</dd>
            </div>
            {summary.discount > 0 ? (
              <div>
                <dt>Descuento</dt>
                <dd>− {formatCop(summary.discount)}</dd>
              </div>
            ) : null}
            <div className="totals__total">
              <dt>Total</dt>
              <dd>{formatCop(summary.total)}</dd>
            </div>
          </dl>
          <button type="button" className="button button--block" disabled={summary.lines.length === 0} onClick={onCheckout}>
            Finalizar compra
          </button>
        </div>
      </AgentGlow>
    </div>
  );
}
