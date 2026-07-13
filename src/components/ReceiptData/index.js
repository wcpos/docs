import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * Shared inline formatter for prop strings coming from MDX:
 * `code` spans and ~struck~ text.
 */
function rich(text) {
  if (typeof text !== 'string') return text;
  return text.split(/`([^`]+)`/g).map((part, i) => {
    if (i % 2 === 1) return <code key={i}>{part}</code>;
    return part.split(/~([^~]+)~/g).map((sub, j) =>
      j % 2 === 1 ? <s key={`${i}-${j}`}>{sub}</s> : sub
    );
  });
}

/* -------------------------------------------------------------------------
 * ReceiptAnatomy — a printed sample receipt that indexes the reference.
 * Hovering a zone highlights its data section (and vice-versa); clicking
 * jumps to the section anchor.
 * ---------------------------------------------------------------------- */

export function ReceiptAnatomy({ zones }) {
  const [hot, setHot] = useState(null);

  const zone = (id) => {
    const meta = zones.find((z) => z.id === id);
    if (!meta && process.env.NODE_ENV !== 'production') {
      console.warn(`ReceiptAnatomy: no zone config for "${id}" — pass it in the zones prop.`);
    }
    return {
      className: clsx(styles.zone, hot === id && styles.hot),
      href: (meta && meta.anchor) || '#receipt-map',
      onMouseEnter: () => setHot(id),
      onMouseLeave: () => setHot(null),
      onFocus: () => setHot(id),
      onBlur: () => setHot(null),
    };
  };

  return (
    <div className={styles.anatomy}>
      <div className={styles.receipt}>
        <a {...zone('store')}>
          <div className={clsx(styles.rCenter, styles.rBold, styles.rStore)}>COFFEE MONSTER</div>
          <div className={clsx(styles.rCenter, styles.rSub)}>12 Roast Lane, Portland OR</div>
          <div className={clsx(styles.rCenter, styles.rSub)}>VAT: US-998877</div>
        </a>
        <hr className={styles.rRule} />
        <a {...zone('order')}>
          <div className={styles.rRow}><span>Receipt #1042</span><span>Jul 13, 2026</span></div>
          <div className={clsx(styles.rRow, styles.rSub)}><span>Cashier: Ada</span><span>Customer: Nia</span></div>
        </a>
        <hr className={styles.rRule} />
        <a {...zone('lines')}>
          <div className={styles.rRow}><span>2 × Espresso Beans</span><span>29.00</span></div>
          <div className={clsx(styles.rRow, styles.rSub)}><span><s>34.00</s> · Savings −5.00</span><span /></div>
          <div className={styles.rRow}><span>1 × Ceramic Mug</span><span>18.00</span></div>
          <div className={styles.rRow}><span>1 × Croissant</span><span>5.75</span></div>
        </a>
        <hr className={styles.rRule} />
        <a {...zone('totals')}>
          <div className={styles.rRow}><span>Subtotal</span><span>52.75</span></div>
          <div className={styles.rRow}><span>Coupon SUMMER10</span><span>−5.28</span></div>
          <div className={styles.rRow}><span>Gift wrap</span><span>2.50</span></div>
          <div className={styles.rRow}><span>Shipping</span><span>10.00</span></div>
          <div className={clsx(styles.rRow, styles.rBold)}><span>TOTAL</span><span>59.97</span></div>
          <div className={clsx(styles.rRow, styles.rSub)}><span>Total saved</span><span>10.28</span></div>
        </a>
        <hr className={styles.rRule} />
        <a {...zone('payments')}>
          <div className={styles.rRow}><span>Card</span><span>59.97</span></div>
        </a>
        <hr className={styles.rRule} />
        <a {...zone('footer')}>
          <div className={clsx(styles.rCenter, styles.rSub)}>Thank you for your purchase!</div>
        </a>
      </div>

      <div className={styles.legend}>
        {zones.map((z) => (
          <a
            key={z.id}
            href={z.anchor}
            className={clsx(styles.legendItem, hot === z.id && styles.hot)}
            onMouseEnter={() => setHot(z.id)}
            onMouseLeave={() => setHot(null)}
            onFocus={() => setHot(z.id)}
            onBlur={() => setHot(null)}
          >
            <div className={styles.legendName}>{z.label}</div>
            <div className={styles.legendPaths}>
              {z.fields.map((f, i) => (
                <React.Fragment key={f}>
                  {i > 0 && ' · '}
                  <code>{f}</code>
                </React.Fragment>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * PriceFlow — one line item's money as a single segmented bar, with every
 * field name as a label on a visible amount.
 * ---------------------------------------------------------------------- */

export function PriceFlow({ caption, scaleLabel, segments, keys, summary }) {
  const total = segments.reduce((sum, seg) => sum + seg.amount, 0);
  return (
    <div className={styles.flow}>
      {caption && <div className={styles.flowCaption}>{caption}</div>}
      <div
        className={styles.flowBar}
        role="img"
        aria-label={segments
          .map((seg) => {
            const key = keys.find((k) => k.kind === seg.kind);
            return key ? `${key.title}: ${seg.label}` : seg.label;
          })
          .join(', ')}
      >
        {segments.map((seg) => (
          <div
            key={seg.kind + seg.label}
            className={clsx(styles.flowSeg, styles[`k_${seg.kind}`])}
            style={{ flexGrow: (seg.amount / total) * 1000 }}
          >
            {seg.label}
          </div>
        ))}
      </div>
      {scaleLabel && (
        <div className={styles.flowScale}><span>0</span><span>{scaleLabel}</span></div>
      )}
      <div className={styles.flowKeys}>
        {keys.map((k) => (
          <div key={k.kind} className={styles.flowKey}>
            <span className={clsx(styles.swatch, styles[`k_${k.kind}`])} />
            <div>
              {k.title}
              <code className={styles.flowKeyFields}>{k.fields}</code>
            </div>
          </div>
        ))}
      </div>
      {summary && summary.length > 0 && (
        <div className={styles.flowSummary}>
          {summary.map((row) => (
            <div key={row.value} className={styles.flowSummaryRow}>
              <span>{rich(row.label)}</span>
              <strong>{rich(row.value)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * FieldIndex — filterable field rows. The left side is what a field means;
 * the right side shows what it holds in the sample order, including the
 * formatted `_display` twin for money fields.
 * ---------------------------------------------------------------------- */

const BADGE_LABELS = {
  money: 'money',
  nullable: 'nullable',
  variants: 'incl/excl',
};

export function FieldIndex({ note, placeholder, emptyText, fields }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const shown = useMemo(
    () =>
      fields.filter((f) => {
        if (!q) return true;
        const hay = [
          f.name,
          f.type,
          f.desc,
          ...(f.badges || []).flatMap((b) => [b, BADGE_LABELS[b] || '']),
          ...(f.sample || []).map((kv) => kv.k),
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      }),
    [fields, q]
  );

  return (
    <div className={styles.fieldIndex}>
      {note && <p className={styles.note}>{rich(note)}</p>}
      <input
        type="search"
        className={styles.filter}
        placeholder={placeholder}
        aria-label={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div>
        {shown.map((f) => (
          <div key={f.name} className={styles.frow}>
            <div>
              <span className={styles.fname}>{f.name}</span>
              <span className={styles.badges}>
                <span className={styles.badge}>{f.type}</span>
                {(f.badges || []).map((b) => (
                  <span key={b} className={clsx(styles.badge, styles[`b_${b}`])}>{BADGE_LABELS[b] || b}</span>
                ))}
              </span>
              <div className={styles.fdesc}>{rich(f.desc)}</div>
            </div>
            {f.sample && f.sample.length > 0 ? (
              <div className={styles.sample}>
                {f.sample.map((kv) => (
                  <div key={kv.k} className={styles.kv}>
                    <span className={styles.k}>{rich(kv.k)}</span>
                    <span className={clsx(styles.v, kv.str && styles.vStr)}>{kv.v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={clsx(styles.sample, styles.sampleEmpty)}>—</div>
            )}
          </div>
        ))}
      </div>
      {shown.length === 0 && <div className={styles.noResults}>{rich(emptyText)}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Recipes / Recipe — copy-ready tasks, rendered result first.
 * ---------------------------------------------------------------------- */

export function Recipes({ children }) {
  return <div className={styles.recipes}>{children}</div>;
}

export function Recipe({ title, why, snippet, preview }) {
  return (
    <div className={styles.recipe}>
      <div className={styles.recipeOut}>
        {preview.map((line, i) => (
          <div
            key={i}
            className={clsx(styles.rRow, line.bold && styles.rBold, line.sub && styles.rSub)}
          >
            <span>{rich(line.left)}</span>
            {line.right != null && <span>{rich(line.right)}</span>}
          </div>
        ))}
      </div>
      <div className={styles.recipeBody}>
        <div className={styles.recipeTitle}>{title}</div>
        <pre className={styles.recipeCode}><code>{snippet}</code></pre>
        <div className={styles.recipeWhy}>{rich(why)}</div>
      </div>
    </div>
  );
}
