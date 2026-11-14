'use client';

/**
 * <LensRipple>: refracting "glass ripple" over a plain logo.
 *
 *   <LensRipple className="hero" strength={40}>
 *     <MyLogo />            // ordinary JSX: text, <svg>, <img>
 *   </LensRipple>
 *
 * The children render normally (so they're accessible and SSR-friendly). On the
 * client, the component copies them (in full colour) into a texture, draws
 * them through a WebGL2 shader, and fades the real children to opacity 0.
 * Without WebGL2 the children simply stay visible.
 *
 * Colours come from CSS custom properties on the component (or any ancestor):
 *   --lens-light  glass highlights (default white)
 *   --lens-shade  glass shading and edge lines (default dark grey)
 *   --lens-ink    logo colour, only used with the `monochrome` prop
 *
 * The canvas is transparent: whatever is behind the component shows through,
 * and the glass rings are drawn as translucent highlights and shading over it.
 * Content behind the component is not refracted, only the logo is.
 *
 * Cross-origin <img> logos need CORS headers (Access-Control-Allow-Origin),
 * otherwise the browser won't let WebGL read their pixels and they're skipped.
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

export interface LensRippleOptions {
  /** Rings alive at once, 1–8. */
  rings?: number;
  /** Max refraction offset in CSS px. */
  strength?: number;
  /** Rim thickness in CSS px. */
  width?: number;
  /** Ring cycles per second. */
  speed?: number;
  /**
   * How each ring's radius grows over its life, as CSS cubic-bezier control
   * points [x1, y1, x2, y2]. Default is cubic-bezier(.17,.67,.41,.99): a fast
   * burst out of the centre that settles as it reaches the edges.
   */
  easing?: readonly [number, number, number, number];
  /** Chromatic split. 0 = none, ~0.06 = noticeable. */
  aberration?: number;
  /**
   * Coloured glow from the chromatic split: a soft spectral bloom along the
   * refracted edges. 0 = off, 1 = default, up to ~3.
   */
  glow?: number;
  /** How far the colours fan out, as a multiple of `aberration`. Default 8. */
  glowSpread?: number;
  /** Softness of the glow as a Gaussian blur radius in CSS px. 0 = crisp, default 6. */
  glowBlur?: number;
  /** Lens drifts toward the pointer while hovering. */
  followPointer?: boolean;
  /** Ignore the logo's own colours and paint it in --lens-ink. */
  monochrome?: boolean;
  /**
   * How visible the glass itself is (highlights, shading, edge lines) over the
   * transparent area. 0 = only the warped logo, 1 = default, up to ~2.
   */
  glass?: number;
}

export interface LensRippleProps extends LensRippleOptions {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Called once with whether the WebGL effect is running. */
  onReady?: (supported: boolean) => void;
}

const DEFAULTS: Required<LensRippleOptions> = {
  rings: 3,
  strength: 38,
  width: 26,
  speed: 0.12,
  easing: [0.17, 0.67, 0.41, 0.99],
  aberration: 0.035,
  glow: 1,
  glowSpread: 8,
  glowBlur: 6,
  followPointer: true,
  monochrome: false,
  glass: 1,
};

export function LensRipple({
  children,
  className,
  style,
  onReady,
  ...options
}: LensRippleProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<LensEngine | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const [live, setLive] = useState(false);

  // Latest options, read when the engine is created so it starts with them.
  const opts: Required<LensRippleOptions> = { ...DEFAULTS, ...stripUndefined(options) };
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Create the engine once per mount (StrictMode-safe: cleanup tears it all down).
  useEffect(() => {
    const stage = stageRef.current;
    const host = canvasHostRef.current;
    const logo = logoRef.current;
    if (!stage || !host || !logo) return;

    const engine = LensEngine.create(stage, host, logo, optsRef.current, () => {
      setLive(true);
      onReadyRef.current?.(true);
    });
    if (!engine) {
      onReadyRef.current?.(false);
      return;
    }
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
      setLive(false);
    };
  }, []);

  // Push option changes into the running engine without recreating WebGL.
  useEffect(() => {
    engineRef.current?.set(opts);
  }, [
    opts.rings, opts.strength, opts.width, opts.speed, opts.easing.join(','),
    opts.aberration, opts.glow, opts.glowSpread, opts.glowBlur,
    opts.followPointer, opts.monochrome, opts.glass,
  ]);

  return (
    <div
      ref={stageRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        ...style,
      }}
    >
      {/* React never renders into this; the engine puts its <canvas> here. */}
      <div
        ref={canvasHostRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />
      <div
        ref={logoRef}
        style={{
          position: 'relative',
          zIndex: 1,
          color: 'var(--lens-ink, #000)',
          opacity: live ? 0 : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default LensRipple;

function stripUndefined<T extends object>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k in o) if (o[k] !== undefined) out[k] = o[k];
  return out;
}

// -----------------------------------------------------------------------------
// Shader
// -----------------------------------------------------------------------------

const MAX_RINGS = 8;
const MAX_BLUR_TAPS = 96; // blur radius cap in device px (sigma up to 32)

const VERT = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

// One pass of a separable Gaussian blur. Run twice (horizontal, vertical).
// Only used when the logo is redrawn or glowBlur changes, never per frame.
const BLUR_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform vec2  uTexel;   // 1 / texture size
uniform vec2  uDir;     // (1, 0) or (0, 1)
uniform float uSigma;   // device px
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy * uTexel;
  if (uSigma < 0.5) { outColor = texture(uSrc, uv); return; }
  int r = int(ceil(uSigma * 3.0));
  vec4 acc = vec4(0.0);
  float sum = 0.0;
  for (int i = -${MAX_BLUR_TAPS}; i <= ${MAX_BLUR_TAPS}; i++) {
    if (i < -r || i > r) continue;
    float w = exp(-float(i * i) / (2.0 * uSigma * uSigma));
    acc += texture(uSrc, uv + uDir * uTexel * float(i)) * w;
    sum += w;
  }
  outColor = acc / sum;
}`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uLogo;  // premultiplied RGBA copy of the logo
uniform sampler2D uGlowTex; // Gaussian-blurred copy, used only for the glow
uniform vec2  uRes;       // device px
uniform vec2  uCenter;    // device px, GL coords (y up)
uniform float uTime;
uniform float uDpr;
uniform int   uRings;
uniform float uStrength;
uniform float uWidth;
uniform float uSpeed;
uniform vec4  uEase;      // cubic-bezier x1, y1, x2, y2
uniform float uAberration;
uniform float uGlow;
uniform float uGlowSpread;
uniform float uMaxR;
uniform float uGlass;
uniform vec3  uInk;
uniform float uMono;
uniform vec3  uLight;
uniform vec3  uShade;

out vec4 outColor;

const int MAX_RINGS = ${MAX_RINGS};

const int GLOW_SAMPLES = 16;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
// Interleaved gradient noise: even, high-frequency, no visible clumps.
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

// One axis of a CSS cubic-bezier (P0 = 0, P3 = 1) and its derivative.
float bez(float t, float a, float b) {
  float u = 1.0 - t;
  return 3.0 * u * u * t * a + 3.0 * u * t * t * b + t * t * t;
}
float bezSlope(float t, float a, float b) {
  float u = 1.0 - t;
  return 3.0 * u * u * a + 6.0 * u * t * (b - a) + 3.0 * t * t * (1.0 - b);
}
// CSS cubic-bezier(x1, y1, x2, y2) evaluated at progress x: solve x(t) = x with
// Newton's method (falling back to bisection steps), then return y(t).
float cubicBezier(float x, vec4 c) {
  float t = x, lo = 0.0, hi = 1.0;
  for (int i = 0; i < 8; i++) {
    float err = bez(t, c.x, c.z) - x;
    if (abs(err) < 1e-5) break;
    if (err > 0.0) hi = t; else lo = t;
    float slope = bezSlope(t, c.x, c.z);
    float next = t - err / slope;
    t = (abs(slope) > 1e-6 && next > lo && next < hi) ? next : 0.5 * (lo + hi);
  }
  return bez(t, c.y, c.w);
}

// Smooth spectrum for the glow: k = -1 red … 0 green … +1 blue.
vec3 spectrum(float k) {
  float x = (k * 0.5 + 0.5) * 0.7;
  return clamp(vec3(abs(x * 6.0 - 3.0) - 1.0, 2.0 - abs(x * 6.0 - 2.0), 2.0 - abs(x * 6.0 - 4.0)), 0.0, 1.0);
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 v = p - uCenter;
  float d = length(v);
  vec2 dir = d > 0.0001 ? v / d : vec2(0.0);
  vec2 L = normalize(vec2(-0.55, 0.85));     // light from the top-left

  float offset = 0.0;   // radial sample shift in device px
  float hi = 0.0, sh = 0.0, line = 0.0;
  float w0 = uWidth * uDpr;
  float s0 = uStrength * uDpr;

  // Expanding rims: gaussian bumps whose slope bends the sample position
  for (int i = 0; i < MAX_RINGS; i++) {
    if (i >= uRings) break;
    float phase = fract(uTime * uSpeed + float(i) / float(uRings));  // linear time
    float travel = cubicBezier(phase, uEase);                         // eased distance
    float R = travel * uMaxR;
    float w = w0 * (0.55 + 0.9 * travel);   // rims thicken as they travel
    float life = smoothstep(0.0, 0.12, phase) * pow(1.0 - phase, 1.3);

    float x = (d - R) / w;
    float g = exp(-x * x);
    float slope = -2.0 * x * g;
    offset += slope * s0 * life;

    vec2 n = -dir * slope;
    hi += life * max(dot(n, L), 0.0);
    sh += life * max(dot(n, -L), 0.0);

    float edge = (d - (R + w * 1.7)) / (0.7 * uDpr);
    line += life * exp(-edge * edge);
  }

  // Sample the logo three times, slightly apart, and take one channel from each
  // for the colour split. Everything below stays in premultiplied alpha, which
  // is what the canvas hands to the page compositor.
  vec2 disp = dir * offset;
  vec4 sR = texture(uLogo, (p + disp * (1.0 + uAberration)) / uRes);
  vec4 sG = texture(uLogo, (p + disp) / uRes);
  vec4 sB = texture(uLogo, (p + disp * (1.0 - uAberration)) / uRes);
  vec3 alpha = vec3(sR.a, sG.a, sB.a);
  vec3 logo = mix(vec3(sR.r, sG.g, sB.b), uInk * alpha, uMono);

  // The logo layer, over a fully transparent backdrop.
  vec4 col = vec4(logo, max(alpha.r, max(alpha.g, alpha.b)));

  // Chromatic glow: smear the logo's coverage along the refraction direction,
  // tinting each sample by its place in the spectrum. Where nothing is bent
  // every sample agrees and the result is neutral, so subtracting the neutral
  // part leaves only coloured light on the refracted edges.
  if (uGlow > 0.0 && abs(offset) > 0.05) {
    vec3 sum = vec3(0.0), weight = vec3(0.0);
    // Samples come from the pre-blurred copy, so the glow blooms smoothly
    // past the edges. A little per-pixel offset on the sample positions hides
    // any stepping between them; on blurred input it reads as smooth, not grainy.
    float jitter = ign(p) - 0.5;
    for (int i = 0; i < GLOW_SAMPLES; i++) {
      float k = (float(i) + jitter) / float(GLOW_SAMPLES - 1) * 2.0 - 1.0;
      vec3 c = spectrum(clamp(k, -1.0, 1.0));
      vec2 at = p + disp * (1.0 - k * uAberration * uGlowSpread);
      sum += c * texture(uGlowTex, at / uRes).a;
      weight += c;
    }
    vec3 dispersed = sum / max(weight, vec3(1e-4));
    float neutral = min(dispersed.r, min(dispersed.g, dispersed.b));
    // Soft, saturating response so higher glow values bloom rather than clip.
    vec3 g = (1.0 - exp(-(dispersed - neutral) * uGlow * 3.0)) * 0.85;
    float ga = max(g.r, max(g.g, g.b));
    col = col * (1.0 - ga) + vec4(g, ga);   // premultiplied "over"
  }

  // Glass layers composited "over" it: shading and edge lines, then highlights.
  // Where there's no logo these become translucent tints of the page behind.
  float s = clamp((sh * 0.14 + line * 0.18) * uGlass, 0.0, 0.6);
  col = col * (1.0 - s) + vec4(uShade * s, s);
  float h = clamp(hi * 0.32 * uGlass, 0.0, 1.0);
  col = col * (1.0 - h) + vec4(uLight * h, h);

  // Dither to hide banding, scaled by alpha so it stays valid premultiplied
  // colour and doesn't speckle the fully transparent area.
  col.rgb += (hash(p + fract(uTime)) - 0.5) / 255.0 * col.a;
  outColor = clamp(col, 0.0, 1.0);
}`;

const UNIFORMS = [
  'uLogo', 'uGlowTex', 'uRes', 'uCenter', 'uTime', 'uDpr', 'uRings', 'uStrength', 'uWidth',
  'uSpeed', 'uEase', 'uAberration', 'uGlow', 'uGlowSpread', 'uMaxR',
  'uGlass', 'uInk', 'uMono', 'uLight', 'uShade',
] as const;
type Uniform = (typeof UNIFORMS)[number];
type RGB = [number, number, number];
type Palette = Record<'ink' | 'light' | 'shade', RGB>;

// -----------------------------------------------------------------------------
// Engine (plain class, no React in here)
// -----------------------------------------------------------------------------

class LensEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly blurProgram: WebGLProgram;
  private readonly blurU: Record<'uSrc' | 'uTexel' | 'uDir' | 'uSigma', WebGLUniformLocation | null>;
  private readonly texture: WebGLTexture;      // sharp logo
  private readonly blurTmp: WebGLTexture;      // horizontal pass
  private readonly glowTexture: WebGLTexture;  // blurred logo for the glow
  private readonly fboTmp: WebGLFramebuffer;
  private readonly fboGlow: WebGLFramebuffer;
  private blurredFor = NaN;                    // glowBlur value the glow texture matches
  private readonly u = {} as Record<Uniform, WebGLUniformLocation | null>;
  private readonly opts: Required<LensRippleOptions>;
  private readonly cleanups: Array<() => void> = [];

  private dpr = 1;
  private raf = 0;
  private last = performance.now();
  private time = 0;
  private center = { x: 0, y: 0 };
  private target = { x: 0, y: 0 };
  private hovering = false;
  private palette: Palette;
  private rasterToken = 0;
  private destroyed = false;
  private readyFired = false;
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  static create(
    stage: HTMLElement,
    host: HTMLElement,
    logo: HTMLElement,
    opts: Required<LensRippleOptions>,
    onReady: () => void,
  ): LensEngine | null {
    // The canvas is created here, not by React, so a StrictMode remount gets a
    // fresh context instead of the one we just lost on cleanup.
    const canvas = document.createElement('canvas');
    // Transparent canvas; the shader outputs premultiplied colour.
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    if (!gl) return null;
    try {
      return new LensEngine(stage, host, logo, canvas, gl, opts, onReady);
    } catch (err) {
      console.error('[LensRipple]', err);
      return null;
    }
  }

  private constructor(
    private readonly stage: HTMLElement,
    host: HTMLElement,
    private readonly logo: HTMLElement,
    canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    opts: Required<LensRippleOptions>,
    private readonly onReady: () => void,
  ) {
    this.canvas = canvas;
    this.gl = gl;
    this.opts = { ...opts };

    Object.assign(canvas.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%',
      display: 'block', pointerEvents: 'none',
    });
    host.appendChild(canvas);

    this.program = linkProgram(gl, VERT, FRAG);
    for (const name of UNIFORMS) this.u[name] = gl.getUniformLocation(this.program, name);
    this.blurProgram = linkProgram(gl, VERT, BLUR_FRAG);
    this.blurU = {
      uSrc: gl.getUniformLocation(this.blurProgram, 'uSrc'),
      uTexel: gl.getUniformLocation(this.blurProgram, 'uTexel'),
      uDir: gl.getUniformLocation(this.blurProgram, 'uDir'),
      uSigma: gl.getUniformLocation(this.blurProgram, 'uSigma'),
    };

    // Fullscreen triangle, shared by both programs (aPos is location 0 in each).
    gl.bindVertexArray(gl.createVertexArray());
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.texture = makeTexture(gl);
    this.blurTmp = makeTexture(gl);
    this.glowTexture = makeTexture(gl);
    this.fboTmp = makeFramebuffer(gl, this.blurTmp);
    this.fboGlow = makeFramebuffer(gl, this.glowTexture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // Premultiply on upload so filtering and blurring don't leave dark fringes
    // around anti-aliased, coloured edges.
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    gl.useProgram(this.program);
    gl.uniform1i(this.u.uLogo, 0);
    gl.uniform1i(this.u.uGlowTex, 1);

    this.palette = readPalette(stage);

    // Theme changes: OS scheme or a data-theme / class toggle on <html>.
    const scheme = matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => {
      this.palette = readPalette(stage);
      void this.rasterize(); // the logo's own colours may be theme-dependent too
    };
    scheme.addEventListener('change', onScheme);
    const themeObserver = new MutationObserver(onScheme);
    const themeAttrs = { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] };
    themeObserver.observe(document.documentElement, themeAttrs);
    themeObserver.observe(stage, themeAttrs); // --lens-* set via className/style props

    // Re-rasterise when the stage resizes, the logo's content changes, or fonts load.
    const resizeObserver = new ResizeObserver(() => void this.resize());
    resizeObserver.observe(stage);
    const contentObserver = new MutationObserver(() => void this.rasterize());
    contentObserver.observe(logo, {
      childList: true, subtree: true, characterData: true, attributes: true,
      attributeFilter: ['class', 'style', 'd', 'src', 'viewBox'],
    });
    const onFonts = () => void this.rasterize();
    document.fonts.addEventListener('loadingdone', onFonts);

    stage.addEventListener('pointermove', this.onPointer);
    stage.addEventListener('pointerleave', this.onLeave);

    this.cleanups.push(
      () => scheme.removeEventListener('change', onScheme),
      () => themeObserver.disconnect(),
      () => resizeObserver.disconnect(),
      () => contentObserver.disconnect(),
      () => document.fonts.removeEventListener('loadingdone', onFonts),
      () => stage.removeEventListener('pointermove', this.onPointer),
      () => stage.removeEventListener('pointerleave', this.onLeave),
    );

    void document.fonts.ready.then(() => this.resize());
    this.raf = requestAnimationFrame(this.loop);
  }

  set(opts: LensRippleOptions): void {
    Object.assign(this.opts, opts);
    if (!this.opts.followPointer) this.onLeave();
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.cleanups.forEach((fn) => fn());
    this.canvas.remove();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  // ---------------------------------------------------------------------------

  private onPointer = (e: PointerEvent): void => {
    if (!this.opts.followPointer || e.pointerType === 'touch') return;
    const r = this.stage.getBoundingClientRect();
    this.hovering = true;
    this.target = { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  private onLeave = (): void => {
    this.hovering = false;
    this.target = this.restingCenter();
  };

  private restingCenter() {
    const s = this.stage.getBoundingClientRect();
    const l = this.logo.getBoundingClientRect();
    return { x: l.left - s.left + l.width / 2, y: l.top - s.top + l.height / 2 };
  }

  private async resize(): Promise<void> {
    const { width, height } = this.stage.getBoundingClientRect();
    if (!width || !height || this.destroyed) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    const gl = this.gl;
    for (const tex of [this.blurTmp, this.glowTexture]) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.canvas.width, this.canvas.height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    this.blurredFor = NaN;
    if (!this.hovering) {
      this.target = this.restingCenter();
      this.center = { ...this.target };
    }
    await this.rasterize();
  }

  private async rasterize(): Promise<void> {
    const { width: w, height: h } = this.canvas;
    if (!w || !h || this.destroyed) return;
    const token = ++this.rasterToken;
    const bitmap = await rasterizeLogo(this.logo, this.stage, w, h, this.dpr);
    if (token !== this.rasterToken || this.destroyed) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    this.blurredFor = NaN; // glow texture is stale now
    if (!this.readyFired) {
      this.readyFired = true;
      this.onReady();
    }
  }

  /** Two-pass Gaussian blur of the logo into glowTexture. */
  private blurGlow(): void {
    const { gl, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    const sigma = Math.min(Math.max(this.opts.glowBlur, 0) * this.dpr, MAX_BLUR_TAPS / 3);

    gl.useProgram(this.blurProgram);
    gl.viewport(0, 0, W, H);
    gl.uniform1i(this.blurU.uSrc, 0);
    gl.uniform2f(this.blurU.uTexel, 1 / W, 1 / H);
    gl.uniform1f(this.blurU.uSigma, sigma);
    gl.activeTexture(gl.TEXTURE0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboTmp);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform2f(this.blurU.uDir, 1, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboGlow);
    gl.bindTexture(gl.TEXTURE_2D, this.blurTmp);
    gl.uniform2f(this.blurU.uDir, 0, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.blurredFor = this.opts.glowBlur;
  }

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.readyFired) return;
    if (this.blurredFor !== this.opts.glowBlur) this.blurGlow();

    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.1);
    this.last = now;
    if (!this.reducedMotion.matches) this.time += dt;

    const k = 1 - Math.exp(-dt * 5);
    this.center.x += (this.target.x - this.center.x) * k;
    this.center.y += (this.target.y - this.center.y) * k;

    const { gl, u, opts, dpr, canvas, palette } = this;
    const W = canvas.width;
    const H = canvas.height;

    gl.useProgram(this.program);
    gl.viewport(0, 0, W, H);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.glowTexture);

    gl.uniform2f(u.uRes, W, H);
    gl.uniform2f(u.uCenter, this.center.x * dpr, H - this.center.y * dpr);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uDpr, dpr);
    gl.uniform1i(u.uRings, Math.max(1, Math.min(MAX_RINGS, Math.round(opts.rings))));
    gl.uniform1f(u.uStrength, opts.strength);
    gl.uniform1f(u.uWidth, opts.width);
    gl.uniform1f(u.uSpeed, opts.speed);
    gl.uniform4f(u.uEase, ...opts.easing);
    gl.uniform1f(u.uAberration, opts.aberration);
    gl.uniform1f(u.uGlow, opts.glow);
    gl.uniform1f(u.uGlowSpread, opts.glowSpread);
    gl.uniform1f(u.uMaxR, Math.hypot(W, H) * 0.55);
    gl.uniform1f(u.uGlass, opts.glass);
    gl.uniform3fv(u.uInk, palette.ink);
    gl.uniform1f(u.uMono, opts.monochrome ? 1 : 0);
    gl.uniform3fv(u.uLight, palette.light);
    gl.uniform3fv(u.uShade, palette.shade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}

// -----------------------------------------------------------------------------
// DOM → colour bitmap
//
// Handles text nodes, inline <svg> and <img>, which is what logos are usually
// made of, and paints them in document order so overlaps stack correctly.
// For arbitrary HTML (gradients via background-clip, CSS filters, borders…)
// replace this with html-to-image and pass its canvas to texImage2D instead.
// -----------------------------------------------------------------------------

type Paint = (ctx: CanvasRenderingContext2D) => void;

async function rasterizeLogo(
  root: HTMLElement,
  stage: HTMLElement,
  w: number,
  h: number,
  dpr: number,
): Promise<HTMLCanvasElement> {
  const origin = stage.getBoundingClientRect();
  // Collect paint steps first (images load in parallel), then paint in order.
  const steps: Array<Paint | Promise<Paint | null>> = [];

  const textStep = (node: Text): Paint | null => {
    const parent = node.parentElement;
    const text = node.textContent ?? '';
    if (!parent || !text.trim()) return null;
    const cs = getComputedStyle(parent);
    if (cs.visibility === 'hidden') return null;

    // Measure word boxes now, while we're walking the live DOM.
    const words: Array<{ word: string; x: number; y: number }> = [];
    const range = document.createRange();
    const re = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text))) {
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const r = range.getBoundingClientRect();
      words.push({ word: match[0], x: r.left - origin.left, y: r.top - origin.top });
    }

    return (ctx) => {
      // font-stretch is left out: computed values like "125%" make the canvas
      // font shorthand invalid, and the assignment is then silently ignored.
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      if ('letterSpacing' in ctx) {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      }
      const fill = cs.getPropertyValue('-webkit-text-fill-color') || cs.color;
      ctx.fillStyle = fill === 'transparent' || fill.endsWith(', 0)') ? cs.color : fill;
      ctx.globalAlpha = effectiveOpacity(parent, root);
      const m = ctx.measureText('Hg');
      const ascent = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent;
      for (const { word, x, y } of words) ctx.fillText(word, x, y + ascent);
      ctx.globalAlpha = 1;
    };
  };

  const imageStep = async (
    src: string,
    r: DOMRect,
    opacity: number,
    crossOrigin: string | null,
  ): Promise<Paint | null> => {
    if (!r.width || !r.height) return null;
    const img = new Image();
    // Without CORS the canvas becomes "tainted" and WebGL refuses to read it,
    // which would break the whole effect. Ask for CORS; skip the image if denied.
    if (!src.startsWith('data:')) img.crossOrigin = crossOrigin ?? 'anonymous';
    img.src = src;
    try {
      await img.decode();
    } catch {
      console.warn('[LensRipple] skipped an image it could not load with CORS:', src);
      return null;
    }
    return (ctx) => {
      ctx.globalAlpha = opacity;
      ctx.drawImage(img, r.left - origin.left, r.top - origin.top, r.width, r.height);
      ctx.globalAlpha = 1;
    };
  };

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const step = textStep(node as Text);
      if (step) steps.push(step);
      return;
    }
    if (node instanceof SVGSVGElement) {
      const src =
        'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(new XMLSerializer().serializeToString(snapshotSvg(node)));
      steps.push(imageStep(src, node.getBoundingClientRect(), effectiveOpacity(node, root), null));
      return;
    }
    if (node instanceof HTMLImageElement) {
      steps.push(
        imageStep(
          node.currentSrc || node.src,
          node.getBoundingClientRect(),
          effectiveOpacity(node, root),
          node.crossOrigin,
        ),
      );
      return;
    }
    node.childNodes.forEach(walk);
  };

  walk(root);
  const paints = await Promise.all(steps);

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  for (const paint of paints) paint?.(ctx);
  return c;
}

/**
 * An SVG drawn as an <img> can't see the page's stylesheets, so fills set via
 * CSS classes (or currentColor from a parent) would be lost. Copy the computed
 * paint properties onto a clone as inline styles.
 */
function snapshotSvg(svg: SVGSVGElement): SVGSVGElement {
  const PROPS = [
    'color', 'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width',
    'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
    'opacity', 'stop-color', 'stop-opacity', 'visibility', 'display',
    'font-family', 'font-size', 'font-weight', 'letter-spacing',
  ];
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const src = [svg, ...svg.querySelectorAll('*')];
  const dst = [clone, ...clone.querySelectorAll('*')];
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const target = dst[i] as SVGElement;
    for (const prop of PROPS) target.style.setProperty(prop, cs.getPropertyValue(prop));
  });
  const r = svg.getBoundingClientRect();
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(r.width));
  clone.setAttribute('height', String(r.height));
  clone.style.removeProperty('opacity'); // applied when painting instead
  return clone;
}

/** Combined CSS opacity of an element and its ancestors, up to (not including) root. */
function effectiveOpacity(el: Element, root: Element): number {
  let o = 1;
  for (let n: Element | null = el; n && n !== root; n = n.parentElement) {
    o *= Number(getComputedStyle(n).opacity) || 0;
  }
  return o;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function makeTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  return tex;
}

function makeFramebuffer(gl: WebGL2RenderingContext, tex: WebGLTexture): WebGLFramebuffer {
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return fbo;
}

function linkProgram(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) ?? 'shader compile failed');
    }
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) ?? 'program link failed');
  }
  return p;
}

function readPalette(el: HTMLElement): Palette {
  const cs = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    cssColorToRgb(cs.getPropertyValue(name).trim() || fallback);
  return {
    ink: read('--lens-ink', '#000000'),
    light: read('--lens-light', '#ffffff'),
    shade: read('--lens-shade', '#2e3438'),
  };
}

let colorCtx: CanvasRenderingContext2D | null = null;
/** Any CSS colour string → 0–1 RGB, using the browser's own parser. */
function cssColorToRgb(color: string): RGB {
  colorCtx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  colorCtx.clearRect(0, 0, 1, 1);
  colorCtx.fillStyle = '#000';
  colorCtx.fillStyle = color;
  colorCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = colorCtx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}