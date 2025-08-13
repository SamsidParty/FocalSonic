// https://github.com/Steve-xmh/applemusic-like-lyrics under the AGPL-3.0 license
// https://github.com/Steve-xmh/applemusic-like-lyrics/blob/ec2c2a796db4bc6d686682b9f304c3fad57b2f98/packages/core/src/bg-render/pixi-renderer.ts#L97
// I didn't manage to find a npm package for this, and the instructions for compiling were unclear and in chinese
// So, behold the pre-bundled js file:

var ee = (e => (e[e.WEBGL_LEGACY = 0] = "WEBGL_LEGACY",
    e[e.WEBGL = 1] = "WEBGL",
    e[e.WEBGL2 = 2] = "WEBGL2",
    e))(ee || {})
    , pr = (e => (e[e.UNKNOWN = 0] = "UNKNOWN",
    e[e.WEBGL = 1] = "WEBGL",
    e[e.CANVAS = 2] = "CANVAS",
    e))(pr || {})
    , $s = (e => (e[e.COLOR = 16384] = "COLOR",
    e[e.DEPTH = 256] = "DEPTH",
    e[e.STENCIL = 1024] = "STENCIL",
    e))($s || {})
    , A = (e => (e[e.NORMAL = 0] = "NORMAL",
    e[e.ADD = 1] = "ADD",
    e[e.MULTIPLY = 2] = "MULTIPLY",
    e[e.SCREEN = 3] = "SCREEN",
    e[e.OVERLAY = 4] = "OVERLAY",
    e[e.DARKEN = 5] = "DARKEN",
    e[e.LIGHTEN = 6] = "LIGHTEN",
    e[e.COLOR_DODGE = 7] = "COLOR_DODGE",
    e[e.COLOR_BURN = 8] = "COLOR_BURN",
    e[e.HARD_LIGHT = 9] = "HARD_LIGHT",
    e[e.SOFT_LIGHT = 10] = "SOFT_LIGHT",
    e[e.DIFFERENCE = 11] = "DIFFERENCE",
    e[e.EXCLUSION = 12] = "EXCLUSION",
    e[e.HUE = 13] = "HUE",
    e[e.SATURATION = 14] = "SATURATION",
    e[e.COLOR = 15] = "COLOR",
    e[e.LUMINOSITY = 16] = "LUMINOSITY",
    e[e.NORMAL_NPM = 17] = "NORMAL_NPM",
    e[e.ADD_NPM = 18] = "ADD_NPM",
    e[e.SCREEN_NPM = 19] = "SCREEN_NPM",
    e[e.NONE = 20] = "NONE",
    e[e.SRC_OVER = 0] = "SRC_OVER",
    e[e.SRC_IN = 21] = "SRC_IN",
    e[e.SRC_OUT = 22] = "SRC_OUT",
    e[e.SRC_ATOP = 23] = "SRC_ATOP",
    e[e.DST_OVER = 24] = "DST_OVER",
    e[e.DST_IN = 25] = "DST_IN",
    e[e.DST_OUT = 26] = "DST_OUT",
    e[e.DST_ATOP = 27] = "DST_ATOP",
    e[e.ERASE = 26] = "ERASE",
    e[e.SUBTRACT = 28] = "SUBTRACT",
    e[e.XOR = 29] = "XOR",
    e))(A || {})
    , Gt = (e => (e[e.POINTS = 0] = "POINTS",
    e[e.LINES = 1] = "LINES",
    e[e.LINE_LOOP = 2] = "LINE_LOOP",
    e[e.LINE_STRIP = 3] = "LINE_STRIP",
    e[e.TRIANGLES = 4] = "TRIANGLES",
    e[e.TRIANGLE_STRIP = 5] = "TRIANGLE_STRIP",
    e[e.TRIANGLE_FAN = 6] = "TRIANGLE_FAN",
    e))(Gt || {})
    , b = (e => (e[e.RGBA = 6408] = "RGBA",
    e[e.RGB = 6407] = "RGB",
    e[e.RG = 33319] = "RG",
    e[e.RED = 6403] = "RED",
    e[e.RGBA_INTEGER = 36249] = "RGBA_INTEGER",
    e[e.RGB_INTEGER = 36248] = "RGB_INTEGER",
    e[e.RG_INTEGER = 33320] = "RG_INTEGER",
    e[e.RED_INTEGER = 36244] = "RED_INTEGER",
    e[e.ALPHA = 6406] = "ALPHA",
    e[e.LUMINANCE = 6409] = "LUMINANCE",
    e[e.LUMINANCE_ALPHA = 6410] = "LUMINANCE_ALPHA",
    e[e.DEPTH_COMPONENT = 6402] = "DEPTH_COMPONENT",
    e[e.DEPTH_STENCIL = 34041] = "DEPTH_STENCIL",
    e))(b || {})
    , ue = (e => (e[e.TEXTURE_2D = 3553] = "TEXTURE_2D",
    e[e.TEXTURE_CUBE_MAP = 34067] = "TEXTURE_CUBE_MAP",
    e[e.TEXTURE_2D_ARRAY = 35866] = "TEXTURE_2D_ARRAY",
    e[e.TEXTURE_CUBE_MAP_POSITIVE_X = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X",
    e[e.TEXTURE_CUBE_MAP_NEGATIVE_X = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X",
    e[e.TEXTURE_CUBE_MAP_POSITIVE_Y = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y",
    e[e.TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y",
    e[e.TEXTURE_CUBE_MAP_POSITIVE_Z = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z",
    e[e.TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z",
    e))(ue || {})
    , L = (e => (e[e.UNSIGNED_BYTE = 5121] = "UNSIGNED_BYTE",
    e[e.UNSIGNED_SHORT = 5123] = "UNSIGNED_SHORT",
    e[e.UNSIGNED_SHORT_5_6_5 = 33635] = "UNSIGNED_SHORT_5_6_5",
    e[e.UNSIGNED_SHORT_4_4_4_4 = 32819] = "UNSIGNED_SHORT_4_4_4_4",
    e[e.UNSIGNED_SHORT_5_5_5_1 = 32820] = "UNSIGNED_SHORT_5_5_5_1",
    e[e.UNSIGNED_INT = 5125] = "UNSIGNED_INT",
    e[e.UNSIGNED_INT_10F_11F_11F_REV = 35899] = "UNSIGNED_INT_10F_11F_11F_REV",
    e[e.UNSIGNED_INT_2_10_10_10_REV = 33640] = "UNSIGNED_INT_2_10_10_10_REV",
    e[e.UNSIGNED_INT_24_8 = 34042] = "UNSIGNED_INT_24_8",
    e[e.UNSIGNED_INT_5_9_9_9_REV = 35902] = "UNSIGNED_INT_5_9_9_9_REV",
    e[e.BYTE = 5120] = "BYTE",
    e[e.SHORT = 5122] = "SHORT",
    e[e.INT = 5124] = "INT",
    e[e.FLOAT = 5126] = "FLOAT",
    e[e.FLOAT_32_UNSIGNED_INT_24_8_REV = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV",
    e[e.HALF_FLOAT = 36193] = "HALF_FLOAT",
    e))(L || {})
    , zs = (e => (e[e.FLOAT = 0] = "FLOAT",
    e[e.INT = 1] = "INT",
    e[e.UINT = 2] = "UINT",
    e))(zs || {})
    , Bt = (e => (e[e.NEAREST = 0] = "NEAREST",
    e[e.LINEAR = 1] = "LINEAR",
    e))(Bt || {})
    , Ne = (e => (e[e.CLAMP = 33071] = "CLAMP",
    e[e.REPEAT = 10497] = "REPEAT",
    e[e.MIRRORED_REPEAT = 33648] = "MIRRORED_REPEAT",
    e))(Ne || {})
    , Qt = (e => (e[e.OFF = 0] = "OFF",
    e[e.POW2 = 1] = "POW2",
    e[e.ON = 2] = "ON",
    e[e.ON_MANUAL = 3] = "ON_MANUAL",
    e))(Qt || {})
    , Xt = (e => (e[e.NPM = 0] = "NPM",
    e[e.UNPACK = 1] = "UNPACK",
    e[e.PMA = 2] = "PMA",
    e[e.NO_PREMULTIPLIED_ALPHA = 0] = "NO_PREMULTIPLIED_ALPHA",
    e[e.PREMULTIPLY_ON_UPLOAD = 1] = "PREMULTIPLY_ON_UPLOAD",
    e[e.PREMULTIPLIED_ALPHA = 2] = "PREMULTIPLIED_ALPHA",
    e))(Xt || {})
    , jt = (e => (e[e.NO = 0] = "NO",
    e[e.YES = 1] = "YES",
    e[e.AUTO = 2] = "AUTO",
    e[e.BLEND = 0] = "BLEND",
    e[e.CLEAR = 1] = "CLEAR",
    e[e.BLIT = 2] = "BLIT",
    e))(jt || {})
    , ci = (e => (e[e.AUTO = 0] = "AUTO",
    e[e.MANUAL = 1] = "MANUAL",
    e))(ci || {})
    , dt = (e => (e.LOW = "lowp",
    e.MEDIUM = "mediump",
    e.HIGH = "highp",
    e))(dt || {})
    , tt = (e => (e[e.NONE = 0] = "NONE",
    e[e.SCISSOR = 1] = "SCISSOR",
    e[e.STENCIL = 2] = "STENCIL",
    e[e.SPRITE = 3] = "SPRITE",
    e[e.COLOR = 4] = "COLOR",
    e))(tt || {})
    , J = (e => (e[e.NONE = 0] = "NONE",
    e[e.LOW = 2] = "LOW",
    e[e.MEDIUM = 4] = "MEDIUM",
    e[e.HIGH = 8] = "HIGH",
    e))(J || {})
    , St = (e => (e[e.ELEMENT_ARRAY_BUFFER = 34963] = "ELEMENT_ARRAY_BUFFER",
    e[e.ARRAY_BUFFER = 34962] = "ARRAY_BUFFER",
    e[e.UNIFORM_BUFFER = 35345] = "UNIFORM_BUFFER",
    e))(St || {});
const fn = {
        createCanvas: (e, t) => {
            const s = document.createElement("canvas");
            return s.width = e,
            s.height = t,
            s;
        }
        ,
        getCanvasRenderingContext2D: () => CanvasRenderingContext2D,
        getWebGLRenderingContext: () => WebGLRenderingContext,
        getNavigator: () => navigator,
        getBaseUrl: () => {
            let e;
            return (e = document.baseURI) != null ? e : window.location.href;
        }
        ,
        getFontFaceSet: () => document.fonts,
        fetch: (e, t) => fetch(e, t),
        parseXML: e => new DOMParser().parseFromString(e, "text/xml")
    }
    , O = {
        ADAPTER: fn,
        RESOLUTION: 1,
        CREATE_IMAGE_BITMAP: !1,
        ROUND_PIXELS: !1
    };
let Is = /iPhone/i
    , wi = /iPod/i
    , Ei = /iPad/i
    , Ii = /\biOS-universal(?:.+)Mac\b/i
    , Rs = /\bAndroid(?:.+)Mobile\b/i
    , Ri = /Android/i
    , se = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i
    , Ge = /Silk/i
    , Ft = /Windows Phone/i
    , Ci = /\bWindows(?:.+)ARM\b/i
    , Ai = /BlackBerry/i
    , Si = /BB10/i
    , Mi = /Opera Mini/i
    , Ni = /\b(CriOS|Chrome)(?:.+)Mobile/i
    , Fi = /Mobile(?:.+)Firefox\b/i
    , Pi = function(e) {
        return typeof e < "u" && e.platform === "MacIntel" && typeof e.maxTouchPoints == "number" && e.maxTouchPoints > 1 && typeof MSStream > "u";
    };
function pn(e) {
    return function(t) {
        return t.test(e);
    };
}
function Oi(e) {
    let t = {
        userAgent: "",
        platform: "",
        maxTouchPoints: 0
    };
    !e && typeof navigator < "u" ? t = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints || 0
    } : typeof e == "string" ? t.userAgent = e : e && e.userAgent && (t = {
        userAgent: e.userAgent,
        platform: e.platform,
        maxTouchPoints: e.maxTouchPoints || 0
    });
    let s = t.userAgent
        , i = s.split("[FBAN");
    typeof i[1] < "u" && (s = i[0]),
    i = s.split("Twitter"),
    typeof i[1] < "u" && (s = i[0]);
    let r = pn(s)
        , n = {
            apple: {
                phone: r(Is) && !r(Ft),
                ipod: r(wi),
                tablet: !r(Is) && (r(Ei) || Pi(t)) && !r(Ft),
                universal: r(Ii),
                device: (r(Is) || r(wi) || r(Ei) || r(Ii) || Pi(t)) && !r(Ft)
            },
            amazon: {
                phone: r(se),
                tablet: !r(se) && r(Ge),
                device: r(se) || r(Ge)
            },
            android: {
                phone: !r(Ft) && r(se) || !r(Ft) && r(Rs),
                tablet: !r(Ft) && !r(se) && !r(Rs) && (r(Ge) || r(Ri)),
                device: !r(Ft) && (r(se) || r(Ge) || r(Rs) || r(Ri)) || r(/\bokhttp\b/i)
            },
            windows: {
                phone: r(Ft),
                tablet: r(Ci),
                device: r(Ft) || r(Ci)
            },
            other: {
                blackberry: r(Ai),
                blackberry10: r(Si),
                opera: r(Mi),
                firefox: r(Fi),
                chrome: r(Ni),
                device: r(Ai) || r(Si) || r(Mi) || r(Fi) || r(Ni)
            },
            any: !1,
            phone: !1,
            tablet: !1
        };
    return n.any = n.apple.device || n.android.device || n.windows.device || n.other.device,
    n.phone = n.apple.phone || n.android.phone || n.windows.phone,
    n.tablet = n.apple.tablet || n.android.tablet || n.windows.tablet,
    n;
}
let fr;
const mn = (fr = Oi.default) != null ? fr : Oi
    , he = mn(globalThis.navigator);
O.RETINA_PREFIX = /@([0-9\.]+)x/;
O.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = !1;
let pe = {}
    , gn = {
        get exports() {
            return pe;
        },
        set exports(e) {
            pe = e;
        }
    };
(function(e) {
    let t = Object.prototype.hasOwnProperty
        , s = "~";
    function i() {}
    Object.create && (i.prototype = Object.create(null),
    new i().__proto__ || (s = !1));
    function r(a, l, u) {
        this.fn = a,
        this.context = l,
        this.once = u || !1;
    }
    function n(a, l, u, c, d) {
        if (typeof u != "function")
            throw new TypeError("The listener must be a function");
        let p = new r(u,c || a,d)
            , f = s ? s + l : l;
        return a._events[f] ? a._events[f].fn ? a._events[f] = [a._events[f], p] : a._events[f].push(p) : (a._events[f] = p,
        a._eventsCount++),
        a;
    }
    function o(a, l) {
        --a._eventsCount === 0 ? a._events = new i : delete a._events[l];
    }
    function h() {
        this._events = new i,
        this._eventsCount = 0;
    }
    h.prototype.eventNames = function() {
        let l = [], u, c;
        if (this._eventsCount === 0)
            return l;
        for (c in u = this._events)
            t.call(u, c) && l.push(s ? c.slice(1) : c);
        return Object.getOwnPropertySymbols ? l.concat(Object.getOwnPropertySymbols(u)) : l;
    }
    ,
    h.prototype.listeners = function(l) {
        let u = s ? s + l : l
            , c = this._events[u];
        if (!c)
            return [];
        if (c.fn)
            return [c.fn];
        for (var d = 0, p = c.length, f = new Array(p); d < p; d++)
            f[d] = c[d].fn;
        return f;
    }
    ,
    h.prototype.listenerCount = function(l) {
        let u = s ? s + l : l
            , c = this._events[u];
        return c ? c.fn ? 1 : c.length : 0;
    }
    ,
    h.prototype.emit = function(l, u, c, d, p, f) {
        let _ = s ? s + l : l;
        if (!this._events[_])
            return !1;
        let g = this._events[_], v = arguments.length, y, m;
        if (g.fn) {
            switch (g.once && this.removeListener(l, g.fn, void 0, !0),
            v) {
                case 1:
                    return g.fn.call(g.context),
                    !0;
                case 2:
                    return g.fn.call(g.context, u),
                    !0;
                case 3:
                    return g.fn.call(g.context, u, c),
                    !0;
                case 4:
                    return g.fn.call(g.context, u, c, d),
                    !0;
                case 5:
                    return g.fn.call(g.context, u, c, d, p),
                    !0;
                case 6:
                    return g.fn.call(g.context, u, c, d, p, f),
                    !0;
            }
            for (m = 1,
            y = new Array(v - 1); m < v; m++)
                y[m - 1] = arguments[m];
            g.fn.apply(g.context, y);
        } else {
            let x = g.length, I;
            for (m = 0; m < x; m++)
                switch (g[m].once && this.removeListener(l, g[m].fn, void 0, !0),
                v) {
                    case 1:
                        g[m].fn.call(g[m].context);
                        break;
                    case 2:
                        g[m].fn.call(g[m].context, u);
                        break;
                    case 3:
                        g[m].fn.call(g[m].context, u, c);
                        break;
                    case 4:
                        g[m].fn.call(g[m].context, u, c, d);
                        break;
                    default:
                        if (!y)
                            for (I = 1,
                            y = new Array(v - 1); I < v; I++)
                                y[I - 1] = arguments[I];
                        g[m].fn.apply(g[m].context, y);
                }
        }
        return !0;
    }
    ,
    h.prototype.on = function(l, u, c) {
        return n(this, l, u, c, !1);
    }
    ,
    h.prototype.once = function(l, u, c) {
        return n(this, l, u, c, !0);
    }
    ,
    h.prototype.removeListener = function(l, u, c, d) {
        let p = s ? s + l : l;
        if (!this._events[p])
            return this;
        if (!u)
            return o(this, p),
            this;
        let f = this._events[p];
        if (f.fn)
            f.fn === u && (!d || f.once) && (!c || f.context === c) && o(this, p);
        else {
            for (var _ = 0, g = [], v = f.length; _ < v; _++)
                (f[_].fn !== u || d && !f[_].once || c && f[_].context !== c) && g.push(f[_]);
            g.length ? this._events[p] = g.length === 1 ? g[0] : g : o(this, p);
        }
        return this;
    }
    ,
    h.prototype.removeAllListeners = function(l) {
        let u;
        return l ? (u = s ? s + l : l,
        this._events[u] && o(this, u)) : (this._events = new i,
        this._eventsCount = 0),
        this;
    }
    ,
    h.prototype.off = h.prototype.removeListener,
    h.prototype.addListener = h.prototype.on,
    h.prefixed = s,
    h.EventEmitter = h,
    e.exports = h;
}
)(gn);
let os = {}
    , _n = {
        get exports() {
            return os;
        },
        set exports(e) {
            os = e;
        }
    };
_n.exports = ms;
os.default = ms;
function ms(e, t, s) {
    s = s || 2;
    let i = t && t.length
        , r = i ? t[0] * s : e.length
        , n = mr(e, 0, r, s, !0)
        , o = [];
    if (!n || n.next === n.prev)
        return o;
    let h, a, l, u, c, d, p;
    if (i && (n = Tn(e, t, n, s)),
    e.length > 80 * s) {
        h = l = e[0],
        a = u = e[1];
        for (let f = s; f < r; f += s)
            c = e[f],
            d = e[f + 1],
            c < h && (h = c),
            d < a && (a = d),
            c > l && (l = c),
            d > u && (u = d);
        p = Math.max(l - h, u - a),
        p = p !== 0 ? 32767 / p : 0;
    }
    return Fe(n, o, s, h, a, p, 0),
    o;
}
function mr(e, t, s, i, r) {
    let n, o;
    if (r === Ws(e, t, s, i) > 0)
        for (n = t; n < s; n += i)
            o = Bi(n, e[n], e[n + 1], o);
    else
        for (n = s - i; n >= t; n -= i)
            o = Bi(n, e[n], e[n + 1], o);
    return o && gs(o, o.next) && (Oe(o),
    o = o.next),
    o;
}
function te(e, t) {
    if (!e)
        return e;
    t || (t = e);
    let s = e, i;
    do
        if (i = !1,
        !s.steiner && (gs(s, s.next) || Y(s.prev, s, s.next) === 0)) {
            if (Oe(s),
            s = t = s.prev,
            s === s.next)
                break;
            i = !0;
        } else
            s = s.next;
    while (i || s !== t);
    return t;
}
function Fe(e, t, s, i, r, n, o) {
    if (e) {
        !o && n && Cn(e, i, r, n);
        for (var h = e, a, l; e.prev !== e.next; ) {
            if (a = e.prev,
            l = e.next,
            n ? yn(e, i, r, n) : xn(e)) {
                t.push(a.i / s | 0),
                t.push(e.i / s | 0),
                t.push(l.i / s | 0),
                Oe(e),
                e = l.next,
                h = l.next;
                continue;
            }
            if (e = l,
            e === h) {
                o ? o === 1 ? (e = vn(te(e), t, s),
                Fe(e, t, s, i, r, n, 2)) : o === 2 && bn(e, t, s, i, r, n) : Fe(te(e), t, s, i, r, n, 1);
                break;
            }
        }
    }
}
function xn(e) {
    let t = e.prev
        , s = e
        , i = e.next;
    if (Y(t, s, i) >= 0)
        return !1;
    for (let r = t.x, n = s.x, o = i.x, h = t.y, a = s.y, l = i.y, u = r < n ? r < o ? r : o : n < o ? n : o, c = h < a ? h < l ? h : l : a < l ? a : l, d = r > n ? r > o ? r : o : n > o ? n : o, p = h > a ? h > l ? h : l : a > l ? a : l, f = i.next; f !== t; ) {
        if (f.x >= u && f.x <= d && f.y >= c && f.y <= p && ae(r, h, n, a, o, l, f.x, f.y) && Y(f.prev, f, f.next) >= 0)
            return !1;
        f = f.next;
    }
    return !0;
}
function yn(e, t, s, i) {
    let r = e.prev
        , n = e
        , o = e.next;
    if (Y(r, n, o) >= 0)
        return !1;
    for (var h = r.x, a = n.x, l = o.x, u = r.y, c = n.y, d = o.y, p = h < a ? h < l ? h : l : a < l ? a : l, f = u < c ? u < d ? u : d : c < d ? c : d, _ = h > a ? h > l ? h : l : a > l ? a : l, g = u > c ? u > d ? u : d : c > d ? c : d, v = js(p, f, t, s, i), y = js(_, g, t, s, i), m = e.prevZ, x = e.nextZ; m && m.z >= v && x && x.z <= y; ) {
        if (m.x >= p && m.x <= _ && m.y >= f && m.y <= g && m !== r && m !== o && ae(h, u, a, c, l, d, m.x, m.y) && Y(m.prev, m, m.next) >= 0 || (m = m.prevZ,
        x.x >= p && x.x <= _ && x.y >= f && x.y <= g && x !== r && x !== o && ae(h, u, a, c, l, d, x.x, x.y) && Y(x.prev, x, x.next) >= 0))
            return !1;
        x = x.nextZ;
    }
    for (; m && m.z >= v; ) {
        if (m.x >= p && m.x <= _ && m.y >= f && m.y <= g && m !== r && m !== o && ae(h, u, a, c, l, d, m.x, m.y) && Y(m.prev, m, m.next) >= 0)
            return !1;
        m = m.prevZ;
    }
    for (; x && x.z <= y; ) {
        if (x.x >= p && x.x <= _ && x.y >= f && x.y <= g && x !== r && x !== o && ae(h, u, a, c, l, d, x.x, x.y) && Y(x.prev, x, x.next) >= 0)
            return !1;
        x = x.nextZ;
    }
    return !0;
}
function vn(e, t, s) {
    let i = e;
    do {
        let r = i.prev
            , n = i.next.next;
        !gs(r, n) && gr(r, i, i.next, n) && Pe(r, n) && Pe(n, r) && (t.push(r.i / s | 0),
        t.push(i.i / s | 0),
        t.push(n.i / s | 0),
        Oe(i),
        Oe(i.next),
        i = e = n),
        i = i.next;
    } while (i !== e);
    return te(i);
}
function bn(e, t, s, i, r, n) {
    let o = e;
    do {
        for (let h = o.next.next; h !== o.prev; ) {
            if (o.i !== h.i && Mn(o, h)) {
                let a = _r(o, h);
                o = te(o, o.next),
                a = te(a, a.next),
                Fe(o, t, s, i, r, n, 0),
                Fe(a, t, s, i, r, n, 0);
                return;
            }
            h = h.next;
        }
        o = o.next;
    } while (o !== e);
}
function Tn(e, t, s, i) {
    let r = [], n, o, h, a, l;
    for (n = 0,
    o = t.length; n < o; n++)
        h = t[n] * i,
        a = n < o - 1 ? t[n + 1] * i : e.length,
        l = mr(e, h, a, i, !1),
        l === l.next && (l.steiner = !0),
        r.push(Sn(l));
    for (r.sort(wn),
    n = 0; n < r.length; n++)
        s = En(r[n], s);
    return s;
}
function wn(e, t) {
    return e.x - t.x;
}
function En(e, t) {
    let s = In(e, t);
    if (!s)
        return t;
    let i = _r(s, e);
    return te(i, i.next),
    te(s, s.next);
}
function In(e, t) {
    let s = t, i = e.x, r = e.y, n = -1 / 0, o;
    do {
        if (r <= s.y && r >= s.next.y && s.next.y !== s.y) {
            let h = s.x + (r - s.y) * (s.next.x - s.x) / (s.next.y - s.y);
            if (h <= i && h > n && (n = h,
            o = s.x < s.next.x ? s : s.next,
            h === i))
                return o;
        }
        s = s.next;
    } while (s !== t);
    if (!o)
        return null;
    let a = o, l = o.x, u = o.y, c = 1 / 0, d;
    s = o;
    do
        i >= s.x && s.x >= l && i !== s.x && ae(r < u ? i : n, r, l, u, r < u ? n : i, r, s.x, s.y) && (d = Math.abs(r - s.y) / (i - s.x),
        Pe(s, e) && (d < c || d === c && (s.x > o.x || s.x === o.x && Rn(o, s))) && (o = s,
        c = d)),
        s = s.next;
    while (s !== a);
    return o;
}
function Rn(e, t) {
    return Y(e.prev, e, t.prev) < 0 && Y(t.next, e, e.next) < 0;
}
function Cn(e, t, s, i) {
    let r = e;
    do
        r.z === 0 && (r.z = js(r.x, r.y, t, s, i)),
        r.prevZ = r.prev,
        r.nextZ = r.next,
        r = r.next;
    while (r !== e);
    r.prevZ.nextZ = null,
    r.prevZ = null,
    An(r);
}
function An(e) {
    let t, s, i, r, n, o, h, a, l = 1;
    do {
        for (s = e,
        e = null,
        n = null,
        o = 0; s; ) {
            for (o++,
            i = s,
            h = 0,
            t = 0; t < l && (h++,
                i = i.nextZ,
                !!i); t++)
                ;
            for (a = l; h > 0 || a > 0 && i; )
                h !== 0 && (a === 0 || !i || s.z <= i.z) ? (r = s,
                s = s.nextZ,
                h--) : (r = i,
                i = i.nextZ,
                a--),
                n ? n.nextZ = r : e = r,
                r.prevZ = n,
                n = r;
            s = i;
        }
        n.nextZ = null,
        l *= 2;
    } while (o > 1);
    return e;
}
function js(e, t, s, i, r) {
    return e = (e - s) * r | 0,
    t = (t - i) * r | 0,
    e = (e | e << 8) & 16711935,
    e = (e | e << 4) & 252645135,
    e = (e | e << 2) & 858993459,
    e = (e | e << 1) & 1431655765,
    t = (t | t << 8) & 16711935,
    t = (t | t << 4) & 252645135,
    t = (t | t << 2) & 858993459,
    t = (t | t << 1) & 1431655765,
    e | t << 1;
}
function Sn(e) {
    let t = e
        , s = e;
    do
        (t.x < s.x || t.x === s.x && t.y < s.y) && (s = t),
        t = t.next;
    while (t !== e);
    return s;
}
function ae(e, t, s, i, r, n, o, h) {
    return (r - o) * (t - h) >= (e - o) * (n - h) && (e - o) * (i - h) >= (s - o) * (t - h) && (s - o) * (n - h) >= (r - o) * (i - h);
}
function Mn(e, t) {
    return e.next.i !== t.i && e.prev.i !== t.i && !Nn(e, t) && (Pe(e, t) && Pe(t, e) && Fn(e, t) && (Y(e.prev, e, t.prev) || Y(e, t.prev, t)) || gs(e, t) && Y(e.prev, e, e.next) > 0 && Y(t.prev, t, t.next) > 0);
}
function Y(e, t, s) {
    return (t.y - e.y) * (s.x - t.x) - (t.x - e.x) * (s.y - t.y);
}
function gs(e, t) {
    return e.x === t.x && e.y === t.y;
}
function gr(e, t, s, i) {
    let r = Xe(Y(e, t, s))
        , n = Xe(Y(e, t, i))
        , o = Xe(Y(s, i, e))
        , h = Xe(Y(s, i, t));
    return !!(r !== n && o !== h || r === 0 && Ve(e, s, t) || n === 0 && Ve(e, i, t) || o === 0 && Ve(s, e, i) || h === 0 && Ve(s, t, i));
}
function Ve(e, t, s) {
    return t.x <= Math.max(e.x, s.x) && t.x >= Math.min(e.x, s.x) && t.y <= Math.max(e.y, s.y) && t.y >= Math.min(e.y, s.y);
}
function Xe(e) {
    return e > 0 ? 1 : e < 0 ? -1 : 0;
}
function Nn(e, t) {
    let s = e;
    do {
        if (s.i !== e.i && s.next.i !== e.i && s.i !== t.i && s.next.i !== t.i && gr(s, s.next, e, t))
            return !0;
        s = s.next;
    } while (s !== e);
    return !1;
}
function Pe(e, t) {
    return Y(e.prev, e, e.next) < 0 ? Y(e, t, e.next) >= 0 && Y(e, e.prev, t) >= 0 : Y(e, t, e.prev) < 0 || Y(e, e.next, t) < 0;
}
function Fn(e, t) {
    let s = e
        , i = !1
        , r = (e.x + t.x) / 2
        , n = (e.y + t.y) / 2;
    do
        s.y > n != s.next.y > n && s.next.y !== s.y && r < (s.next.x - s.x) * (n - s.y) / (s.next.y - s.y) + s.x && (i = !i),
        s = s.next;
    while (s !== e);
    return i;
}
function _r(e, t) {
    let s = new Ys(e.i,e.x,e.y)
        , i = new Ys(t.i,t.x,t.y)
        , r = e.next
        , n = t.prev;
    return e.next = t,
    t.prev = e,
    s.next = r,
    r.prev = s,
    i.next = s,
    s.prev = i,
    n.next = i,
    i.prev = n,
    i;
}
function Bi(e, t, s, i) {
    let r = new Ys(e,t,s);
    return i ? (r.next = i.next,
    r.prev = i,
    i.next.prev = r,
    i.next = r) : (r.prev = r,
    r.next = r),
    r;
}
function Oe(e) {
    e.next.prev = e.prev,
    e.prev.next = e.next,
    e.prevZ && (e.prevZ.nextZ = e.nextZ),
    e.nextZ && (e.nextZ.prevZ = e.prevZ);
}
function Ys(e, t, s) {
    this.i = e,
    this.x = t,
    this.y = s,
    this.prev = null,
    this.next = null,
    this.z = 0,
    this.prevZ = null,
    this.nextZ = null,
    this.steiner = !1;
}
ms.deviation = function(e, t, s, i) {
    let r = t && t.length
        , n = r ? t[0] * s : e.length
        , o = Math.abs(Ws(e, 0, n, s));
    if (r)
        for (var h = 0, a = t.length; h < a; h++) {
            let l = t[h] * s
                , u = h < a - 1 ? t[h + 1] * s : e.length;
            o -= Math.abs(Ws(e, l, u, s));
        }
    let c = 0;
    for (h = 0; h < i.length; h += 3) {
        let d = i[h] * s
            , p = i[h + 1] * s
            , f = i[h + 2] * s;
        c += Math.abs((e[d] - e[f]) * (e[p + 1] - e[d + 1]) - (e[d] - e[p]) * (e[f + 1] - e[d + 1]));
    }
    return o === 0 && c === 0 ? 0 : Math.abs((c - o) / o);
}
;
function Ws(e, t, s, i) {
    for (var r = 0, n = t, o = s - i; n < s; n += i)
        r += (e[o] - e[n]) * (e[n + 1] + e[o + 1]),
        o = n;
    return r;
}
ms.flatten = function(e) {
    for (var t = e[0][0].length, s = {
            vertices: [],
            holes: [],
            dimensions: t
        }, i = 0, r = 0; r < e.length; r++) {
        for (let n = 0; n < e[r].length; n++)
            for (let o = 0; o < t; o++)
                s.vertices.push(e[r][n][o]);
        r > 0 && (i += e[r - 1].length,
        s.holes.push(i));
    }
    return s;
}
;
let hs = {}
    , Pn = {
        get exports() {
            return hs;
        },
        set exports(e) {
            hs = e;
        }
    };
/*! https://mths.be/punycode v1.3.2 by @mathias */
(function(e, t) {
    (function(s) {
        let i = t && !t.nodeType && t
            , r = e && !e.nodeType && e
            , n = true;
        (n.global === n || n.window === n || n.self === n) && (s = n);
        let o, h = 2147483647, a = 36, l = 1, u = 26, c = 38, d = 700, p = 72, f = 128, _ = "-", g = /^xn--/, v = /[^\x20-\x7E]/, y = /[\x2E\u3002\uFF0E\uFF61]/g, m = {
                overflow: "Overflow: input needs wider integers to process",
                "not-basic": "Illegal input >= 0x80 (not a basic code point)",
                "invalid-input": "Invalid input"
            }, x = a - l, I = Math.floor, M = String.fromCharCode, E;
        function T(w) {
            throw RangeError(m[w]);
        }
        function F(w, S) {
            for (var U = w.length, X = []; U--; )
                X[U] = S(w[U]);
            return X;
        }
        function B(w, S) {
            let U = w.split("@")
                , X = "";
            U.length > 1 && (X = U[0] + "@",
            w = U[1]),
            w = w.replace(y, ".");
            let $ = w.split(".")
                , st = F($, S).join(".");
            return X + st;
        }
        function q(w) {
            for (var S = [], U = 0, X = w.length, $, st; U < X; )
                $ = w.charCodeAt(U++),
                $ >= 55296 && $ <= 56319 && U < X ? (st = w.charCodeAt(U++),
                (st & 64512) == 56320 ? S.push((($ & 1023) << 10) + (st & 1023) + 65536) : (S.push($),
                U--)) : S.push($);
            return S;
        }
        function Mt(w) {
            return F(w, function(S) {
                let U = "";
                return S > 65535 && (S -= 65536,
                U += M(S >>> 10 & 1023 | 55296),
                S = 56320 | S & 1023),
                U += M(S),
                U;
            }).join("");
        }
        function R(w) {
            return w - 48 < 10 ? w - 22 : w - 65 < 26 ? w - 65 : w - 97 < 26 ? w - 97 : a;
        }
        function C(w, S) {
            return w + 22 + 75 * (w < 26) - ((S != 0) << 5);
        }
        function kt(w, S, U) {
            let X = 0;
            for (w = U ? I(w / d) : w >> 1,
            w += I(w / S); w > x * u >> 1; X += a)
                w = I(w / x);
            return I(X + (x + 1) * w / (w + c));
        }
        function Nt(w) {
            let S = [], U = w.length, X, $ = 0, st = f, Z = p, it, ht, ut, nt, z, K, Q, Et, It;
            for (it = w.lastIndexOf(_),
            it < 0 && (it = 0),
            ht = 0; ht < it; ++ht)
                w.charCodeAt(ht) >= 128 && T("not-basic"),
                S.push(w.charCodeAt(ht));
            for (ut = it > 0 ? it + 1 : 0; ut < U; ) {
                for (nt = $,
                z = 1,
                K = a; ut >= U && T("invalid-input"),
                    Q = R(w.charCodeAt(ut++)),
                    (Q >= a || Q > I((h - $) / z)) && T("overflow"),
                    $ += Q * z,
                    Et = K <= Z ? l : K >= Z + u ? u : K - Z,
                    !(Q < Et); K += a)
                    It = a - Et,
                    z > I(h / It) && T("overflow"),
                    z *= It;
                X = S.length + 1,
                Z = kt($ - nt, X, nt == 0),
                I($ / X) > h - st && T("overflow"),
                st += I($ / X),
                $ %= X,
                S.splice($++, 0, st);
            }
            return Mt(S);
        }
        function V(w) {
            let S, U, X, $, st, Z, it, ht, ut, nt, z, K = [], Q, Et, It, ve;
            for (w = q(w),
            Q = w.length,
            S = f,
            U = 0,
            st = p,
            Z = 0; Z < Q; ++Z)
                z = w[Z],
                z < 128 && K.push(M(z));
            for (X = $ = K.length,
            $ && K.push(_); X < Q; ) {
                for (it = h,
                Z = 0; Z < Q; ++Z)
                    z = w[Z],
                    z >= S && z < it && (it = z);
                for (Et = X + 1,
                it - S > I((h - U) / Et) && T("overflow"),
                U += (it - S) * Et,
                S = it,
                Z = 0; Z < Q; ++Z)
                    if (z = w[Z],
                    z < S && ++U > h && T("overflow"),
                    z == S) {
                        for (ht = U,
                        ut = a; nt = ut <= st ? l : ut >= st + u ? u : ut - st,
                            !(ht < nt); ut += a)
                            ve = ht - nt,
                            It = a - nt,
                            K.push(M(C(nt + ve % It, 0))),
                            ht = I(ve / It);
                        K.push(M(C(ht, 0))),
                        st = kt(U, Et, X == $),
                        U = 0,
                        ++X;
                    }
                ++U,
                ++S;
            }
            return K.join("");
        }
        function wt(w) {
            return B(w, function(S) {
                return g.test(S) ? Nt(S.slice(4).toLowerCase()) : S;
            });
        }
        function Ht(w) {
            return B(w, function(S) {
                return v.test(S) ? "xn--" + V(S) : S;
            });
        }
        if (o = {
            version: "1.3.2",
            ucs2: {
                decode: q,
                encode: Mt
            },
            decode: Nt,
            encode: V,
            toASCII: Ht,
            toUnicode: wt
        },
        i && r)
            if (e.exports == i)
                r.exports = o;
            else
                for (E in o)
                    o.hasOwnProperty(E) && (i[E] = o[E]);
        else
            s.punycode = o;
    }
    )(true);
}
)(Pn, hs);
let On = {
        isString: function(e) {
            return typeof e == "string";
        },
        isObject: function(e) {
            return typeof e == "object" && e !== null;
        },
        isNull: function(e) {
            return e === null;
        },
        isNullOrUndefined: function(e) {
            return e == null;
        }
    }
    , Be = {};
function Bn(e, t) {
    return Object.prototype.hasOwnProperty.call(e, t);
}
let Un = function(e, t, s, i) {
        t = t || "&",
        s = s || "=";
        let r = {};
        if (typeof e != "string" || e.length === 0)
            return r;
        let n = /\+/g;
        e = e.split(t);
        let o = 1e3;
        i && typeof i.maxKeys == "number" && (o = i.maxKeys);
        let h = e.length;
        o > 0 && h > o && (h = o);
        for (let a = 0; a < h; ++a) {
            var l = e[a].replace(n, "%20"), u = l.indexOf(s), c, d, p, f;
            u >= 0 ? (c = l.substr(0, u),
            d = l.substr(u + 1)) : (c = l,
            d = ""),
            p = decodeURIComponent(c),
            f = decodeURIComponent(d),
            Bn(r, p) ? Array.isArray(r[p]) ? r[p].push(f) : r[p] = [r[p], f] : r[p] = f;
        }
        return r;
    }
    , be = function(e) {
        switch (typeof e) {
            case "string":
                return e;
            case "boolean":
                return e ? "true" : "false";
            case "number":
                return isFinite(e) ? e : "";
            default:
                return "";
        }
    }
    , Ln = function(e, t, s, i) {
        return t = t || "&",
        s = s || "=",
        e === null && (e = void 0),
        typeof e == "object" ? Object.keys(e).map(function(r) {
            let n = encodeURIComponent(be(r)) + s;
            return Array.isArray(e[r]) ? e[r].map(function(o) {
                return n + encodeURIComponent(be(o));
            }).join(t) : n + encodeURIComponent(be(e[r]));
        }).join(t) : i ? encodeURIComponent(be(i)) + s + encodeURIComponent(be(e)) : "";
    };
Be.decode = Be.parse = Un;
Be.encode = Be.stringify = Ln;
let kn = hs
    , At = On
    , Dn = _s
    , Gn = Kn
    , Vn = Zn;
function vt() {
    this.protocol = null,
    this.slashes = null,
    this.auth = null,
    this.host = null,
    this.port = null,
    this.hostname = null,
    this.hash = null,
    this.search = null,
    this.query = null,
    this.pathname = null,
    this.path = null,
    this.href = null;
}
let Xn = /^([a-z0-9.+-]+:)/i
    , Hn = /:[0-9]*$/
    , $n = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/
    , zn = ["<", ">", '"', "`", " ", "\r", `
`, "	"]
    , jn = ["{", "}", "|", "\\", "^", "`"].concat(zn)
    , qs = ["'"].concat(jn)
    , Ui = ["%", "/", "?", ";", "#"].concat(qs)
    , Li = ["/", "?", "#"]
    , Yn = 255
    , ki = /^[+a-z0-9A-Z_-]{0,63}$/
    , Wn = /^([+a-z0-9A-Z_-]{0,63})(.*)$/
    , qn = {
        javascript: !0,
        "javascript:": !0
    }
    , Zs = {
        javascript: !0,
        "javascript:": !0
    }
    , ce = {
        http: !0,
        https: !0,
        ftp: !0,
        gopher: !0,
        file: !0,
        "http:": !0,
        "https:": !0,
        "ftp:": !0,
        "gopher:": !0,
        "file:": !0
    }
    , Ks = Be;
function _s(e, t, s) {
    if (e && At.isObject(e) && e instanceof vt)
        return e;
    let i = new vt;
    return i.parse(e, t, s),
    i;
}
vt.prototype.parse = function(e, t, s) {
    if (!At.isString(e))
        throw new TypeError("Parameter 'url' must be a string, not " + typeof e);
    let i = e.indexOf("?")
        , r = i !== -1 && i < e.indexOf("#") ? "?" : "#"
        , n = e.split(r)
        , o = /\\/g;
    n[0] = n[0].replace(o, "/"),
    e = n.join(r);
    let h = e;
    if (h = h.trim(),
    !s && e.split("#").length === 1) {
        let a = $n.exec(h);
        if (a)
            return this.path = h,
            this.href = h,
            this.pathname = a[1],
            a[2] ? (this.search = a[2],
            t ? this.query = Ks.parse(this.search.substr(1)) : this.query = this.search.substr(1)) : t && (this.search = "",
            this.query = {}),
            this;
    }
    let l = Xn.exec(h);
    if (l) {
        l = l[0];
        var u = l.toLowerCase();
        this.protocol = u,
        h = h.substr(l.length);
    }
    if (s || l || h.match(/^\/\/[^@\/]+@[^@\/]+/)) {
        var c = h.substr(0, 2) === "//";
        c && !(l && Zs[l]) && (h = h.substr(2),
        this.slashes = !0);
    }
    if (!Zs[l] && (c || l && !ce[l])) {
        for (var d = -1, p = 0; p < Li.length; p++) {
            var f = h.indexOf(Li[p]);
            f !== -1 && (d === -1 || f < d) && (d = f);
        }
        let _, g;
        d === -1 ? g = h.lastIndexOf("@") : g = h.lastIndexOf("@", d),
        g !== -1 && (_ = h.slice(0, g),
        h = h.slice(g + 1),
        this.auth = decodeURIComponent(_)),
        d = -1;
        for (var p = 0; p < Ui.length; p++) {
            var f = h.indexOf(Ui[p]);
            f !== -1 && (d === -1 || f < d) && (d = f);
        }
        d === -1 && (d = h.length),
        this.host = h.slice(0, d),
        h = h.slice(d),
        this.parseHost(),
        this.hostname = this.hostname || "";
        let v = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
        if (!v)
            for (var y = this.hostname.split(/\./), p = 0, m = y.length; p < m; p++) {
                let x = y[p];
                if (x && !x.match(ki)) {
                    for (var I = "", M = 0, E = x.length; M < E; M++)
                        x.charCodeAt(M) > 127 ? I += "x" : I += x[M];
                    if (!I.match(ki)) {
                        let T = y.slice(0, p)
                            , F = y.slice(p + 1)
                            , B = x.match(Wn);
                        B && (T.push(B[1]),
                        F.unshift(B[2])),
                        F.length && (h = "/" + F.join(".") + h),
                        this.hostname = T.join(".");
                        break;
                    }
                }
            }
        this.hostname.length > Yn ? this.hostname = "" : this.hostname = this.hostname.toLowerCase(),
        v || (this.hostname = kn.toASCII(this.hostname));
        var q = this.port ? ":" + this.port : ""
            , Mt = this.hostname || "";
        this.host = Mt + q,
        this.href += this.host,
        v && (this.hostname = this.hostname.substr(1, this.hostname.length - 2),
        h[0] !== "/" && (h = "/" + h));
    }
    if (!qn[u])
        for (var p = 0, m = qs.length; p < m; p++) {
            let R = qs[p];
            if (h.indexOf(R) !== -1) {
                let C = encodeURIComponent(R);
                C === R && (C = escape(R)),
                h = h.split(R).join(C);
            }
        }
    let kt = h.indexOf("#");
    kt !== -1 && (this.hash = h.substr(kt),
    h = h.slice(0, kt));
    let Nt = h.indexOf("?");
    if (Nt !== -1 ? (this.search = h.substr(Nt),
    this.query = h.substr(Nt + 1),
    t && (this.query = Ks.parse(this.query)),
    h = h.slice(0, Nt)) : t && (this.search = "",
    this.query = {}),
    h && (this.pathname = h),
    ce[u] && this.hostname && !this.pathname && (this.pathname = "/"),
    this.pathname || this.search) {
        var q = this.pathname || ""
            , V = this.search || "";
        this.path = q + V;
    }
    return this.href = this.format(),
    this;
}
;
function Zn(e) {
    return At.isString(e) && (e = _s(e)),
    e instanceof vt ? e.format() : vt.prototype.format.call(e);
}
vt.prototype.format = function() {
    let e = this.auth || "";
    e && (e = encodeURIComponent(e),
    e = e.replace(/%3A/i, ":"),
    e += "@");
    let t = this.protocol || ""
        , s = this.pathname || ""
        , i = this.hash || ""
        , r = !1
        , n = "";
    this.host ? r = e + this.host : this.hostname && (r = e + (this.hostname.indexOf(":") === -1 ? this.hostname : "[" + this.hostname + "]"),
    this.port && (r += ":" + this.port)),
    this.query && At.isObject(this.query) && Object.keys(this.query).length && (n = Ks.stringify(this.query));
    let o = this.search || n && "?" + n || "";
    return t && t.substr(-1) !== ":" && (t += ":"),
    this.slashes || (!t || ce[t]) && r !== !1 ? (r = "//" + (r || ""),
    s && s.charAt(0) !== "/" && (s = "/" + s)) : r || (r = ""),
    i && i.charAt(0) !== "#" && (i = "#" + i),
    o && o.charAt(0) !== "?" && (o = "?" + o),
    s = s.replace(/[?#]/g, function(h) {
        return encodeURIComponent(h);
    }),
    o = o.replace("#", "%23"),
    t + r + s + o + i;
}
;
function Kn(e, t) {
    return _s(e, !1, !0).resolve(t);
}
vt.prototype.resolve = function(e) {
    return this.resolveObject(_s(e, !1, !0)).format();
}
;
vt.prototype.resolveObject = function(e) {
    if (At.isString(e)) {
        let t = new vt;
        t.parse(e, !1, !0),
        e = t;
    }
    for (var s = new vt, i = Object.keys(this), r = 0; r < i.length; r++) {
        let n = i[r];
        s[n] = this[n];
    }
    if (s.hash = e.hash,
    e.href === "")
        return s.href = s.format(),
        s;
    if (e.slashes && !e.protocol) {
        for (let o = Object.keys(e), h = 0; h < o.length; h++) {
            let a = o[h];
            a !== "protocol" && (s[a] = e[a]);
        }
        return ce[s.protocol] && s.hostname && !s.pathname && (s.path = s.pathname = "/"),
        s.href = s.format(),
        s;
    }
    if (e.protocol && e.protocol !== s.protocol) {
        if (!ce[e.protocol]) {
            for (let l = Object.keys(e), u = 0; u < l.length; u++) {
                let c = l[u];
                s[c] = e[c];
            }
            return s.href = s.format(),
            s;
        }
        if (s.protocol = e.protocol,
        !e.host && !Zs[e.protocol]) {
            for (var m = (e.pathname || "").split("/"); m.length && !(e.host = m.shift()); )
                ;
            e.host || (e.host = ""),
            e.hostname || (e.hostname = ""),
            m[0] !== "" && m.unshift(""),
            m.length < 2 && m.unshift(""),
            s.pathname = m.join("/");
        } else
            s.pathname = e.pathname;
        if (s.search = e.search,
        s.query = e.query,
        s.host = e.host || "",
        s.auth = e.auth,
        s.hostname = e.hostname || e.host,
        s.port = e.port,
        s.pathname || s.search) {
            let d = s.pathname || ""
                , p = s.search || "";
            s.path = d + p;
        }
        return s.slashes = s.slashes || e.slashes,
        s.href = s.format(),
        s;
    }
    var f = s.pathname && s.pathname.charAt(0) === "/"
        , _ = e.host || e.pathname && e.pathname.charAt(0) === "/"
        , g = _ || f || s.host && e.pathname
        , v = g
        , y = s.pathname && s.pathname.split("/") || []
        , m = e.pathname && e.pathname.split("/") || []
        , x = s.protocol && !ce[s.protocol];
    if (x && (s.hostname = "",
    s.port = null,
    s.host && (y[0] === "" ? y[0] = s.host : y.unshift(s.host)),
    s.host = "",
    e.protocol && (e.hostname = null,
    e.port = null,
    e.host && (m[0] === "" ? m[0] = e.host : m.unshift(e.host)),
    e.host = null),
    g = g && (m[0] === "" || y[0] === "")),
    _)
        s.host = e.host || e.host === "" ? e.host : s.host,
        s.hostname = e.hostname || e.hostname === "" ? e.hostname : s.hostname,
        s.search = e.search,
        s.query = e.query,
        y = m;
    else if (m.length)
        y || (y = []),
        y.pop(),
        y = y.concat(m),
        s.search = e.search,
        s.query = e.query;
    else if (!At.isNullOrUndefined(e.search)) {
        if (x) {
            s.hostname = s.host = y.shift();
            var I = s.host && s.host.indexOf("@") > 0 ? s.host.split("@") : !1;
            I && (s.auth = I.shift(),
            s.host = s.hostname = I.shift());
        }
        return s.search = e.search,
        s.query = e.query,
        (!At.isNull(s.pathname) || !At.isNull(s.search)) && (s.path = (s.pathname ? s.pathname : "") + (s.search ? s.search : "")),
        s.href = s.format(),
        s;
    }
    if (!y.length)
        return s.pathname = null,
        s.search ? s.path = "/" + s.search : s.path = null,
        s.href = s.format(),
        s;
    for (var M = y.slice(-1)[0], E = (s.host || e.host || y.length > 1) && (M === "." || M === "..") || M === "", T = 0, F = y.length; F >= 0; F--)
        M = y[F],
        M === "." ? y.splice(F, 1) : M === ".." ? (y.splice(F, 1),
        T++) : T && (y.splice(F, 1),
        T--);
    if (!g && !v)
        for (; T--; T)
            y.unshift("..");
    g && y[0] !== "" && (!y[0] || y[0].charAt(0) !== "/") && y.unshift(""),
    E && y.join("/").substr(-1) !== "/" && y.push("");
    let B = y[0] === "" || y[0] && y[0].charAt(0) === "/";
    if (x) {
        s.hostname = s.host = B ? "" : y.length ? y.shift() : "";
        var I = s.host && s.host.indexOf("@") > 0 ? s.host.split("@") : !1;
        I && (s.auth = I.shift(),
        s.host = s.hostname = I.shift());
    }
    return g = g || s.host && y.length,
    g && !B && y.unshift(""),
    y.length ? s.pathname = y.join("/") : (s.pathname = null,
    s.path = null),
    (!At.isNull(s.pathname) || !At.isNull(s.search)) && (s.path = (s.pathname ? s.pathname : "") + (s.search ? s.search : "")),
    s.auth = e.auth || s.auth,
    s.slashes = s.slashes || e.slashes,
    s.href = s.format(),
    s;
}
;
vt.prototype.parseHost = function() {
    let e = this.host
        , t = Hn.exec(e);
    t && (t = t[0],
    t !== ":" && (this.port = t.substr(1)),
    e = e.substr(0, e.length - t.length)),
    e && (this.hostname = e);
}
;
const Jn = {
        parse: Dn,
        format: Vn,
        resolve: Gn
    }
    , Di = {};
function G(e, t, s=3) {
    if (Di[t])
        return;
    let i = new Error().stack;
    typeof i > "u" ? console.warn("PixiJS Deprecation Warning: ", `${t}
Deprecated since v${e}`) : (i = i.split(`
`).splice(s).join(`
`),
    console.groupCollapsed ? (console.groupCollapsed("%cPixiJS Deprecation Warning: %c%s", "color:#614108;background:#fffbe6", "font-weight:normal;color:#614108;background:#fffbe6", `${t}
Deprecated since v${e}`),
    console.warn(i),
    console.groupEnd()) : (console.warn("PixiJS Deprecation Warning: ", `${t}
Deprecated since v${e}`),
    console.warn(i))),
    Di[t] = !0;
}
let Cs;
function Qn() {
    return typeof Cs > "u" && (Cs = function() {
        let s;
        const t = {
            stencil: !0,
            failIfMajorPerformanceCaveat: O.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT
        };
        try {
            if (!O.ADAPTER.getWebGLRenderingContext())
                return !1;
            const i = O.ADAPTER.createCanvas();
            let r = i.getContext("webgl", t) || i.getContext("experimental-webgl", t);
            const n = !!((s = r == null ? void 0 : r.getContextAttributes()) != null && s.stencil);
            if (r) {
                const o = r.getExtension("WEBGL_lose_context");
                o && o.loseContext();
            }
            return r = null,
            n;
        } catch (i) {
            return !1;
        }
    }()),
    Cs;
}
var to = {
        grad: .9,
        turn: 360,
        rad: 360 / (2 * Math.PI)
    }
    , Pt = function(e) {
        return typeof e == "string" ? e.length > 0 : typeof e == "number";
    }
    , rt = function(e, t, s) {
        return t === void 0 && (t = 0),
        s === void 0 && (s = Math.pow(10, t)),
        Math.round(s * e) / s + 0;
    }
    , ft = function(e, t, s) {
        return t === void 0 && (t = 0),
        s === void 0 && (s = 1),
        e > s ? s : e > t ? e : t;
    }
    , xr = function(e) {
        return (e = isFinite(e) ? e % 360 : 0) > 0 ? e : e + 360;
    }
    , Gi = function(e) {
        return {
            r: ft(e.r, 0, 255),
            g: ft(e.g, 0, 255),
            b: ft(e.b, 0, 255),
            a: ft(e.a)
        };
    }
    , As = function(e) {
        return {
            r: rt(e.r),
            g: rt(e.g),
            b: rt(e.b),
            a: rt(e.a, 3)
        };
    }
    , eo = /^#([0-9a-f]{3,8})$/i
    , He = function(e) {
        let t = e.toString(16);
        return t.length < 2 ? "0" + t : t;
    }
    , yr = function(e) {
        let t = e.r
            , s = e.g
            , i = e.b
            , r = e.a
            , n = Math.max(t, s, i)
            , o = n - Math.min(t, s, i)
            , h = o ? n === t ? (s - i) / o : n === s ? 2 + (i - t) / o : 4 + (t - s) / o : 0;
        return {
            h: 60 * (h < 0 ? h + 6 : h),
            s: n ? o / n * 100 : 0,
            v: n / 255 * 100,
            a: r
        };
    }
    , vr = function(e) {
        let t = e.h
            , s = e.s
            , i = e.v
            , r = e.a;
        t = t / 360 * 6,
        s /= 100,
        i /= 100;
        let n = Math.floor(t)
            , o = i * (1 - s)
            , h = i * (1 - (t - n) * s)
            , a = i * (1 - (1 - t + n) * s)
            , l = n % 6;
        return {
            r: 255 * [i, h, o, o, a, i][l],
            g: 255 * [a, i, i, h, o, o][l],
            b: 255 * [o, o, a, i, i, h][l],
            a: r
        };
    }
    , Vi = function(e) {
        return {
            h: xr(e.h),
            s: ft(e.s, 0, 100),
            l: ft(e.l, 0, 100),
            a: ft(e.a)
        };
    }
    , Xi = function(e) {
        return {
            h: rt(e.h),
            s: rt(e.s),
            l: rt(e.l),
            a: rt(e.a, 3)
        };
    }
    , Hi = function(e) {
        return vr((s = (t = e).s,
        {
            h: t.h,
            s: (s *= ((i = t.l) < 50 ? i : 100 - i) / 100) > 0 ? 2 * s / (i + s) * 100 : 0,
            v: i + s,
            a: t.a
        }));
        let t, s, i;
    }
    , Ae = function(e) {
        return {
            h: (t = yr(e)).h,
            s: (r = (200 - (s = t.s)) * (i = t.v) / 100) > 0 && r < 200 ? s * i / 100 / (r <= 100 ? r : 200 - r) * 100 : 0,
            l: r / 2,
            a: t.a
        };
        let t, s, i, r;
    }
    , so = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i
    , io = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i
    , ro = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i
    , no = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i
    , Js = {
        string: [[function(e) {
            let t = eo.exec(e);
            return t ? (e = t[1]).length <= 4 ? {
                r: parseInt(e[0] + e[0], 16),
                g: parseInt(e[1] + e[1], 16),
                b: parseInt(e[2] + e[2], 16),
                a: e.length === 4 ? rt(parseInt(e[3] + e[3], 16) / 255, 2) : 1
            } : e.length === 6 || e.length === 8 ? {
                r: parseInt(e.substr(0, 2), 16),
                g: parseInt(e.substr(2, 2), 16),
                b: parseInt(e.substr(4, 2), 16),
                a: e.length === 8 ? rt(parseInt(e.substr(6, 2), 16) / 255, 2) : 1
            } : null : null;
        }
        , "hex"], [function(e) {
            let t = ro.exec(e) || no.exec(e);
            return t ? t[2] !== t[4] || t[4] !== t[6] ? null : Gi({
                r: Number(t[1]) / (t[2] ? 100 / 255 : 1),
                g: Number(t[3]) / (t[4] ? 100 / 255 : 1),
                b: Number(t[5]) / (t[6] ? 100 / 255 : 1),
                a: t[7] === void 0 ? 1 : Number(t[7]) / (t[8] ? 100 : 1)
            }) : null;
        }
        , "rgb"], [function(e) {
            let t = so.exec(e) || io.exec(e);
            if (!t)
                return null;
            let s, i, r = Vi({
                h: (s = t[1],
                i = t[2],
                i === void 0 && (i = "deg"),
                Number(s) * (to[i] || 1)),
                s: Number(t[3]),
                l: Number(t[4]),
                a: t[5] === void 0 ? 1 : Number(t[5]) / (t[6] ? 100 : 1)
            });
            return Hi(r);
        }
        , "hsl"]],
        object: [[function(e) {
            let t = e.r
                , s = e.g
                , i = e.b
                , r = e.a
                , n = r === void 0 ? 1 : r;
            return Pt(t) && Pt(s) && Pt(i) ? Gi({
                r: Number(t),
                g: Number(s),
                b: Number(i),
                a: Number(n)
            }) : null;
        }
        , "rgb"], [function(e) {
            let t = e.h
                , s = e.s
                , i = e.l
                , r = e.a
                , n = r === void 0 ? 1 : r;
            if (!Pt(t) || !Pt(s) || !Pt(i))
                return null;
            let o = Vi({
                h: Number(t),
                s: Number(s),
                l: Number(i),
                a: Number(n)
            });
            return Hi(o);
        }
        , "hsl"], [function(e) {
            let t = e.h
                , s = e.s
                , i = e.v
                , r = e.a
                , n = r === void 0 ? 1 : r;
            if (!Pt(t) || !Pt(s) || !Pt(i))
                return null;
            let o = function(h) {
                return {
                    h: xr(h.h),
                    s: ft(h.s, 0, 100),
                    v: ft(h.v, 0, 100),
                    a: ft(h.a)
                };
            }({
                h: Number(t),
                s: Number(s),
                v: Number(i),
                a: Number(n)
            });
            return vr(o);
        }
        , "hsv"]]
    }
    , $i = function(e, t) {
        for (let s = 0; s < t.length; s++) {
            let i = t[s][0](e);
            if (i)
                return [i, t[s][1]];
        }
        return [null, void 0];
    }
    , oo = function(e) {
        return typeof e == "string" ? $i(e.trim(), Js.string) : typeof e == "object" && e !== null ? $i(e, Js.object) : [null, void 0];
    }
    , Ss = function(e, t) {
        let s = Ae(e);
        return {
            h: s.h,
            s: ft(s.s + 100 * t, 0, 100),
            l: s.l,
            a: s.a
        };
    }
    , Ms = function(e) {
        return (299 * e.r + 587 * e.g + 114 * e.b) / 1e3 / 255;
    }
    , zi = function(e, t) {
        let s = Ae(e);
        return {
            h: s.h,
            s: s.s,
            l: ft(s.l + 100 * t, 0, 100),
            a: s.a
        };
    }
    , Qs = function() {
        function e(t) {
            this.parsed = oo(t)[0],
            this.rgba = this.parsed || {
                r: 0,
                g: 0,
                b: 0,
                a: 1
            };
        }
        return e.prototype.isValid = function() {
            return this.parsed !== null;
        }
        ,
        e.prototype.brightness = function() {
            return rt(Ms(this.rgba), 2);
        }
        ,
        e.prototype.isDark = function() {
            return Ms(this.rgba) < .5;
        }
        ,
        e.prototype.isLight = function() {
            return Ms(this.rgba) >= .5;
        }
        ,
        e.prototype.toHex = function() {
            return t = As(this.rgba),
            s = t.r,
            i = t.g,
            r = t.b,
            o = (n = t.a) < 1 ? He(rt(255 * n)) : "",
            "#" + He(s) + He(i) + He(r) + o;
            let t, s, i, r, n, o;
        }
        ,
        e.prototype.toRgb = function() {
            return As(this.rgba);
        }
        ,
        e.prototype.toRgbString = function() {
            return t = As(this.rgba),
            s = t.r,
            i = t.g,
            r = t.b,
            (n = t.a) < 1 ? "rgba(" + s + ", " + i + ", " + r + ", " + n + ")" : "rgb(" + s + ", " + i + ", " + r + ")";
            let t, s, i, r, n;
        }
        ,
        e.prototype.toHsl = function() {
            return Xi(Ae(this.rgba));
        }
        ,
        e.prototype.toHslString = function() {
            return t = Xi(Ae(this.rgba)),
            s = t.h,
            i = t.s,
            r = t.l,
            (n = t.a) < 1 ? "hsla(" + s + ", " + i + "%, " + r + "%, " + n + ")" : "hsl(" + s + ", " + i + "%, " + r + "%)";
            let t, s, i, r, n;
        }
        ,
        e.prototype.toHsv = function() {
            return t = yr(this.rgba),
            {
                h: rt(t.h),
                s: rt(t.s),
                v: rt(t.v),
                a: rt(t.a, 3)
            };
            let t;
        }
        ,
        e.prototype.invert = function() {
            return Rt({
                r: 255 - (t = this.rgba).r,
                g: 255 - t.g,
                b: 255 - t.b,
                a: t.a
            });
            let t;
        }
        ,
        e.prototype.saturate = function(t) {
            return t === void 0 && (t = .1),
            Rt(Ss(this.rgba, t));
        }
        ,
        e.prototype.desaturate = function(t) {
            return t === void 0 && (t = .1),
            Rt(Ss(this.rgba, -t));
        }
        ,
        e.prototype.grayscale = function() {
            return Rt(Ss(this.rgba, -1));
        }
        ,
        e.prototype.lighten = function(t) {
            return t === void 0 && (t = .1),
            Rt(zi(this.rgba, t));
        }
        ,
        e.prototype.darken = function(t) {
            return t === void 0 && (t = .1),
            Rt(zi(this.rgba, -t));
        }
        ,
        e.prototype.rotate = function(t) {
            return t === void 0 && (t = 15),
            this.hue(this.hue() + t);
        }
        ,
        e.prototype.alpha = function(t) {
            return typeof t == "number" ? Rt({
                r: (s = this.rgba).r,
                g: s.g,
                b: s.b,
                a: t
            }) : rt(this.rgba.a, 3);
            let s;
        }
        ,
        e.prototype.hue = function(t) {
            let s = Ae(this.rgba);
            return typeof t == "number" ? Rt({
                h: t,
                s: s.s,
                l: s.l,
                a: s.a
            }) : rt(s.h);
        }
        ,
        e.prototype.isEqual = function(t) {
            return this.toHex() === Rt(t).toHex();
        }
        ,
        e;
    }()
    , Rt = function(e) {
        return e instanceof Qs ? e : new Qs(e);
    }
    , ji = []
    , ho = function(e) {
        e.forEach(function(t) {
            ji.indexOf(t) < 0 && (t(Qs, Js),
            ji.push(t));
        });
    };
function ao(e, t) {
    let s = {
            white: "#ffffff",
            bisque: "#ffe4c4",
            blue: "#0000ff",
            cadetblue: "#5f9ea0",
            chartreuse: "#7fff00",
            chocolate: "#d2691e",
            coral: "#ff7f50",
            antiquewhite: "#faebd7",
            aqua: "#00ffff",
            azure: "#f0ffff",
            whitesmoke: "#f5f5f5",
            papayawhip: "#ffefd5",
            plum: "#dda0dd",
            blanchedalmond: "#ffebcd",
            black: "#000000",
            gold: "#ffd700",
            goldenrod: "#daa520",
            gainsboro: "#dcdcdc",
            cornsilk: "#fff8dc",
            cornflowerblue: "#6495ed",
            burlywood: "#deb887",
            aquamarine: "#7fffd4",
            beige: "#f5f5dc",
            crimson: "#dc143c",
            cyan: "#00ffff",
            darkblue: "#00008b",
            darkcyan: "#008b8b",
            darkgoldenrod: "#b8860b",
            darkkhaki: "#bdb76b",
            darkgray: "#a9a9a9",
            darkgreen: "#006400",
            darkgrey: "#a9a9a9",
            peachpuff: "#ffdab9",
            darkmagenta: "#8b008b",
            darkred: "#8b0000",
            darkorchid: "#9932cc",
            darkorange: "#ff8c00",
            darkslateblue: "#483d8b",
            gray: "#808080",
            darkslategray: "#2f4f4f",
            darkslategrey: "#2f4f4f",
            deeppink: "#ff1493",
            deepskyblue: "#00bfff",
            wheat: "#f5deb3",
            firebrick: "#b22222",
            floralwhite: "#fffaf0",
            ghostwhite: "#f8f8ff",
            darkviolet: "#9400d3",
            magenta: "#ff00ff",
            green: "#008000",
            dodgerblue: "#1e90ff",
            grey: "#808080",
            honeydew: "#f0fff0",
            hotpink: "#ff69b4",
            blueviolet: "#8a2be2",
            forestgreen: "#228b22",
            lawngreen: "#7cfc00",
            indianred: "#cd5c5c",
            indigo: "#4b0082",
            fuchsia: "#ff00ff",
            brown: "#a52a2a",
            maroon: "#800000",
            mediumblue: "#0000cd",
            lightcoral: "#f08080",
            darkturquoise: "#00ced1",
            lightcyan: "#e0ffff",
            ivory: "#fffff0",
            lightyellow: "#ffffe0",
            lightsalmon: "#ffa07a",
            lightseagreen: "#20b2aa",
            linen: "#faf0e6",
            mediumaquamarine: "#66cdaa",
            lemonchiffon: "#fffacd",
            lime: "#00ff00",
            khaki: "#f0e68c",
            mediumseagreen: "#3cb371",
            limegreen: "#32cd32",
            mediumspringgreen: "#00fa9a",
            lightskyblue: "#87cefa",
            lightblue: "#add8e6",
            midnightblue: "#191970",
            lightpink: "#ffb6c1",
            mistyrose: "#ffe4e1",
            moccasin: "#ffe4b5",
            mintcream: "#f5fffa",
            lightslategray: "#778899",
            lightslategrey: "#778899",
            navajowhite: "#ffdead",
            navy: "#000080",
            mediumvioletred: "#c71585",
            powderblue: "#b0e0e6",
            palegoldenrod: "#eee8aa",
            oldlace: "#fdf5e6",
            paleturquoise: "#afeeee",
            mediumturquoise: "#48d1cc",
            mediumorchid: "#ba55d3",
            rebeccapurple: "#663399",
            lightsteelblue: "#b0c4de",
            mediumslateblue: "#7b68ee",
            thistle: "#d8bfd8",
            tan: "#d2b48c",
            orchid: "#da70d6",
            mediumpurple: "#9370db",
            purple: "#800080",
            pink: "#ffc0cb",
            skyblue: "#87ceeb",
            springgreen: "#00ff7f",
            palegreen: "#98fb98",
            red: "#ff0000",
            yellow: "#ffff00",
            slateblue: "#6a5acd",
            lavenderblush: "#fff0f5",
            peru: "#cd853f",
            palevioletred: "#db7093",
            violet: "#ee82ee",
            teal: "#008080",
            slategray: "#708090",
            slategrey: "#708090",
            aliceblue: "#f0f8ff",
            darkseagreen: "#8fbc8f",
            darkolivegreen: "#556b2f",
            greenyellow: "#adff2f",
            seagreen: "#2e8b57",
            seashell: "#fff5ee",
            tomato: "#ff6347",
            silver: "#c0c0c0",
            sienna: "#a0522d",
            lavender: "#e6e6fa",
            lightgreen: "#90ee90",
            orange: "#ffa500",
            orangered: "#ff4500",
            steelblue: "#4682b4",
            royalblue: "#4169e1",
            turquoise: "#40e0d0",
            yellowgreen: "#9acd32",
            salmon: "#fa8072",
            saddlebrown: "#8b4513",
            sandybrown: "#f4a460",
            rosybrown: "#bc8f8f",
            darksalmon: "#e9967a",
            lightgoldenrodyellow: "#fafad2",
            snow: "#fffafa",
            lightgrey: "#d3d3d3",
            lightgray: "#d3d3d3",
            dimgray: "#696969",
            dimgrey: "#696969",
            olivedrab: "#6b8e23",
            olive: "#808000"
        }
        , i = {};
    for (let r in s)
        i[s[r]] = r;
    let n = {};
    e.prototype.toName = function(o) {
        if (!(this.rgba.a || this.rgba.r || this.rgba.g || this.rgba.b))
            return "transparent";
        let h, a, l = i[this.toHex()];
        if (l)
            return l;
        if (o != null && o.closest) {
            let u = this.toRgb()
                , c = 1 / 0
                , d = "black";
            if (!n.length)
                for (let p in s)
                    n[p] = new e(s[p]).toRgb();
            for (let f in s) {
                let _ = (h = u,
                a = n[f],
                Math.pow(h.r - a.r, 2) + Math.pow(h.g - a.g, 2) + Math.pow(h.b - a.b, 2));
                _ < c && (c = _,
                d = f);
            }
            return d;
        }
    }
    ,
    t.string.push([function(o) {
        let h = o.toLowerCase()
            , a = h === "transparent" ? "#0000" : s[h];
        return a ? new e(a).toRgb() : null;
    }
    , "name"]);
}
ho([ao]);
const de = class {
    constructor(e=16777215) {
        this._value = null,
        this._components = new Float32Array(4),
        this._components.fill(1),
        this._int = 16777215,
        this.value = e;
    }
    get red() {
        return this._components[0];
    }
    get green() {
        return this._components[1];
    }
    get blue() {
        return this._components[2];
    }
    get alpha() {
        return this._components[3];
    }
    setValue(e) {
        return this.value = e,
        this;
    }
    set value(e) {
        if (e instanceof de)
            this._value = this.cloneSource(e._value),
            this._int = e._int,
            this._components.set(e._components);
        else {
            if (e === null)
                throw new Error("Cannot set PIXI.Color#value to null");
            (this._value === null || !this.isSourceEqual(this._value, e)) && (this.normalize(e),
            this._value = this.cloneSource(e));
        }
    }
    get value() {
        return this._value;
    }
    cloneSource(e) {
        return typeof e == "string" || typeof e == "number" || e instanceof Number || e === null ? e : Array.isArray(e) || ArrayBuffer.isView(e) ? e.slice(0) : typeof e == "object" && e !== null ? {
            ...e
        } : e;
    }
    isSourceEqual(e, t) {
        const s = typeof e;
        if (s !== typeof t)
            return !1;
        if (s === "number" || s === "string" || e instanceof Number)
            return e === t;
        if (Array.isArray(e) && Array.isArray(t) || ArrayBuffer.isView(e) && ArrayBuffer.isView(t))
            return e.length !== t.length ? !1 : e.every( (r, n) => r === t[n]);
        if (e !== null && t !== null) {
            const r = Object.keys(e)
                , n = Object.keys(t);
            return r.length !== n.length ? !1 : r.every(o => e[o] === t[o]);
        }
        return e === t;
    }
    toRgba() {
        const [e,t,s,i] = this._components;
        return {
            r: e,
            g: t,
            b: s,
            a: i
        };
    }
    toRgb() {
        const [e,t,s] = this._components;
        return {
            r: e,
            g: t,
            b: s
        };
    }
    toRgbaString() {
        const [e,t,s] = this.toUint8RgbArray();
        return `rgba(${e},${t},${s},${this.alpha})`;
    }
    toUint8RgbArray(e) {
        const [t,s,i] = this._components;
        return e = e != null ? e : [],
        e[0] = Math.round(t * 255),
        e[1] = Math.round(s * 255),
        e[2] = Math.round(i * 255),
        e;
    }
    toRgbArray(e) {
        e = e != null ? e : [];
        const [t,s,i] = this._components;
        return e[0] = t,
        e[1] = s,
        e[2] = i,
        e;
    }
    toNumber() {
        return this._int;
    }
    toLittleEndianNumber() {
        const e = this._int;
        return (e >> 16) + (e & 65280) + ((e & 255) << 16);
    }
    multiply(e) {
        const [t,s,i,r] = de.temp.setValue(e)._components;
        return this._components[0] *= t,
        this._components[1] *= s,
        this._components[2] *= i,
        this._components[3] *= r,
        this.refreshInt(),
        this._value = null,
        this;
    }
    premultiply(e, t=!0) {
        return t && (this._components[0] *= e,
        this._components[1] *= e,
        this._components[2] *= e),
        this._components[3] = e,
        this.refreshInt(),
        this._value = null,
        this;
    }
    toPremultiplied(e, t=!0) {
        if (e === 1)
            return (255 << 24) + this._int;
        if (e === 0)
            return t ? 0 : this._int;
        let s = this._int >> 16 & 255
            , i = this._int >> 8 & 255
            , r = this._int & 255;
        return t && (s = s * e + .5 | 0,
        i = i * e + .5 | 0,
        r = r * e + .5 | 0),
        (e * 255 << 24) + (s << 16) + (i << 8) + r;
    }
    toHex() {
        const e = this._int.toString(16);
        return `#${"000000".substring(0, 6 - e.length) + e}`;
    }
    toHexa() {
        const t = Math.round(this._components[3] * 255).toString(16);
        return this.toHex() + "00".substring(0, 2 - t.length) + t;
    }
    setAlpha(e) {
        return this._components[3] = this._clamp(e),
        this;
    }
    round(e) {
        const [t,s,i] = this._components;
        return this._components[0] = Math.round(t * e) / e,
        this._components[1] = Math.round(s * e) / e,
        this._components[2] = Math.round(i * e) / e,
        this.refreshInt(),
        this._value = null,
        this;
    }
    toArray(e) {
        e = e != null ? e : [];
        const [t,s,i,r] = this._components;
        return e[0] = t,
        e[1] = s,
        e[2] = i,
        e[3] = r,
        e;
    }
    normalize(e) {
        let t, s, i, r;
        if ((typeof e == "number" || e instanceof Number) && e >= 0 && e <= 16777215) {
            const n = e;
            t = (n >> 16 & 255) / 255,
            s = (n >> 8 & 255) / 255,
            i = (n & 255) / 255,
            r = 1;
        } else if ((Array.isArray(e) || e instanceof Float32Array) && e.length >= 3 && e.length <= 4)
            e = this._clamp(e),
            [t,s,i,r=1] = e;
        else if ((e instanceof Uint8Array || e instanceof Uint8ClampedArray) && e.length >= 3 && e.length <= 4)
            e = this._clamp(e, 0, 255),
            [t,s,i,r=255] = e,
            t /= 255,
            s /= 255,
            i /= 255,
            r /= 255;
        else if (typeof e == "string" || typeof e == "object") {
            if (typeof e == "string") {
                const o = de.HEX_PATTERN.exec(e);
                o && (e = `#${o[2]}`);
            }
            const n = Rt(e);
            n.isValid() && ({r: t, g: s, b: i, a: r} = n.rgba,
            t /= 255,
            s /= 255,
            i /= 255);
        }
        if (t !== void 0)
            this._components[0] = t,
            this._components[1] = s,
            this._components[2] = i,
            this._components[3] = r,
            this.refreshInt();
        else
            throw new Error(`Unable to convert color ${e}`);
    }
    refreshInt() {
        this._clamp(this._components);
        const [e,t,s] = this._components;
        this._int = (e * 255 << 16) + (t * 255 << 8) + (s * 255 | 0);
    }
    _clamp(e, t=0, s=1) {
        return typeof e == "number" ? Math.min(Math.max(e, t), s) : (e.forEach( (i, r) => {
            e[r] = Math.min(Math.max(i, t), s);
        }),
        e);
    }
}
;
let lt = de;
lt.shared = new de;
lt.temp = new de;
lt.HEX_PATTERN = /^(#|0x)?(([a-f0-9]{3}){1,2}([a-f0-9]{2})?)$/i;
function lo() {
    const e = []
        , t = [];
    for (let i = 0; i < 32; i++)
        e[i] = i,
        t[i] = i;
    e[A.NORMAL_NPM] = A.NORMAL,
    e[A.ADD_NPM] = A.ADD,
    e[A.SCREEN_NPM] = A.SCREEN,
    t[A.NORMAL] = A.NORMAL_NPM,
    t[A.ADD] = A.ADD_NPM,
    t[A.SCREEN] = A.SCREEN_NPM;
    const s = [];
    return s.push(t),
    s.push(e),
    s;
}
const uo = lo();
function br(e) {
    if (e.BYTES_PER_ELEMENT === 4)
        return e instanceof Float32Array ? "Float32Array" : e instanceof Uint32Array ? "Uint32Array" : "Int32Array";
    if (e.BYTES_PER_ELEMENT === 2) {
        if (e instanceof Uint16Array)
            return "Uint16Array";
    } else if (e.BYTES_PER_ELEMENT === 1 && e instanceof Uint8Array)
        return "Uint8Array";
    return null;
}
function as(e) {
    return e += e === 0 ? 1 : 0,
    --e,
    e |= e >>> 1,
    e |= e >>> 2,
    e |= e >>> 4,
    e |= e >>> 8,
    e |= e >>> 16,
    e + 1;
}
function Yi(e) {
    return !(e & e - 1) && !!e;
}
function Wi(e) {
    let t = (e > 65535 ? 1 : 0) << 4;
    e >>>= t;
    let s = (e > 255 ? 1 : 0) << 3;
    return e >>>= s,
    t |= s,
    s = (e > 15 ? 1 : 0) << 2,
    e >>>= s,
    t |= s,
    s = (e > 3 ? 1 : 0) << 1,
    e >>>= s,
    t |= s,
    t | e >> 1;
}
function es(e, t, s) {
    const i = e.length;
    let r;
    if (t >= i || s === 0)
        return;
    s = t + s > i ? i - t : s;
    const n = i - s;
    for (r = t; r < n; ++r)
        e[r] = e[r + s];
    e.length = n;
}
function $e(e) {
    return e === 0 ? 0 : e < 0 ? -1 : 1;
}
let co = 0;
function Ue() {
    return ++co;
}
const qi = {}
    , Ct = Object.create(null)
    , Dt = Object.create(null);
let ze;
function fo(e, t=globalThis.location) {
    if (e.startsWith("data:"))
        return "";
    t = t || globalThis.location,
    ze || (ze = document.createElement("a")),
    ze.href = e;
    const s = Jn.parse(ze.href)
        , i = !s.port && t.port === "" || s.port === t.port;
    return s.hostname !== t.hostname || !i || s.protocol !== t.protocol ? "anonymous" : "";
}
function Zi(e, t=1) {
    let i;
    const s = (i = O.RETINA_PREFIX) == null ? void 0 : i.exec(e);
    return s ? parseFloat(s[1]) : t;
}
var P = (e => (e.Renderer = "renderer",
e.Application = "application",
e.RendererSystem = "renderer-webgl-system",
e.RendererPlugin = "renderer-webgl-plugin",
e.CanvasRendererSystem = "renderer-canvas-system",
e.CanvasRendererPlugin = "renderer-canvas-plugin",
e.Asset = "asset",
e.LoadParser = "load-parser",
e.ResolveParser = "resolve-parser",
e.CacheParser = "cache-parser",
e.DetectionParser = "detection-parser",
e))(P || {});
const ti = e => {
        if (typeof e == "function" || typeof e == "object" && e.extension) {
            if (!e.extension)
                throw new Error("Extension class must have an extension object");
            e = {
                ...typeof e.extension != "object" ? {
                    type: e.extension
                } : e.extension,
                ref: e
            };
        }
        if (typeof e == "object")
            e = {
                ...e
            };
        else
            throw new Error("Invalid extension type");
        return typeof e.type == "string" && (e.type = [e.type]),
        e;
    }
    , Ki = (e, t) => {
        let s;
        return (s = ti(e).priority) != null ? s : t;
    }
    , D = {
        _addHandlers: {},
        _removeHandlers: {},
        _queue: {},
        remove(...e) {
            return e.map(ti).forEach(t => {
                t.type.forEach(s => {
                    let i, r;
                    return (r = (i = this._removeHandlers)[s]) == null ? void 0 : r.call(i, t);
                });
            }),
            this;
        },
        add(...e) {
            return e.map(ti).forEach(t => {
                t.type.forEach(s => {
                    const i = this._addHandlers
                        , r = this._queue;
                    i[s] ? i[s](t) : (r[s] = r[s] || [],
                    r[s].push(t));
                });
            }),
            this;
        },
        handle(e, t, s) {
            const i = this._addHandlers
                , r = this._removeHandlers;
            if (i[e] || r[e])
                throw new Error(`Extension type ${e} already has a handler`);
            i[e] = t,
            r[e] = s;
            const n = this._queue;
            return n[e] && (n[e].forEach(o => t(o)),
            delete n[e]),
            this;
        },
        handleByMap(e, t) {
            return this.handle(
                e, 
                s => {
                    t[s.name] = s.ref;
                }
                , s => {
                    delete t[s.name];
                }
            );
        },
        handleByList(e, t, s=-1) {
            return this.handle(
                e, 
                i => {
                    t.includes(i.ref) || (t.push(i.ref),
                    t.sort( (r, n) => Ki(n, s) - Ki(r, s)));
                }
                , i => {
                    const r = t.indexOf(i.ref);
                    r !== -1 && t.splice(r, 1);
                }
            );
        }
    };
class po {
    constructor(t) {
        typeof t == "number" ? this.rawBinaryData = new ArrayBuffer(t) : t instanceof Uint8Array ? this.rawBinaryData = t.buffer : this.rawBinaryData = t,
        this.uint32View = new Uint32Array(this.rawBinaryData),
        this.float32View = new Float32Array(this.rawBinaryData);
    }
    get int8View() {
        return this._int8View || (this._int8View = new Int8Array(this.rawBinaryData)),
        this._int8View;
    }
    get uint8View() {
        return this._uint8View || (this._uint8View = new Uint8Array(this.rawBinaryData)),
        this._uint8View;
    }
    get int16View() {
        return this._int16View || (this._int16View = new Int16Array(this.rawBinaryData)),
        this._int16View;
    }
    get uint16View() {
        return this._uint16View || (this._uint16View = new Uint16Array(this.rawBinaryData)),
        this._uint16View;
    }
    get int32View() {
        return this._int32View || (this._int32View = new Int32Array(this.rawBinaryData)),
        this._int32View;
    }
    view(t) {
        return this[`${t}View`];
    }
    destroy() {
        this.rawBinaryData = null,
        this._int8View = null,
        this._uint8View = null,
        this._int16View = null,
        this._uint16View = null,
        this._int32View = null,
        this.uint32View = null,
        this.float32View = null;
    }
    static sizeOf(t) {
        switch (t) {
            case "int8":
            case "uint8":
                return 1;
            case "int16":
            case "uint16":
                return 2;
            case "int32":
            case "uint32":
            case "float32":
                return 4;
            default:
                throw new Error(`${t} isn't a valid view type`);
        }
    }
}
const mo = ["precision mediump float;", "void main(void){", "float test = 0.1;", "%forloop%", "gl_FragColor = vec4(0.0);", "}"].join(`
`);
function go(e) {
    let t = "";
    for (let s = 0; s < e; ++s)
        s > 0 && (t += `
else `),
        s < e - 1 && (t += `if(test == ${s}.0){}`);
    return t;
}
function _o(e, t) {
    if (e === 0)
        throw new Error("Invalid value of `0` passed to `checkMaxIfStatementsInShader`");
    const s = t.createShader(t.FRAGMENT_SHADER);
    for (; ; ) {
        const i = mo.replace(/%forloop%/gi, go(e));
        if (t.shaderSource(s, i),
        t.compileShader(s),
        !t.getShaderParameter(s, t.COMPILE_STATUS))
            e = e / 2 | 0;
        else
            break;
    }
    return e;
}
const Ns = 0
    , Fs = 1
    , Ps = 2
    , Os = 3
    , Bs = 4
    , Us = 5;
class xe {
    constructor() {
        this.data = 0,
        this.blendMode = A.NORMAL,
        this.polygonOffset = 0,
        this.blend = !0,
        this.depthMask = !0;
    }
    get blend() {
        return !!(this.data & 1 << Ns);
    }
    set blend(t) {
        !!(this.data & 1 << Ns) !== t && (this.data ^= 1 << Ns);
    }
    get offsets() {
        return !!(this.data & 1 << Fs);
    }
    set offsets(t) {
        !!(this.data & 1 << Fs) !== t && (this.data ^= 1 << Fs);
    }
    get culling() {
        return !!(this.data & 1 << Ps);
    }
    set culling(t) {
        !!(this.data & 1 << Ps) !== t && (this.data ^= 1 << Ps);
    }
    get depthTest() {
        return !!(this.data & 1 << Os);
    }
    set depthTest(t) {
        !!(this.data & 1 << Os) !== t && (this.data ^= 1 << Os);
    }
    get depthMask() {
        return !!(this.data & 1 << Us);
    }
    set depthMask(t) {
        !!(this.data & 1 << Us) !== t && (this.data ^= 1 << Us);
    }
    get clockwiseFrontFace() {
        return !!(this.data & 1 << Bs);
    }
    set clockwiseFrontFace(t) {
        !!(this.data & 1 << Bs) !== t && (this.data ^= 1 << Bs);
    }
    get blendMode() {
        return this._blendMode;
    }
    set blendMode(t) {
        this.blend = t !== A.NONE,
        this._blendMode = t;
    }
    get polygonOffset() {
        return this._polygonOffset;
    }
    set polygonOffset(t) {
        this.offsets = !!t,
        this._polygonOffset = t;
    }
    toString() {
        return `[@pixi/core:State blendMode=${this.blendMode} clockwiseFrontFace=${this.clockwiseFrontFace} culling=${this.culling} depthMask=${this.depthMask} polygonOffset=${this.polygonOffset}]`;
    }
    static for2d() {
        const t = new xe;
        return t.depthTest = !1,
        t.blend = !0,
        t;
    }
}
const ei = [];
function Tr(e, t) {
    if (!e)
        return null;
    let s = "";
    if (typeof e == "string") {
        const i = /\.(\w{3,4})(?:$|\?|#)/i.exec(e);
        i && (s = i[1].toLowerCase());
    }
    for (let i = ei.length - 1; i >= 0; --i) {
        const r = ei[i];
        if (r.test && r.test(e, s))
            return new r(e,t);
    }
    throw new Error("Unrecognized source type to auto-detect Resource");
}
class bt {
    constructor(t) {
        this.items = [],
        this._name = t,
        this._aliasCount = 0;
    }
    emit(t, s, i, r, n, o, h, a) {
        if (arguments.length > 8)
            throw new Error("max arguments reached");
        const {name: l, items: u} = this;
        this._aliasCount++;
        for (let c = 0, d = u.length; c < d; c++)
            u[c][l](t, s, i, r, n, o, h, a);
        return u === this.items && this._aliasCount--,
        this;
    }
    ensureNonAliasedItems() {
        this._aliasCount > 0 && this.items.length > 1 && (this._aliasCount = 0,
        this.items = this.items.slice(0));
    }
    add(t) {
        return t[this._name] && (this.ensureNonAliasedItems(),
        this.remove(t),
        this.items.push(t)),
        this;
    }
    remove(t) {
        const s = this.items.indexOf(t);
        return s !== -1 && (this.ensureNonAliasedItems(),
        this.items.splice(s, 1)),
        this;
    }
    contains(t) {
        return this.items.includes(t);
    }
    removeAll() {
        return this.ensureNonAliasedItems(),
        this.items.length = 0,
        this;
    }
    destroy() {
        this.removeAll(),
        this.items = null,
        this._name = null;
    }
    get empty() {
        return this.items.length === 0;
    }
    get name() {
        return this._name;
    }
}
Object.defineProperties(bt.prototype, {
    dispatch: {
        value: bt.prototype.emit
    },
    run: {
        value: bt.prototype.emit
    }
});
class Le {
    constructor(t=0, s=0) {
        this._width = t,
        this._height = s,
        this.destroyed = !1,
        this.internal = !1,
        this.onResize = new bt("setRealSize"),
        this.onUpdate = new bt("update"),
        this.onError = new bt("onError");
    }
    bind(t) {
        this.onResize.add(t),
        this.onUpdate.add(t),
        this.onError.add(t),
        (this._width || this._height) && this.onResize.emit(this._width, this._height);
    }
    unbind(t) {
        this.onResize.remove(t),
        this.onUpdate.remove(t),
        this.onError.remove(t);
    }
    resize(t, s) {
        (t !== this._width || s !== this._height) && (this._width = t,
        this._height = s,
        this.onResize.emit(t, s));
    }
    get valid() {
        return !!this._width && !!this._height;
    }
    update() {
        this.destroyed || this.onUpdate.emit();
    }
    load() {
        return Promise.resolve(this);
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    style(t, s, i) {
        return !1;
    }
    dispose() {}
    destroy() {
        this.destroyed || (this.destroyed = !0,
        this.dispose(),
        this.onError.removeAll(),
        this.onError = null,
        this.onResize.removeAll(),
        this.onResize = null,
        this.onUpdate.removeAll(),
        this.onUpdate = null);
    }
    static test(t, s) {
        return !1;
    }
}
class di extends Le {
    constructor(t, s) {
        const {width: i, height: r} = s || {};
        if (!i || !r)
            throw new Error("BufferResource width or height invalid");
        super(i, r),
        this.data = t;
    }
    upload(t, s, i) {
        const r = t.gl;
        r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL, s.alphaMode === Xt.UNPACK);
        const n = s.realWidth
            , o = s.realHeight;
        return i.width === n && i.height === o ? r.texSubImage2D(s.target, 0, 0, 0, n, o, s.format, i.type, this.data) : (i.width = n,
        i.height = o,
        r.texImage2D(s.target, 0, i.internalFormat, n, o, 0, s.format, i.type, this.data)),
        !0;
    }
    dispose() {
        this.data = null;
    }
    static test(t) {
        return t instanceof Float32Array || t instanceof Uint8Array || t instanceof Uint32Array;
    }
}
const xo = {
        scaleMode: Bt.NEAREST,
        format: b.RGBA,
        alphaMode: Xt.NPM
    }
    , ne = class extends pe {
        constructor(e=null, t=null) {
            super(),
            t = Object.assign({}, ne.defaultOptions, t);
            const {alphaMode: s, mipmap: i, anisotropicLevel: r, scaleMode: n, width: o, height: h, wrapMode: a, format: l, type: u, target: c, resolution: d, resourceOptions: p} = t;
            e && !(e instanceof Le) && (e = Tr(e, p),
            e.internal = !0),
            this.resolution = d || O.RESOLUTION,
            this.width = Math.round((o || 0) * this.resolution) / this.resolution,
            this.height = Math.round((h || 0) * this.resolution) / this.resolution,
            this._mipmap = i,
            this.anisotropicLevel = r,
            this._wrapMode = a,
            this._scaleMode = n,
            this.format = l,
            this.type = u,
            this.target = c,
            this.alphaMode = s,
            this.uid = Ue(),
            this.touched = 0,
            this.isPowerOfTwo = !1,
            this._refreshPOT(),
            this._glTextures = {},
            this.dirtyId = 0,
            this.dirtyStyleId = 0,
            this.cacheId = null,
            this.valid = o > 0 && h > 0,
            this.textureCacheIds = [],
            this.destroyed = !1,
            this.resource = null,
            this._batchEnabled = 0,
            this._batchLocation = 0,
            this.parentTextureArray = null,
            this.setResource(e);
        }
        get realWidth() {
            return Math.round(this.width * this.resolution);
        }
        get realHeight() {
            return Math.round(this.height * this.resolution);
        }
        get mipmap() {
            return this._mipmap;
        }
        set mipmap(e) {
            this._mipmap !== e && (this._mipmap = e,
            this.dirtyStyleId++);
        }
        get scaleMode() {
            return this._scaleMode;
        }
        set scaleMode(e) {
            this._scaleMode !== e && (this._scaleMode = e,
            this.dirtyStyleId++);
        }
        get wrapMode() {
            return this._wrapMode;
        }
        set wrapMode(e) {
            this._wrapMode !== e && (this._wrapMode = e,
            this.dirtyStyleId++);
        }
        setStyle(e, t) {
            let s;
            return e !== void 0 && e !== this.scaleMode && (this.scaleMode = e,
            s = !0),
            t !== void 0 && t !== this.mipmap && (this.mipmap = t,
            s = !0),
            s && this.dirtyStyleId++,
            this;
        }
        setSize(e, t, s) {
            return s = s || this.resolution,
            this.setRealSize(e * s, t * s, s);
        }
        setRealSize(e, t, s) {
            return this.resolution = s || this.resolution,
            this.width = Math.round(e) / this.resolution,
            this.height = Math.round(t) / this.resolution,
            this._refreshPOT(),
            this.update(),
            this;
        }
        _refreshPOT() {
            this.isPowerOfTwo = Yi(this.realWidth) && Yi(this.realHeight);
        }
        setResolution(e) {
            const t = this.resolution;
            return t === e ? this : (this.resolution = e,
            this.valid && (this.width = Math.round(this.width * t) / e,
            this.height = Math.round(this.height * t) / e,
            this.emit("update", this)),
            this._refreshPOT(),
            this);
        }
        setResource(e) {
            if (this.resource === e)
                return this;
            if (this.resource)
                throw new Error("Resource can be set only once");
            return e.bind(this),
            this.resource = e,
            this;
        }
        update() {
            this.valid ? (this.dirtyId++,
            this.dirtyStyleId++,
            this.emit("update", this)) : this.width > 0 && this.height > 0 && (this.valid = !0,
            this.emit("loaded", this),
            this.emit("update", this));
        }
        onError(e) {
            this.emit("error", this, e);
        }
        destroy() {
            this.resource && (this.resource.unbind(this),
            this.resource.internal && this.resource.destroy(),
            this.resource = null),
            this.cacheId && (delete Dt[this.cacheId],
            delete Ct[this.cacheId],
            this.cacheId = null),
            this.dispose(),
            ne.removeFromCache(this),
            this.textureCacheIds = null,
            this.destroyed = !0;
        }
        dispose() {
            this.emit("dispose", this);
        }
        castToBaseTexture() {
            return this;
        }
        static from(e, t, s=O.STRICT_TEXTURE_CACHE) {
            const i = typeof e == "string";
            let r = null;
            if (i)
                r = e;
            else {
                if (!e._pixiId) {
                    const o = (t == null ? void 0 : t.pixiIdPrefix) || "pixiid";
                    e._pixiId = `${o}_${Ue()}`;
                }
                r = e._pixiId;
            }
            let n = Dt[r];
            if (i && s && !n)
                throw new Error(`The cacheId "${r}" does not exist in BaseTextureCache.`);
            return n || (n = new ne(e,t),
            n.cacheId = r,
            ne.addToCache(n, r)),
            n;
        }
        static fromBuffer(e, t, s, i) {
            e = e || new Float32Array(t * s * 4);
            const r = new di(e,{
                    width: t,
                    height: s
                })
                , n = e instanceof Float32Array ? L.FLOAT : L.UNSIGNED_BYTE;
            return new ne(r,Object.assign({}, xo, {
                type: n
            }, i));
        }
        static addToCache(e, t) {
            t && (e.textureCacheIds.includes(t) || e.textureCacheIds.push(t),
            Dt[t] && Dt[t] !== e && console.warn(`BaseTexture added to the cache with an id [${t}] that already had an entry`),
            Dt[t] = e);
        }
        static removeFromCache(e) {
            if (typeof e == "string") {
                const t = Dt[e];
                if (t) {
                    const s = t.textureCacheIds.indexOf(e);
                    return s > -1 && t.textureCacheIds.splice(s, 1),
                    delete Dt[e],
                    t;
                }
            } else if (e != null && e.textureCacheIds) {
                for (let t = 0; t < e.textureCacheIds.length; ++t)
                    delete Dt[e.textureCacheIds[t]];
                return e.textureCacheIds.length = 0,
                e;
            }
            return null;
        }
    }
;
let k = ne;
k.defaultOptions = {
    mipmap: Qt.POW2,
    anisotropicLevel: 0,
    scaleMode: Bt.LINEAR,
    wrapMode: Ne.CLAMP,
    alphaMode: Xt.UNPACK,
    target: ue.TEXTURE_2D,
    format: b.RGBA,
    type: L.UNSIGNED_BYTE
};
k._globalBatch = 0;
class si {
    constructor() {
        this.texArray = null,
        this.blend = 0,
        this.type = Gt.TRIANGLES,
        this.start = 0,
        this.size = 0,
        this.data = null;
    }
}
let yo = 0;
class at {
    constructor(t, s=!0, i=!1) {
        this.data = t || new Float32Array(1),
        this._glBuffers = {},
        this._updateID = 0,
        this.index = i,
        this.static = s,
        this.id = yo++,
        this.disposeRunner = new bt("disposeBuffer");
    }
    update(t) {
        t instanceof Array && (t = new Float32Array(t)),
        this.data = t || this.data,
        this._updateID++;
    }
    dispose() {
        this.disposeRunner.emit(this, !1);
    }
    destroy() {
        this.dispose(),
        this.data = null;
    }
    set index(t) {
        this.type = t ? St.ELEMENT_ARRAY_BUFFER : St.ARRAY_BUFFER;
    }
    get index() {
        return this.type === St.ELEMENT_ARRAY_BUFFER;
    }
    static from(t) {
        return t instanceof Array && (t = new Float32Array(t)),
        new at(t);
    }
}
class ls {
    constructor(t, s=0, i=!1, r=L.FLOAT, n, o, h, a=1) {
        this.buffer = t,
        this.size = s,
        this.normalized = i,
        this.type = r,
        this.stride = n,
        this.start = o,
        this.instance = h,
        this.divisor = a;
    }
    destroy() {
        this.buffer = null;
    }
    static from(t, s, i, r, n) {
        return new ls(t,s,i,r,n);
    }
}
const vo = {
    Float32Array,
    Uint32Array,
    Int32Array,
    Uint8Array
};
function bo(e, t) {
    let s = 0
        , i = 0;
    const r = {};
    for (let a = 0; a < e.length; a++)
        i += t[a],
        s += e[a].length;
    const n = new ArrayBuffer(s * 4);
    let o = null
        , h = 0;
    for (let a = 0; a < e.length; a++) {
        const l = t[a]
            , u = e[a]
            , c = br(u);
        r[c] || (r[c] = new vo[c](n)),
        o = r[c];
        for (let d = 0; d < u.length; d++) {
            const p = (d / l | 0) * i + h
                , f = d % l;
            o[p + f] = u[d];
        }
        h += l;
    }
    return new Float32Array(n);
}
const Ji = {
    5126: 4,
    5123: 2,
    5121: 1
};
let To = 0;
const wo = {
    Float32Array,
    Uint32Array,
    Int32Array,
    Uint8Array,
    Uint16Array
};
class me {
    constructor(t=[], s={}) {
        this.buffers = t,
        this.indexBuffer = null,
        this.attributes = s,
        this.glVertexArrayObjects = {},
        this.id = To++,
        this.instanced = !1,
        this.instanceCount = 1,
        this.disposeRunner = new bt("disposeGeometry"),
        this.refCount = 0;
    }
    addAttribute(t, s, i=0, r=!1, n, o, h, a=!1) {
        if (!s)
            throw new Error("You must pass a buffer when creating an attribute");
        s instanceof at || (s instanceof Array && (s = new Float32Array(s)),
        s = new at(s));
        const l = t.split("|");
        if (l.length > 1) {
            for (let c = 0; c < l.length; c++)
                this.addAttribute(l[c], s, i, r, n);
            return this;
        }
        let u = this.buffers.indexOf(s);
        return u === -1 && (this.buffers.push(s),
        u = this.buffers.length - 1),
        this.attributes[t] = new ls(u,i,r,n,o,h,a),
        this.instanced = this.instanced || a,
        this;
    }
    getAttribute(t) {
        return this.attributes[t];
    }
    getBuffer(t) {
        return this.buffers[this.getAttribute(t).buffer];
    }
    addIndex(t) {
        return t instanceof at || (t instanceof Array && (t = new Uint16Array(t)),
        t = new at(t)),
        t.type = St.ELEMENT_ARRAY_BUFFER,
        this.indexBuffer = t,
        this.buffers.includes(t) || this.buffers.push(t),
        this;
    }
    getIndex() {
        return this.indexBuffer;
    }
    interleave() {
        if (this.buffers.length === 1 || this.buffers.length === 2 && this.indexBuffer)
            return this;
        const t = []
            , s = []
            , i = new at;
        let r;
        for (r in this.attributes) {
            const n = this.attributes[r]
                , o = this.buffers[n.buffer];
            t.push(o.data),
            s.push(n.size * Ji[n.type] / 4),
            n.buffer = 0;
        }
        for (i.data = bo(t, s),
        r = 0; r < this.buffers.length; r++)
            this.buffers[r] !== this.indexBuffer && this.buffers[r].destroy();
        return this.buffers = [i],
        this.indexBuffer && this.buffers.push(this.indexBuffer),
        this;
    }
    getSize() {
        for (const t in this.attributes) {
            const s = this.attributes[t];
            return this.buffers[s.buffer].data.length / (s.stride / 4 || s.size);
        }
        return 0;
    }
    dispose() {
        this.disposeRunner.emit(this, !1);
    }
    destroy() {
        this.dispose(),
        this.buffers = null,
        this.indexBuffer = null,
        this.attributes = null;
    }
    clone() {
        const t = new me;
        for (let s = 0; s < this.buffers.length; s++)
            t.buffers[s] = new at(this.buffers[s].data.slice(0));
        for (const s in this.attributes) {
            const i = this.attributes[s];
            t.attributes[s] = new ls(i.buffer,i.size,i.normalized,i.type,i.stride,i.start,i.instance);
        }
        return this.indexBuffer && (t.indexBuffer = t.buffers[this.buffers.indexOf(this.indexBuffer)],
        t.indexBuffer.type = St.ELEMENT_ARRAY_BUFFER),
        t;
    }
    static merge(t) {
        const s = new me
            , i = []
            , r = []
            , n = [];
        let o;
        for (let h = 0; h < t.length; h++) {
            o = t[h];
            for (let a = 0; a < o.buffers.length; a++)
                r[a] = r[a] || 0,
                r[a] += o.buffers[a].data.length,
                n[a] = 0;
        }
        for (let h = 0; h < o.buffers.length; h++)
            i[h] = new wo[br(o.buffers[h].data)](r[h]),
            s.buffers[h] = new at(i[h]);
        for (let h = 0; h < t.length; h++) {
            o = t[h];
            for (let a = 0; a < o.buffers.length; a++)
                i[a].set(o.buffers[a].data, n[a]),
                n[a] += o.buffers[a].data.length;
        }
        if (s.attributes = o.attributes,
        o.indexBuffer) {
            s.indexBuffer = s.buffers[o.buffers.indexOf(o.indexBuffer)],
            s.indexBuffer.type = St.ELEMENT_ARRAY_BUFFER;
            let h = 0
                , a = 0
                , l = 0
                , u = 0;
            for (let c = 0; c < o.buffers.length; c++)
                if (o.buffers[c] !== o.indexBuffer) {
                    u = c;
                    break;
                }
            for (const c in o.attributes) {
                const d = o.attributes[c];
                (d.buffer | 0) === u && (a += d.size * Ji[d.type] / 4);
            }
            for (let c = 0; c < t.length; c++) {
                const d = t[c].indexBuffer.data;
                for (let p = 0; p < d.length; p++)
                    s.indexBuffer.data[p + l] += h;
                h += t[c].buffers[u].data.length / a,
                l += d.length;
            }
        }
        return s;
    }
}
class wr extends me {
    constructor(t=!1) {
        super(),
        this._buffer = new at(null,t,!1),
        this._indexBuffer = new at(null,t,!0),
        this.addAttribute("aVertexPosition", this._buffer, 2, !1, L.FLOAT).addAttribute("aTextureCoord", this._buffer, 2, !1, L.FLOAT).addAttribute("aColor", this._buffer, 4, !0, L.UNSIGNED_BYTE).addAttribute("aTextureId", this._buffer, 1, !0, L.FLOAT).addIndex(this._indexBuffer);
    }
}
const us = Math.PI * 2
    , Eo = 180 / Math.PI
    , Io = Math.PI / 180;
var ot = (e => (e[e.POLY = 0] = "POLY",
e[e.RECT = 1] = "RECT",
e[e.CIRC = 2] = "CIRC",
e[e.ELIP = 3] = "ELIP",
e[e.RREC = 4] = "RREC",
e))(ot || {});
class W {
    constructor(t=0, s=0) {
        this.x = 0,
        this.y = 0,
        this.x = t,
        this.y = s;
    }
    clone() {
        return new W(this.x,this.y);
    }
    copyFrom(t) {
        return this.set(t.x, t.y),
        this;
    }
    copyTo(t) {
        return t.set(this.x, this.y),
        t;
    }
    equals(t) {
        return t.x === this.x && t.y === this.y;
    }
    set(t=0, s=t) {
        return this.x = t,
        this.y = s,
        this;
    }
    toString() {
        return `[@pixi/math:Point x=${this.x} y=${this.y}]`;
    }
}
const je = [new W, new W, new W, new W];
class H {
    constructor(t=0, s=0, i=0, r=0) {
        this.x = Number(t),
        this.y = Number(s),
        this.width = Number(i),
        this.height = Number(r),
        this.type = ot.RECT;
    }
    get left() {
        return this.x;
    }
    get right() {
        return this.x + this.width;
    }
    get top() {
        return this.y;
    }
    get bottom() {
        return this.y + this.height;
    }
    static get EMPTY() {
        return new H(0,0,0,0);
    }
    clone() {
        return new H(this.x,this.y,this.width,this.height);
    }
    copyFrom(t) {
        return this.x = t.x,
        this.y = t.y,
        this.width = t.width,
        this.height = t.height,
        this;
    }
    copyTo(t) {
        return t.x = this.x,
        t.y = this.y,
        t.width = this.width,
        t.height = this.height,
        t;
    }
    contains(t, s) {
        return this.width <= 0 || this.height <= 0 ? !1 : t >= this.x && t < this.x + this.width && s >= this.y && s < this.y + this.height;
    }
    intersects(t, s) {
        if (!s) {
            const T = this.x < t.x ? t.x : this.x;
            if ((this.right > t.right ? t.right : this.right) <= T)
                return !1;
            const B = this.y < t.y ? t.y : this.y;
            return (this.bottom > t.bottom ? t.bottom : this.bottom) > B;
        }
        const i = this.left
            , r = this.right
            , n = this.top
            , o = this.bottom;
        if (r <= i || o <= n)
            return !1;
        const h = je[0].set(t.left, t.top)
            , a = je[1].set(t.left, t.bottom)
            , l = je[2].set(t.right, t.top)
            , u = je[3].set(t.right, t.bottom);
        if (l.x <= h.x || a.y <= h.y)
            return !1;
        const c = Math.sign(s.a * s.d - s.b * s.c);
        if (c === 0 || (s.apply(h, h),
        s.apply(a, a),
        s.apply(l, l),
        s.apply(u, u),
        Math.max(h.x, a.x, l.x, u.x) <= i || Math.min(h.x, a.x, l.x, u.x) >= r || Math.max(h.y, a.y, l.y, u.y) <= n || Math.min(h.y, a.y, l.y, u.y) >= o))
            return !1;
        const d = c * (a.y - h.y)
            , p = c * (h.x - a.x)
            , f = d * i + p * n
            , _ = d * r + p * n
            , g = d * i + p * o
            , v = d * r + p * o;
        if (Math.max(f, _, g, v) <= d * h.x + p * h.y || Math.min(f, _, g, v) >= d * u.x + p * u.y)
            return !1;
        const y = c * (h.y - l.y)
            , m = c * (l.x - h.x)
            , x = y * i + m * n
            , I = y * r + m * n
            , M = y * i + m * o
            , E = y * r + m * o;
        return !(Math.max(x, I, M, E) <= y * h.x + m * h.y || Math.min(x, I, M, E) >= y * u.x + m * u.y);
    }
    pad(t=0, s=t) {
        return this.x -= t,
        this.y -= s,
        this.width += t * 2,
        this.height += s * 2,
        this;
    }
    fit(t) {
        const s = Math.max(this.x, t.x)
            , i = Math.min(this.x + this.width, t.x + t.width)
            , r = Math.max(this.y, t.y)
            , n = Math.min(this.y + this.height, t.y + t.height);
        return this.x = s,
        this.width = Math.max(i - s, 0),
        this.y = r,
        this.height = Math.max(n - r, 0),
        this;
    }
    ceil(t=1, s=.001) {
        const i = Math.ceil((this.x + this.width - s) * t) / t
            , r = Math.ceil((this.y + this.height - s) * t) / t;
        return this.x = Math.floor((this.x + s) * t) / t,
        this.y = Math.floor((this.y + s) * t) / t,
        this.width = i - this.x,
        this.height = r - this.y,
        this;
    }
    enlarge(t) {
        const s = Math.min(this.x, t.x)
            , i = Math.max(this.x + this.width, t.x + t.width)
            , r = Math.min(this.y, t.y)
            , n = Math.max(this.y + this.height, t.y + t.height);
        return this.x = s,
        this.width = i - s,
        this.y = r,
        this.height = n - r,
        this;
    }
    toString() {
        return `[@pixi/math:Rectangle x=${this.x} y=${this.y} width=${this.width} height=${this.height}]`;
    }
}
class fi {
    constructor(t=0, s=0, i=0) {
        this.x = t,
        this.y = s,
        this.radius = i,
        this.type = ot.CIRC;
    }
    clone() {
        return new fi(this.x,this.y,this.radius);
    }
    contains(t, s) {
        if (this.radius <= 0)
            return !1;
        const i = this.radius * this.radius;
        let r = this.x - t
            , n = this.y - s;
        return r *= r,
        n *= n,
        r + n <= i;
    }
    getBounds() {
        return new H(this.x - this.radius,this.y - this.radius,this.radius * 2,this.radius * 2);
    }
    toString() {
        return `[@pixi/math:Circle x=${this.x} y=${this.y} radius=${this.radius}]`;
    }
}
class pi {
    constructor(t=0, s=0, i=0, r=0) {
        this.x = t,
        this.y = s,
        this.width = i,
        this.height = r,
        this.type = ot.ELIP;
    }
    clone() {
        return new pi(this.x,this.y,this.width,this.height);
    }
    contains(t, s) {
        if (this.width <= 0 || this.height <= 0)
            return !1;
        let i = (t - this.x) / this.width
            , r = (s - this.y) / this.height;
        return i *= i,
        r *= r,
        i + r <= 1;
    }
    getBounds() {
        return new H(this.x - this.width,this.y - this.height,this.width,this.height);
    }
    toString() {
        return `[@pixi/math:Ellipse x=${this.x} y=${this.y} width=${this.width} height=${this.height}]`;
    }
}
class Se {
    constructor(...t) {
        let s = Array.isArray(t[0]) ? t[0] : t;
        if (typeof s[0] != "number") {
            const i = [];
            for (let r = 0, n = s.length; r < n; r++)
                i.push(s[r].x, s[r].y);
            s = i;
        }
        this.points = s,
        this.type = ot.POLY,
        this.closeStroke = !0;
    }
    clone() {
        const t = this.points.slice()
            , s = new Se(t);
        return s.closeStroke = this.closeStroke,
        s;
    }
    contains(t, s) {
        let i = !1;
        const r = this.points.length / 2;
        for (let n = 0, o = r - 1; n < r; o = n++) {
            const h = this.points[n * 2]
                , a = this.points[n * 2 + 1]
                , l = this.points[o * 2]
                , u = this.points[o * 2 + 1];
            a > s != u > s && t < (l - h) * ((s - a) / (u - a)) + h && (i = !i);
        }
        return i;
    }
    toString() {
        return `[@pixi/math:PolygoncloseStroke=${this.closeStroke}points=${this.points.reduce( (t, s) => `${t}, ${s}`, "")}]`;
    }
}
class mi {
    constructor(t=0, s=0, i=0, r=0, n=20) {
        this.x = t,
        this.y = s,
        this.width = i,
        this.height = r,
        this.radius = n,
        this.type = ot.RREC;
    }
    clone() {
        return new mi(this.x,this.y,this.width,this.height,this.radius);
    }
    contains(t, s) {
        if (this.width <= 0 || this.height <= 0)
            return !1;
        if (t >= this.x && t <= this.x + this.width && s >= this.y && s <= this.y + this.height) {
            const i = Math.max(0, Math.min(this.radius, Math.min(this.width, this.height) / 2));
            if (s >= this.y + i && s <= this.y + this.height - i || t >= this.x + i && t <= this.x + this.width - i)
                return !0;
            let r = t - (this.x + i)
                , n = s - (this.y + i);
            const o = i * i;
            if (r * r + n * n <= o || (r = t - (this.x + this.width - i),
            r * r + n * n <= o) || (n = s - (this.y + this.height - i),
            r * r + n * n <= o) || (r = t - (this.x + i),
            r * r + n * n <= o))
                return !0;
        }
        return !1;
    }
    toString() {
        return `[@pixi/math:RoundedRectangle x=${this.x} y=${this.y}width=${this.width} height=${this.height} radius=${this.radius}]`;
    }
}
class et {
    constructor(t=1, s=0, i=0, r=1, n=0, o=0) {
        this.array = null,
        this.a = t,
        this.b = s,
        this.c = i,
        this.d = r,
        this.tx = n,
        this.ty = o;
    }
    fromArray(t) {
        this.a = t[0],
        this.b = t[1],
        this.c = t[3],
        this.d = t[4],
        this.tx = t[2],
        this.ty = t[5];
    }
    set(t, s, i, r, n, o) {
        return this.a = t,
        this.b = s,
        this.c = i,
        this.d = r,
        this.tx = n,
        this.ty = o,
        this;
    }
    toArray(t, s) {
        this.array || (this.array = new Float32Array(9));
        const i = s || this.array;
        return t ? (i[0] = this.a,
        i[1] = this.b,
        i[2] = 0,
        i[3] = this.c,
        i[4] = this.d,
        i[5] = 0,
        i[6] = this.tx,
        i[7] = this.ty,
        i[8] = 1) : (i[0] = this.a,
        i[1] = this.c,
        i[2] = this.tx,
        i[3] = this.b,
        i[4] = this.d,
        i[5] = this.ty,
        i[6] = 0,
        i[7] = 0,
        i[8] = 1),
        i;
    }
    apply(t, s) {
        s = s || new W;
        const i = t.x
            , r = t.y;
        return s.x = this.a * i + this.c * r + this.tx,
        s.y = this.b * i + this.d * r + this.ty,
        s;
    }
    applyInverse(t, s) {
        s = s || new W;
        const i = 1 / (this.a * this.d + this.c * -this.b)
            , r = t.x
            , n = t.y;
        return s.x = this.d * i * r + -this.c * i * n + (this.ty * this.c - this.tx * this.d) * i,
        s.y = this.a * i * n + -this.b * i * r + (-this.ty * this.a + this.tx * this.b) * i,
        s;
    }
    translate(t, s) {
        return this.tx += t,
        this.ty += s,
        this;
    }
    scale(t, s) {
        return this.a *= t,
        this.d *= s,
        this.c *= t,
        this.b *= s,
        this.tx *= t,
        this.ty *= s,
        this;
    }
    rotate(t) {
        const s = Math.cos(t)
            , i = Math.sin(t)
            , r = this.a
            , n = this.c
            , o = this.tx;
        return this.a = r * s - this.b * i,
        this.b = r * i + this.b * s,
        this.c = n * s - this.d * i,
        this.d = n * i + this.d * s,
        this.tx = o * s - this.ty * i,
        this.ty = o * i + this.ty * s,
        this;
    }
    append(t) {
        const s = this.a
            , i = this.b
            , r = this.c
            , n = this.d;
        return this.a = t.a * s + t.b * r,
        this.b = t.a * i + t.b * n,
        this.c = t.c * s + t.d * r,
        this.d = t.c * i + t.d * n,
        this.tx = t.tx * s + t.ty * r + this.tx,
        this.ty = t.tx * i + t.ty * n + this.ty,
        this;
    }
    setTransform(t, s, i, r, n, o, h, a, l) {
        return this.a = Math.cos(h + l) * n,
        this.b = Math.sin(h + l) * n,
        this.c = -Math.sin(h - a) * o,
        this.d = Math.cos(h - a) * o,
        this.tx = t - (i * this.a + r * this.c),
        this.ty = s - (i * this.b + r * this.d),
        this;
    }
    prepend(t) {
        const s = this.tx;
        if (t.a !== 1 || t.b !== 0 || t.c !== 0 || t.d !== 1) {
            const i = this.a
                , r = this.c;
            this.a = i * t.a + this.b * t.c,
            this.b = i * t.b + this.b * t.d,
            this.c = r * t.a + this.d * t.c,
            this.d = r * t.b + this.d * t.d;
        }
        return this.tx = s * t.a + this.ty * t.c + t.tx,
        this.ty = s * t.b + this.ty * t.d + t.ty,
        this;
    }
    decompose(t) {
        const s = this.a
            , i = this.b
            , r = this.c
            , n = this.d
            , o = t.pivot
            , h = -Math.atan2(-r, n)
            , a = Math.atan2(i, s)
            , l = Math.abs(h + a);
        return l < 1e-5 || Math.abs(us - l) < 1e-5 ? (t.rotation = a,
        t.skew.x = t.skew.y = 0) : (t.rotation = 0,
        t.skew.x = h,
        t.skew.y = a),
        t.scale.x = Math.sqrt(s * s + i * i),
        t.scale.y = Math.sqrt(r * r + n * n),
        t.position.x = this.tx + (o.x * s + o.y * r),
        t.position.y = this.ty + (o.x * i + o.y * n),
        t;
    }
    invert() {
        const t = this.a
            , s = this.b
            , i = this.c
            , r = this.d
            , n = this.tx
            , o = t * r - s * i;
        return this.a = r / o,
        this.b = -s / o,
        this.c = -i / o,
        this.d = t / o,
        this.tx = (i * this.ty - r * n) / o,
        this.ty = -(t * this.ty - s * n) / o,
        this;
    }
    identity() {
        return this.a = 1,
        this.b = 0,
        this.c = 0,
        this.d = 1,
        this.tx = 0,
        this.ty = 0,
        this;
    }
    clone() {
        const t = new et;
        return t.a = this.a,
        t.b = this.b,
        t.c = this.c,
        t.d = this.d,
        t.tx = this.tx,
        t.ty = this.ty,
        t;
    }
    copyTo(t) {
        return t.a = this.a,
        t.b = this.b,
        t.c = this.c,
        t.d = this.d,
        t.tx = this.tx,
        t.ty = this.ty,
        t;
    }
    copyFrom(t) {
        return this.a = t.a,
        this.b = t.b,
        this.c = t.c,
        this.d = t.d,
        this.tx = t.tx,
        this.ty = t.ty,
        this;
    }
    toString() {
        return `[@pixi/math:Matrix a=${this.a} b=${this.b} c=${this.c} d=${this.d} tx=${this.tx} ty=${this.ty}]`;
    }
    static get IDENTITY() {
        return new et;
    }
    static get TEMP_MATRIX() {
        return new et;
    }
}
const Yt = [1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1]
    , Wt = [0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1]
    , qt = [0, -1, -1, -1, 0, 1, 1, 1, 0, 1, 1, 1, 0, -1, -1, -1]
    , Zt = [1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, 1, 1, 1, 0, -1]
    , ii = []
    , Er = []
    , Ye = Math.sign;
function Ro() {
    for (let e = 0; e < 16; e++) {
        const t = [];
        ii.push(t);
        for (let s = 0; s < 16; s++) {
            const i = Ye(Yt[e] * Yt[s] + qt[e] * Wt[s])
                , r = Ye(Wt[e] * Yt[s] + Zt[e] * Wt[s])
                , n = Ye(Yt[e] * qt[s] + qt[e] * Zt[s])
                , o = Ye(Wt[e] * qt[s] + Zt[e] * Zt[s]);
            for (let h = 0; h < 16; h++)
                if (Yt[h] === i && Wt[h] === r && qt[h] === n && Zt[h] === o) {
                    t.push(h);
                    break;
                }
        }
    }
    for (let e = 0; e < 16; e++) {
        const t = new et;
        t.set(Yt[e], Wt[e], qt[e], Zt[e], 0, 0),
        Er.push(t);
    }
}
Ro();
const j = {
    E: 0,
    SE: 1,
    S: 2,
    SW: 3,
    W: 4,
    NW: 5,
    N: 6,
    NE: 7,
    MIRROR_VERTICAL: 8,
    MAIN_DIAGONAL: 10,
    MIRROR_HORIZONTAL: 12,
    REVERSE_DIAGONAL: 14,
    uX: e => Yt[e],
    uY: e => Wt[e],
    vX: e => qt[e],
    vY: e => Zt[e],
    inv: e => e & 8 ? e & 15 : -e & 7,
    add: (e, t) => ii[e][t],
    sub: (e, t) => ii[e][j.inv(t)],
    rotate180: e => e ^ 4,
    isVertical: e => (e & 3) === 2,
    byDirection: (e, t) => Math.abs(e) * 2 <= Math.abs(t) ? t >= 0 ? j.S : j.N : Math.abs(t) * 2 <= Math.abs(e) ? e > 0 ? j.E : j.W : t > 0 ? e > 0 ? j.SE : j.SW : e > 0 ? j.NE : j.NW,
    matrixAppendRotationInv: (e, t, s=0, i=0) => {
        const r = Er[j.inv(t)];
        r.tx = s,
        r.ty = i,
        e.append(r);
    }
};
class Kt {
    constructor(t, s, i=0, r=0) {
        this._x = i,
        this._y = r,
        this.cb = t,
        this.scope = s;
    }
    clone(t=this.cb, s=this.scope) {
        return new Kt(t,s,this._x,this._y);
    }
    set(t=0, s=t) {
        return (this._x !== t || this._y !== s) && (this._x = t,
        this._y = s,
        this.cb.call(this.scope)),
        this;
    }
    copyFrom(t) {
        return (this._x !== t.x || this._y !== t.y) && (this._x = t.x,
        this._y = t.y,
        this.cb.call(this.scope)),
        this;
    }
    copyTo(t) {
        return t.set(this._x, this._y),
        t;
    }
    equals(t) {
        return t.x === this._x && t.y === this._y;
    }
    toString() {
        return `[@pixi/math:ObservablePoint x=0 y=0 scope=${this.scope}]`;
    }
    get x() {
        return this._x;
    }
    set x(t) {
        this._x !== t && (this._x = t,
        this.cb.call(this.scope));
    }
    get y() {
        return this._y;
    }
    set y(t) {
        this._y !== t && (this._y = t,
        this.cb.call(this.scope));
    }
}
const Ir = class {
    constructor() {
        this.worldTransform = new et,
        this.localTransform = new et,
        this.position = new Kt(this.onChange,this,0,0),
        this.scale = new Kt(this.onChange,this,1,1),
        this.pivot = new Kt(this.onChange,this,0,0),
        this.skew = new Kt(this.updateSkew,this,0,0),
        this._rotation = 0,
        this._cx = 1,
        this._sx = 0,
        this._cy = 0,
        this._sy = 1,
        this._localID = 0,
        this._currentLocalID = 0,
        this._worldID = 0,
        this._parentID = 0;
    }
    onChange() {
        this._localID++;
    }
    updateSkew() {
        this._cx = Math.cos(this._rotation + this.skew.y),
        this._sx = Math.sin(this._rotation + this.skew.y),
        this._cy = -Math.sin(this._rotation - this.skew.x),
        this._sy = Math.cos(this._rotation - this.skew.x),
        this._localID++;
    }
    toString() {
        return `[@pixi/math:Transform position=(${this.position.x}, ${this.position.y}) rotation=${this.rotation} scale=(${this.scale.x}, ${this.scale.y}) skew=(${this.skew.x}, ${this.skew.y}) ]`;
    }
    updateLocalTransform() {
        const e = this.localTransform;
        this._localID !== this._currentLocalID && (e.a = this._cx * this.scale.x,
        e.b = this._sx * this.scale.x,
        e.c = this._cy * this.scale.y,
        e.d = this._sy * this.scale.y,
        e.tx = this.position.x - (this.pivot.x * e.a + this.pivot.y * e.c),
        e.ty = this.position.y - (this.pivot.x * e.b + this.pivot.y * e.d),
        this._currentLocalID = this._localID,
        this._parentID = -1);
    }
    updateTransform(e) {
        const t = this.localTransform;
        if (this._localID !== this._currentLocalID && (t.a = this._cx * this.scale.x,
        t.b = this._sx * this.scale.x,
        t.c = this._cy * this.scale.y,
        t.d = this._sy * this.scale.y,
        t.tx = this.position.x - (this.pivot.x * t.a + this.pivot.y * t.c),
        t.ty = this.position.y - (this.pivot.x * t.b + this.pivot.y * t.d),
        this._currentLocalID = this._localID,
        this._parentID = -1),
        this._parentID !== e._worldID) {
            const s = e.worldTransform
                , i = this.worldTransform;
            i.a = t.a * s.a + t.b * s.c,
            i.b = t.a * s.b + t.b * s.d,
            i.c = t.c * s.a + t.d * s.c,
            i.d = t.c * s.b + t.d * s.d,
            i.tx = t.tx * s.a + t.ty * s.c + s.tx,
            i.ty = t.tx * s.b + t.ty * s.d + s.ty,
            this._parentID = e._worldID,
            this._worldID++;
        }
    }
    setFromMatrix(e) {
        e.decompose(this),
        this._localID++;
    }
    get rotation() {
        return this._rotation;
    }
    set rotation(e) {
        this._rotation !== e && (this._rotation = e,
        this.updateSkew());
    }
}
;
let gi = Ir;
gi.IDENTITY = new Ir;
let Co = `varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void){
   gl_FragColor *= texture2D(uSampler, vTextureCoord);
}`
    , Ao = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void){
   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
   vTextureCoord = aTextureCoord;
}
`;
function Qi(e, t, s) {
    const i = e.createShader(t);
    return e.shaderSource(i, s),
    e.compileShader(i),
    i;
}
function Ls(e) {
    const t = new Array(e);
    for (let s = 0; s < t.length; s++)
        t[s] = !1;
    return t;
}
function Rr(e, t) {
    switch (e) {
        case "float":
            return 0;
        case "vec2":
            return new Float32Array(2 * t);
        case "vec3":
            return new Float32Array(3 * t);
        case "vec4":
            return new Float32Array(4 * t);
        case "int":
        case "uint":
        case "sampler2D":
        case "sampler2DArray":
            return 0;
        case "ivec2":
            return new Int32Array(2 * t);
        case "ivec3":
            return new Int32Array(3 * t);
        case "ivec4":
            return new Int32Array(4 * t);
        case "uvec2":
            return new Uint32Array(2 * t);
        case "uvec3":
            return new Uint32Array(3 * t);
        case "uvec4":
            return new Uint32Array(4 * t);
        case "bool":
            return !1;
        case "bvec2":
            return Ls(2 * t);
        case "bvec3":
            return Ls(3 * t);
        case "bvec4":
            return Ls(4 * t);
        case "mat2":
            return new Float32Array([1, 0, 0, 1]);
        case "mat3":
            return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        case "mat4":
            return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    }
    return null;
}
const fe = [{
        test: e => e.type === "float" && e.size === 1 && !e.isArray,
        code: e => `
            if(uv["${e}"] !== ud["${e}"].value)
            {
                ud["${e}"].value = uv["${e}"]
                gl.uniform1f(ud["${e}"].location, uv["${e}"])
            }
            `
    }, {
        test: (e, t) => (e.type === "sampler2D" || e.type === "samplerCube" || e.type === "sampler2DArray") && e.size === 1 && !e.isArray && (t == null || t.castToBaseTexture !== void 0),
        code: e => `t = syncData.textureCount++;

            renderer.texture.bind(uv["${e}"], t);

            if(ud["${e}"].value !== t)
            {
                ud["${e}"].value = t;
                gl.uniform1i(ud["${e}"].location, t);
; // eslint-disable-line max-len
            }`
    }, {
        test: (e, t) => e.type === "mat3" && e.size === 1 && !e.isArray && t.a !== void 0,
        code: e => `
            gl.uniformMatrix3fv(ud["${e}"].location, false, uv["${e}"].toArray(true));
            `,
        codeUbo: e => `
                var ${e}_matrix = uv.${e}.toArray(true);

                data[offset] = ${e}_matrix[0];
                data[offset+1] = ${e}_matrix[1];
                data[offset+2] = ${e}_matrix[2];
        
                data[offset + 4] = ${e}_matrix[3];
                data[offset + 5] = ${e}_matrix[4];
                data[offset + 6] = ${e}_matrix[5];
        
                data[offset + 8] = ${e}_matrix[6];
                data[offset + 9] = ${e}_matrix[7];
                data[offset + 10] = ${e}_matrix[8];
            `
    }, {
        test: (e, t) => e.type === "vec2" && e.size === 1 && !e.isArray && t.x !== void 0,
        code: e => `
                cv = ud["${e}"].value;
                v = uv["${e}"];

                if(cv[0] !== v.x || cv[1] !== v.y)
                {
                    cv[0] = v.x;
                    cv[1] = v.y;
                    gl.uniform2f(ud["${e}"].location, v.x, v.y);
                }`,
        codeUbo: e => `
                v = uv.${e};

                data[offset] = v.x;
                data[offset+1] = v.y;
            `
    }, {
        test: e => e.type === "vec2" && e.size === 1 && !e.isArray,
        code: e => `
                cv = ud["${e}"].value;
                v = uv["${e}"];

                if(cv[0] !== v[0] || cv[1] !== v[1])
                {
                    cv[0] = v[0];
                    cv[1] = v[1];
                    gl.uniform2f(ud["${e}"].location, v[0], v[1]);
                }
            `
    }, {
        test: (e, t) => e.type === "vec4" && e.size === 1 && !e.isArray && t.width !== void 0,
        code: e => `
                cv = ud["${e}"].value;
                v = uv["${e}"];

                if(cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height)
                {
                    cv[0] = v.x;
                    cv[1] = v.y;
                    cv[2] = v.width;
                    cv[3] = v.height;
                    gl.uniform4f(ud["${e}"].location, v.x, v.y, v.width, v.height)
                }`,
        codeUbo: e => `
                    v = uv.${e};

                    data[offset] = v.x;
                    data[offset+1] = v.y;
                    data[offset+2] = v.width;
                    data[offset+3] = v.height;
                `
    }, {
        test: (e, t) => e.type === "vec4" && e.size === 1 && !e.isArray && t.red !== void 0,
        code: e => `
                cv = ud["${e}"].value;
                v = uv["${e}"];

                if(cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue || cv[3] !== v.alpha)
                {
                    cv[0] = v.red;
                    cv[1] = v.green;
                    cv[2] = v.blue;
                    cv[3] = v.alpha;
                    gl.uniform4f(ud["${e}"].location, v.red, v.green, v.blue, v.alpha)
                }`,
        codeUbo: e => `
                    v = uv.${e};

                    data[offset] = v.red;
                    data[offset+1] = v.green;
                    data[offset+2] = v.blue;
                    data[offset+3] = v.alpha;
                `
    }, {
        test: (e, t) => e.type === "vec3" && e.size === 1 && !e.isArray && t.red !== void 0,
        code: e => `
                cv = ud["${e}"].value;
                v = uv["${e}"];

                if(cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue || cv[3] !== v.a)
                {
                    cv[0] = v.red;
                    cv[1] = v.green;
                    cv[2] = v.blue;
    
                    gl.uniform3f(ud["${e}"].location, v.red, v.green, v.blue)
                }`,
        codeUbo: e => `
                    v = uv.${e};

                    data[offset] = v.red;
                    data[offset+1] = v.green;
                    data[offset+2] = v.blue;
                `
    }, {
        test: e => e.type === "vec4" && e.size === 1 && !e.isArray,
        code: e => `
                cv = ud["${e}"].value;
                v = uv["${e}"];

                if(cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
                {
                    cv[0] = v[0];
                    cv[1] = v[1];
                    cv[2] = v[2];
                    cv[3] = v[3];

                    gl.uniform4f(ud["${e}"].location, v[0], v[1], v[2], v[3])
                }`
    }]
    , So = {
        float: `
    if (cv !== v)
    {
        cu.value = v;
        gl.uniform1f(location, v);
    }`,
        vec2: `
    if (cv[0] !== v[0] || cv[1] !== v[1])
    {
        cv[0] = v[0];
        cv[1] = v[1];

        gl.uniform2f(location, v[0], v[1])
    }`,
        vec3: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];

        gl.uniform3f(location, v[0], v[1], v[2])
    }`,
        vec4: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];
        cv[3] = v[3];

        gl.uniform4f(location, v[0], v[1], v[2], v[3]);
    }`,
        int: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1i(location, v);
    }`,
        ivec2: `
    if (cv[0] !== v[0] || cv[1] !== v[1])
    {
        cv[0] = v[0];
        cv[1] = v[1];

        gl.uniform2i(location, v[0], v[1]);
    }`,
        ivec3: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];

        gl.uniform3i(location, v[0], v[1], v[2]);
    }`,
        ivec4: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];
        cv[3] = v[3];

        gl.uniform4i(location, v[0], v[1], v[2], v[3]);
    }`,
        uint: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1ui(location, v);
    }`,
        uvec2: `
    if (cv[0] !== v[0] || cv[1] !== v[1])
    {
        cv[0] = v[0];
        cv[1] = v[1];

        gl.uniform2ui(location, v[0], v[1]);
    }`,
        uvec3: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];

        gl.uniform3ui(location, v[0], v[1], v[2]);
    }`,
        uvec4: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];
        cv[3] = v[3];

        gl.uniform4ui(location, v[0], v[1], v[2], v[3]);
    }`,
        bool: `
    if (cv !== v)
    {
        cu.value = v;
        gl.uniform1i(location, v);
    }`,
        bvec2: `
    if (cv[0] != v[0] || cv[1] != v[1])
    {
        cv[0] = v[0];
        cv[1] = v[1];

        gl.uniform2i(location, v[0], v[1]);
    }`,
        bvec3: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];

        gl.uniform3i(location, v[0], v[1], v[2]);
    }`,
        bvec4: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];
        cv[3] = v[3];

        gl.uniform4i(location, v[0], v[1], v[2], v[3]);
    }`,
        mat2: "gl.uniformMatrix2fv(location, false, v)",
        mat3: "gl.uniformMatrix3fv(location, false, v)",
        mat4: "gl.uniformMatrix4fv(location, false, v)",
        sampler2D: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1i(location, v);
    }`,
        samplerCube: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1i(location, v);
    }`,
        sampler2DArray: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1i(location, v);
    }`
    }
    , Mo = {
        float: "gl.uniform1fv(location, v)",
        vec2: "gl.uniform2fv(location, v)",
        vec3: "gl.uniform3fv(location, v)",
        vec4: "gl.uniform4fv(location, v)",
        mat4: "gl.uniformMatrix4fv(location, false, v)",
        mat3: "gl.uniformMatrix3fv(location, false, v)",
        mat2: "gl.uniformMatrix2fv(location, false, v)",
        int: "gl.uniform1iv(location, v)",
        ivec2: "gl.uniform2iv(location, v)",
        ivec3: "gl.uniform3iv(location, v)",
        ivec4: "gl.uniform4iv(location, v)",
        uint: "gl.uniform1uiv(location, v)",
        uvec2: "gl.uniform2uiv(location, v)",
        uvec3: "gl.uniform3uiv(location, v)",
        uvec4: "gl.uniform4uiv(location, v)",
        bool: "gl.uniform1iv(location, v)",
        bvec2: "gl.uniform2iv(location, v)",
        bvec3: "gl.uniform3iv(location, v)",
        bvec4: "gl.uniform4iv(location, v)",
        sampler2D: "gl.uniform1iv(location, v)",
        samplerCube: "gl.uniform1iv(location, v)",
        sampler2DArray: "gl.uniform1iv(location, v)"
    };
function No(e, t) {
    let i;
    const s = [`
        var v = null;
        var cv = null;
        var cu = null;
        var t = 0;
        var gl = renderer.gl;
    `];
    for (const r in e.uniforms) {
        const n = t[r];
        if (!n) {
            (i = e.uniforms[r]) != null && i.group && (e.uniforms[r].ubo ? s.push(`
                        renderer.shader.syncUniformBufferGroup(uv.${r}, '${r}');
                    `) : s.push(`
                        renderer.shader.syncUniformGroup(uv.${r}, syncData);
                    `));
            continue;
        }
        const o = e.uniforms[r];
        let h = !1;
        for (let a = 0; a < fe.length; a++)
            if (fe[a].test(n, o)) {
                s.push(fe[a].code(r, o)),
                h = !0;
                break;
            }
        if (!h) {
            const l = (n.size === 1 && !n.isArray ? So : Mo)[n.type].replace("location", `ud["${r}"].location`);
            s.push(`
            cu = ud["${r}"];
            cv = cu.value;
            v = uv["${r}"];
            ${l};`);
        }
    }
    return new Function("ud","uv","renderer","syncData",s.join(`
`));
}
const Cr = {};
let ie = Cr;
function Fo() {
    if (ie === Cr || ie != null && ie.isContextLost()) {
        const e = O.ADAPTER.createCanvas();
        let t;
        O.PREFER_ENV >= ee.WEBGL2 && (t = e.getContext("webgl2", {})),
        t || (t = e.getContext("webgl", {}) || e.getContext("experimental-webgl", {}),
        t ? t.getExtension("WEBGL_draw_buffers") : t = null),
        ie = t;
    }
    return ie;
}
let We;
function Po() {
    if (!We) {
        We = dt.MEDIUM;
        const e = Fo();
        e && e.getShaderPrecisionFormat && (We = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.HIGH_FLOAT).precision ? dt.HIGH : dt.MEDIUM);
    }
    return We;
}
function tr(e, t) {
    const s = e.getShaderSource(t).split(`
`).map( (l, u) => `${u}: ${l}`)
        , i = e.getShaderInfoLog(t)
        , r = i.split(`
`)
        , n = {}
        , o = r.map(l => parseFloat(l.replace(/^ERROR\: 0\:([\d]+)\:.*$/, "$1"))).filter(l => l && !n[l] ? (n[l] = !0,
        !0) : !1)
        , h = [""];
    o.forEach(l => {
        s[l - 1] = `%c${s[l - 1]}%c`,
        h.push("background: #FF0000; color:#FFFFFF; font-size: 10px", "font-size: 10px");
    });
    const a = s.join(`
`);
    h[0] = a,
    console.error(i),
    console.groupCollapsed("click to view full shader code"),
    console.warn(...h),
    console.groupEnd();
}
function Oo(e, t, s, i) {
    e.getProgramParameter(t, e.LINK_STATUS) || (e.getShaderParameter(s, e.COMPILE_STATUS) || tr(e, s),
    e.getShaderParameter(i, e.COMPILE_STATUS) || tr(e, i),
    console.error("PixiJS Error: Could not initialize shader."),
    e.getProgramInfoLog(t) !== "" && console.warn("PixiJS Warning: gl.getProgramInfoLog()", e.getProgramInfoLog(t)));
}
const Bo = {
    float: 1,
    vec2: 2,
    vec3: 3,
    vec4: 4,
    int: 1,
    ivec2: 2,
    ivec3: 3,
    ivec4: 4,
    uint: 1,
    uvec2: 2,
    uvec3: 3,
    uvec4: 4,
    bool: 1,
    bvec2: 2,
    bvec3: 3,
    bvec4: 4,
    mat2: 4,
    mat3: 9,
    mat4: 16,
    sampler2D: 1
};
function Ar(e) {
    return Bo[e];
}
let qe = null;
const er = {
    FLOAT: "float",
    FLOAT_VEC2: "vec2",
    FLOAT_VEC3: "vec3",
    FLOAT_VEC4: "vec4",
    INT: "int",
    INT_VEC2: "ivec2",
    INT_VEC3: "ivec3",
    INT_VEC4: "ivec4",
    UNSIGNED_INT: "uint",
    UNSIGNED_INT_VEC2: "uvec2",
    UNSIGNED_INT_VEC3: "uvec3",
    UNSIGNED_INT_VEC4: "uvec4",
    BOOL: "bool",
    BOOL_VEC2: "bvec2",
    BOOL_VEC3: "bvec3",
    BOOL_VEC4: "bvec4",
    FLOAT_MAT2: "mat2",
    FLOAT_MAT3: "mat3",
    FLOAT_MAT4: "mat4",
    SAMPLER_2D: "sampler2D",
    INT_SAMPLER_2D: "sampler2D",
    UNSIGNED_INT_SAMPLER_2D: "sampler2D",
    SAMPLER_CUBE: "samplerCube",
    INT_SAMPLER_CUBE: "samplerCube",
    UNSIGNED_INT_SAMPLER_CUBE: "samplerCube",
    SAMPLER_2D_ARRAY: "sampler2DArray",
    INT_SAMPLER_2D_ARRAY: "sampler2DArray",
    UNSIGNED_INT_SAMPLER_2D_ARRAY: "sampler2DArray"
};
function Sr(e, t) {
    if (!qe) {
        const s = Object.keys(er);
        qe = {};
        for (let i = 0; i < s.length; ++i) {
            const r = s[i];
            qe[e[r]] = er[r];
        }
    }
    return qe[t];
}
function sr(e, t, s) {
    if (e.substring(0, 9) !== "precision") {
        let i = t;
        return t === dt.HIGH && s !== dt.HIGH && (i = dt.MEDIUM),
        `precision ${i} float;
${e}`;
    } else if (s !== dt.HIGH && e.substring(0, 15) === "precision highp")
        return e.replace("precision highp", "precision mediump");
    return e;
}
let Te;
function Uo() {
    if (typeof Te == "boolean")
        return Te;
    try {
        Te = new Function("param1","param2","param3","return param1[param2] === param3;")({
            a: "b"
        }, "a", "b") === !0;
    } catch (e) {
        Te = !1;
    }
    return Te;
}
let Lo = 0;
const Ze = {}
    , oe = class {
        constructor(e, t, s="pixi-shader", i={}) {
            this.extra = {},
            this.id = Lo++,
            this.vertexSrc = e || oe.defaultVertexSrc,
            this.fragmentSrc = t || oe.defaultFragmentSrc,
            this.vertexSrc = this.vertexSrc.trim(),
            this.fragmentSrc = this.fragmentSrc.trim(),
            this.extra = i,
            this.vertexSrc.substring(0, 8) !== "#version" && (s = s.replace(/\s+/g, "-"),
            Ze[s] ? (Ze[s]++,
            s += `-${Ze[s]}`) : Ze[s] = 1,
            this.vertexSrc = `#define SHADER_NAME ${s}
${this.vertexSrc}`,
            this.fragmentSrc = `#define SHADER_NAME ${s}
${this.fragmentSrc}`,
            this.vertexSrc = sr(this.vertexSrc, oe.defaultVertexPrecision, dt.HIGH),
            this.fragmentSrc = sr(this.fragmentSrc, oe.defaultFragmentPrecision, Po())),
            this.glPrograms = {},
            this.syncUniforms = null;
        }
        static get defaultVertexSrc() {
            return Ao;
        }
        static get defaultFragmentSrc() {
            return Co;
        }
        static from(e, t, s) {
            const i = e + t;
            let r = qi[i];
            return r || (qi[i] = r = new oe(e,t,s)),
            r;
        }
    }
;
let Ut = oe;
Ut.defaultVertexPrecision = dt.HIGH;
Ut.defaultFragmentPrecision = he.apple.device ? dt.HIGH : dt.MEDIUM;
let ko = 0;
class Tt {
    constructor(t, s, i) {
        this.group = !0,
        this.syncUniforms = {},
        this.dirtyId = 0,
        this.id = ko++,
        this.static = !!s,
        this.ubo = !!i,
        t instanceof at ? (this.buffer = t,
        this.buffer.type = St.UNIFORM_BUFFER,
        this.autoManage = !1,
        this.ubo = !0) : (this.uniforms = t,
        this.ubo && (this.buffer = new at(new Float32Array(1)),
        this.buffer.type = St.UNIFORM_BUFFER,
        this.autoManage = !0));
    }
    update() {
        this.dirtyId++,
        !this.autoManage && this.buffer && this.buffer.update();
    }
    add(t, s, i) {
        if (!this.ubo)
            this.uniforms[t] = new Tt(s,i);
        else
            throw new Error("[UniformGroup] uniform groups in ubo mode cannot be modified, or have uniform groups nested in them");
    }
    static from(t, s, i) {
        return new Tt(t,s,i);
    }
    static uboFrom(t, s) {
        return new Tt(t,s != null ? s : !0,!0);
    }
}
class ke {
    constructor(t, s) {
        this.uniformBindCount = 0,
        this.program = t,
        s ? s instanceof Tt ? this.uniformGroup = s : this.uniformGroup = new Tt(s) : this.uniformGroup = new Tt({}),
        this.disposeRunner = new bt("disposeShader");
    }
    checkUniformExists(t, s) {
        if (s.uniforms[t])
            return !0;
        for (const i in s.uniforms) {
            const r = s.uniforms[i];
            if (r.group && this.checkUniformExists(t, r))
                return !0;
        }
        return !1;
    }
    destroy() {
        this.uniformGroup = null,
        this.disposeRunner.emit(this),
        this.disposeRunner.destroy();
    }
    get uniforms() {
        return this.uniformGroup.uniforms;
    }
    static from(t, s, i) {
        const r = Ut.from(t, s);
        return new ke(r,i);
    }
}
class Do {
    constructor(t, s) {
        if (this.vertexSrc = t,
        this.fragTemplate = s,
        this.programCache = {},
        this.defaultGroupCache = {},
        !s.includes("%count%"))
            throw new Error('Fragment template must contain "%count%".');
        if (!s.includes("%forloop%"))
            throw new Error('Fragment template must contain "%forloop%".');
    }
    generateShader(t) {
        if (!this.programCache[t]) {
            const i = new Int32Array(t);
            for (let n = 0; n < t; n++)
                i[n] = n;
            this.defaultGroupCache[t] = Tt.from({
                uSamplers: i
            }, !0);
            let r = this.fragTemplate;
            r = r.replace(/%count%/gi, `${t}`),
            r = r.replace(/%forloop%/gi, this.generateSampleSrc(t)),
            this.programCache[t] = new Ut(this.vertexSrc,r);
        }
        const s = {
            tint: new Float32Array([1, 1, 1, 1]),
            translationMatrix: new et,
            default: this.defaultGroupCache[t]
        };
        return new ke(this.programCache[t],s);
    }
    generateSampleSrc(t) {
        let s = "";
        s += `
`,
        s += `
`;
        for (let i = 0; i < t; i++)
            i > 0 && (s += `
else `),
            i < t - 1 && (s += `if(vTextureId < ${i}.5)`),
            s += `
{`,
            s += `
	color = texture2D(uSamplers[${i}], vTextureCoord);`,
            s += `
}`;
        return s += `
`,
        s += `
`,
        s;
    }
}
class ri {
    constructor() {
        this.elements = [],
        this.ids = [],
        this.count = 0;
    }
    clear() {
        for (let t = 0; t < this.count; t++)
            this.elements[t] = null;
        this.count = 0;
    }
}
function Go() {
    return !he.apple.device;
}
function Vo(e) {
    let t = !0;
    const s = O.ADAPTER.getNavigator();
    if (he.tablet || he.phone) {
        if (he.apple.device) {
            const i = s.userAgent.match(/OS (\d+)_(\d+)?/);
            i && parseInt(i[1], 10) < 11 && (t = !1);
        }
        if (he.android.device) {
            const i = s.userAgent.match(/Android\s([0-9.]*)/);
            i && parseInt(i[1], 10) < 7 && (t = !1);
        }
    }
    return t ? e : 4;
}
class Mr {
    constructor(t) {
        this.renderer = t;
    }
    flush() {}
    destroy() {
        this.renderer = null;
    }
    start() {}
    stop() {
        this.flush();
    }
    render(t) {}
}
let Xo = `varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;
uniform sampler2D uSamplers[%count%];

void main(void){
    vec4 color;
    %forloop%
    gl_FragColor = color * vColor;
}
`
    , Ho = `precision highp float;
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aTextureId;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform vec4 tint;

varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;

void main(void){
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = aTextureCoord;
    vTextureId = aTextureId;
    vColor = aColor * tint;
}
`;
const pt = class extends Mr {
    constructor(e) {
        super(e),
        this.setShaderGenerator(),
        this.geometryClass = wr,
        this.vertexSize = 6,
        this.state = xe.for2d(),
        this.size = pt.defaultBatchSize * 4,
        this._vertexCount = 0,
        this._indexCount = 0,
        this._bufferedElements = [],
        this._bufferedTextures = [],
        this._bufferSize = 0,
        this._shader = null,
        this._packedGeometries = [],
        this._packedGeometryPoolSize = 2,
        this._flushId = 0,
        this._aBuffers = {},
        this._iBuffers = {},
        this.maxTextures = 1,
        this.renderer.on("prerender", this.onPrerender, this),
        e.runners.contextChange.add(this),
        this._dcIndex = 0,
        this._aIndex = 0,
        this._iIndex = 0,
        this._attributeBuffer = null,
        this._indexBuffer = null,
        this._tempBoundTextures = [];
    }
    static get defaultMaxTextures() {
        let e;
        return this._defaultMaxTextures = (e = this._defaultMaxTextures) != null ? e : Vo(32),
        this._defaultMaxTextures;
    }
    static set defaultMaxTextures(e) {
        this._defaultMaxTextures = e;
    }
    static get canUploadSameBuffer() {
        let e;
        return this._canUploadSameBuffer = (e = this._canUploadSameBuffer) != null ? e : Go(),
        this._canUploadSameBuffer;
    }
    static set canUploadSameBuffer(e) {
        this._canUploadSameBuffer = e;
    }
    get MAX_TEXTURES() {
        return G("7.1.0", "BatchRenderer#MAX_TEXTURES renamed to BatchRenderer#maxTextures"),
        this.maxTextures;
    }
    static get defaultVertexSrc() {
        return Ho;
    }
    static get defaultFragmentTemplate() {
        return Xo;
    }
    setShaderGenerator({vertex: e=pt.defaultVertexSrc, fragment: t=pt.defaultFragmentTemplate}={}) {
        this.shaderGenerator = new Do(e,t);
    }
    contextChange() {
        const e = this.renderer.gl;
        O.PREFER_ENV === ee.WEBGL_LEGACY ? this.maxTextures = 1 : (this.maxTextures = Math.min(e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS), pt.defaultMaxTextures),
        this.maxTextures = _o(this.maxTextures, e)),
        this._shader = this.shaderGenerator.generateShader(this.maxTextures);
        for (let t = 0; t < this._packedGeometryPoolSize; t++)
            this._packedGeometries[t] = new this.geometryClass;
        this.initFlushBuffers();
    }
    initFlushBuffers() {
        const {_drawCallPool: e, _textureArrayPool: t} = pt
            , s = this.size / 4
            , i = Math.floor(s / this.maxTextures) + 1;
        for (; e.length < s; )
            e.push(new si);
        for (; t.length < i; )
            t.push(new ri);
        for (let r = 0; r < this.maxTextures; r++)
            this._tempBoundTextures[r] = null;
    }
    onPrerender() {
        this._flushId = 0;
    }
    render(e) {
        e._texture.valid && (this._vertexCount + e.vertexData.length / 2 > this.size && this.flush(),
        this._vertexCount += e.vertexData.length / 2,
        this._indexCount += e.indices.length,
        this._bufferedTextures[this._bufferSize] = e._texture.baseTexture,
        this._bufferedElements[this._bufferSize++] = e);
    }
    buildTexturesAndDrawCalls() {
        const {_bufferedTextures: e, maxTextures: t} = this
            , s = pt._textureArrayPool
            , i = this.renderer.batch
            , r = this._tempBoundTextures
            , n = this.renderer.textureGC.count;
        let o = ++k._globalBatch
            , h = 0
            , a = s[0]
            , l = 0;
        i.copyBoundTextures(r, t);
        for (let u = 0; u < this._bufferSize; ++u) {
            const c = e[u];
            e[u] = null,
            c._batchEnabled !== o && (a.count >= t && (i.boundArray(a, r, o, t),
            this.buildDrawCalls(a, l, u),
            l = u,
            a = s[++h],
            ++o),
            c._batchEnabled = o,
            c.touched = n,
            a.elements[a.count++] = c);
        }
        a.count > 0 && (i.boundArray(a, r, o, t),
        this.buildDrawCalls(a, l, this._bufferSize),
        ++h,
        ++o);
        for (let u = 0; u < r.length; u++)
            r[u] = null;
        k._globalBatch = o;
    }
    buildDrawCalls(e, t, s) {
        const {_bufferedElements: i, _attributeBuffer: r, _indexBuffer: n, vertexSize: o} = this
            , h = pt._drawCallPool;
        let a = this._dcIndex
            , l = this._aIndex
            , u = this._iIndex
            , c = h[a];
        c.start = this._iIndex,
        c.texArray = e;
        for (let d = t; d < s; ++d) {
            const p = i[d]
                , f = p._texture.baseTexture
                , _ = uo[f.alphaMode ? 1 : 0][p.blendMode];
            i[d] = null,
            t < d && c.blend !== _ && (c.size = u - c.start,
            t = d,
            c = h[++a],
            c.texArray = e,
            c.start = u),
            this.packInterleavedGeometry(p, r, n, l, u),
            l += p.vertexData.length / 2 * o,
            u += p.indices.length,
            c.blend = _;
        }
        t < s && (c.size = u - c.start,
        ++a),
        this._dcIndex = a,
        this._aIndex = l,
        this._iIndex = u;
    }
    bindAndClearTexArray(e) {
        const t = this.renderer.texture;
        for (let s = 0; s < e.count; s++)
            t.bind(e.elements[s], e.ids[s]),
            e.elements[s] = null;
        e.count = 0;
    }
    updateGeometry() {
        const {_packedGeometries: e, _attributeBuffer: t, _indexBuffer: s} = this;
        pt.canUploadSameBuffer ? (e[this._flushId]._buffer.update(t.rawBinaryData),
        e[this._flushId]._indexBuffer.update(s),
        this.renderer.geometry.updateBuffers()) : (this._packedGeometryPoolSize <= this._flushId && (this._packedGeometryPoolSize++,
        e[this._flushId] = new this.geometryClass),
        e[this._flushId]._buffer.update(t.rawBinaryData),
        e[this._flushId]._indexBuffer.update(s),
        this.renderer.geometry.bind(e[this._flushId]),
        this.renderer.geometry.updateBuffers(),
        this._flushId++);
    }
    drawBatches() {
        const e = this._dcIndex
            , {gl: t, state: s} = this.renderer
            , i = pt._drawCallPool;
        let r = null;
        for (let n = 0; n < e; n++) {
            const {texArray: o, type: h, size: a, start: l, blend: u} = i[n];
            r !== o && (r = o,
            this.bindAndClearTexArray(o)),
            this.state.blendMode = u,
            s.set(this.state),
            t.drawElements(h, a, t.UNSIGNED_SHORT, l * 2);
        }
    }
    flush() {
        this._vertexCount !== 0 && (this._attributeBuffer = this.getAttributeBuffer(this._vertexCount),
        this._indexBuffer = this.getIndexBuffer(this._indexCount),
        this._aIndex = 0,
        this._iIndex = 0,
        this._dcIndex = 0,
        this.buildTexturesAndDrawCalls(),
        this.updateGeometry(),
        this.drawBatches(),
        this._bufferSize = 0,
        this._vertexCount = 0,
        this._indexCount = 0);
    }
    start() {
        this.renderer.state.set(this.state),
        this.renderer.texture.ensureSamplerType(this.maxTextures),
        this.renderer.shader.bind(this._shader),
        pt.canUploadSameBuffer && this.renderer.geometry.bind(this._packedGeometries[this._flushId]);
    }
    stop() {
        this.flush();
    }
    destroy() {
        for (let e = 0; e < this._packedGeometryPoolSize; e++)
            this._packedGeometries[e] && this._packedGeometries[e].destroy();
        this.renderer.off("prerender", this.onPrerender, this),
        this._aBuffers = null,
        this._iBuffers = null,
        this._packedGeometries = null,
        this._attributeBuffer = null,
        this._indexBuffer = null,
        this._shader && (this._shader.destroy(),
        this._shader = null),
        super.destroy();
    }
    getAttributeBuffer(e) {
        const t = as(Math.ceil(e / 8))
            , s = Wi(t)
            , i = t * 8;
        this._aBuffers.length <= s && (this._iBuffers.length = s + 1);
        let r = this._aBuffers[i];
        return r || (this._aBuffers[i] = r = new po(i * this.vertexSize * 4)),
        r;
    }
    getIndexBuffer(e) {
        const t = as(Math.ceil(e / 12))
            , s = Wi(t)
            , i = t * 12;
        this._iBuffers.length <= s && (this._iBuffers.length = s + 1);
        let r = this._iBuffers[s];
        return r || (this._iBuffers[s] = r = new Uint16Array(i)),
        r;
    }
    packInterleavedGeometry(e, t, s, i, r) {
        const {uint32View: n, float32View: o} = t
            , h = i / this.vertexSize
            , a = e.uvs
            , l = e.indices
            , u = e.vertexData
            , c = e._texture.baseTexture._batchLocation
            , d = Math.min(e.worldAlpha, 1)
            , p = lt.shared.setValue(e._tintRGB).toPremultiplied(d, e._texture.baseTexture.alphaMode > 0);
        for (let f = 0; f < u.length; f += 2)
            o[i++] = u[f],
            o[i++] = u[f + 1],
            o[i++] = a[f],
            o[i++] = a[f + 1],
            n[i++] = p,
            o[i++] = c;
        for (let f = 0; f < l.length; f++)
            s[r++] = h + l[f];
    }
}
;
let gt = pt;
gt.defaultBatchSize = 4096;
gt.extension = {
    name: "batch",
    type: P.RendererPlugin
};
gt._drawCallPool = [];
gt._textureArrayPool = [];
D.add(gt);
let $o = `varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void){
   gl_FragColor = texture2D(uSampler, vTextureCoord);
}
`
    , zo = `attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

uniform vec4 inputSize;
uniform vec4 outputFrame;

vec4 filterVertexPosition( void )
{
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aVertexPosition * (outputFrame.zw * inputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;
const Re = class extends ke {
    constructor(e, t, s) {
        const i = Ut.from(e || Re.defaultVertexSrc, t || Re.defaultFragmentSrc);
        super(i, s),
        this.padding = 0,
        this.resolution = Re.defaultResolution,
        this.multisample = Re.defaultMultisample,
        this.enabled = !0,
        this.autoFit = !0,
        this.state = new xe;
    }
    apply(e, t, s, i, r) {
        e.applyFilter(this, t, s, i);
    }
    get blendMode() {
        return this.state.blendMode;
    }
    set blendMode(e) {
        this.state.blendMode = e;
    }
    get resolution() {
        return this._resolution;
    }
    set resolution(e) {
        this._resolution = e;
    }
    static get defaultVertexSrc() {
        return zo;
    }
    static get defaultFragmentSrc() {
        return $o;
    }
}
;
let yt = Re;
yt.defaultResolution = 1;
yt.defaultMultisample = J.NONE;
class xs {
    constructor() {
        this.clearBeforeRender = !0,
        this._backgroundColor = new lt(0),
        this.alpha = 1;
    }
    init(t) {
        this.clearBeforeRender = t.clearBeforeRender;
        const {backgroundColor: s, background: i, backgroundAlpha: r} = t
            , n = i != null ? i : s;
        n !== void 0 && (this.color = n),
        this.alpha = r;
    }
    get color() {
        return this._backgroundColor.value;
    }
    set color(t) {
        this._backgroundColor.setValue(t);
    }
    get alpha() {
        return this._backgroundColor.alpha;
    }
    set alpha(t) {
        this._backgroundColor.setAlpha(t);
    }
    get backgroundColor() {
        return this._backgroundColor;
    }
    destroy() {}
}
xs.defaultOptions = {
    backgroundAlpha: 1,
    backgroundColor: 0,
    clearBeforeRender: !0
};
xs.extension = {
    type: [P.RendererSystem, P.CanvasRendererSystem],
    name: "background"
};
D.add(xs);
class Nr {
    constructor(t) {
        this.renderer = t,
        this.emptyRenderer = new Mr(t),
        this.currentRenderer = this.emptyRenderer;
    }
    setObjectRenderer(t) {
        this.currentRenderer !== t && (this.currentRenderer.stop(),
        this.currentRenderer = t,
        this.currentRenderer.start());
    }
    flush() {
        this.setObjectRenderer(this.emptyRenderer);
    }
    reset() {
        this.setObjectRenderer(this.emptyRenderer);
    }
    copyBoundTextures(t, s) {
        const {boundTextures: i} = this.renderer.texture;
        for (let r = s - 1; r >= 0; --r)
            t[r] = i[r] || null,
            t[r] && (t[r]._batchLocation = r);
    }
    boundArray(t, s, i, r) {
        const {elements: n, ids: o, count: h} = t;
        let a = 0;
        for (let l = 0; l < h; l++) {
            const u = n[l]
                , c = u._batchLocation;
            if (c >= 0 && c < r && s[c] === u) {
                o[l] = c;
                continue;
            }
            for (; a < r; ) {
                const d = s[a];
                if (d && d._batchEnabled === i && d._batchLocation === a) {
                    a++;
                    continue;
                }
                o[l] = a,
                u._batchLocation = a,
                s[a] = u;
                break;
            }
        }
    }
    destroy() {
        this.renderer = null;
    }
}
Nr.extension = {
    type: P.RendererSystem,
    name: "batch"
};
D.add(Nr);
let ir = 0;
class ys {
    constructor(t) {
        this.renderer = t,
        this.webGLVersion = 1,
        this.extensions = {},
        this.supports = {
            uint32Indices: !1
        },
        this.handleContextLost = this.handleContextLost.bind(this),
        this.handleContextRestored = this.handleContextRestored.bind(this);
    }
    get isLost() {
        return !this.gl || this.gl.isContextLost();
    }
    contextChange(t) {
        this.gl = t,
        this.renderer.gl = t,
        this.renderer.CONTEXT_UID = ir++;
    }
    init(t) {
        if (t.context)
            this.initFromContext(t.context);
        else {
            const s = this.renderer.background.alpha < 1
                , i = t.premultipliedAlpha;
            this.preserveDrawingBuffer = t.preserveDrawingBuffer,
            this.useContextAlpha = t.useContextAlpha,
            this.powerPreference = t.powerPreference,
            this.initFromOptions({
                alpha: s,
                premultipliedAlpha: i,
                antialias: t.antialias,
                stencil: !0,
                preserveDrawingBuffer: t.preserveDrawingBuffer,
                powerPreference: t.powerPreference
            });
        }
    }
    initFromContext(t) {
        this.gl = t,
        this.validateContext(t),
        this.renderer.gl = t,
        this.renderer.CONTEXT_UID = ir++,
        this.renderer.runners.contextChange.emit(t);
        const s = this.renderer.view;
        s.addEventListener !== void 0 && (s.addEventListener("webglcontextlost", this.handleContextLost, !1),
        s.addEventListener("webglcontextrestored", this.handleContextRestored, !1));
    }
    initFromOptions(t) {
        const s = this.createContext(this.renderer.view, t);
        this.initFromContext(s);
    }
    createContext(t, s) {
        let i;
        if (O.PREFER_ENV >= ee.WEBGL2 && (i = t.getContext("webgl2", s)),
        i)
            this.webGLVersion = 2;
        else if (this.webGLVersion = 1,
        i = t.getContext("webgl", s) || t.getContext("experimental-webgl", s),
        !i)
            throw new Error("This browser does not support WebGL. Try using the canvas renderer");
        return this.gl = i,
        this.getExtensions(),
        this.gl;
    }
    getExtensions() {
        const {gl: t} = this
            , s = {
                loseContext: t.getExtension("WEBGL_lose_context"),
                anisotropicFiltering: t.getExtension("EXT_texture_filter_anisotropic"),
                floatTextureLinear: t.getExtension("OES_texture_float_linear"),
                s3tc: t.getExtension("WEBGL_compressed_texture_s3tc"),
                s3tc_sRGB: t.getExtension("WEBGL_compressed_texture_s3tc_srgb"),
                etc: t.getExtension("WEBGL_compressed_texture_etc"),
                etc1: t.getExtension("WEBGL_compressed_texture_etc1"),
                pvrtc: t.getExtension("WEBGL_compressed_texture_pvrtc") || t.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),
                atc: t.getExtension("WEBGL_compressed_texture_atc"),
                astc: t.getExtension("WEBGL_compressed_texture_astc")
            };
        this.webGLVersion === 1 ? Object.assign(this.extensions, s, {
            drawBuffers: t.getExtension("WEBGL_draw_buffers"),
            depthTexture: t.getExtension("WEBGL_depth_texture"),
            vertexArrayObject: t.getExtension("OES_vertex_array_object") || t.getExtension("MOZ_OES_vertex_array_object") || t.getExtension("WEBKIT_OES_vertex_array_object"),
            uint32ElementIndex: t.getExtension("OES_element_index_uint"),
            floatTexture: t.getExtension("OES_texture_float"),
            floatTextureLinear: t.getExtension("OES_texture_float_linear"),
            textureHalfFloat: t.getExtension("OES_texture_half_float"),
            textureHalfFloatLinear: t.getExtension("OES_texture_half_float_linear")
        }) : this.webGLVersion === 2 && Object.assign(this.extensions, s, {
            colorBufferFloat: t.getExtension("EXT_color_buffer_float")
        });
    }
    handleContextLost(t) {
        t.preventDefault(),
        setTimeout(
            () => {
                this.gl.isContextLost() && this.extensions.loseContext && this.extensions.loseContext.restoreContext();
            }
            , 0
        );
    }
    handleContextRestored() {
        this.renderer.runners.contextChange.emit(this.gl);
    }
    destroy() {
        const t = this.renderer.view;
        this.renderer = null,
        t.removeEventListener !== void 0 && (t.removeEventListener("webglcontextlost", this.handleContextLost),
        t.removeEventListener("webglcontextrestored", this.handleContextRestored)),
        this.gl.useProgram(null),
        this.extensions.loseContext && this.extensions.loseContext.loseContext();
    }
    postrender() {
        this.renderer.objectRenderer.renderingToScreen && this.gl.flush();
    }
    validateContext(t) {
        const s = t.getContextAttributes()
            , i = "WebGL2RenderingContext"in globalThis && t instanceof globalThis.WebGL2RenderingContext;
        i && (this.webGLVersion = 2),
        s && !s.stencil && console.warn("Provided WebGL context does not have a stencil buffer, masks may not render correctly");
        const r = i || !!t.getExtension("OES_element_index_uint");
        this.supports.uint32Indices = r,
        r || console.warn("Provided WebGL context does not support 32 index buffer, complex graphics may not render correctly");
    }
}
ys.defaultOptions = {
    context: null,
    antialias: !1,
    premultipliedAlpha: !0,
    preserveDrawingBuffer: !1,
    powerPreference: "default"
};
ys.extension = {
    type: P.RendererSystem,
    name: "context"
};
D.add(ys);
class jo extends di {
    upload(t, s, i) {
        const r = t.gl;
        r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL, s.alphaMode === Xt.UNPACK);
        const n = s.realWidth
            , o = s.realHeight;
        return i.width === n && i.height === o ? r.texSubImage2D(s.target, 0, 0, 0, n, o, s.format, i.type, this.data) : (i.width = n,
        i.height = o,
        r.texImage2D(s.target, 0, i.internalFormat, n, o, 0, s.format, i.type, this.data)),
        !0;
    }
}
class ni {
    constructor(t, s) {
        this.width = Math.round(t || 100),
        this.height = Math.round(s || 100),
        this.stencil = !1,
        this.depth = !1,
        this.dirtyId = 0,
        this.dirtyFormat = 0,
        this.dirtySize = 0,
        this.depthTexture = null,
        this.colorTextures = [],
        this.glFramebuffers = {},
        this.disposeRunner = new bt("disposeFramebuffer"),
        this.multisample = J.NONE;
    }
    get colorTexture() {
        return this.colorTextures[0];
    }
    addColorTexture(t=0, s) {
        return this.colorTextures[t] = s || new k(null,{
            scaleMode: Bt.NEAREST,
            resolution: 1,
            mipmap: Qt.OFF,
            width: this.width,
            height: this.height
        }),
        this.dirtyId++,
        this.dirtyFormat++,
        this;
    }
    addDepthTexture(t) {
        return this.depthTexture = t || new k(new jo(null,{
            width: this.width,
            height: this.height
        }),{
            scaleMode: Bt.NEAREST,
            resolution: 1,
            width: this.width,
            height: this.height,
            mipmap: Qt.OFF,
            format: b.DEPTH_COMPONENT,
            type: L.UNSIGNED_SHORT
        }),
        this.dirtyId++,
        this.dirtyFormat++,
        this;
    }
    enableDepth() {
        return this.depth = !0,
        this.dirtyId++,
        this.dirtyFormat++,
        this;
    }
    enableStencil() {
        return this.stencil = !0,
        this.dirtyId++,
        this.dirtyFormat++,
        this;
    }
    resize(t, s) {
        if (t = Math.round(t),
        s = Math.round(s),
        !(t === this.width && s === this.height)) {
            this.width = t,
            this.height = s,
            this.dirtyId++,
            this.dirtySize++;
            for (let i = 0; i < this.colorTextures.length; i++) {
                const r = this.colorTextures[i]
                    , n = r.resolution;
                r.setSize(t / n, s / n);
            }
            if (this.depthTexture) {
                const i = this.depthTexture.resolution;
                this.depthTexture.setSize(t / i, s / i);
            }
        }
    }
    dispose() {
        this.disposeRunner.emit(this, !1);
    }
    destroyDepthTexture() {
        this.depthTexture && (this.depthTexture.destroy(),
        this.depthTexture = null,
        ++this.dirtyId,
        ++this.dirtyFormat);
    }
}
class Fr extends k {
    constructor(t={}) {
        let s;
        if (typeof t == "number") {
            const i = arguments[0]
                , r = arguments[1]
                , n = arguments[2]
                , o = arguments[3];
            t = {
                width: i,
                height: r,
                scaleMode: n,
                resolution: o
            };
        }
        t.width = t.width || 100,
        t.height = t.height || 100,
        (s = t.multisample) != null || (t.multisample = J.NONE),
        super(null, t),
        this.mipmap = Qt.OFF,
        this.valid = !0,
        this._clear = new lt([0, 0, 0, 0]),
        this.framebuffer = new ni(this.realWidth,this.realHeight).addColorTexture(0, this),
        this.framebuffer.multisample = t.multisample,
        this.maskStack = [],
        this.filterStack = [{}];
    }
    set clearColor(t) {
        this._clear.setValue(t);
    }
    get clearColor() {
        return this._clear.value;
    }
    get clear() {
        return this._clear;
    }
    resize(t, s) {
        this.framebuffer.resize(t * this.resolution, s * this.resolution),
        this.setRealSize(this.framebuffer.width, this.framebuffer.height);
    }
    dispose() {
        this.framebuffer.dispose(),
        super.dispose();
    }
    destroy() {
        super.destroy(),
        this.framebuffer.destroyDepthTexture(),
        this.framebuffer = null;
    }
}
class Vt extends Le {
    constructor(t) {
        const s = t
            , i = s.naturalWidth || s.videoWidth || s.width
            , r = s.naturalHeight || s.videoHeight || s.height;
        super(i, r),
        this.source = t,
        this.noSubImage = !1;
    }
    static crossOrigin(t, s, i) {
        i === void 0 && !s.startsWith("data:") ? t.crossOrigin = fo(s) : i !== !1 && (t.crossOrigin = typeof i == "string" ? i : "anonymous");
    }
    upload(t, s, i, r) {
        const n = t.gl
            , o = s.realWidth
            , h = s.realHeight;
        if (r = r || this.source,
        typeof HTMLImageElement < "u" && r instanceof HTMLImageElement) {
            if (!r.complete || r.naturalWidth === 0)
                return !1;
        } else if (typeof HTMLVideoElement < "u" && r instanceof HTMLVideoElement && r.readyState <= 1 && r.buffered.length === 0)
            return !1;
        return n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL, s.alphaMode === Xt.UNPACK),
        !this.noSubImage && s.target === n.TEXTURE_2D && i.width === o && i.height === h ? n.texSubImage2D(n.TEXTURE_2D, 0, 0, 0, s.format, i.type, r) : (i.width = o,
        i.height = h,
        n.texImage2D(s.target, 0, i.internalFormat, s.format, i.type, r)),
        !0;
    }
    update() {
        if (this.destroyed)
            return;
        const t = this.source
            , s = t.naturalWidth || t.videoWidth || t.width
            , i = t.naturalHeight || t.videoHeight || t.height;
        this.resize(s, i),
        super.update();
    }
    dispose() {
        this.source = null;
    }
}
class Pr extends Vt {
    constructor(t, s) {
        let i;
        if (s = s || {},
        typeof t == "string") {
            const r = new Image;
            Vt.crossOrigin(r, t, s.crossorigin),
            r.src = t,
            t = r;
        }
        super(t),
        !t.complete && this._width && this._height && (this._width = 0,
        this._height = 0),
        this.url = t.src,
        this._process = null,
        this.preserveBitmap = !1,
        this.createBitmap = ((i = s.createBitmap) != null ? i : O.CREATE_IMAGE_BITMAP) && !!globalThis.createImageBitmap,
        this.alphaMode = typeof s.alphaMode == "number" ? s.alphaMode : null,
        this.bitmap = null,
        this._load = null,
        s.autoLoad !== !1 && this.load();
    }
    load(t) {
        return this._load ? this._load : (t !== void 0 && (this.createBitmap = t),
        this._load = new Promise( (s, i) => {
            const r = this.source;
            this.url = r.src;
            const n = () => {
                this.destroyed || (r.onload = null,
                r.onerror = null,
                this.resize(r.width, r.height),
                this._load = null,
                this.createBitmap ? s(this.process()) : s(this));
            }
            ;
            r.complete && r.src ? n() : (r.onload = n,
            r.onerror = o => {
                i(o),
                this.onError.emit(o);
            }
            );
        }),
        this._load);
    }
    process() {
        const t = this.source;
        if (this._process !== null)
            return this._process;
        if (this.bitmap !== null || !globalThis.createImageBitmap)
            return Promise.resolve(this);
        const s = globalThis.createImageBitmap
            , i = !t.crossOrigin || t.crossOrigin === "anonymous";
        return this._process = fetch(t.src, {
            mode: i ? "cors" : "no-cors"
        }).then(r => r.blob()).then(r => s(r, 0, 0, t.width, t.height, {
            premultiplyAlpha: this.alphaMode === null || this.alphaMode === Xt.UNPACK ? "premultiply" : "none"
        })).then(r => this.destroyed ? Promise.reject() : (this.bitmap = r,
        this.update(),
        this._process = null,
        Promise.resolve(this))),
        this._process;
    }
    upload(t, s, i) {
        if (typeof this.alphaMode == "number" && (s.alphaMode = this.alphaMode),
        !this.createBitmap)
            return super.upload(t, s, i);
        if (!this.bitmap && (this.process(),
        !this.bitmap))
            return !1;
        if (super.upload(t, s, i, this.bitmap),
        !this.preserveBitmap) {
            let r = !0;
            const n = s._glTextures;
            for (const o in n) {
                const h = n[o];
                if (h !== i && h.dirtyId !== s.dirtyId) {
                    r = !1;
                    break;
                }
            }
            r && (this.bitmap.close && this.bitmap.close(),
            this.bitmap = null);
        }
        return !0;
    }
    dispose() {
        this.source.onload = null,
        this.source.onerror = null,
        super.dispose(),
        this.bitmap && (this.bitmap.close(),
        this.bitmap = null),
        this._process = null,
        this._load = null;
    }
    static test(t) {
        return typeof HTMLImageElement < "u" && (typeof t == "string" || t instanceof HTMLImageElement);
    }
}
class Or {
    constructor() {
        this.x0 = 0,
        this.y0 = 0,
        this.x1 = 1,
        this.y1 = 0,
        this.x2 = 1,
        this.y2 = 1,
        this.x3 = 0,
        this.y3 = 1,
        this.uvsFloat32 = new Float32Array(8);
    }
    set(t, s, i) {
        const r = s.width
            , n = s.height;
        if (i) {
            const o = t.width / 2 / r
                , h = t.height / 2 / n
                , a = t.x / r + o
                , l = t.y / n + h;
            i = j.add(i, j.NW),
            this.x0 = a + o * j.uX(i),
            this.y0 = l + h * j.uY(i),
            i = j.add(i, 2),
            this.x1 = a + o * j.uX(i),
            this.y1 = l + h * j.uY(i),
            i = j.add(i, 2),
            this.x2 = a + o * j.uX(i),
            this.y2 = l + h * j.uY(i),
            i = j.add(i, 2),
            this.x3 = a + o * j.uX(i),
            this.y3 = l + h * j.uY(i);
        } else
            this.x0 = t.x / r,
            this.y0 = t.y / n,
            this.x1 = (t.x + t.width) / r,
            this.y1 = t.y / n,
            this.x2 = (t.x + t.width) / r,
            this.y2 = (t.y + t.height) / n,
            this.x3 = t.x / r,
            this.y3 = (t.y + t.height) / n;
        this.uvsFloat32[0] = this.x0,
        this.uvsFloat32[1] = this.y0,
        this.uvsFloat32[2] = this.x1,
        this.uvsFloat32[3] = this.y1,
        this.uvsFloat32[4] = this.x2,
        this.uvsFloat32[5] = this.y2,
        this.uvsFloat32[6] = this.x3,
        this.uvsFloat32[7] = this.y3;
    }
    toString() {
        return `[@pixi/core:TextureUvs x0=${this.x0} y0=${this.y0} x1=${this.x1} y1=${this.y1} x2=${this.x2} y2=${this.y2} x3=${this.x3} y3=${this.y3}]`;
    }
}
const rr = new Or;
function Ke(e) {
    e.destroy = function() {}
    ,
    e.on = function() {}
    ,
    e.once = function() {}
    ,
    e.emit = function() {};
}
class N extends pe {
    constructor(t, s, i, r, n, o, h) {
        if (super(),
        this.noFrame = !1,
        s || (this.noFrame = !0,
        s = new H(0,0,1,1)),
        t instanceof N && (t = t.baseTexture),
        this.baseTexture = t,
        this._frame = s,
        this.trim = r,
        this.valid = !1,
        this._uvs = rr,
        this.uvMatrix = null,
        this.orig = i || s,
        this._rotate = Number(n || 0),
        n === !0)
            this._rotate = 2;
        else if (this._rotate % 2 !== 0)
            throw new Error("attempt to use diamond-shaped UVs. If you are sure, set rotation manually");
        this.defaultAnchor = o ? new W(o.x,o.y) : new W(0,0),
        this.defaultBorders = h,
        this._updateID = 0,
        this.textureCacheIds = [],
        t.valid ? this.noFrame ? t.valid && this.onBaseTextureUpdated(t) : this.frame = s : t.once("loaded", this.onBaseTextureUpdated, this),
        this.noFrame && t.on("update", this.onBaseTextureUpdated, this);
    }
    update() {
        this.baseTexture.resource && this.baseTexture.resource.update();
    }
    onBaseTextureUpdated(t) {
        if (this.noFrame) {
            if (!this.baseTexture.valid)
                return;
            this._frame.width = t.width,
            this._frame.height = t.height,
            this.valid = !0,
            this.updateUvs();
        } else
            this.frame = this._frame;
        this.emit("update", this);
    }
    destroy(t) {
        if (this.baseTexture) {
            if (t) {
                const {resource: s} = this.baseTexture;
                s != null && s.url && Ct[s.url] && N.removeFromCache(s.url),
                this.baseTexture.destroy();
            }
            this.baseTexture.off("loaded", this.onBaseTextureUpdated, this),
            this.baseTexture.off("update", this.onBaseTextureUpdated, this),
            this.baseTexture = null;
        }
        this._frame = null,
        this._uvs = null,
        this.trim = null,
        this.orig = null,
        this.valid = !1,
        N.removeFromCache(this),
        this.textureCacheIds = null;
    }
    clone() {
        let r;
        const t = this._frame.clone()
            , s = this._frame === this.orig ? t : this.orig.clone()
            , i = new N(this.baseTexture,!this.noFrame && t,s,(r = this.trim) == null ? void 0 : r.clone(),this.rotate,this.defaultAnchor,this.defaultBorders);
        return this.noFrame && (i._frame = t),
        i;
    }
    updateUvs() {
        this._uvs === rr && (this._uvs = new Or),
        this._uvs.set(this._frame, this.baseTexture, this.rotate),
        this._updateID++;
    }
    static from(t, s={}, i=O.STRICT_TEXTURE_CACHE) {
        const r = typeof t == "string";
        let n = null;
        if (r)
            n = t;
        else if (t instanceof k) {
            if (!t.cacheId) {
                const h = (s == null ? void 0 : s.pixiIdPrefix) || "pixiid";
                t.cacheId = `${h}-${Ue()}`,
                k.addToCache(t, t.cacheId);
            }
            n = t.cacheId;
        } else {
            if (!t._pixiId) {
                const h = (s == null ? void 0 : s.pixiIdPrefix) || "pixiid";
                t._pixiId = `${h}_${Ue()}`;
            }
            n = t._pixiId;
        }
        let o = Ct[n];
        if (r && i && !o)
            throw new Error(`The cacheId "${n}" does not exist in TextureCache.`);
        return !o && !(t instanceof k) ? (s.resolution || (s.resolution = Zi(t)),
        o = new N(new k(t,s)),
        o.baseTexture.cacheId = n,
        k.addToCache(o.baseTexture, n),
        N.addToCache(o, n)) : !o && t instanceof k && (o = new N(t),
        N.addToCache(o, n)),
        o;
    }
    static fromURL(t, s) {
        const i = Object.assign({
                autoLoad: !1
            }, s == null ? void 0 : s.resourceOptions)
            , r = N.from(t, Object.assign({
                resourceOptions: i
            }, s), !1)
            , n = r.baseTexture.resource;
        return r.baseTexture.valid ? Promise.resolve(r) : n.load().then( () => Promise.resolve(r));
    }
    static fromBuffer(t, s, i, r) {
        return new N(k.fromBuffer(t, s, i, r));
    }
    static fromLoader(t, s, i, r) {
        const n = new k(t,Object.assign({
                scaleMode: k.defaultOptions.scaleMode,
                resolution: Zi(s)
            }, r))
            , {resource: o} = n;
        o instanceof Pr && (o.url = s);
        const h = new N(n);
        return i || (i = s),
        k.addToCache(h.baseTexture, i),
        N.addToCache(h, i),
        i !== s && (k.addToCache(h.baseTexture, s),
        N.addToCache(h, s)),
        h.baseTexture.valid ? Promise.resolve(h) : new Promise(a => {
            h.baseTexture.once("loaded", () => a(h));
        });
    }
    static addToCache(t, s) {
        s && (t.textureCacheIds.includes(s) || t.textureCacheIds.push(s),
        Ct[s] && Ct[s] !== t && console.warn(`Texture added to the cache with an id [${s}] that already had an entry`),
        Ct[s] = t);
    }
    static removeFromCache(t) {
        if (typeof t == "string") {
            const s = Ct[t];
            if (s) {
                const i = s.textureCacheIds.indexOf(t);
                return i > -1 && s.textureCacheIds.splice(i, 1),
                delete Ct[t],
                s;
            }
        } else if (t != null && t.textureCacheIds) {
            for (let s = 0; s < t.textureCacheIds.length; ++s)
                Ct[t.textureCacheIds[s]] === t && delete Ct[t.textureCacheIds[s]];
            return t.textureCacheIds.length = 0,
            t;
        }
        return null;
    }
    get resolution() {
        return this.baseTexture.resolution;
    }
    get frame() {
        return this._frame;
    }
    set frame(t) {
        this._frame = t,
        this.noFrame = !1;
        const {x: s, y: i, width: r, height: n} = t
            , o = s + r > this.baseTexture.width
            , h = i + n > this.baseTexture.height;
        if (o || h) {
            const a = o && h ? "and" : "or"
                , l = `X: ${s} + ${r} = ${s + r} > ${this.baseTexture.width}`
                , u = `Y: ${i} + ${n} = ${i + n} > ${this.baseTexture.height}`;
            throw new Error(`Texture Error: frame does not fit inside the base Texture dimensions: ${l} ${a} ${u}`);
        }
        this.valid = r && n && this.baseTexture.valid,
        !this.trim && !this.rotate && (this.orig = t),
        this.valid && this.updateUvs();
    }
    get rotate() {
        return this._rotate;
    }
    set rotate(t) {
        this._rotate = t,
        this.valid && this.updateUvs();
    }
    get width() {
        return this.orig.width;
    }
    get height() {
        return this.orig.height;
    }
    castToBaseTexture() {
        return this.baseTexture;
    }
    static get EMPTY() {
        return N._EMPTY || (N._EMPTY = new N(new k),
        Ke(N._EMPTY),
        Ke(N._EMPTY.baseTexture)),
        N._EMPTY;
    }
    static get WHITE() {
        if (!N._WHITE) {
            const t = O.ADAPTER.createCanvas(16, 16)
                , s = t.getContext("2d");
            t.width = 16,
            t.height = 16,
            s.fillStyle = "white",
            s.fillRect(0, 0, 16, 16),
            N._WHITE = new N(k.from(t)),
            Ke(N._WHITE),
            Ke(N._WHITE.baseTexture);
        }
        return N._WHITE;
    }
}
class vs extends N {
    constructor(t, s) {
        super(t, s),
        this.valid = !0,
        this.filterFrame = null,
        this.filterPoolKey = null,
        this.updateUvs();
    }
    get framebuffer() {
        return this.baseTexture.framebuffer;
    }
    get multisample() {
        return this.framebuffer.multisample;
    }
    set multisample(t) {
        this.framebuffer.multisample = t;
    }
    resize(t, s, i=!0) {
        const r = this.baseTexture.resolution
            , n = Math.round(t * r) / r
            , o = Math.round(s * r) / r;
        this.valid = n > 0 && o > 0,
        this._frame.width = this.orig.width = n,
        this._frame.height = this.orig.height = o,
        i && this.baseTexture.resize(n, o),
        this.updateUvs();
    }
    setResolution(t) {
        const {baseTexture: s} = this;
        s.resolution !== t && (s.setResolution(t),
        this.resize(s.width, s.height, !1));
    }
    static create(t) {
        return new vs(new Fr(t));
    }
}
class Br {
    constructor(t) {
        this.texturePool = {},
        this.textureOptions = t || {},
        this.enableFullScreen = !1,
        this._pixelsWidth = 0,
        this._pixelsHeight = 0;
    }
    createTexture(t, s, i=J.NONE) {
        const r = new Fr(Object.assign({
            width: t,
            height: s,
            resolution: 1,
            multisample: i
        }, this.textureOptions));
        return new vs(r);
    }
    getOptimalTexture(t, s, i=1, r=J.NONE) {
        let n;
        t = Math.ceil(t * i - 1e-6),
        s = Math.ceil(s * i - 1e-6),
        !this.enableFullScreen || t !== this._pixelsWidth || s !== this._pixelsHeight ? (t = as(t),
        s = as(s),
        n = ((t & 65535) << 16 | s & 65535) >>> 0,
        r > 1 && (n += r * 4294967296)) : n = r > 1 ? -r : -1,
        this.texturePool[n] || (this.texturePool[n] = []);
        let o = this.texturePool[n].pop();
        return o || (o = this.createTexture(t, s, r)),
        o.filterPoolKey = n,
        o.setResolution(i),
        o;
    }
    getFilterTexture(t, s, i) {
        const r = this.getOptimalTexture(t.width, t.height, s || t.resolution, i || J.NONE);
        return r.filterFrame = t.filterFrame,
        r;
    }
    returnTexture(t) {
        const s = t.filterPoolKey;
        t.filterFrame = null,
        this.texturePool[s].push(t);
    }
    returnFilterTexture(t) {
        this.returnTexture(t);
    }
    clear(t) {
        if (t = t !== !1,
        t)
            for (const s in this.texturePool) {
                const i = this.texturePool[s];
                if (i)
                    for (let r = 0; r < i.length; r++)
                        i[r].destroy(!0);
            }
        this.texturePool = {};
    }
    setScreenSize(t) {
        if (!(t.width === this._pixelsWidth && t.height === this._pixelsHeight)) {
            this.enableFullScreen = t.width > 0 && t.height > 0;
            for (const s in this.texturePool) {
                if (!(Number(s) < 0))
                    continue;
                const i = this.texturePool[s];
                if (i)
                    for (let r = 0; r < i.length; r++)
                        i[r].destroy(!0);
                this.texturePool[s] = [];
            }
            this._pixelsWidth = t.width,
            this._pixelsHeight = t.height;
        }
    }
}
Br.SCREEN_KEY = -1;
class Yo extends me {
    constructor() {
        super(),
        this.addAttribute("aVertexPosition", new Float32Array([0, 0, 1, 0, 1, 1, 0, 1])).addIndex([0, 1, 3, 2]);
    }
}
class Wo extends me {
    constructor() {
        super(),
        this.vertices = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]),
        this.uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
        this.vertexBuffer = new at(this.vertices),
        this.uvBuffer = new at(this.uvs),
        this.addAttribute("aVertexPosition", this.vertexBuffer).addAttribute("aTextureCoord", this.uvBuffer).addIndex([0, 1, 2, 0, 2, 3]);
    }
    map(t, s) {
        let i = 0
            , r = 0;
        return this.uvs[0] = i,
        this.uvs[1] = r,
        this.uvs[2] = i + s.width / t.width,
        this.uvs[3] = r,
        this.uvs[4] = i + s.width / t.width,
        this.uvs[5] = r + s.height / t.height,
        this.uvs[6] = i,
        this.uvs[7] = r + s.height / t.height,
        i = s.x,
        r = s.y,
        this.vertices[0] = i,
        this.vertices[1] = r,
        this.vertices[2] = i + s.width,
        this.vertices[3] = r,
        this.vertices[4] = i + s.width,
        this.vertices[5] = r + s.height,
        this.vertices[6] = i,
        this.vertices[7] = r + s.height,
        this.invalidate(),
        this;
    }
    invalidate() {
        return this.vertexBuffer._updateID++,
        this.uvBuffer._updateID++,
        this;
    }
}
class qo {
    constructor() {
        this.renderTexture = null,
        this.target = null,
        this.legacy = !1,
        this.resolution = 1,
        this.multisample = J.NONE,
        this.sourceFrame = new H,
        this.destinationFrame = new H,
        this.bindingSourceFrame = new H,
        this.bindingDestinationFrame = new H,
        this.filters = [],
        this.transform = null;
    }
    clear() {
        this.target = null,
        this.filters = null,
        this.renderTexture = null;
    }
}
const Je = [new W, new W, new W, new W]
    , ks = new et;
class Ur {
    constructor(t) {
        this.renderer = t,
        this.defaultFilterStack = [{}],
        this.texturePool = new Br,
        this.statePool = [],
        this.quad = new Yo,
        this.quadUv = new Wo,
        this.tempRect = new H,
        this.activeState = {},
        this.globalUniforms = new Tt({
            outputFrame: new H,
            inputSize: new Float32Array(4),
            inputPixel: new Float32Array(4),
            inputClamp: new Float32Array(4),
            resolution: 1,
            filterArea: new Float32Array(4),
            filterClamp: new Float32Array(4)
        },!0),
        this.forceClear = !1,
        this.useMaxPadding = !1;
    }
    init() {
        this.texturePool.setScreenSize(this.renderer.view);
    }
    push(t, s) {
        let f, _;
        const i = this.renderer
            , r = this.defaultFilterStack
            , n = this.statePool.pop() || new qo
            , o = this.renderer.renderTexture;
        let h = s[0].resolution
            , a = s[0].multisample
            , l = s[0].padding
            , u = s[0].autoFit
            , c = (f = s[0].legacy) != null ? f : !0;
        for (let g = 1; g < s.length; g++) {
            const v = s[g];
            h = Math.min(h, v.resolution),
            a = Math.min(a, v.multisample),
            l = this.useMaxPadding ? Math.max(l, v.padding) : l + v.padding,
            u = u && v.autoFit,
            c = c || ((_ = v.legacy) != null ? _ : !0);
        }
        r.length === 1 && (this.defaultFilterStack[0].renderTexture = o.current),
        r.push(n),
        n.resolution = h,
        n.multisample = a,
        n.legacy = c,
        n.target = t,
        n.sourceFrame.copyFrom(t.filterArea || t.getBounds(!0)),
        n.sourceFrame.pad(l);
        const d = this.tempRect.copyFrom(o.sourceFrame);
        i.projection.transform && this.transformAABB(ks.copyFrom(i.projection.transform).invert(), d),
        u ? (n.sourceFrame.fit(d),
        (n.sourceFrame.width <= 0 || n.sourceFrame.height <= 0) && (n.sourceFrame.width = 0,
        n.sourceFrame.height = 0)) : n.sourceFrame.intersects(d) || (n.sourceFrame.width = 0,
        n.sourceFrame.height = 0),
        this.roundFrame(n.sourceFrame, o.current ? o.current.resolution : i.resolution, o.sourceFrame, o.destinationFrame, i.projection.transform),
        n.renderTexture = this.getOptimalFilterTexture(n.sourceFrame.width, n.sourceFrame.height, h, a),
        n.filters = s,
        n.destinationFrame.width = n.renderTexture.width,
        n.destinationFrame.height = n.renderTexture.height;
        const p = this.tempRect;
        p.x = 0,
        p.y = 0,
        p.width = n.sourceFrame.width,
        p.height = n.sourceFrame.height,
        n.renderTexture.filterFrame = n.sourceFrame,
        n.bindingSourceFrame.copyFrom(o.sourceFrame),
        n.bindingDestinationFrame.copyFrom(o.destinationFrame),
        n.transform = i.projection.transform,
        i.projection.transform = null,
        o.bind(n.renderTexture, n.sourceFrame, p),
        i.framebuffer.clear(0, 0, 0, 0);
    }
    pop() {
        const t = this.defaultFilterStack
            , s = t.pop()
            , i = s.filters;
        this.activeState = s;
        const r = this.globalUniforms.uniforms;
        r.outputFrame = s.sourceFrame,
        r.resolution = s.resolution;
        const n = r.inputSize
            , o = r.inputPixel
            , h = r.inputClamp;
        if (n[0] = s.destinationFrame.width,
        n[1] = s.destinationFrame.height,
        n[2] = 1 / n[0],
        n[3] = 1 / n[1],
        o[0] = Math.round(n[0] * s.resolution),
        o[1] = Math.round(n[1] * s.resolution),
        o[2] = 1 / o[0],
        o[3] = 1 / o[1],
        h[0] = .5 * o[2],
        h[1] = .5 * o[3],
        h[2] = s.sourceFrame.width * n[2] - .5 * o[2],
        h[3] = s.sourceFrame.height * n[3] - .5 * o[3],
        s.legacy) {
            const l = r.filterArea;
            l[0] = s.destinationFrame.width,
            l[1] = s.destinationFrame.height,
            l[2] = s.sourceFrame.x,
            l[3] = s.sourceFrame.y,
            r.filterClamp = r.inputClamp;
        }
        this.globalUniforms.update();
        const a = t[t.length - 1];
        if (this.renderer.framebuffer.blit(),
        i.length === 1)
            i[0].apply(this, s.renderTexture, a.renderTexture, jt.BLEND, s),
            this.returnFilterTexture(s.renderTexture);
        else {
            let l = s.renderTexture
                , u = this.getOptimalFilterTexture(l.width, l.height, s.resolution);
            u.filterFrame = l.filterFrame;
            let c = 0;
            for (c = 0; c < i.length - 1; ++c) {
                c === 1 && s.multisample > 1 && (u = this.getOptimalFilterTexture(l.width, l.height, s.resolution),
                u.filterFrame = l.filterFrame),
                i[c].apply(this, l, u, jt.CLEAR, s);
                const d = l;
                l = u,
                u = d;
            }
            i[c].apply(this, l, a.renderTexture, jt.BLEND, s),
            c > 1 && s.multisample > 1 && this.returnFilterTexture(s.renderTexture),
            this.returnFilterTexture(l),
            this.returnFilterTexture(u);
        }
        s.clear(),
        this.statePool.push(s);
    }
    bindAndClear(t, s=jt.CLEAR) {
        const {renderTexture: i, state: r} = this.renderer;
        if (t === this.defaultFilterStack[this.defaultFilterStack.length - 1].renderTexture ? this.renderer.projection.transform = this.activeState.transform : this.renderer.projection.transform = null,
        t != null && t.filterFrame) {
            const o = this.tempRect;
            o.x = 0,
            o.y = 0,
            o.width = t.filterFrame.width,
            o.height = t.filterFrame.height,
            i.bind(t, t.filterFrame, o);
        } else
            t !== this.defaultFilterStack[this.defaultFilterStack.length - 1].renderTexture ? i.bind(t) : this.renderer.renderTexture.bind(t, this.activeState.bindingSourceFrame, this.activeState.bindingDestinationFrame);
        const n = r.stateId & 1 || this.forceClear;
        (s === jt.CLEAR || s === jt.BLIT && n) && this.renderer.framebuffer.clear(0, 0, 0, 0);
    }
    applyFilter(t, s, i, r) {
        const n = this.renderer;
        n.state.set(t.state),
        this.bindAndClear(i, r),
        t.uniforms.uSampler = s,
        t.uniforms.filterGlobals = this.globalUniforms,
        n.shader.bind(t),
        t.legacy = !!t.program.attributeData.aTextureCoord,
        t.legacy ? (this.quadUv.map(s._frame, s.filterFrame),
        n.geometry.bind(this.quadUv),
        n.geometry.draw(Gt.TRIANGLES)) : (n.geometry.bind(this.quad),
        n.geometry.draw(Gt.TRIANGLE_STRIP));
    }
    calculateSpriteMatrix(t, s) {
        const {sourceFrame: i, destinationFrame: r} = this.activeState
            , {orig: n} = s._texture
            , o = t.set(r.width, 0, 0, r.height, i.x, i.y)
            , h = s.worldTransform.copyTo(et.TEMP_MATRIX);
        return h.invert(),
        o.prepend(h),
        o.scale(1 / n.width, 1 / n.height),
        o.translate(s.anchor.x, s.anchor.y),
        o;
    }
    destroy() {
        this.renderer = null,
        this.texturePool.clear(!1);
    }
    getOptimalFilterTexture(t, s, i=1, r=J.NONE) {
        return this.texturePool.getOptimalTexture(t, s, i, r);
    }
    getFilterTexture(t, s, i) {
        if (typeof t == "number") {
            const n = t;
            t = s,
            s = n;
        }
        t = t || this.activeState.renderTexture;
        const r = this.texturePool.getOptimalTexture(t.width, t.height, s || t.resolution, i || J.NONE);
        return r.filterFrame = t.filterFrame,
        r;
    }
    returnFilterTexture(t) {
        this.texturePool.returnTexture(t);
    }
    emptyPool() {
        this.texturePool.clear(!0);
    }
    resize() {
        this.texturePool.setScreenSize(this.renderer.view);
    }
    transformAABB(t, s) {
        const i = Je[0]
            , r = Je[1]
            , n = Je[2]
            , o = Je[3];
        i.set(s.left, s.top),
        r.set(s.left, s.bottom),
        n.set(s.right, s.top),
        o.set(s.right, s.bottom),
        t.apply(i, i),
        t.apply(r, r),
        t.apply(n, n),
        t.apply(o, o);
        const h = Math.min(i.x, r.x, n.x, o.x)
            , a = Math.min(i.y, r.y, n.y, o.y)
            , l = Math.max(i.x, r.x, n.x, o.x)
            , u = Math.max(i.y, r.y, n.y, o.y);
        s.x = h,
        s.y = a,
        s.width = l - h,
        s.height = u - a;
    }
    roundFrame(t, s, i, r, n) {
        if (!(t.width <= 0 || t.height <= 0 || i.width <= 0 || i.height <= 0)) {
            if (n) {
                const {a: o, b: h, c: a, d: l} = n;
                if ((Math.abs(h) > 1e-4 || Math.abs(a) > 1e-4) && (Math.abs(o) > 1e-4 || Math.abs(l) > 1e-4))
                    return;
            }
            n = n ? ks.copyFrom(n) : ks.identity(),
            n.translate(-i.x, -i.y).scale(r.width / i.width, r.height / i.height).translate(r.x, r.y),
            this.transformAABB(n, t),
            t.ceil(s),
            this.transformAABB(n.invert(), t);
        }
    }
}
Ur.extension = {
    type: P.RendererSystem,
    name: "filter"
};
D.add(Ur);
class Zo {
    constructor(t) {
        this.framebuffer = t,
        this.stencil = null,
        this.dirtyId = -1,
        this.dirtyFormat = -1,
        this.dirtySize = -1,
        this.multisample = J.NONE,
        this.msaaBuffer = null,
        this.blitFramebuffer = null,
        this.mipLevel = 0;
    }
}
const Ko = new H;
class Lr {
    constructor(t) {
        this.renderer = t,
        this.managedFramebuffers = [],
        this.unknownFramebuffer = new ni(10,10),
        this.msaaSamples = null;
    }
    contextChange() {
        this.disposeAll(!0);
        const t = this.gl = this.renderer.gl;
        if (this.CONTEXT_UID = this.renderer.CONTEXT_UID,
        this.current = this.unknownFramebuffer,
        this.viewport = new H,
        this.hasMRT = !0,
        this.writeDepthTexture = !0,
        this.renderer.context.webGLVersion === 1) {
            let s = this.renderer.context.extensions.drawBuffers
                , i = this.renderer.context.extensions.depthTexture;
            O.PREFER_ENV === ee.WEBGL_LEGACY && (s = null,
            i = null),
            s ? t.drawBuffers = r => s.drawBuffersWEBGL(r) : (this.hasMRT = !1,
            t.drawBuffers = () => {}
            ),
            i || (this.writeDepthTexture = !1);
        } else
            this.msaaSamples = t.getInternalformatParameter(t.RENDERBUFFER, t.RGBA8, t.SAMPLES);
    }
    bind(t, s, i=0) {
        const {gl: r} = this;
        if (t) {
            const n = t.glFramebuffers[this.CONTEXT_UID] || this.initFramebuffer(t);
            this.current !== t && (this.current = t,
            r.bindFramebuffer(r.FRAMEBUFFER, n.framebuffer)),
            n.mipLevel !== i && (t.dirtyId++,
            t.dirtyFormat++,
            n.mipLevel = i),
            n.dirtyId !== t.dirtyId && (n.dirtyId = t.dirtyId,
            n.dirtyFormat !== t.dirtyFormat ? (n.dirtyFormat = t.dirtyFormat,
            n.dirtySize = t.dirtySize,
            this.updateFramebuffer(t, i)) : n.dirtySize !== t.dirtySize && (n.dirtySize = t.dirtySize,
            this.resizeFramebuffer(t)));
            for (let o = 0; o < t.colorTextures.length; o++) {
                const h = t.colorTextures[o];
                this.renderer.texture.unbind(h.parentTextureArray || h);
            }
            if (t.depthTexture && this.renderer.texture.unbind(t.depthTexture),
            s) {
                const o = s.width >> i
                    , h = s.height >> i
                    , a = o / s.width;
                this.setViewport(s.x * a, s.y * a, o, h);
            } else {
                const o = t.width >> i
                    , h = t.height >> i;
                this.setViewport(0, 0, o, h);
            }
        } else
            this.current && (this.current = null,
            r.bindFramebuffer(r.FRAMEBUFFER, null)),
            s ? this.setViewport(s.x, s.y, s.width, s.height) : this.setViewport(0, 0, this.renderer.width, this.renderer.height);
    }
    setViewport(t, s, i, r) {
        const n = this.viewport;
        t = Math.round(t),
        s = Math.round(s),
        i = Math.round(i),
        r = Math.round(r),
        (n.width !== i || n.height !== r || n.x !== t || n.y !== s) && (n.x = t,
        n.y = s,
        n.width = i,
        n.height = r,
        this.gl.viewport(t, s, i, r));
    }
    get size() {
        return this.current ? {
            x: 0,
            y: 0,
            width: this.current.width,
            height: this.current.height
        } : {
            x: 0,
            y: 0,
            width: this.renderer.width,
            height: this.renderer.height
        };
    }
    clear(t, s, i, r, n=$s.COLOR | $s.DEPTH) {
        const {gl: o} = this;
        o.clearColor(t, s, i, r),
        o.clear(n);
    }
    initFramebuffer(t) {
        const {gl: s} = this
            , i = new Zo(s.createFramebuffer());
        return i.multisample = this.detectSamples(t.multisample),
        t.glFramebuffers[this.CONTEXT_UID] = i,
        this.managedFramebuffers.push(t),
        t.disposeRunner.add(this),
        i;
    }
    resizeFramebuffer(t) {
        const {gl: s} = this
            , i = t.glFramebuffers[this.CONTEXT_UID];
        i.stencil && (s.bindRenderbuffer(s.RENDERBUFFER, i.stencil),
        i.msaaBuffer ? s.renderbufferStorageMultisample(s.RENDERBUFFER, i.multisample, s.DEPTH24_STENCIL8, t.width, t.height) : s.renderbufferStorage(s.RENDERBUFFER, s.DEPTH_STENCIL, t.width, t.height));
        const r = t.colorTextures;
        let n = r.length;
        s.drawBuffers || (n = Math.min(n, 1));
        for (let o = 0; o < n; o++) {
            const h = r[o]
                , a = h.parentTextureArray || h;
            this.renderer.texture.bind(a, 0),
            o === 0 && i.msaaBuffer && (s.bindRenderbuffer(s.RENDERBUFFER, i.msaaBuffer),
            s.renderbufferStorageMultisample(s.RENDERBUFFER, i.multisample, a._glTextures[this.CONTEXT_UID].internalFormat, t.width, t.height));
        }
        t.depthTexture && this.writeDepthTexture && this.renderer.texture.bind(t.depthTexture, 0);
    }
    updateFramebuffer(t, s) {
        const {gl: i} = this
            , r = t.glFramebuffers[this.CONTEXT_UID]
            , n = t.colorTextures;
        let o = n.length;
        i.drawBuffers || (o = Math.min(o, 1)),
        r.multisample > 1 && this.canMultisampleFramebuffer(t) ? r.msaaBuffer = r.msaaBuffer || i.createRenderbuffer() : r.msaaBuffer && (i.deleteRenderbuffer(r.msaaBuffer),
        r.msaaBuffer = null,
        r.blitFramebuffer && (r.blitFramebuffer.dispose(),
        r.blitFramebuffer = null));
        const h = [];
        for (let a = 0; a < o; a++) {
            const l = n[a]
                , u = l.parentTextureArray || l;
            this.renderer.texture.bind(u, 0),
            a === 0 && r.msaaBuffer ? (i.bindRenderbuffer(i.RENDERBUFFER, r.msaaBuffer),
            i.renderbufferStorageMultisample(i.RENDERBUFFER, r.multisample, u._glTextures[this.CONTEXT_UID].internalFormat, t.width, t.height),
            i.framebufferRenderbuffer(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0, i.RENDERBUFFER, r.msaaBuffer)) : (i.framebufferTexture2D(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0 + a, l.target, u._glTextures[this.CONTEXT_UID].texture, s),
            h.push(i.COLOR_ATTACHMENT0 + a));
        }
        if (h.length > 1 && i.drawBuffers(h),
        t.depthTexture && this.writeDepthTexture) {
            const l = t.depthTexture;
            this.renderer.texture.bind(l, 0),
            i.framebufferTexture2D(i.FRAMEBUFFER, i.DEPTH_ATTACHMENT, i.TEXTURE_2D, l._glTextures[this.CONTEXT_UID].texture, s);
        }
        (t.stencil || t.depth) && !(t.depthTexture && this.writeDepthTexture) ? (r.stencil = r.stencil || i.createRenderbuffer(),
        i.bindRenderbuffer(i.RENDERBUFFER, r.stencil),
        r.msaaBuffer ? i.renderbufferStorageMultisample(i.RENDERBUFFER, r.multisample, i.DEPTH24_STENCIL8, t.width, t.height) : i.renderbufferStorage(i.RENDERBUFFER, i.DEPTH_STENCIL, t.width, t.height),
        i.framebufferRenderbuffer(i.FRAMEBUFFER, i.DEPTH_STENCIL_ATTACHMENT, i.RENDERBUFFER, r.stencil)) : r.stencil && (i.deleteRenderbuffer(r.stencil),
        r.stencil = null);
    }
    canMultisampleFramebuffer(t) {
        return this.renderer.context.webGLVersion !== 1 && t.colorTextures.length <= 1 && !t.depthTexture;
    }
    detectSamples(t) {
        const {msaaSamples: s} = this;
        let i = J.NONE;
        if (t <= 1 || s === null)
            return i;
        for (let r = 0; r < s.length; r++)
            if (s[r] <= t) {
                i = s[r];
                break;
            }
        return i === 1 && (i = J.NONE),
        i;
    }
    blit(t, s, i) {
        const {current: r, renderer: n, gl: o, CONTEXT_UID: h} = this;
        if (n.context.webGLVersion !== 2 || !r)
            return;
        const a = r.glFramebuffers[h];
        if (!a)
            return;
        if (!t) {
            if (!a.msaaBuffer)
                return;
            const u = r.colorTextures[0];
            if (!u)
                return;
            a.blitFramebuffer || (a.blitFramebuffer = new ni(r.width,r.height),
            a.blitFramebuffer.addColorTexture(0, u)),
            t = a.blitFramebuffer,
            t.colorTextures[0] !== u && (t.colorTextures[0] = u,
            t.dirtyId++,
            t.dirtyFormat++),
            (t.width !== r.width || t.height !== r.height) && (t.width = r.width,
            t.height = r.height,
            t.dirtyId++,
            t.dirtySize++);
        }
        s || (s = Ko,
        s.width = r.width,
        s.height = r.height),
        i || (i = s);
        const l = s.width === i.width && s.height === i.height;
        this.bind(t),
        o.bindFramebuffer(o.READ_FRAMEBUFFER, a.framebuffer),
        o.blitFramebuffer(s.left, s.top, s.right, s.bottom, i.left, i.top, i.right, i.bottom, o.COLOR_BUFFER_BIT, l ? o.NEAREST : o.LINEAR),
        o.bindFramebuffer(o.READ_FRAMEBUFFER, t.glFramebuffers[this.CONTEXT_UID].framebuffer);
    }
    disposeFramebuffer(t, s) {
        const i = t.glFramebuffers[this.CONTEXT_UID]
            , r = this.gl;
        if (!i)
            return;
        delete t.glFramebuffers[this.CONTEXT_UID];
        const n = this.managedFramebuffers.indexOf(t);
        n >= 0 && this.managedFramebuffers.splice(n, 1),
        t.disposeRunner.remove(this),
        s || (r.deleteFramebuffer(i.framebuffer),
        i.msaaBuffer && r.deleteRenderbuffer(i.msaaBuffer),
        i.stencil && r.deleteRenderbuffer(i.stencil)),
        i.blitFramebuffer && this.disposeFramebuffer(i.blitFramebuffer, s);
    }
    disposeAll(t) {
        const s = this.managedFramebuffers;
        this.managedFramebuffers = [];
        for (let i = 0; i < s.length; i++)
            this.disposeFramebuffer(s[i], t);
    }
    forceStencil() {
        const t = this.current;
        if (!t)
            return;
        const s = t.glFramebuffers[this.CONTEXT_UID];
        if (!s || s.stencil)
            return;
        t.stencil = !0;
        const i = t.width
            , r = t.height
            , n = this.gl
            , o = n.createRenderbuffer();
        n.bindRenderbuffer(n.RENDERBUFFER, o),
        s.msaaBuffer ? n.renderbufferStorageMultisample(n.RENDERBUFFER, s.multisample, n.DEPTH24_STENCIL8, i, r) : n.renderbufferStorage(n.RENDERBUFFER, n.DEPTH_STENCIL, i, r),
        s.stencil = o,
        n.framebufferRenderbuffer(n.FRAMEBUFFER, n.DEPTH_STENCIL_ATTACHMENT, n.RENDERBUFFER, o);
    }
    reset() {
        this.current = this.unknownFramebuffer,
        this.viewport = new H;
    }
    destroy() {
        this.renderer = null;
    }
}
Lr.extension = {
    type: P.RendererSystem,
    name: "framebuffer"
};
D.add(Lr);
const Ds = {
    5126: 4,
    5123: 2,
    5121: 1
};
class kr {
    constructor(t) {
        this.renderer = t,
        this._activeGeometry = null,
        this._activeVao = null,
        this.hasVao = !0,
        this.hasInstance = !0,
        this.canUseUInt32ElementIndex = !1,
        this.managedGeometries = {};
    }
    contextChange() {
        this.disposeAll(!0);
        const t = this.gl = this.renderer.gl
            , s = this.renderer.context;
        if (this.CONTEXT_UID = this.renderer.CONTEXT_UID,
        s.webGLVersion !== 2) {
            let i = this.renderer.context.extensions.vertexArrayObject;
            O.PREFER_ENV === ee.WEBGL_LEGACY && (i = null),
            i ? (t.createVertexArray = () => i.createVertexArrayOES(),
            t.bindVertexArray = r => i.bindVertexArrayOES(r),
            t.deleteVertexArray = r => i.deleteVertexArrayOES(r)) : (this.hasVao = !1,
            t.createVertexArray = () => null,
            t.bindVertexArray = () => null,
            t.deleteVertexArray = () => null);
        }
        if (s.webGLVersion !== 2) {
            const i = t.getExtension("ANGLE_instanced_arrays");
            i ? (t.vertexAttribDivisor = (r, n) => i.vertexAttribDivisorANGLE(r, n),
            t.drawElementsInstanced = (r, n, o, h, a) => i.drawElementsInstancedANGLE(r, n, o, h, a),
            t.drawArraysInstanced = (r, n, o, h) => i.drawArraysInstancedANGLE(r, n, o, h)) : this.hasInstance = !1;
        }
        this.canUseUInt32ElementIndex = s.webGLVersion === 2 || !!s.extensions.uint32ElementIndex;
    }
    bind(t, s) {
        s = s || this.renderer.shader.shader;
        const {gl: i} = this;
        let r = t.glVertexArrayObjects[this.CONTEXT_UID]
            , n = !1;
        r || (this.managedGeometries[t.id] = t,
        t.disposeRunner.add(this),
        t.glVertexArrayObjects[this.CONTEXT_UID] = r = {},
        n = !0);
        const o = r[s.program.id] || this.initGeometryVao(t, s, n);
        this._activeGeometry = t,
        this._activeVao !== o && (this._activeVao = o,
        this.hasVao ? i.bindVertexArray(o) : this.activateVao(t, s.program)),
        this.updateBuffers();
    }
    reset() {
        this.unbind();
    }
    updateBuffers() {
        const t = this._activeGeometry
            , s = this.renderer.buffer;
        for (let i = 0; i < t.buffers.length; i++) {
            const r = t.buffers[i];
            s.update(r);
        }
    }
    checkCompatibility(t, s) {
        const i = t.attributes
            , r = s.attributeData;
        for (const n in r)
            if (!i[n])
                throw new Error(`shader and geometry incompatible, geometry missing the "${n}" attribute`);
    }
    getSignature(t, s) {
        const i = t.attributes
            , r = s.attributeData
            , n = ["g", t.id];
        for (const o in i)
            r[o] && n.push(o, r[o].location);
        return n.join("-");
    }
    initGeometryVao(t, s, i=!0) {
        const r = this.gl
            , n = this.CONTEXT_UID
            , o = this.renderer.buffer
            , h = s.program;
        h.glPrograms[n] || this.renderer.shader.generateProgram(s),
        this.checkCompatibility(t, h);
        const a = this.getSignature(t, h)
            , l = t.glVertexArrayObjects[this.CONTEXT_UID];
        let u = l[a];
        if (u)
            return l[h.id] = u,
            u;
        const c = t.buffers
            , d = t.attributes
            , p = {}
            , f = {};
        for (const _ in c)
            p[_] = 0,
            f[_] = 0;
        for (const _ in d)
            !d[_].size && h.attributeData[_] ? d[_].size = h.attributeData[_].size : d[_].size || console.warn(`PIXI Geometry attribute '${_}' size cannot be determined (likely the bound shader does not have the attribute)`),
            p[d[_].buffer] += d[_].size * Ds[d[_].type];
        for (const _ in d) {
            const g = d[_]
                , v = g.size;
            g.stride === void 0 && (p[g.buffer] === v * Ds[g.type] ? g.stride = 0 : g.stride = p[g.buffer]),
            g.start === void 0 && (g.start = f[g.buffer],
            f[g.buffer] += v * Ds[g.type]);
        }
        u = r.createVertexArray(),
        r.bindVertexArray(u);
        for (let _ = 0; _ < c.length; _++) {
            const g = c[_];
            o.bind(g),
            i && g._glBuffers[n].refCount++;
        }
        return this.activateVao(t, h),
        l[h.id] = u,
        l[a] = u,
        r.bindVertexArray(null),
        o.unbind(St.ARRAY_BUFFER),
        u;
    }
    disposeGeometry(t, s) {
        let h;
        if (!this.managedGeometries[t.id])
            return;
        delete this.managedGeometries[t.id];
        const i = t.glVertexArrayObjects[this.CONTEXT_UID]
            , r = this.gl
            , n = t.buffers
            , o = (h = this.renderer) == null ? void 0 : h.buffer;
        if (t.disposeRunner.remove(this),
        !!i) {
            if (o)
                for (let a = 0; a < n.length; a++) {
                    const l = n[a]._glBuffers[this.CONTEXT_UID];
                    l && (l.refCount--,
                    l.refCount === 0 && !s && o.dispose(n[a], s));
                }
            if (!s) {
                for (const a in i)
                    if (a[0] === "g") {
                        const l = i[a];
                        this._activeVao === l && this.unbind(),
                        r.deleteVertexArray(l);
                    }
            }
            delete t.glVertexArrayObjects[this.CONTEXT_UID];
        }
    }
    disposeAll(t) {
        const s = Object.keys(this.managedGeometries);
        for (let i = 0; i < s.length; i++)
            this.disposeGeometry(this.managedGeometries[s[i]], t);
    }
    activateVao(t, s) {
        const i = this.gl
            , r = this.CONTEXT_UID
            , n = this.renderer.buffer
            , o = t.buffers
            , h = t.attributes;
        t.indexBuffer && n.bind(t.indexBuffer);
        let a = null;
        for (const l in h) {
            const u = h[l]
                , c = o[u.buffer]
                , d = c._glBuffers[r];
            if (s.attributeData[l]) {
                a !== d && (n.bind(c),
                a = d);
                const p = s.attributeData[l].location;
                if (i.enableVertexAttribArray(p),
                i.vertexAttribPointer(p, u.size, u.type || i.FLOAT, u.normalized, u.stride, u.start),
                u.instance)
                    if (this.hasInstance)
                        i.vertexAttribDivisor(p, u.divisor);
                    else
                        throw new Error("geometry error, GPU Instancing is not supported on this device");
            }
        }
    }
    draw(t, s, i, r) {
        const {gl: n} = this
            , o = this._activeGeometry;
        if (o.indexBuffer) {
            const h = o.indexBuffer.data.BYTES_PER_ELEMENT
                , a = h === 2 ? n.UNSIGNED_SHORT : n.UNSIGNED_INT;
            h === 2 || h === 4 && this.canUseUInt32ElementIndex ? o.instanced ? n.drawElementsInstanced(t, s || o.indexBuffer.data.length, a, (i || 0) * h, r || 1) : n.drawElements(t, s || o.indexBuffer.data.length, a, (i || 0) * h) : console.warn("unsupported index buffer type: uint32");
        } else
            o.instanced ? n.drawArraysInstanced(t, i, s || o.getSize(), r || 1) : n.drawArrays(t, i, s || o.getSize());
        return this;
    }
    unbind() {
        this.gl.bindVertexArray(null),
        this._activeVao = null,
        this._activeGeometry = null;
    }
    destroy() {
        this.renderer = null;
    }
}
kr.extension = {
    type: P.RendererSystem,
    name: "geometry"
};
D.add(kr);
const nr = new et;
class Jo {
    constructor(t, s) {
        this._texture = t,
        this.mapCoord = new et,
        this.uClampFrame = new Float32Array(4),
        this.uClampOffset = new Float32Array(2),
        this._textureID = -1,
        this._updateID = 0,
        this.clampOffset = 0,
        this.clampMargin = typeof s > "u" ? .5 : s,
        this.isSimple = !1;
    }
    get texture() {
        return this._texture;
    }
    set texture(t) {
        this._texture = t,
        this._textureID = -1;
    }
    multiplyUvs(t, s) {
        s === void 0 && (s = t);
        const i = this.mapCoord;
        for (let r = 0; r < t.length; r += 2) {
            const n = t[r]
                , o = t[r + 1];
            s[r] = n * i.a + o * i.c + i.tx,
            s[r + 1] = n * i.b + o * i.d + i.ty;
        }
        return s;
    }
    update(t) {
        const s = this._texture;
        if (!s || !s.valid || !t && this._textureID === s._updateID)
            return !1;
        this._textureID = s._updateID,
        this._updateID++;
        const i = s._uvs;
        this.mapCoord.set(i.x1 - i.x0, i.y1 - i.y0, i.x3 - i.x0, i.y3 - i.y0, i.x0, i.y0);
        const r = s.orig
            , n = s.trim;
        n && (nr.set(r.width / n.width, 0, 0, r.height / n.height, -n.x / n.width, -n.y / n.height),
        this.mapCoord.append(nr));
        const o = s.baseTexture
            , h = this.uClampFrame
            , a = this.clampMargin / o.resolution
            , l = this.clampOffset;
        return h[0] = (s._frame.x + a + l) / o.width,
        h[1] = (s._frame.y + a + l) / o.height,
        h[2] = (s._frame.x + s._frame.width - a + l) / o.width,
        h[3] = (s._frame.y + s._frame.height - a + l) / o.height,
        this.uClampOffset[0] = l / o.realWidth,
        this.uClampOffset[1] = l / o.realHeight,
        this.isSimple = s._frame.width === o.width && s._frame.height === o.height && s.rotate === 0,
        !0;
    }
}
let Qo = `varying vec2 vMaskCoord;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform sampler2D mask;
uniform float alpha;
uniform float npmAlpha;
uniform vec4 maskClamp;

void main(void)
{
    float clip = step(3.5,
        step(maskClamp.x, vMaskCoord.x) +
        step(maskClamp.y, vMaskCoord.y) +
        step(vMaskCoord.x, maskClamp.z) +
        step(vMaskCoord.y, maskClamp.w));

    vec4 original = texture2D(uSampler, vTextureCoord);
    vec4 masky = texture2D(mask, vMaskCoord);
    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);

    original *= (alphaMul * masky.r * alpha * clip);

    gl_FragColor = original;
}
`
    , th = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 otherMatrix;

varying vec2 vMaskCoord;
varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = aTextureCoord;
    vMaskCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;
}
`;
class eh extends yt {
    constructor(t, s, i) {
        let r = null;
        typeof t != "string" && s === void 0 && i === void 0 && (r = t,
        t = void 0,
        s = void 0,
        i = void 0),
        super(t || th, s || Qo, i),
        this.maskSprite = r,
        this.maskMatrix = new et;
    }
    get maskSprite() {
        return this._maskSprite;
    }
    set maskSprite(t) {
        this._maskSprite = t,
        this._maskSprite && (this._maskSprite.renderable = !1);
    }
    apply(t, s, i, r) {
        const n = this._maskSprite
            , o = n._texture;
        o.valid && (o.uvMatrix || (o.uvMatrix = new Jo(o,0)),
        o.uvMatrix.update(),
        this.uniforms.npmAlpha = o.baseTexture.alphaMode ? 0 : 1,
        this.uniforms.mask = o,
        this.uniforms.otherMatrix = t.calculateSpriteMatrix(this.maskMatrix, n).prepend(o.uvMatrix.mapCoord),
        this.uniforms.alpha = n.worldAlpha,
        this.uniforms.maskClamp = o.uvMatrix.uClampFrame,
        t.applyFilter(this, s, i, r));
    }
}
class sh {
    constructor(t=null) {
        this.type = tt.NONE,
        this.autoDetect = !0,
        this.maskObject = t || null,
        this.pooled = !1,
        this.isMaskData = !0,
        this.resolution = null,
        this.multisample = yt.defaultMultisample,
        this.enabled = !0,
        this.colorMask = 15,
        this._filters = null,
        this._stencilCounter = 0,
        this._scissorCounter = 0,
        this._scissorRect = null,
        this._scissorRectLocal = null,
        this._colorMask = 15,
        this._target = null;
    }
    get filter() {
        return this._filters ? this._filters[0] : null;
    }
    set filter(t) {
        t ? this._filters ? this._filters[0] = t : this._filters = [t] : this._filters = null;
    }
    reset() {
        this.pooled && (this.maskObject = null,
        this.type = tt.NONE,
        this.autoDetect = !0),
        this._target = null,
        this._scissorRectLocal = null;
    }
    copyCountersOrReset(t) {
        t ? (this._stencilCounter = t._stencilCounter,
        this._scissorCounter = t._scissorCounter,
        this._scissorRect = t._scissorRect) : (this._stencilCounter = 0,
        this._scissorCounter = 0,
        this._scissorRect = null);
    }
}
class Dr {
    constructor(t) {
        this.renderer = t,
        this.enableScissor = !0,
        this.alphaMaskPool = [],
        this.maskDataPool = [],
        this.maskStack = [],
        this.alphaMaskIndex = 0;
    }
    setMaskStack(t) {
        this.maskStack = t,
        this.renderer.scissor.setMaskStack(t),
        this.renderer.stencil.setMaskStack(t);
    }
    push(t, s) {
        let i = s;
        if (!i.isMaskData) {
            const n = this.maskDataPool.pop() || new sh;
            n.pooled = !0,
            n.maskObject = s,
            i = n;
        }
        const r = this.maskStack.length !== 0 ? this.maskStack[this.maskStack.length - 1] : null;
        if (i.copyCountersOrReset(r),
        i._colorMask = r ? r._colorMask : 15,
        i.autoDetect && this.detect(i),
        i._target = t,
        i.type !== tt.SPRITE && this.maskStack.push(i),
        i.enabled)
            switch (i.type) {
                case tt.SCISSOR:
                    this.renderer.scissor.push(i);
                    break;
                case tt.STENCIL:
                    this.renderer.stencil.push(i);
                    break;
                case tt.SPRITE:
                    i.copyCountersOrReset(null),
                    this.pushSpriteMask(i);
                    break;
                case tt.COLOR:
                    this.pushColorMask(i);
                    break;
            }
        i.type === tt.SPRITE && this.maskStack.push(i);
    }
    pop(t) {
        const s = this.maskStack.pop();
        if (!(!s || s._target !== t)) {
            if (s.enabled)
                switch (s.type) {
                    case tt.SCISSOR:
                        this.renderer.scissor.pop(s);
                        break;
                    case tt.STENCIL:
                        this.renderer.stencil.pop(s.maskObject);
                        break;
                    case tt.SPRITE:
                        this.popSpriteMask(s);
                        break;
                    case tt.COLOR:
                        this.popColorMask(s);
                        break;
                }
            if (s.reset(),
            s.pooled && this.maskDataPool.push(s),
            this.maskStack.length !== 0) {
                const i = this.maskStack[this.maskStack.length - 1];
                i.type === tt.SPRITE && i._filters && (i._filters[0].maskSprite = i.maskObject);
            }
        }
    }
    detect(t) {
        const s = t.maskObject;
        s ? s.isSprite ? t.type = tt.SPRITE : this.enableScissor && this.renderer.scissor.testScissor(t) ? t.type = tt.SCISSOR : t.type = tt.STENCIL : t.type = tt.COLOR;
    }
    pushSpriteMask(t) {
        let u, c;
        const {maskObject: s} = t
            , i = t._target;
        let r = t._filters;
        r || (r = this.alphaMaskPool[this.alphaMaskIndex],
        r || (r = this.alphaMaskPool[this.alphaMaskIndex] = [new eh]));
        const n = this.renderer
            , o = n.renderTexture;
        let h, a;
        if (o.current) {
            const d = o.current;
            h = t.resolution || d.resolution,
            a = (u = t.multisample) != null ? u : d.multisample;
        } else
            h = t.resolution || n.resolution,
            a = (c = t.multisample) != null ? c : n.multisample;
        r[0].resolution = h,
        r[0].multisample = a,
        r[0].maskSprite = s;
        const l = i.filterArea;
        i.filterArea = s.getBounds(!0),
        n.filter.push(i, r),
        i.filterArea = l,
        t._filters || this.alphaMaskIndex++;
    }
    popSpriteMask(t) {
        this.renderer.filter.pop(),
        t._filters ? t._filters[0].maskSprite = null : (this.alphaMaskIndex--,
        this.alphaMaskPool[this.alphaMaskIndex][0].maskSprite = null);
    }
    pushColorMask(t) {
        const s = t._colorMask
            , i = t._colorMask = s & t.colorMask;
        i !== s && this.renderer.gl.colorMask((i & 1) !== 0, (i & 2) !== 0, (i & 4) !== 0, (i & 8) !== 0);
    }
    popColorMask(t) {
        const s = t._colorMask
            , i = this.maskStack.length > 0 ? this.maskStack[this.maskStack.length - 1]._colorMask : 15;
        i !== s && this.renderer.gl.colorMask((i & 1) !== 0, (i & 2) !== 0, (i & 4) !== 0, (i & 8) !== 0);
    }
    destroy() {
        this.renderer = null;
    }
}
Dr.extension = {
    type: P.RendererSystem,
    name: "mask"
};
D.add(Dr);
class Gr {
    constructor(t) {
        this.renderer = t,
        this.maskStack = [],
        this.glConst = 0;
    }
    getStackLength() {
        return this.maskStack.length;
    }
    setMaskStack(t) {
        const {gl: s} = this.renderer
            , i = this.getStackLength();
        this.maskStack = t;
        const r = this.getStackLength();
        r !== i && (r === 0 ? s.disable(this.glConst) : (s.enable(this.glConst),
        this._useCurrent()));
    }
    _useCurrent() {}
    destroy() {
        this.renderer = null,
        this.maskStack = null;
    }
}
const or = new et
    , hr = []
    , ss = class extends Gr {
        constructor(e) {
            super(e),
            this.glConst = O.ADAPTER.getWebGLRenderingContext().SCISSOR_TEST;
        }
        getStackLength() {
            const e = this.maskStack[this.maskStack.length - 1];
            return e ? e._scissorCounter : 0;
        }
        calcScissorRect(e) {
            let o;
            if (e._scissorRectLocal)
                return;
            const t = e._scissorRect
                , {maskObject: s} = e
                , {renderer: i} = this
                , r = i.renderTexture
                , n = s.getBounds(!0, (o = hr.pop()) != null ? o : new H);
            this.roundFrameToPixels(n, r.current ? r.current.resolution : i.resolution, r.sourceFrame, r.destinationFrame, i.projection.transform),
            t && n.fit(t),
            e._scissorRectLocal = n;
        }
        static isMatrixRotated(e) {
            if (!e)
                return !1;
            const {a: t, b: s, c: i, d: r} = e;
            return (Math.abs(s) > 1e-4 || Math.abs(i) > 1e-4) && (Math.abs(t) > 1e-4 || Math.abs(r) > 1e-4);
        }
        testScissor(e) {
            const {maskObject: t} = e;
            if (!t.isFastRect || !t.isFastRect() || ss.isMatrixRotated(t.worldTransform) || ss.isMatrixRotated(this.renderer.projection.transform))
                return !1;
            this.calcScissorRect(e);
            const s = e._scissorRectLocal;
            return s.width > 0 && s.height > 0;
        }
        roundFrameToPixels(e, t, s, i, r) {
            ss.isMatrixRotated(r) || (r = r ? or.copyFrom(r) : or.identity(),
            r.translate(-s.x, -s.y).scale(i.width / s.width, i.height / s.height).translate(i.x, i.y),
            this.renderer.filter.transformAABB(r, e),
            e.fit(i),
            e.x = Math.round(e.x * t),
            e.y = Math.round(e.y * t),
            e.width = Math.round(e.width * t),
            e.height = Math.round(e.height * t));
        }
        push(e) {
            e._scissorRectLocal || this.calcScissorRect(e);
            const {gl: t} = this.renderer;
            e._scissorRect || t.enable(t.SCISSOR_TEST),
            e._scissorCounter++,
            e._scissorRect = e._scissorRectLocal,
            this._useCurrent();
        }
        pop(e) {
            const {gl: t} = this.renderer;
            e && hr.push(e._scissorRectLocal),
            this.getStackLength() > 0 ? this._useCurrent() : t.disable(t.SCISSOR_TEST);
        }
        _useCurrent() {
            const e = this.maskStack[this.maskStack.length - 1]._scissorRect;
            let t;
            this.renderer.renderTexture.current ? t = e.y : t = this.renderer.height - e.height - e.y,
            this.renderer.gl.scissor(e.x, t, e.width, e.height);
        }
    }
;
let Vr = ss;
Vr.extension = {
    type: P.RendererSystem,
    name: "scissor"
};
D.add(Vr);
class Xr extends Gr {
    constructor(t) {
        super(t),
        this.glConst = O.ADAPTER.getWebGLRenderingContext().STENCIL_TEST;
    }
    getStackLength() {
        const t = this.maskStack[this.maskStack.length - 1];
        return t ? t._stencilCounter : 0;
    }
    push(t) {
        const s = t.maskObject
            , {gl: i} = this.renderer
            , r = t._stencilCounter;
        r === 0 && (this.renderer.framebuffer.forceStencil(),
        i.clearStencil(0),
        i.clear(i.STENCIL_BUFFER_BIT),
        i.enable(i.STENCIL_TEST)),
        t._stencilCounter++;
        const n = t._colorMask;
        n !== 0 && (t._colorMask = 0,
        i.colorMask(!1, !1, !1, !1)),
        i.stencilFunc(i.EQUAL, r, 4294967295),
        i.stencilOp(i.KEEP, i.KEEP, i.INCR),
        s.renderable = !0,
        s.render(this.renderer),
        this.renderer.batch.flush(),
        s.renderable = !1,
        n !== 0 && (t._colorMask = n,
        i.colorMask((n & 1) !== 0, (n & 2) !== 0, (n & 4) !== 0, (n & 8) !== 0)),
        this._useCurrent();
    }
    pop(t) {
        const s = this.renderer.gl;
        if (this.getStackLength() === 0)
            s.disable(s.STENCIL_TEST);
        else {
            const i = this.maskStack.length !== 0 ? this.maskStack[this.maskStack.length - 1] : null
                , r = i ? i._colorMask : 15;
            r !== 0 && (i._colorMask = 0,
            s.colorMask(!1, !1, !1, !1)),
            s.stencilOp(s.KEEP, s.KEEP, s.DECR),
            t.renderable = !0,
            t.render(this.renderer),
            this.renderer.batch.flush(),
            t.renderable = !1,
            r !== 0 && (i._colorMask = r,
            s.colorMask((r & 1) !== 0, (r & 2) !== 0, (r & 4) !== 0, (r & 8) !== 0)),
            this._useCurrent();
        }
    }
    _useCurrent() {
        const t = this.renderer.gl;
        t.stencilFunc(t.EQUAL, this.getStackLength(), 4294967295),
        t.stencilOp(t.KEEP, t.KEEP, t.KEEP);
    }
}
Xr.extension = {
    type: P.RendererSystem,
    name: "stencil"
};
D.add(Xr);
class Hr {
    constructor(t) {
        this.renderer = t,
        this.plugins = {},
        Object.defineProperties(this.plugins, {
            extract: {
                enumerable: !1,
                get() {
                    return G("7.0.0", "renderer.plugins.extract has moved to renderer.extract"),
                    t.extract;
                }
            },
            prepare: {
                enumerable: !1,
                get() {
                    return G("7.0.0", "renderer.plugins.prepare has moved to renderer.prepare"),
                    t.prepare;
                }
            },
            interaction: {
                enumerable: !1,
                get() {
                    return G("7.0.0", "renderer.plugins.interaction has been deprecated, use renderer.events"),
                    t.events;
                }
            }
        });
    }
    init() {
        const t = this.rendererPlugins;
        for (const s in t)
            this.plugins[s] = new t[s](this.renderer);
    }
    destroy() {
        for (const t in this.plugins)
            this.plugins[t].destroy(),
            this.plugins[t] = null;
    }
}
Hr.extension = {
    type: [P.RendererSystem, P.CanvasRendererSystem],
    name: "_plugin"
};
D.add(Hr);
class $r {
    constructor(t) {
        this.renderer = t,
        this.destinationFrame = null,
        this.sourceFrame = null,
        this.defaultFrame = null,
        this.projectionMatrix = new et,
        this.transform = null;
    }
    update(t, s, i, r) {
        this.destinationFrame = t || this.destinationFrame || this.defaultFrame,
        this.sourceFrame = s || this.sourceFrame || t,
        this.calculateProjection(this.destinationFrame, this.sourceFrame, i, r),
        this.transform && this.projectionMatrix.append(this.transform);
        const n = this.renderer;
        n.globalUniforms.uniforms.projectionMatrix = this.projectionMatrix,
        n.globalUniforms.update(),
        n.shader.shader && n.shader.syncUniformGroup(n.shader.shader.uniforms.globals);
    }
    calculateProjection(t, s, i, r) {
        const n = this.projectionMatrix
            , o = r ? -1 : 1;
        n.identity(),
        n.a = 1 / s.width * 2,
        n.d = o * (1 / s.height * 2),
        n.tx = -1 - s.x * n.a,
        n.ty = -o - s.y * n.d;
    }
    setTransform(t) {}
    destroy() {
        this.renderer = null;
    }
}
$r.extension = {
    type: P.RendererSystem,
    name: "projection"
};
D.add($r);
const ih = new gi;
class zr {
    constructor(t) {
        this.renderer = t,
        this._tempMatrix = new et;
    }
    generateTexture(t, s) {
        const {region: i, ...r} = s || {}
            , n = i || t.getLocalBounds(null, !0);
        n.width === 0 && (n.width = 1),
        n.height === 0 && (n.height = 1);
        const o = vs.create({
            width: n.width,
            height: n.height,
            ...r
        });
        this._tempMatrix.tx = -n.x,
        this._tempMatrix.ty = -n.y;
        const h = t.transform;
        return t.transform = ih,
        this.renderer.render(t, {
            renderTexture: o,
            transform: this._tempMatrix,
            skipUpdateTransform: !!t.parent,
            blit: !0
        }),
        t.transform = h,
        o;
    }
    destroy() {}
}
zr.extension = {
    type: [P.RendererSystem, P.CanvasRendererSystem],
    name: "textureGenerator"
};
D.add(zr);
const $t = new H
    , we = new H;
class jr {
    constructor(t) {
        this.renderer = t,
        this.defaultMaskStack = [],
        this.current = null,
        this.sourceFrame = new H,
        this.destinationFrame = new H,
        this.viewportFrame = new H;
    }
    contextChange() {
        let s;
        const t = (s = this.renderer) == null ? void 0 : s.gl.getContextAttributes();
        this._rendererPremultipliedAlpha = !!(t && t.alpha && t.premultipliedAlpha);
    }
    bind(t=null, s, i) {
        const r = this.renderer;
        this.current = t;
        let n, o, h;
        t ? (n = t.baseTexture,
        h = n.resolution,
        s || ($t.width = t.frame.width,
        $t.height = t.frame.height,
        s = $t),
        i || (we.x = t.frame.x,
        we.y = t.frame.y,
        we.width = s.width,
        we.height = s.height,
        i = we),
        o = n.framebuffer) : (h = r.resolution,
        s || ($t.width = r._view.screen.width,
        $t.height = r._view.screen.height,
        s = $t),
        i || (i = $t,
        i.width = s.width,
        i.height = s.height));
        const a = this.viewportFrame;
        a.x = i.x * h,
        a.y = i.y * h,
        a.width = i.width * h,
        a.height = i.height * h,
        t || (a.y = r.view.height - (a.y + a.height)),
        a.ceil(),
        this.renderer.framebuffer.bind(o, a),
        this.renderer.projection.update(i, s, h, !o),
        t ? this.renderer.mask.setMaskStack(n.maskStack) : this.renderer.mask.setMaskStack(this.defaultMaskStack),
        this.sourceFrame.copyFrom(s),
        this.destinationFrame.copyFrom(i);
    }
    clear(t, s) {
        const i = this.current ? this.current.baseTexture.clear : this.renderer.background.backgroundColor
            , r = lt.shared.setValue(t || i);
        (this.current && this.current.baseTexture.alphaMode > 0 || !this.current && this._rendererPremultipliedAlpha) && r.premultiply(r.alpha);
        const n = this.destinationFrame
            , o = this.current ? this.current.baseTexture : this.renderer._view.screen
            , h = n.width !== o.width || n.height !== o.height;
        if (h) {
            let {x: a, y: l, width: u, height: c} = this.viewportFrame;
            a = Math.round(a),
            l = Math.round(l),
            u = Math.round(u),
            c = Math.round(c),
            this.renderer.gl.enable(this.renderer.gl.SCISSOR_TEST),
            this.renderer.gl.scissor(a, l, u, c);
        }
        this.renderer.framebuffer.clear(r.red, r.green, r.blue, r.alpha, s),
        h && this.renderer.scissor.pop();
    }
    resize() {
        this.bind(null);
    }
    reset() {
        this.bind(null);
    }
    destroy() {
        this.renderer = null;
    }
}
jr.extension = {
    type: P.RendererSystem,
    name: "renderTexture"
};
D.add(jr);
class rh {
    constructor(t, s) {
        this.program = t,
        this.uniformData = s,
        this.uniformGroups = {},
        this.uniformDirtyGroups = {},
        this.uniformBufferBindings = {};
    }
    destroy() {
        this.uniformData = null,
        this.uniformGroups = null,
        this.uniformDirtyGroups = null,
        this.uniformBufferBindings = null,
        this.program = null;
    }
}
function nh(e, t) {
    const s = {}
        , i = t.getProgramParameter(e, t.ACTIVE_ATTRIBUTES);
    for (let r = 0; r < i; r++) {
        const n = t.getActiveAttrib(e, r);
        if (n.name.startsWith("gl_"))
            continue;
        const o = Sr(t, n.type)
            , h = {
                type: o,
                name: n.name,
                size: Ar(o),
                location: t.getAttribLocation(e, n.name)
            };
        s[n.name] = h;
    }
    return s;
}
function oh(e, t) {
    const s = {}
        , i = t.getProgramParameter(e, t.ACTIVE_UNIFORMS);
    for (let r = 0; r < i; r++) {
        const n = t.getActiveUniform(e, r)
            , o = n.name.replace(/\[.*?\]$/, "")
            , h = !!n.name.match(/\[.*?\]$/)
            , a = Sr(t, n.type);
        s[o] = {
            name: o,
            index: r,
            type: a,
            size: n.size,
            isArray: h,
            value: Rr(a, n.size)
        };
    }
    return s;
}
function hh(e, t) {
    let a;
    const s = Qi(e, e.VERTEX_SHADER, t.vertexSrc)
        , i = Qi(e, e.FRAGMENT_SHADER, t.fragmentSrc)
        , r = e.createProgram();
    e.attachShader(r, s),
    e.attachShader(r, i);
    const n = (a = t.extra) == null ? void 0 : a.transformFeedbackVaryings;
    if (n && (typeof e.transformFeedbackVaryings != "function" ? console.warn("TransformFeedback is not supported but TransformFeedbackVaryings are given.") : e.transformFeedbackVaryings(r, n.names, n.bufferMode === "separate" ? e.SEPARATE_ATTRIBS : e.INTERLEAVED_ATTRIBS)),
    e.linkProgram(r),
    e.getProgramParameter(r, e.LINK_STATUS) || Oo(e, r, s, i),
    t.attributeData = nh(r, e),
    t.uniformData = oh(r, e),
    !/^[ \t]*#[ \t]*version[ \t]+300[ \t]+es[ \t]*$/m.test(t.vertexSrc)) {
        const l = Object.keys(t.attributeData);
        l.sort( (u, c) => u > c ? 1 : -1);
        for (let u = 0; u < l.length; u++)
            t.attributeData[l[u]].location = u,
            e.bindAttribLocation(r, u, l[u]);
        e.linkProgram(r);
    }
    e.deleteShader(s),
    e.deleteShader(i);
    const o = {};
    for (const l in t.uniformData) {
        const u = t.uniformData[l];
        o[l] = {
            location: e.getUniformLocation(r, l),
            value: Rr(u.type, u.size)
        };
    }
    return new rh(r,o);
}
function ah(e, t, s, i, r) {
    s.buffer.update(r);
}
const lh = {
        float: `
        data[offset] = v;
    `,
        vec2: `
        data[offset] = v[0];
        data[offset+1] = v[1];
    `,
        vec3: `
        data[offset] = v[0];
        data[offset+1] = v[1];
        data[offset+2] = v[2];

    `,
        vec4: `
        data[offset] = v[0];
        data[offset+1] = v[1];
        data[offset+2] = v[2];
        data[offset+3] = v[3];
    `,
        mat2: `
        data[offset] = v[0];
        data[offset+1] = v[1];

        data[offset+4] = v[2];
        data[offset+5] = v[3];
    `,
        mat3: `
        data[offset] = v[0];
        data[offset+1] = v[1];
        data[offset+2] = v[2];

        data[offset + 4] = v[3];
        data[offset + 5] = v[4];
        data[offset + 6] = v[5];

        data[offset + 8] = v[6];
        data[offset + 9] = v[7];
        data[offset + 10] = v[8];
    `,
        mat4: `
        for(var i = 0; i < 16; i++)
        {
            data[offset + i] = v[i];
        }
    `
    }
    , Yr = {
        float: 4,
        vec2: 8,
        vec3: 12,
        vec4: 16,
        int: 4,
        ivec2: 8,
        ivec3: 12,
        ivec4: 16,
        uint: 4,
        uvec2: 8,
        uvec3: 12,
        uvec4: 16,
        bool: 4,
        bvec2: 8,
        bvec3: 12,
        bvec4: 16,
        mat2: 16 * 2,
        mat3: 16 * 3,
        mat4: 16 * 4
    };
function uh(e) {
    const t = e.map(n => ({
        data: n,
        offset: 0,
        dataLen: 0,
        dirty: 0
    }));
    let s = 0
        , i = 0
        , r = 0;
    for (let n = 0; n < t.length; n++) {
        const o = t[n];
        if (s = Yr[o.data.type],
        o.data.size > 1 && (s = Math.max(s, 16) * o.data.size),
        o.dataLen = s,
        i % s !== 0 && i < 16) {
            const h = i % s % 16;
            i += h,
            r += h;
        }
        i + s > 16 ? (r = Math.ceil(r / 16) * 16,
        o.offset = r,
        r += s,
        i = s) : (o.offset = r,
        i += s,
        r += s);
    }
    return r = Math.ceil(r / 16) * 16,
    {
        uboElements: t,
        size: r
    };
}
function ch(e, t) {
    const s = [];
    for (const i in e)
        t[i] && s.push(t[i]);
    return s.sort( (i, r) => i.index - r.index),
    s;
}
function dh(e, t) {
    if (!e.autoManage)
        return {
            size: 0,
            syncFunc: ah
        };
    const s = ch(e.uniforms, t)
        , {uboElements: i, size: r} = uh(s)
        , n = [`
    var v = null;
    var v2 = null;
    var cv = null;
    var t = 0;
    var gl = renderer.gl
    var index = 0;
    var data = buffer.data;
    `];
    for (let o = 0; o < i.length; o++) {
        const h = i[o]
            , a = e.uniforms[h.data.name]
            , l = h.data.name;
        let u = !1;
        for (let c = 0; c < fe.length; c++) {
            const d = fe[c];
            if (d.codeUbo && d.test(h.data, a)) {
                n.push(`offset = ${h.offset / 4};`, fe[c].codeUbo(h.data.name, a)),
                u = !0;
                break;
            }
        }
        if (!u)
            if (h.data.size > 1) {
                const c = Ar(h.data.type)
                    , d = Math.max(Yr[h.data.type] / 16, 1)
                    , p = c / d
                    , f = (4 - p % 4) % 4;
                n.push(`
                cv = ud.${l}.value;
                v = uv.${l};
                offset = ${h.offset / 4};

                t = 0;

                for(var i=0; i < ${h.data.size * d}; i++)
                {
                    for(var j = 0; j < ${p}; j++)
                    {
                        data[offset++] = v[t++];
                    }
                    offset += ${f};
                }

                `);
            } else {
                const c = lh[h.data.type];
                n.push(`
                cv = ud.${l}.value;
                v = uv.${l};
                offset = ${h.offset / 4};
                ${c};
                `);
            }
    }
    return n.push(`
       renderer.buffer.update(buffer);
    `),
    {
        size: r,
        syncFunc: new Function("ud","uv","renderer","syncData","buffer",n.join(`
`))
    };
}
let fh = 0;
const Qe = {
    textureCount: 0,
    uboCount: 0
};
class Wr {
    constructor(t) {
        this.destroyed = !1,
        this.renderer = t,
        this.systemCheck(),
        this.gl = null,
        this.shader = null,
        this.program = null,
        this.cache = {},
        this._uboCache = {},
        this.id = fh++;
    }
    systemCheck() {
        if (!Uo())
            throw new Error("Current environment does not allow unsafe-eval, please use @pixi/unsafe-eval module to enable support.");
    }
    contextChange(t) {
        this.gl = t,
        this.reset();
    }
    bind(t, s) {
        t.disposeRunner.add(this),
        t.uniforms.globals = this.renderer.globalUniforms;
        const i = t.program
            , r = i.glPrograms[this.renderer.CONTEXT_UID] || this.generateProgram(t);
        return this.shader = t,
        this.program !== i && (this.program = i,
        this.gl.useProgram(r.program)),
        s || (Qe.textureCount = 0,
        Qe.uboCount = 0,
        this.syncUniformGroup(t.uniformGroup, Qe)),
        r;
    }
    setUniforms(t) {
        const s = this.shader.program
            , i = s.glPrograms[this.renderer.CONTEXT_UID];
        s.syncUniforms(i.uniformData, t, this.renderer);
    }
    syncUniformGroup(t, s) {
        const i = this.getGlProgram();
        (!t.static || t.dirtyId !== i.uniformDirtyGroups[t.id]) && (i.uniformDirtyGroups[t.id] = t.dirtyId,
        this.syncUniforms(t, i, s));
    }
    syncUniforms(t, s, i) {
        (t.syncUniforms[this.shader.program.id] || this.createSyncGroups(t))(s.uniformData, t.uniforms, this.renderer, i);
    }
    createSyncGroups(t) {
        const s = this.getSignature(t, this.shader.program.uniformData, "u");
        return this.cache[s] || (this.cache[s] = No(t, this.shader.program.uniformData)),
        t.syncUniforms[this.shader.program.id] = this.cache[s],
        t.syncUniforms[this.shader.program.id];
    }
    syncUniformBufferGroup(t, s) {
        const i = this.getGlProgram();
        if (!t.static || t.dirtyId !== 0 || !i.uniformGroups[t.id]) {
            t.dirtyId = 0;
            const r = i.uniformGroups[t.id] || this.createSyncBufferGroup(t, i, s);
            t.buffer.update(),
            r(i.uniformData, t.uniforms, this.renderer, Qe, t.buffer);
        }
        this.renderer.buffer.bindBufferBase(t.buffer, i.uniformBufferBindings[s]);
    }
    createSyncBufferGroup(t, s, i) {
        const {gl: r} = this.renderer;
        this.renderer.buffer.bind(t.buffer);
        const n = this.gl.getUniformBlockIndex(s.program, i);
        s.uniformBufferBindings[i] = this.shader.uniformBindCount,
        r.uniformBlockBinding(s.program, n, this.shader.uniformBindCount),
        this.shader.uniformBindCount++;
        const o = this.getSignature(t, this.shader.program.uniformData, "ubo");
        let h = this._uboCache[o];
        if (h || (h = this._uboCache[o] = dh(t, this.shader.program.uniformData)),
        t.autoManage) {
            const a = new Float32Array(h.size / 4);
            t.buffer.update(a);
        }
        return s.uniformGroups[t.id] = h.syncFunc,
        s.uniformGroups[t.id];
    }
    getSignature(t, s, i) {
        const r = t.uniforms
            , n = [`${i}-`];
        for (const o in r)
            n.push(o),
            s[o] && n.push(s[o].type);
        return n.join("-");
    }
    getGlProgram() {
        return this.shader ? this.shader.program.glPrograms[this.renderer.CONTEXT_UID] : null;
    }
    generateProgram(t) {
        const s = this.gl
            , i = t.program
            , r = hh(s, i);
        return i.glPrograms[this.renderer.CONTEXT_UID] = r,
        r;
    }
    reset() {
        this.program = null,
        this.shader = null;
    }
    disposeShader(t) {
        this.shader === t && (this.shader = null);
    }
    destroy() {
        this.renderer = null,
        this.destroyed = !0;
    }
}
Wr.extension = {
    type: P.RendererSystem,
    name: "shader"
};
D.add(Wr);
class bs {
    constructor(t) {
        this.renderer = t;
    }
    run(t) {
        const {renderer: s} = this;
        s.runners.init.emit(s.options),
        t.hello && console.log(`PixiJS 7.2.4 - ${s.rendererLogId} - https://pixijs.com`),
        s.resize(s.screen.width, s.screen.height);
    }
    destroy() {}
}
bs.defaultOptions = {
    hello: !1
};
bs.extension = {
    type: [P.RendererSystem, P.CanvasRendererSystem],
    name: "startup"
};
D.add(bs);
function ph(e, t=[]) {
    return t[A.NORMAL] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.ADD] = [e.ONE, e.ONE],
    t[A.MULTIPLY] = [e.DST_COLOR, e.ONE_MINUS_SRC_ALPHA, e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.SCREEN] = [e.ONE, e.ONE_MINUS_SRC_COLOR, e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.OVERLAY] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.DARKEN] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.LIGHTEN] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.COLOR_DODGE] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.COLOR_BURN] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.HARD_LIGHT] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.SOFT_LIGHT] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.DIFFERENCE] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.EXCLUSION] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.HUE] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.SATURATION] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.COLOR] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.LUMINOSITY] = [e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.NONE] = [0, 0],
    t[A.NORMAL_NPM] = [e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA, e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.ADD_NPM] = [e.SRC_ALPHA, e.ONE, e.ONE, e.ONE],
    t[A.SCREEN_NPM] = [e.SRC_ALPHA, e.ONE_MINUS_SRC_COLOR, e.ONE, e.ONE_MINUS_SRC_ALPHA],
    t[A.SRC_IN] = [e.DST_ALPHA, e.ZERO],
    t[A.SRC_OUT] = [e.ONE_MINUS_DST_ALPHA, e.ZERO],
    t[A.SRC_ATOP] = [e.DST_ALPHA, e.ONE_MINUS_SRC_ALPHA],
    t[A.DST_OVER] = [e.ONE_MINUS_DST_ALPHA, e.ONE],
    t[A.DST_IN] = [e.ZERO, e.SRC_ALPHA],
    t[A.DST_OUT] = [e.ZERO, e.ONE_MINUS_SRC_ALPHA],
    t[A.DST_ATOP] = [e.ONE_MINUS_DST_ALPHA, e.SRC_ALPHA],
    t[A.XOR] = [e.ONE_MINUS_DST_ALPHA, e.ONE_MINUS_SRC_ALPHA],
    t[A.SUBTRACT] = [e.ONE, e.ONE, e.ONE, e.ONE, e.FUNC_REVERSE_SUBTRACT, e.FUNC_ADD],
    t;
}
const mh = 0
    , gh = 1
    , _h = 2
    , xh = 3
    , yh = 4
    , vh = 5
    , oi = class {
        constructor() {
            this.gl = null,
            this.stateId = 0,
            this.polygonOffset = 0,
            this.blendMode = A.NONE,
            this._blendEq = !1,
            this.map = [],
            this.map[mh] = this.setBlend,
            this.map[gh] = this.setOffset,
            this.map[_h] = this.setCullFace,
            this.map[xh] = this.setDepthTest,
            this.map[yh] = this.setFrontFace,
            this.map[vh] = this.setDepthMask,
            this.checks = [],
            this.defaultState = new xe,
            this.defaultState.blend = !0;
        }
        contextChange(e) {
            this.gl = e,
            this.blendModes = ph(e),
            this.set(this.defaultState),
            this.reset();
        }
        set(e) {
            if (e = e || this.defaultState,
            this.stateId !== e.data) {
                let t = this.stateId ^ e.data
                    , s = 0;
                for (; t; )
                    t & 1 && this.map[s].call(this, !!(e.data & 1 << s)),
                    t = t >> 1,
                    s++;
                this.stateId = e.data;
            }
            for (let t = 0; t < this.checks.length; t++)
                this.checks[t](this, e);
        }
        forceState(e) {
            e = e || this.defaultState;
            for (let t = 0; t < this.map.length; t++)
                this.map[t].call(this, !!(e.data & 1 << t));
            for (let t = 0; t < this.checks.length; t++)
                this.checks[t](this, e);
            this.stateId = e.data;
        }
        setBlend(e) {
            this.updateCheck(oi.checkBlendMode, e),
            this.gl[e ? "enable" : "disable"](this.gl.BLEND);
        }
        setOffset(e) {
            this.updateCheck(oi.checkPolygonOffset, e),
            this.gl[e ? "enable" : "disable"](this.gl.POLYGON_OFFSET_FILL);
        }
        setDepthTest(e) {
            this.gl[e ? "enable" : "disable"](this.gl.DEPTH_TEST);
        }
        setDepthMask(e) {
            this.gl.depthMask(e);
        }
        setCullFace(e) {
            this.gl[e ? "enable" : "disable"](this.gl.CULL_FACE);
        }
        setFrontFace(e) {
            this.gl.frontFace(this.gl[e ? "CW" : "CCW"]);
        }
        setBlendMode(e) {
            if (e === this.blendMode)
                return;
            this.blendMode = e;
            const t = this.blendModes[e]
                , s = this.gl;
            t.length === 2 ? s.blendFunc(t[0], t[1]) : s.blendFuncSeparate(t[0], t[1], t[2], t[3]),
            t.length === 6 ? (this._blendEq = !0,
            s.blendEquationSeparate(t[4], t[5])) : this._blendEq && (this._blendEq = !1,
            s.blendEquationSeparate(s.FUNC_ADD, s.FUNC_ADD));
        }
        setPolygonOffset(e, t) {
            this.gl.polygonOffset(e, t);
        }
        reset() {
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, !1),
            this.forceState(this.defaultState),
            this._blendEq = !0,
            this.blendMode = -1,
            this.setBlendMode(0);
        }
        updateCheck(e, t) {
            const s = this.checks.indexOf(e);
            t && s === -1 ? this.checks.push(e) : !t && s !== -1 && this.checks.splice(s, 1);
        }
        static checkBlendMode(e, t) {
            e.setBlendMode(t.blendMode);
        }
        static checkPolygonOffset(e, t) {
            e.setPolygonOffset(1, t.polygonOffset);
        }
        destroy() {
            this.gl = null;
        }
    }
;
let qr = oi;
qr.extension = {
    type: P.RendererSystem,
    name: "state"
};
D.add(qr);
class bh extends pe {
    constructor() {
        super(...arguments),
        this.runners = {},
        this._systemsHash = {};
    }
    setup(t) {
        let r;
        this.addRunners(...t.runners);
        const s = ((r = t.priority) != null ? r : []).filter(n => t.systems[n])
            , i = [...s, ...Object.keys(t.systems).filter(n => !s.includes(n))];
        for (const n of i)
            this.addSystem(t.systems[n], n);
    }
    addRunners(...t) {
        t.forEach(s => {
            this.runners[s] = new bt(s);
        });
    }
    addSystem(t, s) {
        const i = new t(this);
        if (this[s])
            throw new Error(`Whoops! The name "${s}" is already in use`);
        this[s] = i,
        this._systemsHash[s] = i;
        for (const r in this.runners)
            this.runners[r].add(i);
        return this;
    }
    emitWithCustomOptions(t, s) {
        const i = Object.keys(this._systemsHash);
        t.items.forEach(r => {
            const n = i.find(o => this._systemsHash[o] === r);
            r[t.name](s[n]);
        });
    }
    destroy() {
        Object.values(this.runners).forEach(t => {
            t.destroy();
        }),
        this._systemsHash = {};
    }
}
const is = class {
    constructor(e) {
        this.renderer = e,
        this.count = 0,
        this.checkCount = 0,
        this.maxIdle = is.defaultMaxIdle,
        this.checkCountMax = is.defaultCheckCountMax,
        this.mode = is.defaultMode;
    }
    postrender() {
        this.renderer.objectRenderer.renderingToScreen && (this.count++,
        this.mode !== ci.MANUAL && (this.checkCount++,
        this.checkCount > this.checkCountMax && (this.checkCount = 0,
        this.run())));
    }
    run() {
        const e = this.renderer.texture
            , t = e.managedTextures;
        let s = !1;
        for (let i = 0; i < t.length; i++) {
            const r = t[i];
            !r.framebuffer && this.count - r.touched > this.maxIdle && (e.destroyTexture(r, !0),
            t[i] = null,
            s = !0);
        }
        if (s) {
            let i = 0;
            for (let r = 0; r < t.length; r++)
                t[r] !== null && (t[i++] = t[r]);
            t.length = i;
        }
    }
    unload(e) {
        const t = this.renderer.texture
            , s = e._texture;
        s && !s.framebuffer && t.destroyTexture(s);
        for (let i = e.children.length - 1; i >= 0; i--)
            this.unload(e.children[i]);
    }
    destroy() {
        this.renderer = null;
    }
}
;
let _t = is;
_t.defaultMode = ci.AUTO;
_t.defaultMaxIdle = 60 * 60;
_t.defaultCheckCountMax = 60 * 10;
_t.extension = {
    type: P.RendererSystem,
    name: "textureGC"
};
D.add(_t);
class Gs {
    constructor(t) {
        this.texture = t,
        this.width = -1,
        this.height = -1,
        this.dirtyId = -1,
        this.dirtyStyleId = -1,
        this.mipmap = !1,
        this.wrapMode = 33071,
        this.type = L.UNSIGNED_BYTE,
        this.internalFormat = b.RGBA,
        this.samplerType = 0;
    }
}
function Th(e) {
    let t;
    return "WebGL2RenderingContext"in globalThis && e instanceof globalThis.WebGL2RenderingContext ? t = {
        [L.UNSIGNED_BYTE]: {
            [b.RGBA]: e.RGBA8,
            [b.RGB]: e.RGB8,
            [b.RG]: e.RG8,
            [b.RED]: e.R8,
            [b.RGBA_INTEGER]: e.RGBA8UI,
            [b.RGB_INTEGER]: e.RGB8UI,
            [b.RG_INTEGER]: e.RG8UI,
            [b.RED_INTEGER]: e.R8UI,
            [b.ALPHA]: e.ALPHA,
            [b.LUMINANCE]: e.LUMINANCE,
            [b.LUMINANCE_ALPHA]: e.LUMINANCE_ALPHA
        },
        [L.BYTE]: {
            [b.RGBA]: e.RGBA8_SNORM,
            [b.RGB]: e.RGB8_SNORM,
            [b.RG]: e.RG8_SNORM,
            [b.RED]: e.R8_SNORM,
            [b.RGBA_INTEGER]: e.RGBA8I,
            [b.RGB_INTEGER]: e.RGB8I,
            [b.RG_INTEGER]: e.RG8I,
            [b.RED_INTEGER]: e.R8I
        },
        [L.UNSIGNED_SHORT]: {
            [b.RGBA_INTEGER]: e.RGBA16UI,
            [b.RGB_INTEGER]: e.RGB16UI,
            [b.RG_INTEGER]: e.RG16UI,
            [b.RED_INTEGER]: e.R16UI,
            [b.DEPTH_COMPONENT]: e.DEPTH_COMPONENT16
        },
        [L.SHORT]: {
            [b.RGBA_INTEGER]: e.RGBA16I,
            [b.RGB_INTEGER]: e.RGB16I,
            [b.RG_INTEGER]: e.RG16I,
            [b.RED_INTEGER]: e.R16I
        },
        [L.UNSIGNED_INT]: {
            [b.RGBA_INTEGER]: e.RGBA32UI,
            [b.RGB_INTEGER]: e.RGB32UI,
            [b.RG_INTEGER]: e.RG32UI,
            [b.RED_INTEGER]: e.R32UI,
            [b.DEPTH_COMPONENT]: e.DEPTH_COMPONENT24
        },
        [L.INT]: {
            [b.RGBA_INTEGER]: e.RGBA32I,
            [b.RGB_INTEGER]: e.RGB32I,
            [b.RG_INTEGER]: e.RG32I,
            [b.RED_INTEGER]: e.R32I
        },
        [L.FLOAT]: {
            [b.RGBA]: e.RGBA32F,
            [b.RGB]: e.RGB32F,
            [b.RG]: e.RG32F,
            [b.RED]: e.R32F,
            [b.DEPTH_COMPONENT]: e.DEPTH_COMPONENT32F
        },
        [L.HALF_FLOAT]: {
            [b.RGBA]: e.RGBA16F,
            [b.RGB]: e.RGB16F,
            [b.RG]: e.RG16F,
            [b.RED]: e.R16F
        },
        [L.UNSIGNED_SHORT_5_6_5]: {
            [b.RGB]: e.RGB565
        },
        [L.UNSIGNED_SHORT_4_4_4_4]: {
            [b.RGBA]: e.RGBA4
        },
        [L.UNSIGNED_SHORT_5_5_5_1]: {
            [b.RGBA]: e.RGB5_A1
        },
        [L.UNSIGNED_INT_2_10_10_10_REV]: {
            [b.RGBA]: e.RGB10_A2,
            [b.RGBA_INTEGER]: e.RGB10_A2UI
        },
        [L.UNSIGNED_INT_10F_11F_11F_REV]: {
            [b.RGB]: e.R11F_G11F_B10F
        },
        [L.UNSIGNED_INT_5_9_9_9_REV]: {
            [b.RGB]: e.RGB9_E5
        },
        [L.UNSIGNED_INT_24_8]: {
            [b.DEPTH_STENCIL]: e.DEPTH24_STENCIL8
        },
        [L.FLOAT_32_UNSIGNED_INT_24_8_REV]: {
            [b.DEPTH_STENCIL]: e.DEPTH32F_STENCIL8
        }
    } : t = {
        [L.UNSIGNED_BYTE]: {
            [b.RGBA]: e.RGBA,
            [b.RGB]: e.RGB,
            [b.ALPHA]: e.ALPHA,
            [b.LUMINANCE]: e.LUMINANCE,
            [b.LUMINANCE_ALPHA]: e.LUMINANCE_ALPHA
        },
        [L.UNSIGNED_SHORT_5_6_5]: {
            [b.RGB]: e.RGB
        },
        [L.UNSIGNED_SHORT_4_4_4_4]: {
            [b.RGBA]: e.RGBA
        },
        [L.UNSIGNED_SHORT_5_5_5_1]: {
            [b.RGBA]: e.RGBA
        }
    },
    t;
}
class Zr {
    constructor(t) {
        this.renderer = t,
        this.boundTextures = [],
        this.currentLocation = -1,
        this.managedTextures = [],
        this._unknownBoundTextures = !1,
        this.unknownTexture = new k,
        this.hasIntegerTextures = !1;
    }
    contextChange() {
        const t = this.gl = this.renderer.gl;
        this.CONTEXT_UID = this.renderer.CONTEXT_UID,
        this.webGLVersion = this.renderer.context.webGLVersion,
        this.internalFormats = Th(t);
        const s = t.getParameter(t.MAX_TEXTURE_IMAGE_UNITS);
        this.boundTextures.length = s;
        for (let r = 0; r < s; r++)
            this.boundTextures[r] = null;
        this.emptyTextures = {};
        const i = new Gs(t.createTexture());
        t.bindTexture(t.TEXTURE_2D, i.texture),
        t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, 1, 1, 0, t.RGBA, t.UNSIGNED_BYTE, new Uint8Array(4)),
        this.emptyTextures[t.TEXTURE_2D] = i,
        this.emptyTextures[t.TEXTURE_CUBE_MAP] = new Gs(t.createTexture()),
        t.bindTexture(t.TEXTURE_CUBE_MAP, this.emptyTextures[t.TEXTURE_CUBE_MAP].texture);
        for (let r = 0; r < 6; r++)
            t.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X + r, 0, t.RGBA, 1, 1, 0, t.RGBA, t.UNSIGNED_BYTE, null);
        t.texParameteri(t.TEXTURE_CUBE_MAP, t.TEXTURE_MAG_FILTER, t.LINEAR),
        t.texParameteri(t.TEXTURE_CUBE_MAP, t.TEXTURE_MIN_FILTER, t.LINEAR);
        for (let r = 0; r < this.boundTextures.length; r++)
            this.bind(null, r);
    }
    bind(t, s=0) {
        const {gl: i} = this;
        if (t = t == null ? void 0 : t.castToBaseTexture(),
        t != null && t.valid && !t.parentTextureArray) {
            t.touched = this.renderer.textureGC.count;
            const r = t._glTextures[this.CONTEXT_UID] || this.initTexture(t);
            this.boundTextures[s] !== t && (this.currentLocation !== s && (this.currentLocation = s,
            i.activeTexture(i.TEXTURE0 + s)),
            i.bindTexture(t.target, r.texture)),
            r.dirtyId !== t.dirtyId ? (this.currentLocation !== s && (this.currentLocation = s,
            i.activeTexture(i.TEXTURE0 + s)),
            this.updateTexture(t)) : r.dirtyStyleId !== t.dirtyStyleId && this.updateTextureStyle(t),
            this.boundTextures[s] = t;
        } else
            this.currentLocation !== s && (this.currentLocation = s,
            i.activeTexture(i.TEXTURE0 + s)),
            i.bindTexture(i.TEXTURE_2D, this.emptyTextures[i.TEXTURE_2D].texture),
            this.boundTextures[s] = null;
    }
    reset() {
        this._unknownBoundTextures = !0,
        this.hasIntegerTextures = !1,
        this.currentLocation = -1;
        for (let t = 0; t < this.boundTextures.length; t++)
            this.boundTextures[t] = this.unknownTexture;
    }
    unbind(t) {
        const {gl: s, boundTextures: i} = this;
        if (this._unknownBoundTextures) {
            this._unknownBoundTextures = !1;
            for (let r = 0; r < i.length; r++)
                i[r] === this.unknownTexture && this.bind(null, r);
        }
        for (let r = 0; r < i.length; r++)
            i[r] === t && (this.currentLocation !== r && (s.activeTexture(s.TEXTURE0 + r),
            this.currentLocation = r),
            s.bindTexture(t.target, this.emptyTextures[t.target].texture),
            i[r] = null);
    }
    ensureSamplerType(t) {
        const {boundTextures: s, hasIntegerTextures: i, CONTEXT_UID: r} = this;
        if (i)
            for (let n = t - 1; n >= 0; --n) {
                const o = s[n];
                o && o._glTextures[r].samplerType !== zs.FLOAT && this.renderer.texture.unbind(o);
            }
    }
    initTexture(t) {
        const s = new Gs(this.gl.createTexture());
        return s.dirtyId = -1,
        t._glTextures[this.CONTEXT_UID] = s,
        this.managedTextures.push(t),
        t.on("dispose", this.destroyTexture, this),
        s;
    }
    initTextureType(t, s) {
        let i, r;
        s.internalFormat = (r = (i = this.internalFormats[t.type]) == null ? void 0 : i[t.format]) != null ? r : t.format,
        this.webGLVersion === 2 && t.type === L.HALF_FLOAT ? s.type = this.gl.HALF_FLOAT : s.type = t.type;
    }
    updateTexture(t) {
        let r;
        const s = t._glTextures[this.CONTEXT_UID];
        if (!s)
            return;
        const i = this.renderer;
        if (this.initTextureType(t, s),
        (r = t.resource) != null && r.upload(i, t, s))
            s.samplerType !== zs.FLOAT && (this.hasIntegerTextures = !0);
        else {
            const n = t.realWidth
                , o = t.realHeight
                , h = i.gl;
            (s.width !== n || s.height !== o || s.dirtyId < 0) && (s.width = n,
            s.height = o,
            h.texImage2D(t.target, 0, s.internalFormat, n, o, 0, t.format, s.type, null));
        }
        t.dirtyStyleId !== s.dirtyStyleId && this.updateTextureStyle(t),
        s.dirtyId = t.dirtyId;
    }
    destroyTexture(t, s) {
        const {gl: i} = this;
        if (t = t.castToBaseTexture(),
        t._glTextures[this.CONTEXT_UID] && (this.unbind(t),
        i.deleteTexture(t._glTextures[this.CONTEXT_UID].texture),
        t.off("dispose", this.destroyTexture, this),
        delete t._glTextures[this.CONTEXT_UID],
        !s)) {
            const r = this.managedTextures.indexOf(t);
            r !== -1 && es(this.managedTextures, r, 1);
        }
    }
    updateTextureStyle(t) {
        let i;
        const s = t._glTextures[this.CONTEXT_UID];
        s && ((t.mipmap === Qt.POW2 || this.webGLVersion !== 2) && !t.isPowerOfTwo ? s.mipmap = !1 : s.mipmap = t.mipmap >= 1,
        this.webGLVersion !== 2 && !t.isPowerOfTwo ? s.wrapMode = Ne.CLAMP : s.wrapMode = t.wrapMode,
        (i = t.resource) != null && i.style(this.renderer, t, s) || this.setStyle(t, s),
        s.dirtyStyleId = t.dirtyStyleId);
    }
    setStyle(t, s) {
        const i = this.gl;
        if (s.mipmap && t.mipmap !== Qt.ON_MANUAL && i.generateMipmap(t.target),
        i.texParameteri(t.target, i.TEXTURE_WRAP_S, s.wrapMode),
        i.texParameteri(t.target, i.TEXTURE_WRAP_T, s.wrapMode),
        s.mipmap) {
            i.texParameteri(t.target, i.TEXTURE_MIN_FILTER, t.scaleMode === Bt.LINEAR ? i.LINEAR_MIPMAP_LINEAR : i.NEAREST_MIPMAP_NEAREST);
            const r = this.renderer.context.extensions.anisotropicFiltering;
            if (r && t.anisotropicLevel > 0 && t.scaleMode === Bt.LINEAR) {
                const n = Math.min(t.anisotropicLevel, i.getParameter(r.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
                i.texParameterf(t.target, r.TEXTURE_MAX_ANISOTROPY_EXT, n);
            }
        } else
            i.texParameteri(t.target, i.TEXTURE_MIN_FILTER, t.scaleMode === Bt.LINEAR ? i.LINEAR : i.NEAREST);
        i.texParameteri(t.target, i.TEXTURE_MAG_FILTER, t.scaleMode === Bt.LINEAR ? i.LINEAR : i.NEAREST);
    }
    destroy() {
        this.renderer = null;
    }
}
Zr.extension = {
    type: P.RendererSystem,
    name: "texture"
};
D.add(Zr);
class Kr {
    constructor(t) {
        this.renderer = t;
    }
    contextChange() {
        this.gl = this.renderer.gl,
        this.CONTEXT_UID = this.renderer.CONTEXT_UID;
    }
    bind(t) {
        const {gl: s, CONTEXT_UID: i} = this
            , r = t._glTransformFeedbacks[i] || this.createGLTransformFeedback(t);
        s.bindTransformFeedback(s.TRANSFORM_FEEDBACK, r);
    }
    unbind() {
        const {gl: t} = this;
        t.bindTransformFeedback(t.TRANSFORM_FEEDBACK, null);
    }
    beginTransformFeedback(t, s) {
        const {gl: i, renderer: r} = this;
        s && r.shader.bind(s),
        i.beginTransformFeedback(t);
    }
    endTransformFeedback() {
        const {gl: t} = this;
        t.endTransformFeedback();
    }
    createGLTransformFeedback(t) {
        const {gl: s, renderer: i, CONTEXT_UID: r} = this
            , n = s.createTransformFeedback();
        t._glTransformFeedbacks[r] = n,
        s.bindTransformFeedback(s.TRANSFORM_FEEDBACK, n);
        for (let o = 0; o < t.buffers.length; o++) {
            const h = t.buffers[o];
            h && (i.buffer.update(h),
            h._glBuffers[r].refCount++,
            s.bindBufferBase(s.TRANSFORM_FEEDBACK_BUFFER, o, h._glBuffers[r].buffer || null));
        }
        return s.bindTransformFeedback(s.TRANSFORM_FEEDBACK, null),
        t.disposeRunner.add(this),
        n;
    }
    disposeTransformFeedback(t, s) {
        const i = t._glTransformFeedbacks[this.CONTEXT_UID]
            , r = this.gl;
        t.disposeRunner.remove(this);
        const n = this.renderer.buffer;
        if (n)
            for (let o = 0; o < t.buffers.length; o++) {
                const h = t.buffers[o];
                if (!h)
                    continue;
                const a = h._glBuffers[this.CONTEXT_UID];
                a && (a.refCount--,
                a.refCount === 0 && !s && n.dispose(h, s));
            }
        i && (s || r.deleteTransformFeedback(i),
        delete t._glTransformFeedbacks[this.CONTEXT_UID]);
    }
    destroy() {
        this.renderer = null;
    }
}
Kr.extension = {
    type: P.RendererSystem,
    name: "transformFeedback"
};
D.add(Kr);
class Ts {
    constructor(t) {
        this.renderer = t;
    }
    init(t) {
        this.screen = new H(0,0,t.width,t.height),
        this.element = t.view || O.ADAPTER.createCanvas(),
        this.resolution = t.resolution || O.RESOLUTION,
        this.autoDensity = !!t.autoDensity;
    }
    resizeView(t, s) {
        this.element.width = Math.round(t * this.resolution),
        this.element.height = Math.round(s * this.resolution);
        const i = this.element.width / this.resolution
            , r = this.element.height / this.resolution;
        this.screen.width = i,
        this.screen.height = r,
        this.autoDensity && (this.element.style.width = `${i}px`,
        this.element.style.height = `${r}px`),
        this.renderer.emit("resize", i, r),
        this.renderer.runners.resize.emit(this.screen.width, this.screen.height);
    }
    destroy(t) {
        let s;
        t && ((s = this.element.parentNode) == null || s.removeChild(this.element)),
        this.renderer = null,
        this.element = null,
        this.screen = null;
    }
}
Ts.defaultOptions = {
    width: 800,
    height: 600,
    resolution: O.RESOLUTION,
    autoDensity: !1
};
Ts.extension = {
    type: [P.RendererSystem, P.CanvasRendererSystem],
    name: "_view"
};
D.add(Ts);
O.PREFER_ENV = ee.WEBGL2;
O.STRICT_TEXTURE_CACHE = !1;
O.RENDER_OPTIONS = {
    ...ys.defaultOptions,
    ...xs.defaultOptions,
    ...Ts.defaultOptions,
    ...bs.defaultOptions
};
Object.defineProperties(O, {
    WRAP_MODE: {
        get() {
            return k.defaultOptions.wrapMode;
        },
        set(e) {
            G("7.1.0", "settings.WRAP_MODE is deprecated, use BaseTexture.defaultOptions.wrapMode"),
            k.defaultOptions.wrapMode = e;
        }
    },
    SCALE_MODE: {
        get() {
            return k.defaultOptions.scaleMode;
        },
        set(e) {
            G("7.1.0", "settings.SCALE_MODE is deprecated, use BaseTexture.defaultOptions.scaleMode"),
            k.defaultOptions.scaleMode = e;
        }
    },
    MIPMAP_TEXTURES: {
        get() {
            return k.defaultOptions.mipmap;
        },
        set(e) {
            G("7.1.0", "settings.MIPMAP_TEXTURES is deprecated, use BaseTexture.defaultOptions.mipmap"),
            k.defaultOptions.mipmap = e;
        }
    },
    ANISOTROPIC_LEVEL: {
        get() {
            return k.defaultOptions.anisotropicLevel;
        },
        set(e) {
            G("7.1.0", "settings.ANISOTROPIC_LEVEL is deprecated, use BaseTexture.defaultOptions.anisotropicLevel"),
            k.defaultOptions.anisotropicLevel = e;
        }
    },
    FILTER_RESOLUTION: {
        get() {
            return G("7.1.0", "settings.FILTER_RESOLUTION is deprecated, use Filter.defaultResolution"),
            yt.defaultResolution;
        },
        set(e) {
            yt.defaultResolution = e;
        }
    },
    FILTER_MULTISAMPLE: {
        get() {
            return G("7.1.0", "settings.FILTER_MULTISAMPLE is deprecated, use Filter.defaultMultisample"),
            yt.defaultMultisample;
        },
        set(e) {
            yt.defaultMultisample = e;
        }
    },
    SPRITE_MAX_TEXTURES: {
        get() {
            return gt.defaultMaxTextures;
        },
        set(e) {
            G("7.1.0", "settings.SPRITE_MAX_TEXTURES is deprecated, use BatchRenderer.defaultMaxTextures"),
            gt.defaultMaxTextures = e;
        }
    },
    SPRITE_BATCH_SIZE: {
        get() {
            return gt.defaultBatchSize;
        },
        set(e) {
            G("7.1.0", "settings.SPRITE_BATCH_SIZE is deprecated, use BatchRenderer.defaultBatchSize"),
            gt.defaultBatchSize = e;
        }
    },
    CAN_UPLOAD_SAME_BUFFER: {
        get() {
            return gt.canUploadSameBuffer;
        },
        set(e) {
            G("7.1.0", "settings.CAN_UPLOAD_SAME_BUFFER is deprecated, use BatchRenderer.canUploadSameBuffer"),
            gt.canUploadSameBuffer = e;
        }
    },
    GC_MODE: {
        get() {
            return _t.defaultMode;
        },
        set(e) {
            G("7.1.0", "settings.GC_MODE is deprecated, use TextureGCSystem.defaultMode"),
            _t.defaultMode = e;
        }
    },
    GC_MAX_IDLE: {
        get() {
            return _t.defaultMaxIdle;
        },
        set(e) {
            G("7.1.0", "settings.GC_MAX_IDLE is deprecated, use TextureGCSystem.defaultMaxIdle"),
            _t.defaultMaxIdle = e;
        }
    },
    GC_MAX_CHECK_COUNT: {
        get() {
            return _t.defaultCheckCountMax;
        },
        set(e) {
            G("7.1.0", "settings.GC_MAX_CHECK_COUNT is deprecated, use TextureGCSystem.defaultCheckCountMax"),
            _t.defaultCheckCountMax = e;
        }
    },
    PRECISION_VERTEX: {
        get() {
            return Ut.defaultVertexPrecision;
        },
        set(e) {
            G("7.1.0", "settings.PRECISION_VERTEX is deprecated, use Program.defaultVertexPrecision"),
            Ut.defaultVertexPrecision = e;
        }
    },
    PRECISION_FRAGMENT: {
        get() {
            return Ut.defaultFragmentPrecision;
        },
        set(e) {
            G("7.1.0", "settings.PRECISION_FRAGMENT is deprecated, use Program.defaultFragmentPrecision"),
            Ut.defaultFragmentPrecision = e;
        }
    }
});
var cs = (e => (e[e.INTERACTION = 50] = "INTERACTION",
e[e.HIGH = 25] = "HIGH",
e[e.NORMAL = 0] = "NORMAL",
e[e.LOW = -25] = "LOW",
e[e.UTILITY = -50] = "UTILITY",
e))(cs || {});
class Vs {
    constructor(t, s=null, i=0, r=!1) {
        this.next = null,
        this.previous = null,
        this._destroyed = !1,
        this.fn = t,
        this.context = s,
        this.priority = i,
        this.once = r;
    }
    match(t, s=null) {
        return this.fn === t && this.context === s;
    }
    emit(t) {
        this.fn && (this.context ? this.fn.call(this.context, t) : this.fn(t));
        const s = this.next;
        return this.once && this.destroy(!0),
        this._destroyed && (this.next = null),
        s;
    }
    connect(t) {
        this.previous = t,
        t.next && (t.next.previous = this),
        this.next = t.next,
        t.next = this;
    }
    destroy(t=!1) {
        this._destroyed = !0,
        this.fn = null,
        this.context = null,
        this.previous && (this.previous.next = this.next),
        this.next && (this.next.previous = this.previous);
        const s = this.next;
        return this.next = t ? null : s,
        this.previous = null,
        s;
    }
}
const ct = class {
    constructor() {
        this.autoStart = !1,
        this.deltaTime = 1,
        this.lastTime = -1,
        this.speed = 1,
        this.started = !1,
        this._requestId = null,
        this._maxElapsedMS = 100,
        this._minElapsedMS = 0,
        this._protected = !1,
        this._lastFrame = -1,
        this._head = new Vs(null,null,1 / 0),
        this.deltaMS = 1 / ct.targetFPMS,
        this.elapsedMS = 1 / ct.targetFPMS,
        this._tick = e => {
            this._requestId = null,
            this.started && (this.update(e),
            this.started && this._requestId === null && this._head.next && (this._requestId = requestAnimationFrame(this._tick)));
        };
    }
    _requestIfNeeded() {
        this._requestId === null && this._head.next && (this.lastTime = performance.now(),
        this._lastFrame = this.lastTime,
        this._requestId = requestAnimationFrame(this._tick));
    }
    _cancelIfNeeded() {
        this._requestId !== null && (cancelAnimationFrame(this._requestId),
        this._requestId = null);
    }
    _startIfPossible() {
        this.started ? this._requestIfNeeded() : this.autoStart && this.start();
    }
    add(e, t, s=cs.NORMAL) {
        return this._addListener(new Vs(e,t,s));
    }
    addOnce(e, t, s=cs.NORMAL) {
        return this._addListener(new Vs(e,t,s,!0));
    }
    _addListener(e) {
        let t = this._head.next
            , s = this._head;
        if (!t)
            e.connect(s);
        else {
            for (; t; ) {
                if (e.priority > t.priority) {
                    e.connect(s);
                    break;
                }
                s = t,
                t = t.next;
            }
            e.previous || e.connect(s);
        }
        return this._startIfPossible(),
        this;
    }
    remove(e, t) {
        let s = this._head.next;
        for (; s; )
            s.match(e, t) ? s = s.destroy() : s = s.next;
        return this._head.next || this._cancelIfNeeded(),
        this;
    }
    get count() {
        if (!this._head)
            return 0;
        let e = 0
            , t = this._head;
        for (; t = t.next; )
            e++;
        return e;
    }
    start() {
        this.started || (this.started = !0,
        this._requestIfNeeded());
    }
    stop() {
        this.started && (this.started = !1,
        this._cancelIfNeeded());
    }
    destroy() {
        if (!this._protected) {
            this.stop();
            let e = this._head.next;
            for (; e; )
                e = e.destroy(!0);
            this._head.destroy(),
            this._head = null;
        }
    }
    update(e=performance.now()) {
        let t;
        if (e > this.lastTime) {
            if (t = this.elapsedMS = e - this.lastTime,
            t > this._maxElapsedMS && (t = this._maxElapsedMS),
            t *= this.speed,
            this._minElapsedMS) {
                const r = e - this._lastFrame | 0;
                if (r < this._minElapsedMS)
                    return;
                this._lastFrame = e - r % this._minElapsedMS;
            }
            this.deltaMS = t,
            this.deltaTime = this.deltaMS * ct.targetFPMS;
            const s = this._head;
            let i = s.next;
            for (; i; )
                i = i.emit(this.deltaTime);
            s.next || this._cancelIfNeeded();
        } else
            this.deltaTime = this.deltaMS = this.elapsedMS = 0;
        this.lastTime = e;
    }
    get FPS() {
        return 1e3 / this.elapsedMS;
    }
    get minFPS() {
        return 1e3 / this._maxElapsedMS;
    }
    set minFPS(e) {
        const t = Math.min(this.maxFPS, e)
            , s = Math.min(Math.max(0, t) / 1e3, ct.targetFPMS);
        this._maxElapsedMS = 1 / s;
    }
    get maxFPS() {
        return this._minElapsedMS ? Math.round(1e3 / this._minElapsedMS) : 0;
    }
    set maxFPS(e) {
        if (e === 0)
            this._minElapsedMS = 0;
        else {
            const t = Math.max(this.minFPS, e);
            this._minElapsedMS = 1 / (t / 1e3);
        }
    }
    static get shared() {
        if (!ct._shared) {
            const e = ct._shared = new ct;
            e.autoStart = !0,
            e._protected = !0;
        }
        return ct._shared;
    }
    static get system() {
        if (!ct._system) {
            const e = ct._system = new ct;
            e.autoStart = !0,
            e._protected = !0;
        }
        return ct._system;
    }
}
;
let xt = ct;
xt.targetFPMS = .06;
Object.defineProperties(O, {
    TARGET_FPMS: {
        get() {
            return xt.targetFPMS;
        },
        set(e) {
            G("7.1.0", "settings.TARGET_FPMS is deprecated, use Ticker.targetFPMS"),
            xt.targetFPMS = e;
        }
    }
});
class Jr {
    static init(t) {
        t = Object.assign({
            autoStart: !0,
            sharedTicker: !1
        }, t),
        Object.defineProperty(this, "ticker", {
            set(s) {
                this._ticker && this._ticker.remove(this.render, this),
                this._ticker = s,
                s && s.add(this.render, this, cs.LOW);
            },
            get() {
                return this._ticker;
            }
        }),
        this.stop = () => {
            this._ticker.stop();
        }
        ,
        this.start = () => {
            this._ticker.start();
        }
        ,
        this._ticker = null,
        this.ticker = t.sharedTicker ? xt.shared : new xt,
        t.autoStart && this.start();
    }
    static destroy() {
        if (this._ticker) {
            const t = this._ticker;
            this.ticker = null,
            t.destroy();
        }
    }
}
Jr.extension = P.Application;
D.add(Jr);
const Qr = [];
D.handleByList(P.Renderer, Qr);
function wh(e) {
    for (const t of Qr)
        if (t.test(e))
            return new t(e);
    throw new Error("Unable to auto-detect a suitable renderer.");
}
class tn {
    constructor(t) {
        this.renderer = t;
    }
    contextChange(t) {
        let s;
        if (this.renderer.context.webGLVersion === 1) {
            const i = t.getParameter(t.FRAMEBUFFER_BINDING);
            t.bindFramebuffer(t.FRAMEBUFFER, null),
            s = t.getParameter(t.SAMPLES),
            t.bindFramebuffer(t.FRAMEBUFFER, i);
        } else {
            const i = t.getParameter(t.DRAW_FRAMEBUFFER_BINDING);
            t.bindFramebuffer(t.DRAW_FRAMEBUFFER, null),
            s = t.getParameter(t.SAMPLES),
            t.bindFramebuffer(t.DRAW_FRAMEBUFFER, i);
        }
        s >= J.HIGH ? this.multisample = J.HIGH : s >= J.MEDIUM ? this.multisample = J.MEDIUM : s >= J.LOW ? this.multisample = J.LOW : this.multisample = J.NONE;
    }
    destroy() {}
}
tn.extension = {
    type: P.RendererSystem,
    name: "_multisample"
};
D.add(tn);
class Eh {
    constructor(t) {
        this.buffer = t || null,
        this.updateID = -1,
        this.byteLength = -1,
        this.refCount = 0;
    }
}
class en {
    constructor(t) {
        this.renderer = t,
        this.managedBuffers = {},
        this.boundBufferBases = {};
    }
    destroy() {
        this.renderer = null;
    }
    contextChange() {
        this.disposeAll(!0),
        this.gl = this.renderer.gl,
        this.CONTEXT_UID = this.renderer.CONTEXT_UID;
    }
    bind(t) {
        const {gl: s, CONTEXT_UID: i} = this
            , r = t._glBuffers[i] || this.createGLBuffer(t);
        s.bindBuffer(t.type, r.buffer);
    }
    unbind(t) {
        const {gl: s} = this;
        s.bindBuffer(t, null);
    }
    bindBufferBase(t, s) {
        const {gl: i, CONTEXT_UID: r} = this;
        if (this.boundBufferBases[s] !== t) {
            const n = t._glBuffers[r] || this.createGLBuffer(t);
            this.boundBufferBases[s] = t,
            i.bindBufferBase(i.UNIFORM_BUFFER, s, n.buffer);
        }
    }
    bindBufferRange(t, s, i) {
        const {gl: r, CONTEXT_UID: n} = this;
        i = i || 0;
        const o = t._glBuffers[n] || this.createGLBuffer(t);
        r.bindBufferRange(r.UNIFORM_BUFFER, s || 0, o.buffer, i * 256, 256);
    }
    update(t) {
        const {gl: s, CONTEXT_UID: i} = this
            , r = t._glBuffers[i] || this.createGLBuffer(t);
        if (t._updateID !== r.updateID)
            if (r.updateID = t._updateID,
            s.bindBuffer(t.type, r.buffer),
            r.byteLength >= t.data.byteLength)
                s.bufferSubData(t.type, 0, t.data);
            else {
                const n = t.static ? s.STATIC_DRAW : s.DYNAMIC_DRAW;
                r.byteLength = t.data.byteLength,
                s.bufferData(t.type, t.data, n);
            }
    }
    dispose(t, s) {
        if (!this.managedBuffers[t.id])
            return;
        delete this.managedBuffers[t.id];
        const i = t._glBuffers[this.CONTEXT_UID]
            , r = this.gl;
        t.disposeRunner.remove(this),
        i && (s || r.deleteBuffer(i.buffer),
        delete t._glBuffers[this.CONTEXT_UID]);
    }
    disposeAll(t) {
        const s = Object.keys(this.managedBuffers);
        for (let i = 0; i < s.length; i++)
            this.dispose(this.managedBuffers[s[i]], t);
    }
    createGLBuffer(t) {
        const {CONTEXT_UID: s, gl: i} = this;
        return t._glBuffers[s] = new Eh(i.createBuffer()),
        this.managedBuffers[t.id] = t,
        t.disposeRunner.add(this),
        t._glBuffers[s];
    }
}
en.extension = {
    type: P.RendererSystem,
    name: "buffer"
};
D.add(en);
class sn {
    constructor(t) {
        this.renderer = t;
    }
    render(t, s) {
        const i = this.renderer;
        let r, n, o, h;
        if (s && (r = s.renderTexture,
        n = s.clear,
        o = s.transform,
        h = s.skipUpdateTransform),
        this.renderingToScreen = !r,
        i.runners.prerender.emit(),
        i.emit("prerender"),
        i.projection.transform = o,
        !i.context.isLost) {
            if (r || (this.lastObjectRendered = t),
            !h) {
                const a = t.enableTempParent();
                t.updateTransform(),
                t.disableTempParent(a);
            }
            i.renderTexture.bind(r),
            i.batch.currentRenderer.start(),
            (n != null ? n : i.background.clearBeforeRender) && i.renderTexture.clear(),
            t.render(i),
            i.batch.currentRenderer.flush(),
            r && (s.blit && i.framebuffer.blit(),
            r.baseTexture.update()),
            i.runners.postrender.emit(),
            i.projection.transform = null,
            i.emit("postrender");
        }
    }
    destroy() {
        this.renderer = null,
        this.lastObjectRendered = null;
    }
}
sn.extension = {
    type: P.RendererSystem,
    name: "objectRenderer"
};
D.add(sn);
const hi = class extends bh {
    constructor(e) {
        super(),
        this.type = pr.WEBGL,
        e = Object.assign({}, O.RENDER_OPTIONS, e),
        this.gl = null,
        this.CONTEXT_UID = 0,
        this.globalUniforms = new Tt({
            projectionMatrix: new et
        },!0);
        const t = {
            runners: ["init", "destroy", "contextChange", "resolutionChange", "reset", "update", "postrender", "prerender", "resize"],
            systems: hi.__systems,
            priority: ["_view", "textureGenerator", "background", "_plugin", "startup", "context", "state", "texture", "buffer", "geometry", "framebuffer", "transformFeedback", "mask", "scissor", "stencil", "projection", "textureGC", "filter", "renderTexture", "batch", "objectRenderer", "_multisample"]
        };
        this.setup(t),
        "useContextAlpha"in e && (G("7.0.0", "options.useContextAlpha is deprecated, use options.premultipliedAlpha and options.backgroundAlpha instead"),
        e.premultipliedAlpha = e.useContextAlpha && e.useContextAlpha !== "notMultiplied",
        e.backgroundAlpha = e.useContextAlpha === !1 ? 1 : e.backgroundAlpha),
        this._plugin.rendererPlugins = hi.__plugins,
        this.options = e,
        this.startup.run(this.options);
    }
    static test(e) {
        return e != null && e.forceCanvas ? !1 : Qn();
    }
    render(e, t) {
        this.objectRenderer.render(e, t);
    }
    resize(e, t) {
        this._view.resizeView(e, t);
    }
    reset() {
        return this.runners.reset.emit(),
        this;
    }
    clear() {
        this.renderTexture.bind(),
        this.renderTexture.clear();
    }
    destroy(e=!1) {
        this.runners.destroy.items.reverse(),
        this.emitWithCustomOptions(this.runners.destroy, {
            _view: e
        }),
        super.destroy();
    }
    get plugins() {
        return this._plugin.plugins;
    }
    get multisample() {
        return this._multisample.multisample;
    }
    get width() {
        return this._view.element.width;
    }
    get height() {
        return this._view.element.height;
    }
    get resolution() {
        return this._view.resolution;
    }
    set resolution(e) {
        this._view.resolution = e,
        this.runners.resolutionChange.emit(e);
    }
    get autoDensity() {
        return this._view.autoDensity;
    }
    get view() {
        return this._view.element;
    }
    get screen() {
        return this._view.screen;
    }
    get lastObjectRendered() {
        return this.objectRenderer.lastObjectRendered;
    }
    get renderingToScreen() {
        return this.objectRenderer.renderingToScreen;
    }
    get rendererLogId() {
        return `WebGL ${this.context.webGLVersion}`;
    }
    get clearBeforeRender() {
        return G("7.0.0", "renderer.clearBeforeRender has been deprecated, please use renderer.background.clearBeforeRender instead."),
        this.background.clearBeforeRender;
    }
    get useContextAlpha() {
        return G("7.0.0", "renderer.useContextAlpha has been deprecated, please use renderer.context.premultipliedAlpha instead."),
        this.context.useContextAlpha;
    }
    get preserveDrawingBuffer() {
        return G("7.0.0", "renderer.preserveDrawingBuffer has been deprecated, we cannot truly know this unless pixi created the context"),
        this.context.preserveDrawingBuffer;
    }
    get backgroundColor() {
        return G("7.0.0", "renderer.backgroundColor has been deprecated, use renderer.background.color instead."),
        this.background.color;
    }
    set backgroundColor(e) {
        G("7.0.0", "renderer.backgroundColor has been deprecated, use renderer.background.color instead."),
        this.background.color = e;
    }
    get backgroundAlpha() {
        return G("7.0.0", "renderer.backgroundAlpha has been deprecated, use renderer.background.alpha instead."),
        this.background.alpha;
    }
    set backgroundAlpha(e) {
        G("7.0.0", "renderer.backgroundAlpha has been deprecated, use renderer.background.alpha instead."),
        this.background.alpha = e;
    }
    get powerPreference() {
        return G("7.0.0", "renderer.powerPreference has been deprecated, we can only know this if pixi creates the context"),
        this.context.powerPreference;
    }
    generateTexture(e, t) {
        return this.textureGenerator.generateTexture(e, t);
    }
}
;
let ye = hi;
ye.extension = {
    type: P.Renderer,
    priority: 1
};
ye.__plugins = {};
ye.__systems = {};
D.handleByMap(P.RendererPlugin, ye.__plugins);
D.handleByMap(P.RendererSystem, ye.__systems);
D.add(ye);
class rn extends Le {
    constructor(t, s) {
        const {width: i, height: r} = s || {};
        super(i, r),
        this.items = [],
        this.itemDirtyIds = [];
        for (let n = 0; n < t; n++) {
            const o = new k;
            this.items.push(o),
            this.itemDirtyIds.push(-2);
        }
        this.length = t,
        this._load = null,
        this.baseTexture = null;
    }
    initFromArray(t, s) {
        for (let i = 0; i < this.length; i++)
            t[i] && (t[i].castToBaseTexture ? this.addBaseTextureAt(t[i].castToBaseTexture(), i) : t[i]instanceof Le ? this.addResourceAt(t[i], i) : this.addResourceAt(Tr(t[i], s), i));
    }
    dispose() {
        for (let t = 0, s = this.length; t < s; t++)
            this.items[t].destroy();
        this.items = null,
        this.itemDirtyIds = null,
        this._load = null;
    }
    addResourceAt(t, s) {
        if (!this.items[s])
            throw new Error(`Index ${s} is out of bounds`);
        return t.valid && !this.valid && this.resize(t.width, t.height),
        this.items[s].setResource(t),
        this;
    }
    bind(t) {
        if (this.baseTexture !== null)
            throw new Error("Only one base texture per TextureArray is allowed");
        super.bind(t);
        for (let s = 0; s < this.length; s++)
            this.items[s].parentTextureArray = t,
            this.items[s].on("update", t.update, t);
    }
    unbind(t) {
        super.unbind(t);
        for (let s = 0; s < this.length; s++)
            this.items[s].parentTextureArray = null,
            this.items[s].off("update", t.update, t);
    }
    load() {
        if (this._load)
            return this._load;
        const s = this.items.map(i => i.resource).filter(i => i).map(i => i.load());
        return this._load = Promise.all(s).then( () => {
            const {realWidth: i, realHeight: r} = this.items[0];
            return this.resize(i, r),
            Promise.resolve(this);
        }),
        this._load;
    }
}
class Ih extends rn {
    constructor(t, s) {
        const {width: i, height: r} = s || {};
        let n, o;
        Array.isArray(t) ? (n = t,
        o = t.length) : o = t,
        super(o, {
            width: i,
            height: r
        }),
        n && this.initFromArray(n, s);
    }
    addBaseTextureAt(t, s) {
        if (t.resource)
            this.addResourceAt(t.resource, s);
        else
            throw new Error("ArrayResource does not support RenderTexture");
        return this;
    }
    bind(t) {
        super.bind(t),
        t.target = ue.TEXTURE_2D_ARRAY;
    }
    upload(t, s, i) {
        const {length: r, itemDirtyIds: n, items: o} = this
            , {gl: h} = t;
        i.dirtyId < 0 && h.texImage3D(h.TEXTURE_2D_ARRAY, 0, i.internalFormat, this._width, this._height, r, 0, s.format, i.type, null);
        for (let a = 0; a < r; a++) {
            const l = o[a];
            n[a] < l.dirtyId && (n[a] = l.dirtyId,
            l.valid && h.texSubImage3D(h.TEXTURE_2D_ARRAY, 0, 0, 0, a, l.resource.width, l.resource.height, 1, s.format, i.type, l.resource.source));
        }
        return !0;
    }
}
class Rh extends Vt {
    constructor(t) {
        super(t);
    }
    static test(t) {
        const {OffscreenCanvas: s} = globalThis;
        return s && t instanceof s ? !0 : globalThis.HTMLCanvasElement && t instanceof HTMLCanvasElement;
    }
}
const Ce = class extends rn {
    constructor(e, t) {
        const {width: s, height: i, autoLoad: r, linkBaseTexture: n} = t || {};
        if (e && e.length !== Ce.SIDES)
            throw new Error(`Invalid length. Got ${e.length}, expected 6`);
        super(6, {
            width: s,
            height: i
        });
        for (let o = 0; o < Ce.SIDES; o++)
            this.items[o].target = ue.TEXTURE_CUBE_MAP_POSITIVE_X + o;
        this.linkBaseTexture = n !== !1,
        e && this.initFromArray(e, t),
        r !== !1 && this.load();
    }
    bind(e) {
        super.bind(e),
        e.target = ue.TEXTURE_CUBE_MAP;
    }
    addBaseTextureAt(e, t, s) {
        if (s === void 0 && (s = this.linkBaseTexture),
        !this.items[t])
            throw new Error(`Index ${t} is out of bounds`);
        if (!this.linkBaseTexture || e.parentTextureArray || Object.keys(e._glTextures).length > 0)
            if (e.resource)
                this.addResourceAt(e.resource, t);
            else
                throw new Error("CubeResource does not support copying of renderTexture.");
        else
            e.target = ue.TEXTURE_CUBE_MAP_POSITIVE_X + t,
            e.parentTextureArray = this.baseTexture,
            this.items[t] = e;
        return e.valid && !this.valid && this.resize(e.realWidth, e.realHeight),
        this.items[t] = e,
        this;
    }
    upload(e, t, s) {
        const i = this.itemDirtyIds;
        for (let r = 0; r < Ce.SIDES; r++) {
            const n = this.items[r];
            (i[r] < n.dirtyId || s.dirtyId < t.dirtyId) && (n.valid && n.resource ? (n.resource.upload(e, n, s),
            i[r] = n.dirtyId) : i[r] < -1 && (e.gl.texImage2D(n.target, 0, s.internalFormat, t.realWidth, t.realHeight, 0, t.format, s.type, null),
            i[r] = -1));
        }
        return !0;
    }
    static test(e) {
        return Array.isArray(e) && e.length === Ce.SIDES;
    }
}
;
let nn = Ce;
nn.SIDES = 6;
class le extends Vt {
    constructor(t, s) {
        let n;
        s = s || {};
        let i, r;
        typeof t == "string" ? (i = le.EMPTY,
        r = t) : (i = t,
        r = null),
        super(i),
        this.url = r,
        this.crossOrigin = (n = s.crossOrigin) != null ? n : !0,
        this.alphaMode = typeof s.alphaMode == "number" ? s.alphaMode : null,
        this._load = null,
        s.autoLoad !== !1 && this.load();
    }
    load() {
        return this._load ? this._load : (this._load = new Promise(async (t, s) => {
            if (this.url === null) {
                t(this);
                return;
            }
            try {
                const i = await O.ADAPTER.fetch(this.url, {
                    mode: this.crossOrigin ? "cors" : "no-cors"
                });
                if (this.destroyed)
                    return;
                const r = await i.blob();
                if (this.destroyed)
                    return;
                const n = await createImageBitmap(r, {
                    premultiplyAlpha: this.alphaMode === null || this.alphaMode === Xt.UNPACK ? "premultiply" : "none"
                });
                if (this.destroyed)
                    return;
                this.source = n,
                this.update(),
                t(this);
            } catch (i) {
                if (this.destroyed)
                    return;
                s(i),
                this.onError.emit(i);
            }
        }),
        this._load);
    }
    upload(t, s, i) {
        return this.source instanceof ImageBitmap ? (typeof this.alphaMode == "number" && (s.alphaMode = this.alphaMode),
        super.upload(t, s, i)) : (this.load(),
        !1);
    }
    dispose() {
        this.source instanceof ImageBitmap && this.source.close(),
        super.dispose(),
        this._load = null;
    }
    static test(t) {
        return !!globalThis.createImageBitmap && typeof ImageBitmap < "u" && (typeof t == "string" || t instanceof ImageBitmap);
    }
    static get EMPTY() {
        let t;
        return le._EMPTY = (t = le._EMPTY) != null ? t : O.ADAPTER.createCanvas(0, 0),
        le._EMPTY;
    }
}
const rs = class extends Vt {
    constructor(e, t) {
        t = t || {},
        super(O.ADAPTER.createCanvas()),
        this._width = 0,
        this._height = 0,
        this.svg = e,
        this.scale = t.scale || 1,
        this._overrideWidth = t.width,
        this._overrideHeight = t.height,
        this._resolve = null,
        this._crossorigin = t.crossorigin,
        this._load = null,
        t.autoLoad !== !1 && this.load();
    }
    load() {
        return this._load ? this._load : (this._load = new Promise(e => {
            if (this._resolve = () => {
                this.resize(this.source.width, this.source.height),
                e(this);
            }
            ,
            rs.SVG_XML.test(this.svg.trim())) {
                if (!btoa)
                    throw new Error("Your browser doesn't support base64 conversions.");
                this.svg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(this.svg)))}`;
            }
            this._loadSvg();
        }),
        this._load);
    }
    _loadSvg() {
        const e = new Image;
        Vt.crossOrigin(e, this.svg, this._crossorigin),
        e.src = this.svg,
        e.onerror = t => {
            this._resolve && (e.onerror = null,
            this.onError.emit(t));
        }
        ,
        e.onload = () => {
            if (!this._resolve)
                return;
            const t = e.width
                , s = e.height;
            if (!t || !s)
                throw new Error("The SVG image must have width and height defined (in pixels), canvas API needs them.");
            let i = t * this.scale
                , r = s * this.scale;
            (this._overrideWidth || this._overrideHeight) && (i = this._overrideWidth || this._overrideHeight / s * t,
            r = this._overrideHeight || this._overrideWidth / t * s),
            i = Math.round(i),
            r = Math.round(r);
            const n = this.source;
            n.width = i,
            n.height = r,
            n._pixiId = `canvas_${Ue()}`,
            n.getContext("2d").drawImage(e, 0, 0, t, s, 0, 0, i, r),
            this._resolve(),
            this._resolve = null;
        };
    }
    static getSize(e) {
        const t = rs.SVG_SIZE.exec(e)
            , s = {};
        return t && (s[t[1]] = Math.round(parseFloat(t[3])),
        s[t[5]] = Math.round(parseFloat(t[7]))),
        s;
    }
    dispose() {
        super.dispose(),
        this._resolve = null,
        this._crossorigin = null;
    }
    static test(e, t) {
        return t === "svg" || typeof e == "string" && e.startsWith("data:image/svg+xml") || typeof e == "string" && rs.SVG_XML.test(e);
    }
}
;
let _i = rs;
_i.SVG_XML = /^(<\?xml[^?]+\?>)?\s*(<!--[^(-->)]*-->)?\s*\<svg/m;
_i.SVG_SIZE = /<svg[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*>/i;
const ai = class extends Vt {
    constructor(e, t) {
        if (t = t || {},
        !(e instanceof HTMLVideoElement)) {
            const s = document.createElement("video");
            s.setAttribute("preload", "auto"),
            s.setAttribute("webkit-playsinline", ""),
            s.setAttribute("playsinline", ""),
            typeof e == "string" && (e = [e]);
            const i = e[0].src || e[0];
            Vt.crossOrigin(s, i, t.crossorigin);
            for (let r = 0; r < e.length; ++r) {
                const n = document.createElement("source");
                let {src: o, mime: h} = e[r];
                o = o || e[r];
                const a = o.split("?").shift().toLowerCase()
                    , l = a.slice(a.lastIndexOf(".") + 1);
                h = h || ai.MIME_TYPES[l] || `video/${l}`,
                n.src = o,
                n.type = h,
                s.appendChild(n);
            }
            e = s;
        }
        super(e),
        this.noSubImage = !0,
        this._autoUpdate = !0,
        this._isConnectedToTicker = !1,
        this._updateFPS = t.updateFPS || 0,
        this._msToNextUpdate = 0,
        this.autoPlay = t.autoPlay !== !1,
        this._load = null,
        this._resolve = null,
        this._onCanPlay = this._onCanPlay.bind(this),
        this._onError = this._onError.bind(this),
        t.autoLoad !== !1 && this.load();
    }
    update(e=0) {
        if (!this.destroyed) {
            const t = xt.shared.elapsedMS * this.source.playbackRate;
            this._msToNextUpdate = Math.floor(this._msToNextUpdate - t),
            (!this._updateFPS || this._msToNextUpdate <= 0) && (super.update(),
            this._msToNextUpdate = this._updateFPS ? Math.floor(1e3 / this._updateFPS) : 0);
        }
    }
    load() {
        if (this._load)
            return this._load;
        const e = this.source;
        return (e.readyState === e.HAVE_ENOUGH_DATA || e.readyState === e.HAVE_FUTURE_DATA) && e.width && e.height && (e.complete = !0),
        e.addEventListener("play", this._onPlayStart.bind(this)),
        e.addEventListener("pause", this._onPlayStop.bind(this)),
        this._isSourceReady() ? this._onCanPlay() : (e.addEventListener("canplay", this._onCanPlay),
        e.addEventListener("canplaythrough", this._onCanPlay),
        e.addEventListener("error", this._onError, !0)),
        this._load = new Promise(t => {
            this.valid ? t(this) : (this._resolve = t,
            e.load());
        }),
        this._load;
    }
    _onError(e) {
        this.source.removeEventListener("error", this._onError, !0),
        this.onError.emit(e);
    }
    _isSourcePlaying() {
        const e = this.source;
        return !e.paused && !e.ended && this._isSourceReady();
    }
    _isSourceReady() {
        return this.source.readyState > 2;
    }
    _onPlayStart() {
        this.valid || this._onCanPlay(),
        this.autoUpdate && !this._isConnectedToTicker && (xt.shared.add(this.update, this),
        this._isConnectedToTicker = !0);
    }
    _onPlayStop() {
        this._isConnectedToTicker && (xt.shared.remove(this.update, this),
        this._isConnectedToTicker = !1);
    }
    _onCanPlay() {
        const e = this.source;
        e.removeEventListener("canplay", this._onCanPlay),
        e.removeEventListener("canplaythrough", this._onCanPlay);
        const t = this.valid;
        this.resize(e.videoWidth, e.videoHeight),
        !t && this._resolve && (this._resolve(this),
        this._resolve = null),
        this._isSourcePlaying() ? this._onPlayStart() : this.autoPlay && e.play();
    }
    dispose() {
        this._isConnectedToTicker && (xt.shared.remove(this.update, this),
        this._isConnectedToTicker = !1);
        const e = this.source;
        e && (e.removeEventListener("error", this._onError, !0),
        e.pause(),
        e.src = "",
        e.load()),
        super.dispose();
    }
    get autoUpdate() {
        return this._autoUpdate;
    }
    set autoUpdate(e) {
        e !== this._autoUpdate && (this._autoUpdate = e,
        !this._autoUpdate && this._isConnectedToTicker ? (xt.shared.remove(this.update, this),
        this._isConnectedToTicker = !1) : this._autoUpdate && !this._isConnectedToTicker && this._isSourcePlaying() && (xt.shared.add(this.update, this),
        this._isConnectedToTicker = !0));
    }
    get updateFPS() {
        return this._updateFPS;
    }
    set updateFPS(e) {
        e !== this._updateFPS && (this._updateFPS = e);
    }
    static test(e, t) {
        return globalThis.HTMLVideoElement && e instanceof HTMLVideoElement || ai.TYPES.includes(t);
    }
}
;
let xi = ai;
xi.TYPES = ["mp4", "m4v", "webm", "ogg", "ogv", "h264", "avi", "mov"];
xi.MIME_TYPES = {
    ogv: "video/ogg",
    mov: "video/quicktime",
    m4v: "video/mp4"
};
ei.push(le, Pr, Rh, xi, _i, di, nn, Ih);
let Ch = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}`
    , Ah = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform vec2 uOffset;

void main(void)
{
    vec4 color = vec4(0.0);

    // Sample top left pixel
    color += texture2D(uSampler, vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y + uOffset.y));

    // Sample top right pixel
    color += texture2D(uSampler, vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y + uOffset.y));

    // Sample bottom right pixel
    color += texture2D(uSampler, vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y - uOffset.y));

    // Sample bottom left pixel
    color += texture2D(uSampler, vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y - uOffset.y));

    // Average
    color *= 0.25;

    gl_FragColor = color;
}`
    , Sh = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform vec2 uOffset;
uniform vec4 filterClamp;

void main(void)
{
    vec4 color = vec4(0.0);

    // Sample top left pixel
    color += texture2D(uSampler, clamp(vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y + uOffset.y), filterClamp.xy, filterClamp.zw));

    // Sample top right pixel
    color += texture2D(uSampler, clamp(vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y + uOffset.y), filterClamp.xy, filterClamp.zw));

    // Sample bottom right pixel
    color += texture2D(uSampler, clamp(vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y - uOffset.y), filterClamp.xy, filterClamp.zw));

    // Sample bottom left pixel
    color += texture2D(uSampler, clamp(vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y - uOffset.y), filterClamp.xy, filterClamp.zw));

    // Average
    color *= 0.25;

    gl_FragColor = color;
}
`;
class Ee extends yt {
    constructor(t=4, s=3, i=!1) {
        super(Ch, i ? Sh : Ah),
        this._kernels = [],
        this._blur = 4,
        this._quality = 3,
        this.uniforms.uOffset = new Float32Array(2),
        this._pixelSize = new W,
        this.pixelSize = 1,
        this._clamp = i,
        Array.isArray(t) ? this.kernels = t : (this._blur = t,
        this.quality = s);
    }
    apply(t, s, i, r) {
        const n = this._pixelSize.x / s._frame.width
            , o = this._pixelSize.y / s._frame.height;
        let h;
        if (this._quality === 1 || this._blur === 0)
            h = this._kernels[0] + .5,
            this.uniforms.uOffset[0] = h * n,
            this.uniforms.uOffset[1] = h * o,
            t.applyFilter(this, s, i, r);
        else {
            const a = t.getFilterTexture();
            let l = s, u = a, c;
            const d = this._quality - 1;
            for (let p = 0; p < d; p++)
                h = this._kernels[p] + .5,
                this.uniforms.uOffset[0] = h * n,
                this.uniforms.uOffset[1] = h * o,
                t.applyFilter(this, l, u, 1),
                c = l,
                l = u,
                u = c;
            h = this._kernels[d] + .5,
            this.uniforms.uOffset[0] = h * n,
            this.uniforms.uOffset[1] = h * o,
            t.applyFilter(this, l, i, r),
            t.returnFilterTexture(a);
        }
    }
    _updatePadding() {
        this.padding = Math.ceil(this._kernels.reduce( (t, s) => t + s + .5, 0));
    }
    _generateKernels() {
        const t = this._blur
            , s = this._quality
            , i = [t];
        if (t > 0) {
            let r = t;
            const n = t / s;
            for (let o = 1; o < s; o++)
                r -= n,
                i.push(r);
        }
        this._kernels = i,
        this._updatePadding();
    }
    get kernels() {
        return this._kernels;
    }
    set kernels(t) {
        Array.isArray(t) && t.length > 0 ? (this._kernels = t,
        this._quality = t.length,
        this._blur = Math.max(...t)) : (this._kernels = [0],
        this._quality = 1);
    }
    get clamp() {
        return this._clamp;
    }
    set pixelSize(t) {
        typeof t == "number" ? (this._pixelSize.x = t,
        this._pixelSize.y = t) : Array.isArray(t) ? (this._pixelSize.x = t[0],
        this._pixelSize.y = t[1]) : t instanceof W ? (this._pixelSize.x = t.x,
        this._pixelSize.y = t.y) : (this._pixelSize.x = 1,
        this._pixelSize.y = 1);
    }
    get pixelSize() {
        return this._pixelSize;
    }
    get quality() {
        return this._quality;
    }
    set quality(t) {
        this._quality = Math.max(1, Math.round(t)),
        this._generateKernels();
    }
    get blur() {
        return this._blur;
    }
    set blur(t) {
        this._blur = t,
        this._generateKernels();
    }
}
let Mh = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}`
    , Nh = `varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform float radius;
uniform float angle;
uniform vec2 offset;
uniform vec4 filterArea;

vec2 mapCoord( vec2 coord )
{
    coord *= filterArea.xy;
    coord += filterArea.zw;

    return coord;
}

vec2 unmapCoord( vec2 coord )
{
    coord -= filterArea.zw;
    coord /= filterArea.xy;

    return coord;
}

vec2 twist(vec2 coord)
{
    coord -= offset;

    float dist = length(coord);

    if (dist < radius)
    {
        float ratioDist = (radius - dist) / radius;
        float angleMod = ratioDist * ratioDist * angle;
        float s = sin(angleMod);
        float c = cos(angleMod);
        coord = vec2(coord.x * c - coord.y * s, coord.x * s + coord.y * c);
    }

    coord += offset;

    return coord;
}

void main(void)
{

    vec2 coord = mapCoord(vTextureCoord);

    coord = twist(coord);

    coord = unmapCoord(coord);

    gl_FragColor = texture2D(uSampler, coord );

}
`;
const on = class extends yt {
    constructor(e) {
        super(Mh, Nh),
        Object.assign(this, on.defaults, e);
    }
    get offset() {
        return this.uniforms.offset;
    }
    set offset(e) {
        this.uniforms.offset = e;
    }
    get radius() {
        return this.uniforms.radius;
    }
    set radius(e) {
        this.uniforms.radius = e;
    }
    get angle() {
        return this.uniforms.angle;
    }
    set angle(e) {
        this.uniforms.angle = e;
    }
}
;
let hn = on;
hn.defaults = {
    radius: 200,
    angle: 4,
    padding: 20,
    offset: new W
};
let Fh = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}`
    , Ph = `varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform float gamma;
uniform float contrast;
uniform float saturation;
uniform float brightness;
uniform float red;
uniform float green;
uniform float blue;
uniform float alpha;

void main(void)
{
    vec4 c = texture2D(uSampler, vTextureCoord);

    if (c.a > 0.0) {
        c.rgb /= c.a;

        vec3 rgb = pow(c.rgb, vec3(1. / gamma));
        rgb = mix(vec3(.5), mix(vec3(dot(vec3(.2125, .7154, .0721), rgb)), rgb, saturation), contrast);
        rgb.r *= red;
        rgb.g *= green;
        rgb.b *= blue;
        c.rgb = rgb * brightness;

        c.rgb *= c.a;
    }

    gl_FragColor = c * alpha;
}
`;
class Oh extends yt {
    constructor(t) {
        super(Fh, Ph),
        this.gamma = 1,
        this.saturation = 1,
        this.contrast = 1,
        this.brightness = 1,
        this.red = 1,
        this.green = 1,
        this.blue = 1,
        this.alpha = 1,
        Object.assign(this, t);
    }
    apply(t, s, i, r) {
        this.uniforms.gamma = Math.max(this.gamma, 1e-4),
        this.uniforms.saturation = this.saturation,
        this.uniforms.contrast = this.contrast,
        this.uniforms.brightness = this.brightness,
        this.uniforms.red = this.red,
        this.uniforms.green = this.green,
        this.uniforms.blue = this.blue,
        this.uniforms.alpha = this.alpha,
        t.applyFilter(this, s, i, r);
    }
}
class ds {
    constructor() {
        this.minX = 1 / 0,
        this.minY = 1 / 0,
        this.maxX = -1 / 0,
        this.maxY = -1 / 0,
        this.rect = null,
        this.updateID = -1;
    }
    isEmpty() {
        return this.minX > this.maxX || this.minY > this.maxY;
    }
    clear() {
        this.minX = 1 / 0,
        this.minY = 1 / 0,
        this.maxX = -1 / 0,
        this.maxY = -1 / 0;
    }
    getRectangle(t) {
        return this.minX > this.maxX || this.minY > this.maxY ? H.EMPTY : (t = t || new H(0,0,1,1),
        t.x = this.minX,
        t.y = this.minY,
        t.width = this.maxX - this.minX,
        t.height = this.maxY - this.minY,
        t);
    }
    addPoint(t) {
        this.minX = Math.min(this.minX, t.x),
        this.maxX = Math.max(this.maxX, t.x),
        this.minY = Math.min(this.minY, t.y),
        this.maxY = Math.max(this.maxY, t.y);
    }
    addPointMatrix(t, s) {
        const {a: i, b: r, c: n, d: o, tx: h, ty: a} = t
            , l = i * s.x + n * s.y + h
            , u = r * s.x + o * s.y + a;
        this.minX = Math.min(this.minX, l),
        this.maxX = Math.max(this.maxX, l),
        this.minY = Math.min(this.minY, u),
        this.maxY = Math.max(this.maxY, u);
    }
    addQuad(t) {
        let s = this.minX
            , i = this.minY
            , r = this.maxX
            , n = this.maxY
            , o = t[0]
            , h = t[1];
        s = o < s ? o : s,
        i = h < i ? h : i,
        r = o > r ? o : r,
        n = h > n ? h : n,
        o = t[2],
        h = t[3],
        s = o < s ? o : s,
        i = h < i ? h : i,
        r = o > r ? o : r,
        n = h > n ? h : n,
        o = t[4],
        h = t[5],
        s = o < s ? o : s,
        i = h < i ? h : i,
        r = o > r ? o : r,
        n = h > n ? h : n,
        o = t[6],
        h = t[7],
        s = o < s ? o : s,
        i = h < i ? h : i,
        r = o > r ? o : r,
        n = h > n ? h : n,
        this.minX = s,
        this.minY = i,
        this.maxX = r,
        this.maxY = n;
    }
    addFrame(t, s, i, r, n) {
        this.addFrameMatrix(t.worldTransform, s, i, r, n);
    }
    addFrameMatrix(t, s, i, r, n) {
        const o = t.a
            , h = t.b
            , a = t.c
            , l = t.d
            , u = t.tx
            , c = t.ty;
        let d = this.minX
            , p = this.minY
            , f = this.maxX
            , _ = this.maxY
            , g = o * s + a * i + u
            , v = h * s + l * i + c;
        d = g < d ? g : d,
        p = v < p ? v : p,
        f = g > f ? g : f,
        _ = v > _ ? v : _,
        g = o * r + a * i + u,
        v = h * r + l * i + c,
        d = g < d ? g : d,
        p = v < p ? v : p,
        f = g > f ? g : f,
        _ = v > _ ? v : _,
        g = o * s + a * n + u,
        v = h * s + l * n + c,
        d = g < d ? g : d,
        p = v < p ? v : p,
        f = g > f ? g : f,
        _ = v > _ ? v : _,
        g = o * r + a * n + u,
        v = h * r + l * n + c,
        d = g < d ? g : d,
        p = v < p ? v : p,
        f = g > f ? g : f,
        _ = v > _ ? v : _,
        this.minX = d,
        this.minY = p,
        this.maxX = f,
        this.maxY = _;
    }
    addVertexData(t, s, i) {
        let r = this.minX
            , n = this.minY
            , o = this.maxX
            , h = this.maxY;
        for (let a = s; a < i; a += 2) {
            const l = t[a]
                , u = t[a + 1];
            r = l < r ? l : r,
            n = u < n ? u : n,
            o = l > o ? l : o,
            h = u > h ? u : h;
        }
        this.minX = r,
        this.minY = n,
        this.maxX = o,
        this.maxY = h;
    }
    addVertices(t, s, i, r) {
        this.addVerticesMatrix(t.worldTransform, s, i, r);
    }
    addVerticesMatrix(t, s, i, r, n=0, o=n) {
        const h = t.a
            , a = t.b
            , l = t.c
            , u = t.d
            , c = t.tx
            , d = t.ty;
        let p = this.minX
            , f = this.minY
            , _ = this.maxX
            , g = this.maxY;
        for (let v = i; v < r; v += 2) {
            const y = s[v]
                , m = s[v + 1]
                , x = h * y + l * m + c
                , I = u * m + a * y + d;
            p = Math.min(p, x - n),
            _ = Math.max(_, x + n),
            f = Math.min(f, I - o),
            g = Math.max(g, I + o);
        }
        this.minX = p,
        this.minY = f,
        this.maxX = _,
        this.maxY = g;
    }
    addBounds(t) {
        const s = this.minX
            , i = this.minY
            , r = this.maxX
            , n = this.maxY;
        this.minX = t.minX < s ? t.minX : s,
        this.minY = t.minY < i ? t.minY : i,
        this.maxX = t.maxX > r ? t.maxX : r,
        this.maxY = t.maxY > n ? t.maxY : n;
    }
    addBoundsMask(t, s) {
        const i = t.minX > s.minX ? t.minX : s.minX
            , r = t.minY > s.minY ? t.minY : s.minY
            , n = t.maxX < s.maxX ? t.maxX : s.maxX
            , o = t.maxY < s.maxY ? t.maxY : s.maxY;
        if (i <= n && r <= o) {
            const h = this.minX
                , a = this.minY
                , l = this.maxX
                , u = this.maxY;
            this.minX = i < h ? i : h,
            this.minY = r < a ? r : a,
            this.maxX = n > l ? n : l,
            this.maxY = o > u ? o : u;
        }
    }
    addBoundsMatrix(t, s) {
        this.addFrameMatrix(s, t.minX, t.minY, t.maxX, t.maxY);
    }
    addBoundsArea(t, s) {
        const i = t.minX > s.x ? t.minX : s.x
            , r = t.minY > s.y ? t.minY : s.y
            , n = t.maxX < s.x + s.width ? t.maxX : s.x + s.width
            , o = t.maxY < s.y + s.height ? t.maxY : s.y + s.height;
        if (i <= n && r <= o) {
            const h = this.minX
                , a = this.minY
                , l = this.maxX
                , u = this.maxY;
            this.minX = i < h ? i : h,
            this.minY = r < a ? r : a,
            this.maxX = n > l ? n : l,
            this.maxY = o > u ? o : u;
        }
    }
    pad(t=0, s=t) {
        this.isEmpty() || (this.minX -= t,
        this.maxX += t,
        this.minY -= s,
        this.maxY += s);
    }
    addFramePad(t, s, i, r, n, o) {
        t -= n,
        s -= o,
        i += n,
        r += o,
        this.minX = this.minX < t ? this.minX : t,
        this.maxX = this.maxX > i ? this.maxX : i,
        this.minY = this.minY < s ? this.minY : s,
        this.maxY = this.maxY > r ? this.maxY : r;
    }
}
class ge extends pe {
    constructor() {
        super(),
        this.tempDisplayObjectParent = null,
        this.transform = new gi,
        this.alpha = 1,
        this.visible = !0,
        this.renderable = !0,
        this.cullable = !1,
        this.cullArea = null,
        this.parent = null,
        this.worldAlpha = 1,
        this._lastSortedIndex = 0,
        this._zIndex = 0,
        this.filterArea = null,
        this.filters = null,
        this._enabledFilters = null,
        this._bounds = new ds,
        this._localBounds = null,
        this._boundsID = 0,
        this._boundsRect = null,
        this._localBoundsRect = null,
        this._mask = null,
        this._maskRefCount = 0,
        this._destroyed = !1,
        this.isSprite = !1,
        this.isMask = !1;
    }
    static mixin(t) {
        const s = Object.keys(t);
        for (let i = 0; i < s.length; ++i) {
            const r = s[i];
            Object.defineProperty(ge.prototype, r, Object.getOwnPropertyDescriptor(t, r));
        }
    }
    get destroyed() {
        return this._destroyed;
    }
    _recursivePostUpdateTransform() {
        this.parent ? (this.parent._recursivePostUpdateTransform(),
        this.transform.updateTransform(this.parent.transform)) : this.transform.updateTransform(this._tempDisplayObjectParent.transform);
    }
    updateTransform() {
        this._boundsID++,
        this.transform.updateTransform(this.parent.transform),
        this.worldAlpha = this.alpha * this.parent.worldAlpha;
    }
    getBounds(t, s) {
        return t || (this.parent ? (this._recursivePostUpdateTransform(),
        this.updateTransform()) : (this.parent = this._tempDisplayObjectParent,
        this.updateTransform(),
        this.parent = null)),
        this._bounds.updateID !== this._boundsID && (this.calculateBounds(),
        this._bounds.updateID = this._boundsID),
        s || (this._boundsRect || (this._boundsRect = new H),
        s = this._boundsRect),
        this._bounds.getRectangle(s);
    }
    getLocalBounds(t) {
        t || (this._localBoundsRect || (this._localBoundsRect = new H),
        t = this._localBoundsRect),
        this._localBounds || (this._localBounds = new ds);
        const s = this.transform
            , i = this.parent;
        this.parent = null,
        this.transform = this._tempDisplayObjectParent.transform;
        const r = this._bounds
            , n = this._boundsID;
        this._bounds = this._localBounds;
        const o = this.getBounds(!1, t);
        return this.parent = i,
        this.transform = s,
        this._bounds = r,
        this._bounds.updateID += this._boundsID - n,
        o;
    }
    toGlobal(t, s, i=!1) {
        return i || (this._recursivePostUpdateTransform(),
        this.parent ? this.displayObjectUpdateTransform() : (this.parent = this._tempDisplayObjectParent,
        this.displayObjectUpdateTransform(),
        this.parent = null)),
        this.worldTransform.apply(t, s);
    }
    toLocal(t, s, i, r) {
        return s && (t = s.toGlobal(t, i, r)),
        r || (this._recursivePostUpdateTransform(),
        this.parent ? this.displayObjectUpdateTransform() : (this.parent = this._tempDisplayObjectParent,
        this.displayObjectUpdateTransform(),
        this.parent = null)),
        this.worldTransform.applyInverse(t, i);
    }
    setParent(t) {
        if (!t || !t.addChild)
            throw new Error("setParent: Argument must be a Container");
        return t.addChild(this),
        t;
    }
    removeFromParent() {
        let t;
        (t = this.parent) == null || t.removeChild(this);
    }
    setTransform(t=0, s=0, i=1, r=1, n=0, o=0, h=0, a=0, l=0) {
        return this.position.x = t,
        this.position.y = s,
        this.scale.x = i || 1,
        this.scale.y = r || 1,
        this.rotation = n,
        this.skew.x = o,
        this.skew.y = h,
        this.pivot.x = a,
        this.pivot.y = l,
        this;
    }
    destroy(t) {
        this.removeFromParent(),
        this._destroyed = !0,
        this.transform = null,
        this.parent = null,
        this._bounds = null,
        this.mask = null,
        this.cullArea = null,
        this.filters = null,
        this.filterArea = null,
        this.hitArea = null,
        this.eventMode = "auto",
        this.interactiveChildren = !1,
        this.emit("destroyed"),
        this.removeAllListeners();
    }
    get _tempDisplayObjectParent() {
        return this.tempDisplayObjectParent === null && (this.tempDisplayObjectParent = new Bh),
        this.tempDisplayObjectParent;
    }
    enableTempParent() {
        const t = this.parent;
        return this.parent = this._tempDisplayObjectParent,
        t;
    }
    disableTempParent(t) {
        this.parent = t;
    }
    get x() {
        return this.position.x;
    }
    set x(t) {
        this.transform.position.x = t;
    }
    get y() {
        return this.position.y;
    }
    set y(t) {
        this.transform.position.y = t;
    }
    get worldTransform() {
        return this.transform.worldTransform;
    }
    get localTransform() {
        return this.transform.localTransform;
    }
    get position() {
        return this.transform.position;
    }
    set position(t) {
        this.transform.position.copyFrom(t);
    }
    get scale() {
        return this.transform.scale;
    }
    set scale(t) {
        this.transform.scale.copyFrom(t);
    }
    get pivot() {
        return this.transform.pivot;
    }
    set pivot(t) {
        this.transform.pivot.copyFrom(t);
    }
    get skew() {
        return this.transform.skew;
    }
    set skew(t) {
        this.transform.skew.copyFrom(t);
    }
    get rotation() {
        return this.transform.rotation;
    }
    set rotation(t) {
        this.transform.rotation = t;
    }
    get angle() {
        return this.transform.rotation * Eo;
    }
    set angle(t) {
        this.transform.rotation = t * Io;
    }
    get zIndex() {
        return this._zIndex;
    }
    set zIndex(t) {
        this._zIndex = t,
        this.parent && (this.parent.sortDirty = !0);
    }
    get worldVisible() {
        let t = this;
        do {
            if (!t.visible)
                return !1;
            t = t.parent;
        } while (t);
        return !0;
    }
    get mask() {
        return this._mask;
    }
    set mask(t) {
        if (this._mask !== t) {
            if (this._mask) {
                const s = this._mask.isMaskData ? this._mask.maskObject : this._mask;
                s && (s._maskRefCount--,
                s._maskRefCount === 0 && (s.renderable = !0,
                s.isMask = !1));
            }
            if (this._mask = t,
            this._mask) {
                const s = this._mask.isMaskData ? this._mask.maskObject : this._mask;
                s && (s._maskRefCount === 0 && (s.renderable = !1,
                s.isMask = !0),
                s._maskRefCount++);
            }
        }
    }
}
class Bh extends ge {
    constructor() {
        super(...arguments),
        this.sortDirty = null;
    }
}
ge.prototype.displayObjectUpdateTransform = ge.prototype.updateTransform;
const Uh = new et;
function Lh(e, t) {
    return e.zIndex === t.zIndex ? e._lastSortedIndex - t._lastSortedIndex : e.zIndex - t.zIndex;
}
const li = class extends ge {
    constructor() {
        super(),
        this.children = [],
        this.sortableChildren = li.defaultSortableChildren,
        this.sortDirty = !1;
    }
    onChildrenChange(e) {}
    addChild(...e) {
        if (e.length > 1)
            for (let t = 0; t < e.length; t++)
                this.addChild(e[t]);
        else {
            const t = e[0];
            t.parent && t.parent.removeChild(t),
            t.parent = this,
            this.sortDirty = !0,
            t.transform._parentID = -1,
            this.children.push(t),
            this._boundsID++,
            this.onChildrenChange(this.children.length - 1),
            this.emit("childAdded", t, this, this.children.length - 1),
            t.emit("added", this);
        }
        return e[0];
    }
    addChildAt(e, t) {
        if (t < 0 || t > this.children.length)
            throw new Error(`${e}addChildAt: The index ${t} supplied is out of bounds ${this.children.length}`);
        return e.parent && e.parent.removeChild(e),
        e.parent = this,
        this.sortDirty = !0,
        e.transform._parentID = -1,
        this.children.splice(t, 0, e),
        this._boundsID++,
        this.onChildrenChange(t),
        e.emit("added", this),
        this.emit("childAdded", e, this, t),
        e;
    }
    swapChildren(e, t) {
        if (e === t)
            return;
        const s = this.getChildIndex(e)
            , i = this.getChildIndex(t);
        this.children[s] = t,
        this.children[i] = e,
        this.onChildrenChange(s < i ? s : i);
    }
    getChildIndex(e) {
        const t = this.children.indexOf(e);
        if (t === -1)
            throw new Error("The supplied DisplayObject must be a child of the caller");
        return t;
    }
    setChildIndex(e, t) {
        if (t < 0 || t >= this.children.length)
            throw new Error(`The index ${t} supplied is out of bounds ${this.children.length}`);
        const s = this.getChildIndex(e);
        es(this.children, s, 1),
        this.children.splice(t, 0, e),
        this.onChildrenChange(t);
    }
    getChildAt(e) {
        if (e < 0 || e >= this.children.length)
            throw new Error(`getChildAt: Index (${e}) does not exist.`);
        return this.children[e];
    }
    removeChild(...e) {
        if (e.length > 1)
            for (let t = 0; t < e.length; t++)
                this.removeChild(e[t]);
        else {
            const t = e[0]
                , s = this.children.indexOf(t);
            if (s === -1)
                return null;
            t.parent = null,
            t.transform._parentID = -1,
            es(this.children, s, 1),
            this._boundsID++,
            this.onChildrenChange(s),
            t.emit("removed", this),
            this.emit("childRemoved", t, this, s);
        }
        return e[0];
    }
    removeChildAt(e) {
        const t = this.getChildAt(e);
        return t.parent = null,
        t.transform._parentID = -1,
        es(this.children, e, 1),
        this._boundsID++,
        this.onChildrenChange(e),
        t.emit("removed", this),
        this.emit("childRemoved", t, this, e),
        t;
    }
    removeChildren(e=0, t=this.children.length) {
        const s = e
            , i = t
            , r = i - s;
        let n;
        if (r > 0 && r <= i) {
            n = this.children.splice(s, r);
            for (let o = 0; o < n.length; ++o)
                n[o].parent = null,
                n[o].transform && (n[o].transform._parentID = -1);
            this._boundsID++,
            this.onChildrenChange(e);
            for (let o = 0; o < n.length; ++o)
                n[o].emit("removed", this),
                this.emit("childRemoved", n[o], this, o);
            return n;
        } else if (r === 0 && this.children.length === 0)
            return [];
        throw new RangeError("removeChildren: numeric values are outside the acceptable range.");
    }
    sortChildren() {
        let e = !1;
        for (let t = 0, s = this.children.length; t < s; ++t) {
            const i = this.children[t];
            i._lastSortedIndex = t,
            !e && i.zIndex !== 0 && (e = !0);
        }
        e && this.children.length > 1 && this.children.sort(Lh),
        this.sortDirty = !1;
    }
    updateTransform() {
        this.sortableChildren && this.sortDirty && this.sortChildren(),
        this._boundsID++,
        this.transform.updateTransform(this.parent.transform),
        this.worldAlpha = this.alpha * this.parent.worldAlpha;
        for (let e = 0, t = this.children.length; e < t; ++e) {
            const s = this.children[e];
            s.visible && s.updateTransform();
        }
    }
    calculateBounds() {
        this._bounds.clear(),
        this._calculateBounds();
        for (let e = 0; e < this.children.length; e++) {
            const t = this.children[e];
            if (!(!t.visible || !t.renderable))
                if (t.calculateBounds(),
                t._mask) {
                    const s = t._mask.isMaskData ? t._mask.maskObject : t._mask;
                    s ? (s.calculateBounds(),
                    this._bounds.addBoundsMask(t._bounds, s._bounds)) : this._bounds.addBounds(t._bounds);
                } else
                    t.filterArea ? this._bounds.addBoundsArea(t._bounds, t.filterArea) : this._bounds.addBounds(t._bounds);
        }
        this._bounds.updateID = this._boundsID;
    }
    getLocalBounds(e, t=!1) {
        const s = super.getLocalBounds(e);
        if (!t)
            for (let i = 0, r = this.children.length; i < r; ++i) {
                const n = this.children[i];
                n.visible && n.updateTransform();
            }
        return s;
    }
    _calculateBounds() {}
    _renderWithCulling(e) {
        const t = e.renderTexture.sourceFrame;
        if (!(t.width > 0 && t.height > 0))
            return;
        let s, i;
        this.cullArea ? (s = this.cullArea,
        i = this.worldTransform) : this._render !== li.prototype._render && (s = this.getBounds(!0));
        const r = e.projection.transform;
        if (r && (i ? (i = Uh.copyFrom(i),
        i.prepend(r)) : i = r),
        s && t.intersects(s, i))
            this._render(e);
        else if (this.cullArea)
            return;
        for (let n = 0, o = this.children.length; n < o; ++n) {
            const h = this.children[n]
                , a = h.cullable;
            h.cullable = a || !this.cullArea,
            h.render(e),
            h.cullable = a;
        }
    }
    render(e) {
        let t;
        if (!(!this.visible || this.worldAlpha <= 0 || !this.renderable))
            if (this._mask || (t = this.filters) != null && t.length)
                this.renderAdvanced(e);
            else if (this.cullable)
                this._renderWithCulling(e);
            else {
                this._render(e);
                for (let s = 0, i = this.children.length; s < i; ++s)
                    this.children[s].render(e);
            }
    }
    renderAdvanced(e) {
        let r, n, o;
        const t = this.filters
            , s = this._mask;
        if (t) {
            this._enabledFilters || (this._enabledFilters = []),
            this._enabledFilters.length = 0;
            for (let h = 0; h < t.length; h++)
                t[h].enabled && this._enabledFilters.push(t[h]);
        }
        const i = t && ((r = this._enabledFilters) == null ? void 0 : r.length) || s && (!s.isMaskData || s.enabled && (s.autoDetect || s.type !== tt.NONE));
        if (i && e.batch.flush(),
        t && ((n = this._enabledFilters) != null && n.length) && e.filter.push(this, this._enabledFilters),
        s && e.mask.push(this, this._mask),
        this.cullable)
            this._renderWithCulling(e);
        else {
            this._render(e);
            for (let h = 0, a = this.children.length; h < a; ++h)
                this.children[h].render(e);
        }
        i && e.batch.flush(),
        s && e.mask.pop(this),
        t && ((o = this._enabledFilters) != null && o.length) && e.filter.pop();
    }
    _render(e) {}
    destroy(e) {
        super.destroy(),
        this.sortDirty = !1;
        const t = typeof e == "boolean" ? e : e == null ? void 0 : e.children
            , s = this.removeChildren(0, this.children.length);
        if (t)
            for (let i = 0; i < s.length; ++i)
                s[i].destroy(e);
    }
    get width() {
        return this.scale.x * this.getLocalBounds().width;
    }
    set width(e) {
        const t = this.getLocalBounds().width;
        t !== 0 ? this.scale.x = e / t : this.scale.x = 1,
        this._width = e;
    }
    get height() {
        return this.scale.y * this.getLocalBounds().height;
    }
    set height(e) {
        const t = this.getLocalBounds().height;
        t !== 0 ? this.scale.y = e / t : this.scale.y = 1,
        this._height = e;
    }
}
;
let Lt = li;
Lt.defaultSortableChildren = !1;
Lt.prototype.containerUpdateTransform = Lt.prototype.updateTransform;
Object.defineProperties(O, {
    SORTABLE_CHILDREN: {
        get() {
            return Lt.defaultSortableChildren;
        },
        set(e) {
            G("7.1.0", "settings.SORTABLE_CHILDREN is deprecated, use Container.defaultSortableChildren"),
            Lt.defaultSortableChildren = e;
        }
    }
});
const Ie = new W
    , kh = new Uint16Array([0, 1, 2, 0, 2, 3]);
class Ot extends Lt {
    constructor(t) {
        super(),
        this._anchor = new Kt(this._onAnchorUpdate,this,t ? t.defaultAnchor.x : 0,t ? t.defaultAnchor.y : 0),
        this._texture = null,
        this._width = 0,
        this._height = 0,
        this._tintColor = new lt(16777215),
        this._tintRGB = null,
        this.tint = 16777215,
        this.blendMode = A.NORMAL,
        this._cachedTint = 16777215,
        this.uvs = null,
        this.texture = t || N.EMPTY,
        this.vertexData = new Float32Array(8),
        this.vertexTrimmedData = null,
        this._transformID = -1,
        this._textureID = -1,
        this._transformTrimmedID = -1,
        this._textureTrimmedID = -1,
        this.indices = kh,
        this.pluginName = "batch",
        this.isSprite = !0,
        this._roundPixels = O.ROUND_PIXELS;
    }
    _onTextureUpdate() {
        this._textureID = -1,
        this._textureTrimmedID = -1,
        this._cachedTint = 16777215,
        this._width && (this.scale.x = $e(this.scale.x) * this._width / this._texture.orig.width),
        this._height && (this.scale.y = $e(this.scale.y) * this._height / this._texture.orig.height);
    }
    _onAnchorUpdate() {
        this._transformID = -1,
        this._transformTrimmedID = -1;
    }
    calculateVertices() {
        const t = this._texture;
        if (this._transformID === this.transform._worldID && this._textureID === t._updateID)
            return;
        this._textureID !== t._updateID && (this.uvs = this._texture._uvs.uvsFloat32),
        this._transformID = this.transform._worldID,
        this._textureID = t._updateID;
        const s = this.transform.worldTransform
            , i = s.a
            , r = s.b
            , n = s.c
            , o = s.d
            , h = s.tx
            , a = s.ty
            , l = this.vertexData
            , u = t.trim
            , c = t.orig
            , d = this._anchor;
        let p = 0
            , f = 0
            , _ = 0
            , g = 0;
        if (u ? (f = u.x - d._x * c.width,
        p = f + u.width,
        g = u.y - d._y * c.height,
        _ = g + u.height) : (f = -d._x * c.width,
        p = f + c.width,
        g = -d._y * c.height,
        _ = g + c.height),
        l[0] = i * f + n * g + h,
        l[1] = o * g + r * f + a,
        l[2] = i * p + n * g + h,
        l[3] = o * g + r * p + a,
        l[4] = i * p + n * _ + h,
        l[5] = o * _ + r * p + a,
        l[6] = i * f + n * _ + h,
        l[7] = o * _ + r * f + a,
        this._roundPixels) {
            const v = O.RESOLUTION;
            for (let y = 0; y < l.length; ++y)
                l[y] = Math.round(l[y] * v) / v;
        }
    }
    calculateTrimmedVertices() {
        if (!this.vertexTrimmedData)
            this.vertexTrimmedData = new Float32Array(8);
        else if (this._transformTrimmedID === this.transform._worldID && this._textureTrimmedID === this._texture._updateID)
            return;
        this._transformTrimmedID = this.transform._worldID,
        this._textureTrimmedID = this._texture._updateID;
        const t = this._texture
            , s = this.vertexTrimmedData
            , i = t.orig
            , r = this._anchor
            , n = this.transform.worldTransform
            , o = n.a
            , h = n.b
            , a = n.c
            , l = n.d
            , u = n.tx
            , c = n.ty
            , d = -r._x * i.width
            , p = d + i.width
            , f = -r._y * i.height
            , _ = f + i.height;
        s[0] = o * d + a * f + u,
        s[1] = l * f + h * d + c,
        s[2] = o * p + a * f + u,
        s[3] = l * f + h * p + c,
        s[4] = o * p + a * _ + u,
        s[5] = l * _ + h * p + c,
        s[6] = o * d + a * _ + u,
        s[7] = l * _ + h * d + c;
    }
    _render(t) {
        this.calculateVertices(),
        t.batch.setObjectRenderer(t.plugins[this.pluginName]),
        t.plugins[this.pluginName].render(this);
    }
    _calculateBounds() {
        const t = this._texture.trim
            , s = this._texture.orig;
        !t || t.width === s.width && t.height === s.height ? (this.calculateVertices(),
        this._bounds.addQuad(this.vertexData)) : (this.calculateTrimmedVertices(),
        this._bounds.addQuad(this.vertexTrimmedData));
    }
    getLocalBounds(t) {
        return this.children.length === 0 ? (this._localBounds || (this._localBounds = new ds),
        this._localBounds.minX = this._texture.orig.width * -this._anchor._x,
        this._localBounds.minY = this._texture.orig.height * -this._anchor._y,
        this._localBounds.maxX = this._texture.orig.width * (1 - this._anchor._x),
        this._localBounds.maxY = this._texture.orig.height * (1 - this._anchor._y),
        t || (this._localBoundsRect || (this._localBoundsRect = new H),
        t = this._localBoundsRect),
        this._localBounds.getRectangle(t)) : super.getLocalBounds.call(this, t);
    }
    containsPoint(t) {
        this.worldTransform.applyInverse(t, Ie);
        const s = this._texture.orig.width
            , i = this._texture.orig.height
            , r = -s * this.anchor.x;
        let n = 0;
        return Ie.x >= r && Ie.x < r + s && (n = -i * this.anchor.y,
        Ie.y >= n && Ie.y < n + i);
    }
    destroy(t) {
        if (super.destroy(t),
        this._texture.off("update", this._onTextureUpdate, this),
        this._anchor = null,
        typeof t == "boolean" ? t : t == null ? void 0 : t.texture) {
            const i = typeof t == "boolean" ? t : t == null ? void 0 : t.baseTexture;
            this._texture.destroy(!!i);
        }
        this._texture = null;
    }
    static from(t, s) {
        const i = t instanceof N ? t : N.from(t, s);
        return new Ot(i);
    }
    set roundPixels(t) {
        this._roundPixels !== t && (this._transformID = -1),
        this._roundPixels = t;
    }
    get roundPixels() {
        return this._roundPixels;
    }
    get width() {
        return Math.abs(this.scale.x) * this._texture.orig.width;
    }
    set width(t) {
        const s = $e(this.scale.x) || 1;
        this.scale.x = s * t / this._texture.orig.width,
        this._width = t;
    }
    get height() {
        return Math.abs(this.scale.y) * this._texture.orig.height;
    }
    set height(t) {
        const s = $e(this.scale.y) || 1;
        this.scale.y = s * t / this._texture.orig.height,
        this._height = t;
    }
    get anchor() {
        return this._anchor;
    }
    set anchor(t) {
        this._anchor.copyFrom(t);
    }
    get tint() {
        return this._tintColor.value;
    }
    set tint(t) {
        this._tintColor.setValue(t),
        this._tintRGB = this._tintColor.toLittleEndianNumber();
    }
    get tintValue() {
        return this._tintColor.toNumber();
    }
    get texture() {
        return this._texture;
    }
    set texture(t) {
        this._texture !== t && (this._texture && this._texture.off("update", this._onTextureUpdate, this),
        this._texture = t || N.EMPTY,
        this._cachedTint = 16777215,
        this._textureID = -1,
        this._textureTrimmedID = -1,
        t && (t.baseTexture.valid ? this._onTextureUpdate() : t.once("update", this._onTextureUpdate, this)));
    }
}
const fs = {
    build(e) {
        const t = e.points;
        let s, i, r, n, o, h;
        if (e.type === ot.CIRC) {
            const f = e.shape;
            s = f.x,
            i = f.y,
            o = h = f.radius,
            r = n = 0;
        } else if (e.type === ot.ELIP) {
            const f = e.shape;
            s = f.x,
            i = f.y,
            o = f.width,
            h = f.height,
            r = n = 0;
        } else {
            const f = e.shape
                , _ = f.width / 2
                , g = f.height / 2;
            s = f.x + _,
            i = f.y + g,
            o = h = Math.max(0, Math.min(f.radius, Math.min(_, g))),
            r = _ - o,
            n = g - h;
        }
        if (!(o >= 0 && h >= 0 && r >= 0 && n >= 0)) {
            t.length = 0;
            return;
        }
        const a = Math.ceil(2.3 * Math.sqrt(o + h))
            , l = a * 8 + (r ? 4 : 0) + (n ? 4 : 0);
        if (t.length = l,
        l === 0)
            return;
        if (a === 0) {
            t.length = 8,
            t[0] = t[6] = s + r,
            t[1] = t[3] = i + n,
            t[2] = t[4] = s - r,
            t[5] = t[7] = i - n;
            return;
        }
        let u = 0
            , c = a * 4 + (r ? 2 : 0) + 2
            , d = c
            , p = l;
        {
            const f = r + o
                , _ = n
                , g = s + f
                , v = s - f
                , y = i + _;
            if (t[u++] = g,
            t[u++] = y,
            t[--c] = y,
            t[--c] = v,
            n) {
                const m = i - _;
                t[d++] = v,
                t[d++] = m,
                t[--p] = m,
                t[--p] = g;
            }
        }
        for (let f = 1; f < a; f++) {
            const _ = Math.PI / 2 * (f / a)
                , g = r + Math.cos(_) * o
                , v = n + Math.sin(_) * h
                , y = s + g
                , m = s - g
                , x = i + v
                , I = i - v;
            t[u++] = y,
            t[u++] = x,
            t[--c] = x,
            t[--c] = m,
            t[d++] = m,
            t[d++] = I,
            t[--p] = I,
            t[--p] = y;
        }
        {
            const f = r
                , _ = n + h
                , g = s + f
                , v = s - f
                , y = i + _
                , m = i - _;
            t[u++] = g,
            t[u++] = y,
            t[--p] = m,
            t[--p] = g,
            r && (t[u++] = v,
            t[u++] = y,
            t[--p] = m,
            t[--p] = v);
        }
    },
    triangulate(e, t) {
        const s = e.points
            , i = t.points
            , r = t.indices;
        if (s.length === 0)
            return;
        let n = i.length / 2;
        const o = n;
        let h, a;
        if (e.type !== ot.RREC) {
            const u = e.shape;
            h = u.x,
            a = u.y;
        } else {
            const u = e.shape;
            h = u.x + u.width / 2,
            a = u.y + u.height / 2;
        }
        const l = e.matrix;
        i.push(e.matrix ? l.a * h + l.c * a + l.tx : h, e.matrix ? l.b * h + l.d * a + l.ty : a),
        n++,
        i.push(s[0], s[1]);
        for (let u = 2; u < s.length; u += 2)
            i.push(s[u], s[u + 1]),
            r.push(n++, o, n);
        r.push(o + 1, o, n);
    }
};
function ar(e, t=!1) {
    const s = e.length;
    if (s < 6)
        return;
    let i = 0;
    for (let r = 0, n = e[s - 2], o = e[s - 1]; r < s; r += 2) {
        const h = e[r]
            , a = e[r + 1];
        i += (h - n) * (a + o),
        n = h,
        o = a;
    }
    if (!t && i > 0 || t && i <= 0) {
        const r = s / 2;
        for (let n = r + r % 2; n < s; n += 2) {
            const o = s - n - 2
                , h = s - n - 1
                , a = n
                , l = n + 1;
            [e[o],e[a]] = [e[a], e[o]],
            [e[h],e[l]] = [e[l], e[h]];
        }
    }
}
const an = {
        build(e) {
            e.points = e.shape.points.slice();
        },
        triangulate(e, t) {
            let s = e.points;
            const i = e.holes
                , r = t.points
                , n = t.indices;
            if (s.length >= 6) {
                ar(s, !1);
                const o = [];
                for (let l = 0; l < i.length; l++) {
                    const u = i[l];
                    ar(u.points, !0),
                    o.push(s.length / 2),
                    s = s.concat(u.points);
                }
                const h = os(s, o, 2);
                if (!h)
                    return;
                const a = r.length / 2;
                for (let l = 0; l < h.length; l += 3)
                    n.push(h[l] + a),
                    n.push(h[l + 1] + a),
                    n.push(h[l + 2] + a);
                for (let l = 0; l < s.length; l++)
                    r.push(s[l]);
            }
        }
    }
    , Dh = {
        build(e) {
            const t = e.shape
                , s = t.x
                , i = t.y
                , r = t.width
                , n = t.height
                , o = e.points;
            o.length = 0,
            r >= 0 && n >= 0 && o.push(s, i, s + r, i, s + r, i + n, s, i + n);
        },
        triangulate(e, t) {
            const s = e.points
                , i = t.points;
            if (s.length === 0)
                return;
            const r = i.length / 2;
            i.push(s[0], s[1], s[2], s[3], s[6], s[7], s[4], s[5]),
            t.indices.push(r, r + 1, r + 2, r + 1, r + 2, r + 3);
        }
    }
    , Gh = {
        build(e) {
            fs.build(e);
        },
        triangulate(e, t) {
            fs.triangulate(e, t);
        }
    };
var mt = (e => (e.MITER = "miter",
    e.BEVEL = "bevel",
    e.ROUND = "round",
    e))(mt || {})
    , Jt = (e => (e.BUTT = "butt",
    e.ROUND = "round",
    e.SQUARE = "square",
    e))(Jt || {});
const _e = {
    adaptive: !0,
    maxLength: 10,
    minSegments: 8,
    maxSegments: 2048,
    epsilon: 1e-4,
    _segmentsCount(e, t=20) {
        if (!this.adaptive || !e || isNaN(e))
            return t;
        let s = Math.ceil(e / this.maxLength);
        return s < this.minSegments ? s = this.minSegments : s > this.maxSegments && (s = this.maxSegments),
        s;
    }
};
class lr {
    static curveTo(t, s, i, r, n, o) {
        const h = o[o.length - 2]
            , l = o[o.length - 1] - s
            , u = h - t
            , c = r - s
            , d = i - t
            , p = Math.abs(l * d - u * c);
        if (p < 1e-8 || n === 0)
            return (o[o.length - 2] !== t || o[o.length - 1] !== s) && o.push(t, s),
            null;
        const f = l * l + u * u
            , _ = c * c + d * d
            , g = l * c + u * d
            , v = n * Math.sqrt(f) / p
            , y = n * Math.sqrt(_) / p
            , m = v * g / f
            , x = y * g / _
            , I = v * d + y * u
            , M = v * c + y * l
            , E = u * (y + m)
            , T = l * (y + m)
            , F = d * (v + x)
            , B = c * (v + x)
            , q = Math.atan2(T - M, E - I)
            , Mt = Math.atan2(B - M, F - I);
        return {
            cx: I + t,
            cy: M + s,
            radius: n,
            startAngle: q,
            endAngle: Mt,
            anticlockwise: u * c > d * l
        };
    }
    static arc(t, s, i, r, n, o, h, a, l) {
        const u = h - o
            , c = _e._segmentsCount(Math.abs(u) * n, Math.ceil(Math.abs(u) / us) * 40)
            , d = u / (c * 2)
            , p = d * 2
            , f = Math.cos(d)
            , _ = Math.sin(d)
            , g = c - 1
            , v = g % 1 / g;
        for (let y = 0; y <= g; ++y) {
            const m = y + v * y
                , x = d + o + p * m
                , I = Math.cos(x)
                , M = -Math.sin(x);
            l.push((f * I + _ * M) * n + i, (f * -M + _ * I) * n + r);
        }
    }
}
class Vh {
    constructor() {
        this.reset();
    }
    begin(t, s, i) {
        this.reset(),
        this.style = t,
        this.start = s,
        this.attribStart = i;
    }
    end(t, s) {
        this.attribSize = s - this.attribStart,
        this.size = t - this.start;
    }
    reset() {
        this.style = null,
        this.size = 0,
        this.start = 0,
        this.attribStart = 0,
        this.attribSize = 0;
    }
}
class yi {
    static curveLength(t, s, i, r, n, o, h, a) {
        let u = 0
            , c = 0
            , d = 0
            , p = 0
            , f = 0
            , _ = 0
            , g = 0
            , v = 0
            , y = 0
            , m = 0
            , x = 0
            , I = t
            , M = s;
        for (let E = 1; E <= 10; ++E)
            c = E / 10,
            d = c * c,
            p = d * c,
            f = 1 - c,
            _ = f * f,
            g = _ * f,
            v = g * t + 3 * _ * c * i + 3 * f * d * n + p * h,
            y = g * s + 3 * _ * c * r + 3 * f * d * o + p * a,
            m = I - v,
            x = M - y,
            I = v,
            M = y,
            u += Math.sqrt(m * m + x * x);
        return u;
    }
    static curveTo(t, s, i, r, n, o, h) {
        const a = h[h.length - 2]
            , l = h[h.length - 1];
        h.length -= 2;
        const u = _e._segmentsCount(yi.curveLength(a, l, t, s, i, r, n, o));
        let c = 0
            , d = 0
            , p = 0
            , f = 0
            , _ = 0;
        h.push(a, l);
        for (let g = 1, v = 0; g <= u; ++g)
            v = g / u,
            c = 1 - v,
            d = c * c,
            p = d * c,
            f = v * v,
            _ = f * v,
            h.push(p * a + 3 * d * v * t + 3 * c * f * i + _ * n, p * l + 3 * d * v * s + 3 * c * f * r + _ * o);
    }
}
function ur(e, t, s, i, r, n, o, h) {
    const a = e - s * r
        , l = t - i * r
        , u = e + s * n
        , c = t + i * n;
    let d, p;
    o ? (d = i,
    p = -s) : (d = -i,
    p = s);
    const f = a + d
        , _ = l + p
        , g = u + d
        , v = c + p;
    return h.push(f, _, g, v),
    2;
}
function zt(e, t, s, i, r, n, o, h) {
    const a = s - e
        , l = i - t;
    let u = Math.atan2(a, l)
        , c = Math.atan2(r - e, n - t);
    h && u < c ? u += Math.PI * 2 : !h && u > c && (c += Math.PI * 2);
    let d = u;
    const p = c - u
        , f = Math.abs(p)
        , _ = Math.sqrt(a * a + l * l)
        , g = (15 * f * Math.sqrt(_) / Math.PI >> 0) + 1
        , v = p / g;
    if (d += v,
    h) {
        o.push(e, t, s, i);
        for (let y = 1, m = d; y < g; y++,
        m += v)
            o.push(e, t, e + Math.sin(m) * _, t + Math.cos(m) * _);
        o.push(e, t, r, n);
    } else {
        o.push(s, i, e, t);
        for (let y = 1, m = d; y < g; y++,
        m += v)
            o.push(e + Math.sin(m) * _, t + Math.cos(m) * _, e, t);
        o.push(r, n, e, t);
    }
    return g * 2;
}
function Xh(e, t) {
    const s = e.shape;
    let i = e.points || s.points.slice();
    const r = t.closePointEps;
    if (i.length === 0)
        return;
    const n = e.lineStyle
        , o = new W(i[0],i[1])
        , h = new W(i[i.length - 2],i[i.length - 1])
        , a = s.type !== ot.POLY || s.closeStroke
        , l = Math.abs(o.x - h.x) < r && Math.abs(o.y - h.y) < r;
    if (a) {
        i = i.slice(),
        l && (i.pop(),
        i.pop(),
        h.set(i[i.length - 2], i[i.length - 1]));
        const V = (o.x + h.x) * .5
            , wt = (h.y + o.y) * .5;
        i.unshift(V, wt),
        i.push(V, wt);
    }
    const u = t.points
        , c = i.length / 2;
    let d = i.length;
    const p = u.length / 2
        , f = n.width / 2
        , _ = f * f
        , g = n.miterLimit * n.miterLimit;
    let v = i[0]
        , y = i[1]
        , m = i[2]
        , x = i[3]
        , I = 0
        , M = 0
        , E = -(y - x)
        , T = v - m
        , F = 0
        , B = 0
        , q = Math.sqrt(E * E + T * T);
    E /= q,
    T /= q,
    E *= f,
    T *= f;
    const Mt = n.alignment
        , R = (1 - Mt) * 2
        , C = Mt * 2;
    a || (n.cap === Jt.ROUND ? d += zt(v - E * (R - C) * .5, y - T * (R - C) * .5, v - E * R, y - T * R, v + E * C, y + T * C, u, !0) + 2 : n.cap === Jt.SQUARE && (d += ur(v, y, E, T, R, C, !0, u))),
    u.push(v - E * R, y - T * R, v + E * C, y + T * C);
    for (let V = 1; V < c - 1; ++V) {
        v = i[(V - 1) * 2],
        y = i[(V - 1) * 2 + 1],
        m = i[V * 2],
        x = i[V * 2 + 1],
        I = i[(V + 1) * 2],
        M = i[(V + 1) * 2 + 1],
        E = -(y - x),
        T = v - m,
        q = Math.sqrt(E * E + T * T),
        E /= q,
        T /= q,
        E *= f,
        T *= f,
        F = -(x - M),
        B = m - I,
        q = Math.sqrt(F * F + B * B),
        F /= q,
        B /= q,
        F *= f,
        B *= f;
        const wt = m - v
            , Ht = y - x
            , w = m - I
            , S = M - x
            , U = wt * w + Ht * S
            , X = Ht * w - S * wt
            , $ = X < 0;
        if (Math.abs(X) < .001 * Math.abs(U)) {
            u.push(m - E * R, x - T * R, m + E * C, x + T * C),
            U >= 0 && (n.join === mt.ROUND ? d += zt(m, x, m - E * R, x - T * R, m - F * R, x - B * R, u, !1) + 4 : d += 2,
            u.push(m - F * C, x - B * C, m + F * R, x + B * R));
            continue;
        }
        const st = (-E + v) * (-T + x) - (-E + m) * (-T + y)
            , Z = (-F + I) * (-B + x) - (-F + m) * (-B + M)
            , it = (wt * Z - w * st) / X
            , ht = (S * st - Ht * Z) / X
            , ut = (it - m) * (it - m) + (ht - x) * (ht - x)
            , nt = m + (it - m) * R
            , z = x + (ht - x) * R
            , K = m - (it - m) * C
            , Q = x - (ht - x) * C
            , Et = Math.min(wt * wt + Ht * Ht, w * w + S * S)
            , It = $ ? R : C
            , ve = Et + It * It * _
            , dn = ut <= ve;
        let De = n.join;
        if (De === mt.MITER && ut / _ > g && (De = mt.BEVEL),
        dn)
            switch (De) {
                case mt.MITER:
                {
                    u.push(nt, z, K, Q);
                    break;
                }
                case mt.BEVEL:
                {
                    $ ? u.push(nt, z, m + E * C, x + T * C, nt, z, m + F * C, x + B * C) : u.push(m - E * R, x - T * R, K, Q, m - F * R, x - B * R, K, Q),
                    d += 2;
                    break;
                }
                case mt.ROUND:
                {
                    $ ? (u.push(nt, z, m + E * C, x + T * C),
                    d += zt(m, x, m + E * C, x + T * C, m + F * C, x + B * C, u, !0) + 4,
                    u.push(nt, z, m + F * C, x + B * C)) : (u.push(m - E * R, x - T * R, K, Q),
                    d += zt(m, x, m - E * R, x - T * R, m - F * R, x - B * R, u, !1) + 4,
                    u.push(m - F * R, x - B * R, K, Q));
                    break;
                }
            }
        else {
            switch (u.push(m - E * R, x - T * R, m + E * C, x + T * C),
            De) {
                case mt.MITER:
                {
                    $ ? u.push(K, Q, K, Q) : u.push(nt, z, nt, z),
                    d += 2;
                    break;
                }
                case mt.ROUND:
                {
                    $ ? d += zt(m, x, m + E * C, x + T * C, m + F * C, x + B * C, u, !0) + 2 : d += zt(m, x, m - E * R, x - T * R, m - F * R, x - B * R, u, !1) + 2;
                    break;
                }
            }
            u.push(m - F * R, x - B * R, m + F * C, x + B * C),
            d += 2;
        }
    }
    v = i[(c - 2) * 2],
    y = i[(c - 2) * 2 + 1],
    m = i[(c - 1) * 2],
    x = i[(c - 1) * 2 + 1],
    E = -(y - x),
    T = v - m,
    q = Math.sqrt(E * E + T * T),
    E /= q,
    T /= q,
    E *= f,
    T *= f,
    u.push(m - E * R, x - T * R, m + E * C, x + T * C),
    a || (n.cap === Jt.ROUND ? d += zt(m - E * (R - C) * .5, x - T * (R - C) * .5, m - E * R, x - T * R, m + E * C, x + T * C, u, !1) + 2 : n.cap === Jt.SQUARE && (d += ur(m, x, E, T, R, C, !1, u)));
    const kt = t.indices
        , Nt = _e.epsilon * _e.epsilon;
    for (let V = p; V < d + p - 2; ++V)
        v = u[V * 2],
        y = u[V * 2 + 1],
        m = u[(V + 1) * 2],
        x = u[(V + 1) * 2 + 1],
        I = u[(V + 2) * 2],
        M = u[(V + 2) * 2 + 1],
        !(Math.abs(v * (x - M) + m * (M - y) + I * (y - x)) < Nt) && kt.push(V, V + 1, V + 2);
}
function Hh(e, t) {
    let s = 0;
    const i = e.shape
        , r = e.points || i.points
        , n = i.type !== ot.POLY || i.closeStroke;
    if (r.length === 0)
        return;
    const o = t.points
        , h = t.indices
        , a = r.length / 2
        , l = o.length / 2;
    let u = l;
    for (o.push(r[0], r[1]),
    s = 1; s < a; s++)
        o.push(r[s * 2], r[s * 2 + 1]),
        h.push(u, u + 1),
        u++;
    n && h.push(u, l);
}
function cr(e, t) {
    e.lineStyle.native ? Hh(e, t) : Xh(e, t);
}
class vi {
    static curveLength(t, s, i, r, n, o) {
        const h = t - 2 * i + n
            , a = s - 2 * r + o
            , l = 2 * i - 2 * t
            , u = 2 * r - 2 * s
            , c = 4 * (h * h + a * a)
            , d = 4 * (h * l + a * u)
            , p = l * l + u * u
            , f = 2 * Math.sqrt(c + d + p)
            , _ = Math.sqrt(c)
            , g = 2 * c * _
            , v = 2 * Math.sqrt(p)
            , y = d / _;
        return (g * f + _ * d * (f - v) + (4 * p * c - d * d) * Math.log((2 * _ + y + f) / (y + v))) / (4 * g);
    }
    static curveTo(t, s, i, r, n) {
        const o = n[n.length - 2]
            , h = n[n.length - 1]
            , a = _e._segmentsCount(vi.curveLength(o, h, t, s, i, r));
        let l = 0
            , u = 0;
        for (let c = 1; c <= a; ++c) {
            const d = c / a;
            l = o + (t - o) * d,
            u = h + (s - h) * d,
            n.push(l + (t + (i - t) * d - l) * d, u + (s + (r - s) * d - u) * d);
        }
    }
}
const Xs = {
        [ot.POLY]: an,
        [ot.CIRC]: fs,
        [ot.ELIP]: fs,
        [ot.RECT]: Dh,
        [ot.RREC]: Gh
    }
    , dr = []
    , ts = [];
class ps {
    constructor(t, s=null, i=null, r=null) {
        this.points = [],
        this.holes = [],
        this.shape = t,
        this.lineStyle = i,
        this.fillStyle = s,
        this.matrix = r,
        this.type = t.type;
    }
    clone() {
        return new ps(this.shape,this.fillStyle,this.lineStyle,this.matrix);
    }
    destroy() {
        this.shape = null,
        this.holes.length = 0,
        this.holes = null,
        this.points.length = 0,
        this.points = null,
        this.lineStyle = null,
        this.fillStyle = null;
    }
}
const re = new W
    , ln = class extends wr {
        constructor() {
            super(),
            this.closePointEps = 1e-4,
            this.boundsPadding = 0,
            this.uvsFloat32 = null,
            this.indicesUint16 = null,
            this.batchable = !1,
            this.points = [],
            this.colors = [],
            this.uvs = [],
            this.indices = [],
            this.textureIds = [],
            this.graphicsData = [],
            this.drawCalls = [],
            this.batchDirty = -1,
            this.batches = [],
            this.dirty = 0,
            this.cacheDirty = -1,
            this.clearDirty = 0,
            this.shapeIndex = 0,
            this._bounds = new ds,
            this.boundsDirty = -1;
        }
        get bounds() {
            return this.updateBatches(),
            this.boundsDirty !== this.dirty && (this.boundsDirty = this.dirty,
            this.calculateBounds()),
            this._bounds;
        }
        invalidate() {
            this.boundsDirty = -1,
            this.dirty++,
            this.batchDirty++,
            this.shapeIndex = 0,
            this.points.length = 0,
            this.colors.length = 0,
            this.uvs.length = 0,
            this.indices.length = 0,
            this.textureIds.length = 0;
            for (let e = 0; e < this.drawCalls.length; e++)
                this.drawCalls[e].texArray.clear(),
                ts.push(this.drawCalls[e]);
            this.drawCalls.length = 0;
            for (let e = 0; e < this.batches.length; e++) {
                const t = this.batches[e];
                t.reset(),
                dr.push(t);
            }
            this.batches.length = 0;
        }
        clear() {
            return this.graphicsData.length > 0 && (this.invalidate(),
            this.clearDirty++,
            this.graphicsData.length = 0),
            this;
        }
        drawShape(e, t=null, s=null, i=null) {
            const r = new ps(e,t,s,i);
            return this.graphicsData.push(r),
            this.dirty++,
            this;
        }
        drawHole(e, t=null) {
            if (!this.graphicsData.length)
                return null;
            const s = new ps(e,null,null,t)
                , i = this.graphicsData[this.graphicsData.length - 1];
            return s.lineStyle = i.lineStyle,
            i.holes.push(s),
            this.dirty++,
            this;
        }
        destroy() {
            super.destroy();
            for (let e = 0; e < this.graphicsData.length; ++e)
                this.graphicsData[e].destroy();
            this.points.length = 0,
            this.points = null,
            this.colors.length = 0,
            this.colors = null,
            this.uvs.length = 0,
            this.uvs = null,
            this.indices.length = 0,
            this.indices = null,
            this.indexBuffer.destroy(),
            this.indexBuffer = null,
            this.graphicsData.length = 0,
            this.graphicsData = null,
            this.drawCalls.length = 0,
            this.drawCalls = null,
            this.batches.length = 0,
            this.batches = null,
            this._bounds = null;
        }
        containsPoint(e) {
            const t = this.graphicsData;
            for (let s = 0; s < t.length; ++s) {
                const i = t[s];
                if (i.fillStyle.visible && i.shape && (i.matrix ? i.matrix.applyInverse(e, re) : re.copyFrom(e),
                i.shape.contains(re.x, re.y))) {
                    let r = !1;
                    if (i.holes) {
                        for (let n = 0; n < i.holes.length; n++)
                            if (i.holes[n].shape.contains(re.x, re.y)) {
                                r = !0;
                                break;
                            }
                    }
                    if (!r)
                        return !0;
                }
            }
            return !1;
        }
        updateBatches() {
            if (!this.graphicsData.length) {
                this.batchable = !0;
                return;
            }
            if (!this.validateBatching())
                return;
            this.cacheDirty = this.dirty;
            const e = this.uvs
                , t = this.graphicsData;
            let s = null
                , i = null;
            this.batches.length > 0 && (s = this.batches[this.batches.length - 1],
            i = s.style);
            for (let h = this.shapeIndex; h < t.length; h++) {
                this.shapeIndex++;
                const a = t[h]
                    , l = a.fillStyle
                    , u = a.lineStyle;
                Xs[a.type].build(a),
                a.matrix && this.transformPoints(a.points, a.matrix),
                (l.visible || u.visible) && this.processHoles(a.holes);
                for (let d = 0; d < 2; d++) {
                    const p = d === 0 ? l : u;
                    if (!p.visible)
                        continue;
                    const f = p.texture.baseTexture
                        , _ = this.indices.length
                        , g = this.points.length / 2;
                    f.wrapMode = Ne.REPEAT,
                    d === 0 ? this.processFill(a) : this.processLine(a);
                    const v = this.points.length / 2 - g;
                    v !== 0 && (s && !this._compareStyles(i, p) && (s.end(_, g),
                    s = null),
                    s || (s = dr.pop() || new Vh,
                    s.begin(p, _, g),
                    this.batches.push(s),
                    i = p),
                    this.addUvs(this.points, e, p.texture, g, v, p.matrix));
                }
            }
            const r = this.indices.length
                , n = this.points.length / 2;
            if (s && s.end(r, n),
            this.batches.length === 0) {
                this.batchable = !0;
                return;
            }
            const o = n > 65535;
            this.indicesUint16 && this.indices.length === this.indicesUint16.length && o === this.indicesUint16.BYTES_PER_ELEMENT > 2 ? this.indicesUint16.set(this.indices) : this.indicesUint16 = o ? new Uint32Array(this.indices) : new Uint16Array(this.indices),
            this.batchable = this.isBatchable(),
            this.batchable ? this.packBatches() : this.buildDrawCalls();
        }
        _compareStyles(e, t) {
            return !(!e || !t || e.texture.baseTexture !== t.texture.baseTexture || e.color + e.alpha !== t.color + t.alpha || !!e.native != !!t.native);
        }
        validateBatching() {
            if (this.dirty === this.cacheDirty || !this.graphicsData.length)
                return !1;
            for (let e = 0, t = this.graphicsData.length; e < t; e++) {
                const s = this.graphicsData[e]
                    , i = s.fillStyle
                    , r = s.lineStyle;
                if (i && !i.texture.baseTexture.valid || r && !r.texture.baseTexture.valid)
                    return !1;
            }
            return !0;
        }
        packBatches() {
            this.batchDirty++,
            this.uvsFloat32 = new Float32Array(this.uvs);
            const e = this.batches;
            for (let t = 0, s = e.length; t < s; t++) {
                const i = e[t];
                for (let r = 0; r < i.size; r++) {
                    const n = i.start + r;
                    this.indicesUint16[n] = this.indicesUint16[n] - i.attribStart;
                }
            }
        }
        isBatchable() {
            if (this.points.length > 65535 * 2)
                return !1;
            const e = this.batches;
            for (let t = 0; t < e.length; t++)
                if (e[t].style.native)
                    return !1;
            return this.points.length < ln.BATCHABLE_SIZE * 2;
        }
        buildDrawCalls() {
            let e = ++k._globalBatch;
            for (let u = 0; u < this.drawCalls.length; u++)
                this.drawCalls[u].texArray.clear(),
                ts.push(this.drawCalls[u]);
            this.drawCalls.length = 0;
            const t = this.colors
                , s = this.textureIds;
            let i = ts.pop();
            i || (i = new si,
            i.texArray = new ri),
            i.texArray.count = 0,
            i.start = 0,
            i.size = 0,
            i.type = Gt.TRIANGLES;
            let r = 0
                , n = null
                , o = 0
                , h = !1
                , a = Gt.TRIANGLES
                , l = 0;
            this.drawCalls.push(i);
            for (let u = 0; u < this.batches.length; u++) {
                const c = this.batches[u]
                    , d = 8
                    , p = c.style
                    , f = p.texture.baseTexture;
                h !== !!p.native && (h = !!p.native,
                a = h ? Gt.LINES : Gt.TRIANGLES,
                n = null,
                r = d,
                e++),
                n !== f && (n = f,
                f._batchEnabled !== e && (r === d && (e++,
                r = 0,
                i.size > 0 && (i = ts.pop(),
                i || (i = new si,
                i.texArray = new ri),
                this.drawCalls.push(i)),
                i.start = l,
                i.size = 0,
                i.texArray.count = 0,
                i.type = a),
                f.touched = 1,
                f._batchEnabled = e,
                f._batchLocation = r,
                f.wrapMode = Ne.REPEAT,
                i.texArray.elements[i.texArray.count++] = f,
                r++)),
                i.size += c.size,
                l += c.size,
                o = f._batchLocation,
                this.addColors(t, p.color, p.alpha, c.attribSize, c.attribStart),
                this.addTextureIds(s, o, c.attribSize, c.attribStart);
            }
            k._globalBatch = e,
            this.packAttributes();
        }
        packAttributes() {
            const e = this.points
                , t = this.uvs
                , s = this.colors
                , i = this.textureIds
                , r = new ArrayBuffer(e.length * 3 * 4)
                , n = new Float32Array(r)
                , o = new Uint32Array(r);
            let h = 0;
            for (let a = 0; a < e.length / 2; a++)
                n[h++] = e[a * 2],
                n[h++] = e[a * 2 + 1],
                n[h++] = t[a * 2],
                n[h++] = t[a * 2 + 1],
                o[h++] = s[a],
                n[h++] = i[a];
            this._buffer.update(r),
            this._indexBuffer.update(this.indicesUint16);
        }
        processFill(e) {
            e.holes.length ? an.triangulate(e, this) : Xs[e.type].triangulate(e, this);
        }
        processLine(e) {
            cr(e, this);
            for (let t = 0; t < e.holes.length; t++)
                cr(e.holes[t], this);
        }
        processHoles(e) {
            for (let t = 0; t < e.length; t++) {
                const s = e[t];
                Xs[s.type].build(s),
                s.matrix && this.transformPoints(s.points, s.matrix);
            }
        }
        calculateBounds() {
            const e = this._bounds;
            e.clear(),
            e.addVertexData(this.points, 0, this.points.length),
            e.pad(this.boundsPadding, this.boundsPadding);
        }
        transformPoints(e, t) {
            for (let s = 0; s < e.length / 2; s++) {
                const i = e[s * 2]
                    , r = e[s * 2 + 1];
                e[s * 2] = t.a * i + t.c * r + t.tx,
                e[s * 2 + 1] = t.b * i + t.d * r + t.ty;
            }
        }
        addColors(e, t, s, i, r=0) {
            const n = lt.shared.setValue(t).toLittleEndianNumber()
                , o = lt.shared.setValue(n).toPremultiplied(s);
            e.length = Math.max(e.length, r + i);
            for (let h = 0; h < i; h++)
                e[r + h] = o;
        }
        addTextureIds(e, t, s, i=0) {
            e.length = Math.max(e.length, i + s);
            for (let r = 0; r < s; r++)
                e[i + r] = t;
        }
        addUvs(e, t, s, i, r, n=null) {
            let o = 0;
            const h = t.length
                , a = s.frame;
            for (; o < r; ) {
                let u = e[(i + o) * 2]
                    , c = e[(i + o) * 2 + 1];
                if (n) {
                    const d = n.a * u + n.c * c + n.tx;
                    c = n.b * u + n.d * c + n.ty,
                    u = d;
                }
                o++,
                t.push(u / a.width, c / a.height);
            }
            const l = s.baseTexture;
            (a.width < l.width || a.height < l.height) && this.adjustUvs(t, s, h, r);
        }
        adjustUvs(e, t, s, i) {
            const r = t.baseTexture
                , n = 1e-6
                , o = s + i * 2
                , h = t.frame
                , a = h.width / r.width
                , l = h.height / r.height;
            let u = h.x / h.width
                , c = h.y / h.height
                , d = Math.floor(e[s] + n)
                , p = Math.floor(e[s + 1] + n);
            for (let f = s + 2; f < o; f += 2)
                d = Math.min(d, Math.floor(e[f] + n)),
                p = Math.min(p, Math.floor(e[f + 1] + n));
            u -= d,
            c -= p;
            for (let f = s; f < o; f += 2)
                e[f] = (e[f] + u) * a,
                e[f + 1] = (e[f + 1] + c) * l;
        }
    }
;
let un = ln;
un.BATCHABLE_SIZE = 100;
class ws {
    constructor() {
        this.color = 16777215,
        this.alpha = 1,
        this.texture = N.WHITE,
        this.matrix = null,
        this.visible = !1,
        this.reset();
    }
    clone() {
        const t = new ws;
        return t.color = this.color,
        t.alpha = this.alpha,
        t.texture = this.texture,
        t.matrix = this.matrix,
        t.visible = this.visible,
        t;
    }
    reset() {
        this.color = 16777215,
        this.alpha = 1,
        this.texture = N.WHITE,
        this.matrix = null,
        this.visible = !1;
    }
    destroy() {
        this.texture = null,
        this.matrix = null;
    }
}
class bi extends ws {
    constructor() {
        super(...arguments),
        this.width = 0,
        this.alignment = .5,
        this.native = !1,
        this.cap = Jt.BUTT,
        this.join = mt.MITER,
        this.miterLimit = 10;
    }
    clone() {
        const t = new bi;
        return t.color = this.color,
        t.alpha = this.alpha,
        t.texture = this.texture,
        t.matrix = this.matrix,
        t.visible = this.visible,
        t.width = this.width,
        t.alignment = this.alignment,
        t.native = this.native,
        t.cap = this.cap,
        t.join = this.join,
        t.miterLimit = this.miterLimit,
        t;
    }
    reset() {
        super.reset(),
        this.color = 0,
        this.alignment = .5,
        this.width = 0,
        this.native = !1;
    }
}
const Hs = {}
    , ns = class extends Lt {
        constructor(e=null) {
            super(),
            this.shader = null,
            this.pluginName = "batch",
            this.currentPath = null,
            this.batches = [],
            this.batchTint = -1,
            this.batchDirty = -1,
            this.vertexData = null,
            this._fillStyle = new ws,
            this._lineStyle = new bi,
            this._matrix = null,
            this._holeMode = !1,
            this.state = xe.for2d(),
            this._geometry = e || new un,
            this._geometry.refCount++,
            this._transformID = -1,
            this._tintColor = new lt(16777215),
            this.blendMode = A.NORMAL;
        }
        get geometry() {
            return this._geometry;
        }
        clone() {
            return this.finishPoly(),
            new ns(this._geometry);
        }
        set blendMode(e) {
            this.state.blendMode = e;
        }
        get blendMode() {
            return this.state.blendMode;
        }
        get tint() {
            return this._tintColor.value;
        }
        set tint(e) {
            this._tintColor.setValue(e);
        }
        get fill() {
            return this._fillStyle;
        }
        get line() {
            return this._lineStyle;
        }
        lineStyle(e=null, t=0, s, i=.5, r=!1) {
            return typeof e == "number" && (e = {
                width: e,
                color: t,
                alpha: s,
                alignment: i,
                native: r
            }),
            this.lineTextureStyle(e);
        }
        lineTextureStyle(e) {
            const t = {
                width: 0,
                texture: N.WHITE,
                color: e != null && e.texture ? 16777215 : 0,
                matrix: null,
                alignment: .5,
                native: !1,
                cap: Jt.BUTT,
                join: mt.MITER,
                miterLimit: 10
            };
            e = Object.assign(t, e),
            this.normalizeColor(e),
            this.currentPath && this.startPoly();
            const s = e.width > 0 && e.alpha > 0;
            return s ? (e.matrix && (e.matrix = e.matrix.clone(),
            e.matrix.invert()),
            Object.assign(this._lineStyle, {
                visible: s
            }, e)) : this._lineStyle.reset(),
            this;
        }
        startPoly() {
            if (this.currentPath) {
                const e = this.currentPath.points
                    , t = this.currentPath.points.length;
                t > 2 && (this.drawShape(this.currentPath),
                this.currentPath = new Se,
                this.currentPath.closeStroke = !1,
                this.currentPath.points.push(e[t - 2], e[t - 1]));
            } else
                this.currentPath = new Se,
                this.currentPath.closeStroke = !1;
        }
        finishPoly() {
            this.currentPath && (this.currentPath.points.length > 2 ? (this.drawShape(this.currentPath),
            this.currentPath = null) : this.currentPath.points.length = 0);
        }
        moveTo(e, t) {
            return this.startPoly(),
            this.currentPath.points[0] = e,
            this.currentPath.points[1] = t,
            this;
        }
        lineTo(e, t) {
            this.currentPath || this.moveTo(0, 0);
            const s = this.currentPath.points
                , i = s[s.length - 2]
                , r = s[s.length - 1];
            return (i !== e || r !== t) && s.push(e, t),
            this;
        }
        _initCurve(e=0, t=0) {
            this.currentPath ? this.currentPath.points.length === 0 && (this.currentPath.points = [e, t]) : this.moveTo(e, t);
        }
        quadraticCurveTo(e, t, s, i) {
            this._initCurve();
            const r = this.currentPath.points;
            return r.length === 0 && this.moveTo(0, 0),
            vi.curveTo(e, t, s, i, r),
            this;
        }
        bezierCurveTo(e, t, s, i, r, n) {
            return this._initCurve(),
            yi.curveTo(e, t, s, i, r, n, this.currentPath.points),
            this;
        }
        arcTo(e, t, s, i, r) {
            this._initCurve(e, t);
            const n = this.currentPath.points
                , o = lr.curveTo(e, t, s, i, r, n);
            if (o) {
                const {cx: h, cy: a, radius: l, startAngle: u, endAngle: c, anticlockwise: d} = o;
                this.arc(h, a, l, u, c, d);
            }
            return this;
        }
        arc(e, t, s, i, r, n=!1) {
            if (i === r)
                return this;
            if (!n && r <= i ? r += us : n && i <= r && (i += us),
            r - i === 0)
                return this;
            const h = e + Math.cos(i) * s
                , a = t + Math.sin(i) * s
                , l = this._geometry.closePointEps;
            let u = this.currentPath ? this.currentPath.points : null;
            if (u) {
                const c = Math.abs(u[u.length - 2] - h)
                    , d = Math.abs(u[u.length - 1] - a);
                c < l && d < l || u.push(h, a);
            } else
                this.moveTo(h, a),
                u = this.currentPath.points;
            return lr.arc(h, a, e, t, s, i, r, n, u),
            this;
        }
        beginFill(e=0, t) {
            return this.beginTextureFill({
                texture: N.WHITE,
                color: e,
                alpha: t
            });
        }
        normalizeColor(e) {
            let s, i;
            const t = lt.shared.setValue((s = e.color) != null ? s : 0);
            e.color = t.toNumber(),
            (i = e.alpha) != null || (e.alpha = t.alpha);
        }
        beginTextureFill(e) {
            const t = {
                texture: N.WHITE,
                color: 16777215,
                matrix: null
            };
            e = Object.assign(t, e),
            this.normalizeColor(e),
            this.currentPath && this.startPoly();
            const s = e.alpha > 0;
            return s ? (e.matrix && (e.matrix = e.matrix.clone(),
            e.matrix.invert()),
            Object.assign(this._fillStyle, {
                visible: s
            }, e)) : this._fillStyle.reset(),
            this;
        }
        endFill() {
            return this.finishPoly(),
            this._fillStyle.reset(),
            this;
        }
        drawRect(e, t, s, i) {
            return this.drawShape(new H(e,t,s,i));
        }
        drawRoundedRect(e, t, s, i, r) {
            return this.drawShape(new mi(e,t,s,i,r));
        }
        drawCircle(e, t, s) {
            return this.drawShape(new fi(e,t,s));
        }
        drawEllipse(e, t, s, i) {
            return this.drawShape(new pi(e,t,s,i));
        }
        drawPolygon(...e) {
            let t, s = !0;
            const i = e[0];
            i.points ? (s = i.closeStroke,
            t = i.points) : Array.isArray(e[0]) ? t = e[0] : t = e;
            const r = new Se(t);
            return r.closeStroke = s,
            this.drawShape(r),
            this;
        }
        drawShape(e) {
            return this._holeMode ? this._geometry.drawHole(e, this._matrix) : this._geometry.drawShape(e, this._fillStyle.clone(), this._lineStyle.clone(), this._matrix),
            this;
        }
        clear() {
            return this._geometry.clear(),
            this._lineStyle.reset(),
            this._fillStyle.reset(),
            this._boundsID++,
            this._matrix = null,
            this._holeMode = !1,
            this.currentPath = null,
            this;
        }
        isFastRect() {
            const e = this._geometry.graphicsData;
            return e.length === 1 && e[0].shape.type === ot.RECT && !e[0].matrix && !e[0].holes.length && !(e[0].lineStyle.visible && e[0].lineStyle.width);
        }
        _render(e) {
            this.finishPoly();
            const t = this._geometry;
            t.updateBatches(),
            t.batchable ? (this.batchDirty !== t.batchDirty && this._populateBatches(),
            this._renderBatched(e)) : (e.batch.flush(),
            this._renderDirect(e));
        }
        _populateBatches() {
            const e = this._geometry
                , t = this.blendMode
                , s = e.batches.length;
            this.batchTint = -1,
            this._transformID = -1,
            this.batchDirty = e.batchDirty,
            this.batches.length = s,
            this.vertexData = new Float32Array(e.points);
            for (let i = 0; i < s; i++) {
                const r = e.batches[i]
                    , n = r.style.color
                    , o = new Float32Array(this.vertexData.buffer,r.attribStart * 4 * 2,r.attribSize * 2)
                    , h = new Float32Array(e.uvsFloat32.buffer,r.attribStart * 4 * 2,r.attribSize * 2)
                    , a = new Uint16Array(e.indicesUint16.buffer,r.start * 2,r.size)
                    , l = {
                        vertexData: o,
                        blendMode: t,
                        indices: a,
                        uvs: h,
                        _batchRGB: lt.shared.setValue(n).toRgbArray(),
                        _tintRGB: n,
                        _texture: r.style.texture,
                        alpha: r.style.alpha,
                        worldAlpha: 1
                    };
                this.batches[i] = l;
            }
        }
        _renderBatched(e) {
            if (this.batches.length) {
                e.batch.setObjectRenderer(e.plugins[this.pluginName]),
                this.calculateVertices(),
                this.calculateTints();
                for (let t = 0, s = this.batches.length; t < s; t++) {
                    const i = this.batches[t];
                    i.worldAlpha = this.worldAlpha * i.alpha,
                    e.plugins[this.pluginName].render(i);
                }
            }
        }
        _renderDirect(e) {
            const t = this._resolveDirectShader(e)
                , s = this._geometry
                , i = this.worldAlpha
                , r = t.uniforms
                , n = s.drawCalls;
            r.translationMatrix = this.transform.worldTransform,
            lt.shared.setValue(this._tintColor).premultiply(i).toArray(r.tint),
            e.shader.bind(t),
            e.geometry.bind(s, t),
            e.state.set(this.state);
            for (let o = 0, h = n.length; o < h; o++)
                this._renderDrawCallDirect(e, s.drawCalls[o]);
        }
        _renderDrawCallDirect(e, t) {
            const {texArray: s, type: i, size: r, start: n} = t
                , o = s.count;
            for (let h = 0; h < o; h++)
                e.texture.bind(s.elements[h], h);
            e.geometry.draw(i, r, n);
        }
        _resolveDirectShader(e) {
            let t = this.shader;
            const s = this.pluginName;
            if (!t) {
                if (!Hs[s]) {
                    const {maxTextures: i} = e.plugins[s]
                        , r = new Int32Array(i);
                    for (let h = 0; h < i; h++)
                        r[h] = h;
                    const n = {
                            tint: new Float32Array([1, 1, 1, 1]),
                            translationMatrix: new et,
                            default: Tt.from({
                                uSamplers: r
                            }, !0)
                        }
                        , o = e.plugins[s]._shader.program;
                    Hs[s] = new ke(o,n);
                }
                t = Hs[s];
            }
            return t;
        }
        _calculateBounds() {
            this.finishPoly();
            const e = this._geometry;
            if (!e.graphicsData.length)
                return;
            const {minX: t, minY: s, maxX: i, maxY: r} = e.bounds;
            this._bounds.addFrame(this.transform, t, s, i, r);
        }
        containsPoint(e) {
            return this.worldTransform.applyInverse(e, ns._TEMP_POINT),
            this._geometry.containsPoint(ns._TEMP_POINT);
        }
        calculateTints() {
            if (this.batchTint !== this.tint) {
                this.batchTint = this._tintColor.toNumber();
                for (let e = 0; e < this.batches.length; e++) {
                    const t = this.batches[e];
                    t._tintRGB = lt.shared.setValue(this._tintColor).multiply(t._batchRGB).toLittleEndianNumber();
                }
            }
        }
        calculateVertices() {
            const e = this.transform._worldID;
            if (this._transformID === e)
                return;
            this._transformID = e;
            const t = this.transform.worldTransform
                , s = t.a
                , i = t.b
                , r = t.c
                , n = t.d
                , o = t.tx
                , h = t.ty
                , a = this._geometry.points
                , l = this.vertexData;
            let u = 0;
            for (let c = 0; c < a.length; c += 2) {
                const d = a[c]
                    , p = a[c + 1];
                l[u++] = s * d + r * p + o,
                l[u++] = n * p + i * d + h;
            }
        }
        closePath() {
            const e = this.currentPath;
            return e && (e.closeStroke = !0,
            this.finishPoly()),
            this;
        }
        setMatrix(e) {
            return this._matrix = e,
            this;
        }
        beginHole() {
            return this.finishPoly(),
            this._holeMode = !0,
            this;
        }
        endHole() {
            return this.finishPoly(),
            this._holeMode = !1,
            this;
        }
        destroy(e) {
            this._geometry.refCount--,
            this._geometry.refCount === 0 && this._geometry.dispose(),
            this._matrix = null,
            this.currentPath = null,
            this._lineStyle.destroy(),
            this._lineStyle = null,
            this._fillStyle.destroy(),
            this._fillStyle = null,
            this._geometry = null,
            this.shader = null,
            this.vertexData = null,
            this.batches.length = 0,
            this.batches = null,
            super.destroy(e);
        }
    }
;
let Me = ns;
Me.curves = _e;
Me._TEMP_POINT = new W;
const ui = class {
    constructor(e) {
        this.stage = new Lt,
        e = Object.assign({
            forceCanvas: !1
        }, e),
        this.renderer = wh(e),
        ui._plugins.forEach(t => {
            t.init.call(this, e);
        });
    }
    render() {
        this.renderer.render(this.stage);
    }
    get view() {
        return this.renderer.view;
    }
    get screen() {
        return this.renderer.screen;
    }
    destroy(e, t) {
        const s = ui._plugins.slice(0);
        s.reverse(),
        s.forEach(i => {
            i.destroy.call(this);
        }),
        this.stage.destroy(t),
        this.stage = null,
        this.renderer.destroy(e),
        this.renderer = null;
    }
}
;
let Ti = ui;
Ti._plugins = [];
D.handleByList(P.Application, Ti._plugins);
class cn {
    static init(t) {
        Object.defineProperty(this, "resizeTo", {
            set(s) {
                globalThis.removeEventListener("resize", this.queueResize),
                this._resizeTo = s,
                s && (globalThis.addEventListener("resize", this.queueResize),
                this.resize());
            },
            get() {
                return this._resizeTo;
            }
        }),
        this.queueResize = () => {
            this._resizeTo && (this.cancelResize(),
            this._resizeId = requestAnimationFrame( () => this.resize()));
        }
        ,
        this.cancelResize = () => {
            this._resizeId && (cancelAnimationFrame(this._resizeId),
            this._resizeId = null);
        }
        ,
        this.resize = () => {
            if (!this._resizeTo)
                return;
            this.cancelResize();
            let s, i;
            if (this._resizeTo === globalThis.window)
                s = globalThis.innerWidth,
                i = globalThis.innerHeight;
            else {
                const {clientWidth: r, clientHeight: n} = this._resizeTo;
                s = r,
                i = n;
            }
            this.renderer.resize(s, i),
            this.render();
        }
        ,
        this._resizeId = null,
        this._resizeTo = null,
        this.resizeTo = t.resizeTo || null;
    }
    static destroy() {
        globalThis.removeEventListener("resize", this.queueResize),
        this.cancelResize(),
        this.cancelResize = null,
        this.queueResize = null,
        this.resizeTo = null,
        this.resize = null;
    }
}
cn.extension = P.Application;
D.add(cn);
class zh {
    constructor(t, s) {
        let {height: i, width: r} = t.getBoundingClientRect();
        this.app = new Ti({
            width: r,
            height: i,
            view: t,
            powerPreference: "low-power",
            backgroundAlpha: 0
        });
        const n = new Me;
        n.beginFill(16777215),
        n.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height),
        n.endFill(),
        this.app.stage.addChild(n),
        this.reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)"),
        this.app.ticker.maxFPS = 15,
        this.initAnimation(),
        this.updateArtwork(s);
    }
    updateArtwork(t) {
        if (this.app && t) {
            N.removeFromCache(t);
            const s = N.from(t)
                , i = [];
            for (let h = 0; h < 4; h++) {
                const a = new Ot(s);
                a.alpha = 0,
                i.push(a);
            }
            this.container.children.length > 4 && this.container.removeChildren(4),
            this.addSpritesToContainer.apply(this, i);
            const r = this.container.children.slice(0, 4);
            let n = 1
                , o = r.map(h => h.rotation);
            this.app.ticker.add( () => {
                let h = this.app.ticker.deltaMS / 33.333333;
                n -= .02 * h,
                n < 0 && this.container.removeChild(...r),
                r.forEach(a => {
                    a.alpha = n;
                }),
                i.forEach(a => {
                    a.alpha = 1 - n;
                }),
                this.reduceMotionQuery.matches ? (o[0] += .001 * h,
                o[1] += .001 * h,
                o[2] += .001 * h,
                o[3] += .001 * h) : (o[0] += .003 * h,
                o[1] -= .008 * h,
                o[2] -= .006 * h,
                o[3] += .004 * h),
                i[0] && (i[0].rotation = o[0]),
                i[1] && (i[1].rotation = o[1]),
                i[2] && (i[2].rotation = -o[2],
                i[2].x = this.app.screen.width / 2 + this.app.screen.width / 4 * Math.cos(o[2] * .75),
                i[2].y = this.app.screen.height / 2 + this.app.screen.width / 4 * Math.sin(o[2] * .75)),
                i[3] && (i[3].rotation = -o[3],
                i[3].x = this.app.screen.width / 2 + this.app.screen.width / 2 * .1 + this.app.screen.width / 4 * Math.cos(o[3] * .75),
                i[3].y = this.app.screen.height / 2 + this.app.screen.width / 2 * .1 + this.app.screen.width / 4 * Math.sin(o[3] * .75));
            });
        }
    }
    addSpritesToContainer(t, s, i, r) {
        t.anchor.set(.5, .5),
        s.anchor.set(.5, .5),
        i.anchor.set(.5, .5),
        r.anchor.set(.5, .5),
        t.position.set(this.app.screen.width / 2, this.app.screen.height / 2),
        s.position.set(this.app.screen.width / 2.5, this.app.screen.height / 2.5),
        i.position.set(this.app.screen.width / 2, this.app.screen.height / 2),
        r.position.set(this.app.screen.width / 2, this.app.screen.height / 2),
        t.width = this.app.screen.width * 1.25,
        t.height = t.width,
        s.width = this.app.screen.width * .8,
        s.height = s.width,
        i.width = this.app.screen.width * .5,
        i.height = i.width,
        r.width = this.app.screen.width * .25,
        r.height = r.width,
        this.container.addChild(t, s, i, r);
    }
    initAnimation() {
        this.container = new Lt,
        this.app.stage.addChild(this.container);
        const t = new Ot
            , s = new Ot
            , i = new Ot
            , r = new Ot;
        this.addSpritesToContainer(t, s, i, r);
        const n = new Ee
            , o = new Ee
            , h = new Ee
            , a = new Ee
            , l = new Ee;
        n.blur = 5,
        o.blur = 10,
        h.blur = 20,
        a.blur = 40,
        l.blur = 80,
        n.quality = 1,
        o.quality = 1,
        h.quality = 2,
        a.quality = 2,
        l.quality = 2;
        const u = new hn;
        u.angle = -3.25,
        u.radius = 900,
        u.offset.x = this.app.renderer.screen.width / 2,
        u.offset.y = this.app.renderer.screen.height / 2;
        const c = new Oh;
        c.saturation = 2.75,
        c.brightness = .7,
        c.contrast = 1.9,
        this.container.filters = [u, n, o, h, a, l, c];
        const d = new Ot;
        d.width = this.app.screen.width,
        d.height = this.app.screen.height;
        const p = new Me;
        p.beginFill(0, .5),
        p.drawRect(0, 0, this.app.screen.width, this.app.screen.height),
        p.endFill(),
        d.addChild(p),
        this.app.stage.addChild(d);
        const f = new Ot;
        f.width = this.app.screen.width,
        f.height = this.app.screen.height;
        const _ = new Me;
        _.beginFill(16777215, .05),
        _.drawRect(0, 0, this.app.screen.width, this.app.screen.height),
        _.endFill(),
        d.addChild(_),
        this.app.stage.addChild(f);
    }
    destroy() {
        this.app && this.app.destroy(!0, {
            children: !0,
            texture: !0,
            baseTexture: !0
        });
    }
}
export { zh as LyricsScene };

