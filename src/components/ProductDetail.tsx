import { useEffect, useMemo, useState } from 'react';
import { findProduct } from '../data/products';
import { CATEGORY_LABELS } from '../data/types';
import { addToCart, openCart, selectProduct } from '../store/actions';
import { formatCop } from '../store/selectors';
import { useStore } from '../store/store';
import { CertificationBadges, ProductArt } from './Catalog';

export function ProductDetail() {
  const productId = useStore((s) => s.selectedProductId);
  const product = productId ? findProduct(productId) : undefined;
  const sizes = useMemo(() => (product ? [...new Set(product.variants.map((v) => v.size))] : []), [product]);
  const colors = useMemo(() => (product ? [...new Set(product.variants.map((v) => v.color))] : []), [product]);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!product) return;
    const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
    setSize(firstAvailable.size);
    setColor(firstAvailable.color);
    setQuantity(1);
    setMessage(null);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && selectProduct(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product]);

  if (!product) return null;

  const stockFor = (s: string, c: string) => product.variants.find((v) => v.size === s && v.color === c)?.stock ?? 0;
  const selectedStock = stockFor(size, color);

  const onAdd = () => {
    // Same action the add_to_cart tool calls.
    const result = addToCart({ productId: product.id, size, color, quantity });
    if (result.ok) {
      setMessage({ tone: 'ok', text: 'Agregado al carrito.' });
    } else {
      setMessage({ tone: 'error', text: result.message });
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => selectProduct(null)}>
      <div className="modal detail" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-button modal__close" onClick={() => selectProduct(null)} aria-label="Cerrar">
          ×
        </button>
        <div className="detail__layout">
          <ProductArt product={product} large />
          <div>
            <p className="card__brand">
              {product.brand} · {CATEGORY_LABELS[product.category]}
              {product.style ? ` · ${product.style}` : ''}
            </p>
            <h2 id="detail-title">{product.name}</h2>
            <div className="card__certs">
              <CertificationBadges product={product} />
            </div>
            <p className="detail__price">{formatCop(product.price)}</p>
            <p>{product.description}</p>
            <ul className="detail__features">
              {product.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>

            <fieldset className="options">
              <legend>Talla</legend>
              {sizes.map((s) => {
                const available = stockFor(s, color) > 0;
                return (
                  <button
                    key={s}
                    type="button"
                    className={`option${s === size ? ' option--selected' : ''}${available ? '' : ' option--out'}`}
                    aria-pressed={s === size}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                );
              })}
            </fieldset>
            <fieldset className="options">
              <legend>Color</legend>
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`option${c === color ? ' option--selected' : ''}${stockFor(size, c) > 0 ? '' : ' option--out'}`}
                  aria-pressed={c === color}
                  onClick={() => setColor(c)}
                >
                  {c}
                </button>
              ))}
            </fieldset>
            <p className={`detail__stock${selectedStock > 0 ? '' : ' detail__stock--out'}`}>
              {selectedStock > 0 ? `${selectedStock} disponibles en ${size} / ${color}` : `Agotado en ${size} / ${color}`}
            </p>
            <div className="detail__buy">
              <label className="field field--qty">
                <span>Cantidad</span>
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
              </label>
              <button type="button" className="button" disabled={selectedStock === 0} onClick={onAdd}>
                Agregar al carrito
              </button>
              <button type="button" className="button button--ghost" onClick={openCart}>
                Ver carrito
              </button>
            </div>
            {message ? (
              <p className={`notice notice--${message.tone}`} role="status">
                {message.text}
              </p>
            ) : null}
          </div>
        </div>

        <section className="reviews">
          <h3>Reseñas de clientes</h3>
          {product.reviews.map((review) => (
            <article key={review.id} className="review">
              <p className="review__meta">
                <strong>{review.author}</strong> · {'★'.repeat(review.rating)}
                {'☆'.repeat(5 - review.rating)} · {review.date}
              </p>
              <p>{review.text}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
