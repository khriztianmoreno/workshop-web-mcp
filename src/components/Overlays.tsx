import { useEffect, useRef } from 'react';
import { dismissOrder } from '../store/actions';
import { formatCop } from '../store/selectors';
import { useStore } from '../store/store';
import { respondToConfirmation, usePendingConfirmation } from '../ui/confirmation';
import { useActivityToasts } from '../webmcp/activity';

/** Page-owned confirmation dialog (used by the checkout tool). */
export function ConfirmationDialog() {
  const request = usePendingConfirmation();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (request) cancelRef.current?.focus();
  }, [request]);

  if (!request) return null;
  return (
    <div className="modal-backdrop modal-backdrop--strong">
      <div className="modal confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
        <p className="confirm__eyebrow">Confirmación de la tienda</p>
        <h2 id="confirm-title">{request.title}</h2>
        <p id="confirm-message">{request.message}</p>
        {request.details?.length ? (
          <ul className="confirm__details">
            {request.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}
        <div className="confirm__actions">
          <button ref={cancelRef} type="button" className="button button--ghost" onClick={() => respondToConfirmation(false)}>
            Cancelar
          </button>
          <button type="button" className="button button--danger" onClick={() => respondToConfirmation(true)}>
            {request.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AgentToasts() {
  const toasts = useActivityToasts();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <span className="toast__label">Agente ejecutó</span>
          <code>{toast.toolName}</code>
          {toast.args && Object.keys(toast.args).length > 0 ? <code className="toast__args">{JSON.stringify(toast.args)}</code> : null}
        </div>
      ))}
    </div>
  );
}

export function OrderConfirmation() {
  const order = useStore((s) => s.lastOrder);
  if (!order) return null;
  return (
    <div className="modal-backdrop" onClick={dismissOrder}>
      <div className="modal order" role="dialog" aria-modal="true" aria-labelledby="order-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="order-title">¡Pedido {order.orderId} confirmado!</h2>
        <p>
          {order.lines.reduce((sum, line) => sum + line.quantity, 0)} artículo(s) por un total de <strong>{formatCop(order.total)}</strong>.
        </p>
        <p className="muted">Esta es una tienda de demostración: no se realizó ningún cobro.</p>
        <button type="button" className="button" onClick={dismissOrder}>
          Seguir comprando
        </button>
      </div>
    </div>
  );
}
