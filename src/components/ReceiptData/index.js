import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { translate } from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { fieldMatches, suggestTerms, typeLabel } from './fieldIndexSearch';
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

function zoneLabels() {
  return {
    store: translate({
      id: 'receiptData.zone.store',
      message: 'Store header',
      description: 'Receipt data page: legend name of a receipt zone',
    }),
    order: translate({
      id: 'receiptData.zone.order',
      message: 'Order & people',
      description: 'Receipt data page: legend name of a receipt zone',
    }),
    lines: translate({
      id: 'receiptData.zone.lines',
      message: 'Line items',
      description: 'Receipt data page: legend name of a receipt zone',
    }),
    totals: translate({
      id: 'receiptData.zone.totals',
      message: 'Totals block',
      description: 'Receipt data page: legend name of a receipt zone',
    }),
    payments: translate({
      id: 'receiptData.zone.payments',
      message: 'Payments',
      description: 'Receipt data page: legend name of a receipt zone',
    }),
    footer: translate({
      id: 'receiptData.zone.footer',
      message: 'Footer',
      description: 'Receipt data page: legend name of a receipt zone',
    }),
  };
}

export function ReceiptAnatomy({ zones, facsimile }) {
  const [hot, setHot] = useState(null);
  const labels = zoneLabels();

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
        {facsimile.map((section, sectionIndex) => (
          <React.Fragment key={section.id}>
            <a {...zone(section.id)}>
              {section.rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={clsx(
                    row.center ? styles.rCenter : styles.rRow,
                    row.bold && styles.rBold,
                    row.store && styles.rStore,
                    row.sub && styles.rSub
                  )}
                >
                  <span>{rich(row.left)}</span>
                  {row.right != null && <span>{rich(row.right)}</span>}
                </div>
              ))}
            </a>
            {sectionIndex < facsimile.length - 1 && <hr className={styles.rRule} />}
          </React.Fragment>
        ))}
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
            <div className={styles.legendName}>{labels[z.id] ?? z.label}</div>
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

function priceKeys() {
  return [
    {
      kind: 'paid',
      title: translate({
        id: 'receiptData.priceKey.paid',
        message: 'What the customer pays',
        description: 'Receipt data page: name of a price segment in the sample order',
      }),
      fields: 'unit_price → 13.05 · line_total → 26.10',
    },
    {
      kind: 'coupon',
      title: translate({
        id: 'receiptData.priceKey.coupon',
        message: 'Coupon discount (SUMMER10)',
        description: 'Receipt data page: name of a price segment in the sample order',
      }),
      fields: translate({
        id: 'receiptData.priceKey.coupon.fields',
        message: 'lines[].discounts → 2.90 on this line',
        description: 'Receipt data page: field path and amount; keep lines[].discounts unchanged',
      }),
    },
    {
      kind: 'savings',
      title: translate({
        id: 'receiptData.priceKey.savings',
        message: 'Savings vs regular price',
        description: 'Receipt data page: name of a price segment in the sample order',
      }),
      fields: 'unit_savings → 2.50 · line_savings → 5.00',
    },
  ];
}

export function PriceFlow({ caption, scaleLabel, segments, summary }) {
  const keys = priceKeys();
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

function fieldIndexLabels() {
  return {
    types: {
      string: translate({ id: 'receiptData.fieldIndex.type.string', message: 'string',
        description: 'Receipt data page: field type chip',
      }),
      number: translate({ id: 'receiptData.fieldIndex.type.number', message: 'number',
        description: 'Receipt data page: field type chip',
      }),
      boolean: translate({ id: 'receiptData.fieldIndex.type.boolean', message: 'boolean',
        description: 'Receipt data page: field type chip',
      }),
      array: translate({ id: 'receiptData.fieldIndex.type.array', message: 'array',
        description: 'Receipt data page: field type chip',
      }),
      object: translate({ id: 'receiptData.fieldIndex.type.object', message: 'object',
        description: 'Receipt data page: field type chip',
      }),
      null: translate({ id: 'receiptData.fieldIndex.type.null', message: 'null',
        description: 'Receipt data page: field type chip',
      }),
    },
    badges: {
      money: translate({ id: 'receiptData.fieldIndex.badge.money', message: 'money',
        description: 'Receipt data page: field badge chip',
      }),
      nullable: translate({ id: 'receiptData.fieldIndex.badge.nullable', message: 'nullable',
        description: 'Receipt data page: field badge chip',
      }),
      variants: translate({ id: 'receiptData.fieldIndex.badge.variants', message: 'incl/excl',
        description: 'Receipt data page: field badge chip',
      }),
    },
    filter: translate({ id: 'receiptData.fieldIndex.filter', message: 'Filter fields…',
      description: 'Receipt data page: field filter label and placeholder without suggestions',
    }),
    suggestion: (term) => translate({ id: 'receiptData.fieldIndex.suggestion', message: '“{term}”',
      description: 'Receipt data page: quoted search suggestion in the field filter placeholder',
    }, { term }),
    placeholder: (terms) => translate({ id: 'receiptData.fieldIndex.placeholder', message: 'Filter fields… try {terms}',
      description: 'Receipt data page: field filter placeholder with search suggestions',
    }, { terms }),
  };
}

export function FieldIndex({ note, emptyText, fields }) {
  const [query, setQuery] = useState('');
  const labels = fieldIndexLabels();
  const locale = useDocusaurusContext().i18n.currentLocale;
  const suggestions = useMemo(() => suggestTerms(fields, locale), [fields, locale]);
  const placeholder = suggestions.length
    ? labels.placeholder(suggestions.map((term) => labels.suggestion(term)).join(', '))
    : labels.filter;
  const shown = fields.filter((f) => fieldMatches(f, query, labels));

  return (
    <div className={styles.fieldIndex}>
      {note && <p className={styles.note}>{rich(note)}</p>}
      <input
        type="search"
        className={styles.filter}
        placeholder={placeholder}
        aria-label={labels.filter}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div>
        {shown.map((f) => (
          <div key={f.name} className={styles.frow}>
            <div>
              <span className={styles.fname}>{f.name}</span>
              <span className={styles.badges}>
                <span className={styles.badge}>{typeLabel(f.type, labels)}</span>
                {(f.badges || []).map((b) => (
                  <span key={b} className={clsx(styles.badge, styles[`b_${b}`])}>{labels.badges[b] || b}</span>
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
