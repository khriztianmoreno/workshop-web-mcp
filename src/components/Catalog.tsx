import { useMemo } from 'react';
import { CATEGORIES, CATEGORY_LABELS, CERTIFICATIONS, ALL_SIZES, type Category, type Certification } from '../data/types';
import type { Product } from '../data/types';
import { resetFilters, selectProduct, setFilters } from '../store/actions';
import { formatCop, isInStock, searchProducts, sizesInStock } from '../store/selectors';
import { useStore } from '../store/store';
import { AgentGlow } from './AgentGlow';

const PRICE_OPTIONS = [200000, 500000, 800000, 1200000, 1500000];

export function ProductArt({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <div className={`art${large ? ' art--large' : ''}`} style={{ ['--hue' as string]: product.art.hue }} aria-hidden="true">
      <span>{product.art.emoji}</span>
    </div>
  );
}

export function CertificationBadges({ product }: { product: Product }) {
  if (product.certifications.length === 0) {
    return <span className="cert cert--none">Sin certificación</span>;
  }
  return (
    <>
      {product.certifications.map((cert) => (
        <span key={cert} className="cert">
          {cert}
        </span>
      ))}
    </>
  );
}

export function FiltersBar() {
  const filters = useStore((s) => s.filters);
  return (
    <AgentGlow target="filters" as="section" className="filters">
      <h2 className="sr-only">Filtros</h2>
      <label className="field field--grow">
        <span>Buscar</span>
        <input
          type="search"
          value={filters.query}
          placeholder="Casco integral, guantes de pista…"
          onChange={(e) => setFilters({ query: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Categoría</span>
        <select value={filters.category ?? ''} onChange={(e) => setFilters({ category: (e.target.value || null) as Category | null })}>
          <option value="">Todas</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Certificación</span>
        <select
          value={filters.certification ?? ''}
          onChange={(e) => setFilters({ certification: (e.target.value || null) as Certification | null })}
        >
          <option value="">Cualquiera</option>
          {CERTIFICATIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Precio máximo</span>
        <select value={filters.maxPrice ?? ''} onChange={(e) => setFilters({ maxPrice: e.target.value ? Number(e.target.value) : null })}>
          <option value="">Sin límite</option>
          {PRICE_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {formatCop(p)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Talla disponible</span>
        <select value={filters.size ?? ''} onChange={(e) => setFilters({ size: e.target.value || null })}>
          <option value="">Todas</option>
          {ALL_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="field field--check">
        <input type="checkbox" checked={filters.inStockOnly} onChange={(e) => setFilters({ inStockOnly: e.target.checked })} />
        <span>Solo en stock</span>
      </label>
      <button type="button" className="button button--ghost" onClick={resetFilters}>
        Limpiar
      </button>
    </AgentGlow>
  );
}

function ProductCard({ product }: { product: Product }) {
  const inStock = isInStock(product);
  const sizes = sizesInStock(product);
  return (
    <AgentGlow target={`product:${product.id}`} as="article" className={`card${inStock ? '' : ' card--soldout'}`}>
      <button type="button" className="card__hit" onClick={() => selectProduct(product.id)} aria-label={`Ver ${product.name}`}>
        <ProductArt product={product} />
        <div className="card__body">
          <p className="card__brand">
            {product.brand} · {CATEGORY_LABELS[product.category]}
            {product.popular ? <span className="pill">Popular</span> : null}
          </p>
          <h3 className="card__title">{product.name}</h3>
          <div className="card__certs">
            <CertificationBadges product={product} />
          </div>
          <p className="card__price">{formatCop(product.price)}</p>
          <p className={`card__stock${inStock ? '' : ' card__stock--out'}`}>
            {inStock ? `Tallas: ${sizes.join(', ')}` : 'Agotado'}
          </p>
        </div>
      </button>
    </AgentGlow>
  );
}

export function ProductGrid() {
  const filters = useStore((s) => s.filters);
  const products = useMemo(() => searchProducts(filters), [filters]);
  return (
    <AgentGlow target="catalog" as="section" className="catalog">
      <p className="catalog__count" aria-live="polite">
        {products.length} producto{products.length === 1 ? '' : 's'}
      </p>
      {products.length === 0 ? (
        <p className="empty">No hay productos con esos filtros.</p>
      ) : (
        <div className="grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </AgentGlow>
  );
}
