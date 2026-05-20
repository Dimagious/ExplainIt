// Icon directions for ExplainIt!
// Brief: glyph reads as "transform / decode", not "find"
// Filled tile, brand #2563EB, must read at 16px on any background

// ----------------------------------------------------------------
// Direction A — Speech bubble with bold "!" (statement, not question)
// "Mark transformation" — peek of "?" hints at input → confident answer
// ----------------------------------------------------------------
const IconA = ({ size = 128, rounded = true }) => {
  const r = rounded ? size * 0.22 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <rect x="0" y="0" width="128" height="128" rx={r * (128/size)} fill="#2563EB" />
      {/* Ghost "?" behind, hinting input */}
      <text x="38" y="78" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="58" fill="#1D4ED8" textAnchor="middle">?</text>
      {/* Speech bubble */}
      <path
        d="M 42 30
           L 102 30
           Q 114 30 114 42
           L 114 78
           Q 114 90 102 90
           L 78 90
           L 64 104
           L 66 90
           L 42 90
           Q 30 90 30 78
           L 30 42
           Q 30 30 42 30 Z"
        fill="#FFFFFF"
      />
      {/* Bold "!" inside bubble */}
      <rect x="68" y="44" width="10" height="28" rx="4" fill="#2563EB" />
      <circle cx="73" cy="80" r="5.5" fill="#2563EB" />
    </svg>
  );
};

// 16px-optimized version (simplified, no ghost ?)
const IconA16 = ({ size = 16, rounded = true }) => {
  const r = rounded ? size * 0.22 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }} shapeRendering="geometricPrecision">
      <rect x="0" y="0" width="16" height="16" rx={r * (16/size)} fill="#2563EB" />
      {/* Bubble */}
      <path
        d="M 4 3.2
           L 12 3.2
           Q 13.5 3.2 13.5 4.7
           L 13.5 9.4
           Q 13.5 10.9 12 10.9
           L 9.6 10.9
           L 7.7 12.8
           L 7.9 10.9
           L 4 10.9
           Q 2.5 10.9 2.5 9.4
           L 2.5 4.7
           Q 2.5 3.2 4 3.2 Z"
        fill="#FFFFFF"
      />
      <rect x="7.2" y="4.8" width="1.6" height="3.6" rx="0.6" fill="#2563EB" />
      <rect x="7.2" y="8.9" width="1.6" height="1.6" rx="0.6" fill="#2563EB" />
    </svg>
  );
};

// ----------------------------------------------------------------
// Direction B — "Aa" with highlight underline
// Reads as: text + the act of marking/explaining
// ----------------------------------------------------------------
const IconB = ({ size = 128, rounded = true }) => {
  const r = rounded ? size * 0.22 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <rect x="0" y="0" width="128" height="128" rx={r * (128/size)} fill="#2563EB" />
      {/* Highlight stripe behind text (slightly darker brand for "marker" feel) */}
      <rect x="20" y="62" width="88" height="22" rx="3" fill="#60A5FA" opacity="0.9" />
      {/* "Aa" white text, set big and tight */}
      <text
        x="64" y="84"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="800"
        fontSize="74"
        letterSpacing="-3"
        fill="#FFFFFF"
        textAnchor="middle"
      >Aa</text>
    </svg>
  );
};

const IconB16 = ({ size = 16, rounded = true }) => {
  const r = rounded ? size * 0.22 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }} shapeRendering="geometricPrecision">
      <rect x="0" y="0" width="16" height="16" rx={r * (16/size)} fill="#2563EB" />
      <rect x="2.2" y="8.4" width="11.6" height="3.2" rx="0.4" fill="#60A5FA" />
      <text x="8" y="11.7" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="10.5" letterSpacing="-0.4" fill="#FFFFFF" textAnchor="middle">Aa</text>
    </svg>
  );
};

// ----------------------------------------------------------------
// Direction C — Text block with highlighted selection stripe
// 3 text lines, middle one is "selected" — the moment of selection
// ----------------------------------------------------------------
const IconC = ({ size = 128, rounded = true }) => {
  const r = rounded ? size * 0.22 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <rect x="0" y="0" width="128" height="128" rx={r * (128/size)} fill="#2563EB" />
      {/* Top text line */}
      <rect x="24" y="34" width="80" height="9" rx="2" fill="#FFFFFF" opacity="0.55" />
      <rect x="24" y="49" width="56" height="9" rx="2" fill="#FFFFFF" opacity="0.55" />
      {/* Highlighted selected line — bright tab */}
      <rect x="20" y="68" width="88" height="20" rx="4" fill="#FBBF24" />
      <rect x="26" y="74" width="64" height="8" rx="2" fill="#1E3A8A" />
      {/* Bottom text lines */}
      <rect x="24" y="96" width="72" height="9" rx="2" fill="#FFFFFF" opacity="0.55" />
    </svg>
  );
};

const IconC16 = ({ size = 16, rounded = true }) => {
  const r = rounded ? size * 0.22 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }} shapeRendering="geometricPrecision">
      <rect x="0" y="0" width="16" height="16" rx={r * (16/size)} fill="#2563EB" />
      <rect x="3" y="3.6" width="10" height="1.6" rx="0.4" fill="#FFFFFF" opacity="0.6" />
      <rect x="2.4" y="6.8" width="11.2" height="2.8" rx="0.5" fill="#FBBF24" />
      <rect x="3" y="11.2" width="9" height="1.6" rx="0.4" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
};

// ----------------------------------------------------------------
// Old icon (for comparison) — generic magnifier
// ----------------------------------------------------------------
const OldIcon = ({ size = 128 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
    <rect x="0" y="0" width="24" height="24" fill="#FFFFFF" />
    <circle cx="11" cy="11" r="6.5" fill="none" stroke="#5F6368" strokeWidth="1.6" />
    <line x1="15.8" y1="15.8" x2="20" y2="20" stroke="#5F6368" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M 17 4 L 18 6.5 L 20.5 7.5 L 18 8.5 L 17 11 L 16 8.5 L 13.5 7.5 L 16 6.5 Z" fill="#5F6368" />
  </svg>
);

// Helper: a row showing one icon at 128, 48, 16
const IconSizeStrip = ({ Big, Sixteen, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 28, justifyContent: 'center', marginTop: 24 }}>
    <div style={{ textAlign: 'center' }}>
      <Big size={128} />
      <div style={iconLabelStyle}>128</div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <Big size={48} />
      <div style={iconLabelStyle}>48</div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <Sixteen size={32} />
      <div style={iconLabelStyle}>16 @2×</div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <Sixteen size={16} />
      <div style={iconLabelStyle}>16</div>
    </div>
  </div>
);

const iconLabelStyle = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  color: '#94A3B8',
  marginTop: 6,
  letterSpacing: 0.4,
};

// Chrome toolbar mock — shows icon at actual 16px on real backgrounds
const ChromeToolbarMock = ({ Icon16, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const bg = isDark ? '#202124' : '#DEE1E6';
  const ring = isDark ? '#3C4043' : '#FFFFFF';
  return (
    <div style={{
      background: bg,
      borderRadius: 8,
      padding: '8px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: 'fit-content',
    }}>
      {/* Other extension icons (placeholder gray squares) */}
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 16, height: 16, borderRadius: 3,
          background: isDark ? '#3C4043' : '#B8BCC2',
          opacity: 0.7,
        }} />
      ))}
      {/* Our icon inside the active highlight ring */}
      <div style={{
        background: ring,
        borderRadius: 6,
        padding: 4,
        boxShadow: isDark ? '0 0 0 1px #5F6368' : '0 0 0 1px #C8CCD2',
        display: 'flex',
      }}>
        <Icon16 size={16} />
      </div>
      {/* Profile circle */}
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: isDark ? '#5F6368' : '#9AA0A6',
        marginLeft: 4,
      }} />
    </div>
  );
};

// ============================================================
// ICON EXPLORATION ARTBOARDS
// ============================================================

const IconDirectionCard = ({ title, blurb, Big, Sixteen }) => (
  <div style={{
    width: '100%', height: '100%',
    background: '#FFFFFF',
    padding: '36px 32px',
    display: 'flex', flexDirection: 'column',
    fontFamily: 'Inter, system-ui, sans-serif',
  }}>
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2563EB', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
        Direction
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#64748B', marginTop: 6, lineHeight: 1.5, maxWidth: 440 }}>{blurb}</div>
    </div>

    {/* Hero size */}
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
      <Big size={180} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Big size={64} />
        <Big size={48} />
        <Sixteen size={32} />
        <Sixteen size={16} />
      </div>
    </div>

    {/* Toolbar contexts */}
    <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' }}>
      <ChromeToolbarMock Icon16={Sixteen} theme="light" />
      <ChromeToolbarMock Icon16={Sixteen} theme="dark" />
    </div>
  </div>
);

const IconCompareCard = () => (
  <div style={{
    width: '100%', height: '100%',
    background: '#FFFFFF',
    padding: '36px 32px',
    fontFamily: 'Inter, system-ui, sans-serif',
  }}>
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2563EB', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
      Why ditch the magnifier
    </div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginTop: 4, marginBottom: 24 }}>
      Current icon vs. proposed
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Current</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
          <OldIcon size={64} />
          <OldIcon size={32} />
          <OldIcon size={16} />
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
          <li>Reads as <b>search</b>, not explain</li>
          <li>Outline — disappears on busy backgrounds</li>
          <li>Sparkle is generic "AI" topping</li>
          <li>No brand surface</li>
        </ul>
      </div>
      <div style={{ background: '#EFF6FF', borderRadius: 12, padding: 20, border: '1px solid #DBEAFE' }}>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#2563EB', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Proposed (any direction)</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
          <IconB size={64} />
          <IconB size={32} />
          <IconB16 size={16} />
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#1E293B', lineHeight: 1.7 }}>
          <li><b>Filled tile</b> — stays visible on dark/light/photo</li>
          <li>Glyph signals <b>text → mark</b>, decode action</li>
          <li>Owns the blue — brand-recognizable</li>
          <li>Looks like a <i>tool</i>, not a search box</li>
        </ul>
      </div>
    </div>

    {/* Side-by-side toolbar */}
    <div style={{ marginTop: 28 }}>
      <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>In the Chrome toolbar, 16px</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>current</div>
          <div style={{ background: '#DEE1E6', borderRadius: 8, padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: '#B8BCC2', opacity: 0.7 }} />
            <div style={{ background: '#FFFFFF', borderRadius: 6, padding: 4, boxShadow: '0 0 0 1px #C8CCD2' }}>
              <OldIcon size={16} />
            </div>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: '#B8BCC2', opacity: 0.7 }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#2563EB', marginBottom: 4, fontWeight: 600 }}>proposed</div>
          <div style={{ background: '#DEE1E6', borderRadius: 8, padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: '#B8BCC2', opacity: 0.7 }} />
            <div style={{ background: '#FFFFFF', borderRadius: 6, padding: 4, boxShadow: '0 0 0 1px #C8CCD2' }}>
              <IconB16 size={16} />
            </div>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: '#B8BCC2', opacity: 0.7 }} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, {
  IconA, IconA16, IconB, IconB16, IconC, IconC16, OldIcon,
  IconDirectionCard, IconCompareCard, ChromeToolbarMock,
});
