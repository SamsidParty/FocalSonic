"""
tkinter PIN dialog. Run as its own process (see pairing.ask_pin) so tkinter gets
a real process main thread — running it on a worker thread of the asyncio host
process is unreliable. In production the pairing flow relaunches the compiled exe
with ``--pin-dialog "Device Name"`` (airplay.main dispatches here).

``run_dialog`` writes the entered PIN to stdout and returns 0, or returns 1 if the
dialog was cancelled.

Runs on Windows and Linux; the palette follows the desktop's light/dark setting on
both, and the fonts are resolved against what's actually installed.
"""

import os
import shutil
import sys


# Colour palettes. The dialog follows the Windows apps theme (see _is_dark_mode);
# both are tuned to sit nicely behind the (blue/violet) app logo.
_LIGHT = {
    "bg": "#ffffff",
    "heading": "#1c1c1e",
    "subtitle": "#6e6e73",
    "entry_bg": "#ffffff",
    "entry_fg": "#1c1c1e",
    "entry_border": "#d1d1d6",
    "accent": "#5b6ef5",
    "accent_active": "#4a5ce0",
    "accent_fg": "#ffffff",
    "cancel_bg": "#ececf0",
    "cancel_active": "#e0e0e6",
    "cancel_fg": "#1c1c1e",
}
_DARK = {
    "bg": "#202022",
    "heading": "#f5f5f7",
    "subtitle": "#9a9aa0",
    "entry_bg": "#2c2c2e",
    "entry_fg": "#f5f5f7",
    "entry_border": "#3a3a3c",
    "accent": "#6d7cf7",
    "accent_active": "#7d8bff",
    "accent_fg": "#ffffff",
    "cancel_bg": "#3a3a3c",
    "cancel_active": "#48484a",
    "cancel_fg": "#f5f5f7",
}


def _is_dark_mode() -> bool:
    """True if the desktop is in dark mode. Best-effort; False when unknown."""
    if sys.platform == "win32":
        return _is_dark_mode_windows()
    if sys.platform.startswith("linux"):
        return _is_dark_mode_linux()
    return False


def _is_dark_mode_windows() -> bool:
    try:
        import winreg

        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize",
        ) as key:
            return winreg.QueryValueEx(key, "AppsUseLightTheme")[0] == 0
    except Exception:
        return False


def _is_dark_mode_linux() -> bool:
    """Linux has no single dark-mode switch, so try the common ones in turn:
    the XDG desktop portal (works across desktops), GNOME's gsettings, KDE's
    window colour, then the GTK_THEME override."""
    for probe in (_dark_from_portal, _dark_from_gsettings, _dark_from_kdeglobals,
                  _dark_from_gtk_env):
        try:
            result = probe()
        except Exception:
            continue
        if result is not None:
            return result
    return False


def _dark_from_portal():
    """org.freedesktop.appearance color-scheme: 1 = prefer dark, 2 = prefer light."""
    import subprocess

    if shutil.which("gdbus") is None:
        return None
    done = subprocess.run(
        ["gdbus", "call", "--session", "--dest", "org.freedesktop.portal.Desktop",
         "--object-path", "/org/freedesktop/portal/desktop",
         "--method", "org.freedesktop.portal.Settings.Read",
         "org.freedesktop.appearance", "color-scheme"],
        capture_output=True, timeout=3, check=False,
    )
    if done.returncode != 0:
        return None
    out = done.stdout.decode("utf-8", "replace")
    if "uint32 1" in out:
        return True
    if "uint32 2" in out:
        return False
    return None


def _dark_from_gsettings():
    import subprocess

    if shutil.which("gsettings") is None:
        return None
    done = subprocess.run(
        ["gsettings", "get", "org.gnome.desktop.interface", "color-scheme"],
        capture_output=True, timeout=3, check=False,
    )
    if done.returncode != 0:
        return None
    value = done.stdout.decode("utf-8", "replace").strip().strip("'").lower()
    if not value or value == "default":
        return None
    return "dark" in value


def _dark_from_kdeglobals():
    """Plasma writes the active palette into kdeglobals; judge by how bright the
    normal window background is rather than by trusting the scheme's name."""
    config = os.environ.get("XDG_CONFIG_HOME") or os.path.join(
        os.path.expanduser("~"), ".config")
    path = os.path.join(config, "kdeglobals")
    if not os.path.isfile(path):
        return None

    section = ""
    with open(path, "r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            line = line.strip()
            if line.startswith("[") and line.endswith("]"):
                section = line[1:-1]
            elif section == "Colors:Window" and line.startswith("BackgroundNormal="):
                parts = line.split("=", 1)[1].split(",")
                if len(parts) < 3:
                    return None
                r, g, b = (int(p) for p in parts[:3])
                # Rec. 601 luma; below mid-grey means a dark palette.
                return (0.299 * r + 0.587 * g + 0.114 * b) < 128
    return None


def _dark_from_gtk_env():
    theme = os.environ.get("GTK_THEME", "").lower()
    if not theme:
        return None
    return "dark" in theme


def _apply_dark_titlebar(root) -> None:
    """Paint the native (OS-drawn) title bar dark on Windows 10/11; no-op elsewhere.

    Without this the caption stays white while the body is dark, which looks broken.
    Must be applied before the window is first shown (we build it withdrawn).
    """
    try:
        from ctypes import windll, byref, sizeof, c_int

        hwnd = windll.user32.GetParent(root.winfo_id())
        # DWMWA_USE_IMMERSIVE_DARK_MODE is 20 on Windows builds >= 1903, 19 before.
        for attr in (20, 19):
            windll.dwmapi.DwmSetWindowAttribute(hwnd, attr, byref(c_int(1)), sizeof(c_int))
    except Exception:
        pass


# The Segoe UI stack only exists on Windows; on Linux we pick whichever of the
# common desktop UI faces is actually installed.
_LINUX_UI_FAMILIES = ("Inter", "Cantarell", "Noto Sans", "Ubuntu", "Roboto",
                      "DejaVu Sans", "Liberation Sans")


def _resolve_fonts(root):
    """Font specs for the dialog, resolved against the installed families.

    Falling through to Tk's own default family (rather than naming a font that
    isn't there) is what keeps the dialog looking deliberate on Linux instead of
    dropping to Tk's ancient bitmap fallback.
    """
    import tkinter.font as tkfont

    try:
        available = {name.lower() for name in tkfont.families(root)}
    except Exception:
        available = set()
    try:
        fallback = tkfont.nametofont("TkDefaultFont").actual("family")
    except Exception:
        fallback = "Helvetica"

    def pick(candidates):
        for name in candidates:
            if name.lower() in available:
                return name
        return fallback

    if sys.platform == "win32":
        body = pick(("Segoe UI",))
        # Semibold is its own family on Windows, not a weight of Segoe UI.
        heading = (pick(("Segoe UI Semibold", "Segoe UI")), 16)
    else:
        body = pick(_LINUX_UI_FAMILIES)
        heading = (body, 16, "bold")

    return {
        "heading": heading,
        "subtitle": (body, 10),
        "entry": (body, 24),
        "button": (body, 11),
    }


def _load_icon(tk):
    """Load ``favicon.png`` shipped next to this program as (icon, logo): the
    window icon (which replaces tkinter's default feather) plus a copy downscaled
    for the dialog body. Returns (None, None) if it can't be loaded.

    The file sits beside the executable in production (build-airplay.bat copies it
    there) and beside the scripts when running from source; ``sys.argv[0]`` points
    at the real program in both the Nuitka onefile and source cases.
    """
    path = os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), "favicon.png")
    try:
        icon = tk.PhotoImage(file=path)
        logo = icon.subsample(max(1, round(icon.width() / 72)))  # -> ~72px for the body
        return icon, logo
    except Exception:
        return None, None


def run_dialog(device_name: str = "AirPlay device") -> int:
    import tkinter as tk

    dark = _is_dark_mode()
    c = _DARK if dark else _LIGHT
    result = {"pin": None}

    # Build withdrawn so the icon and dark title bar are set before first paint.
    root = tk.Tk()
    root.withdraw()
    root.title("AirPlay Pairing")
    root.resizable(False, False)
    root.configure(bg=c["bg"])
    root.attributes("-topmost", True)

    fonts = _resolve_fonts(root)

    icon, logo = _load_icon(tk)
    if icon is not None:
        try:
            root.iconphoto(True, icon)
        except Exception:
            pass
    root._icon_refs = (icon, logo)  # keep a reference so Tk doesn't GC them

    if dark:
        _apply_dark_titlebar(root)

    def submit(*_):
        value = pin_var.get().strip()
        if value:
            result["pin"] = value
            root.destroy()

    def cancel(*_):
        result["pin"] = None
        root.destroy()

    # Let the frame fill the (deliberately wider-than-natural) window so its
    # contents stay centred — see the geometry calc at the end.
    root.columnconfigure(0, weight=1)
    root.rowconfigure(0, weight=1)

    frame = tk.Frame(root, bg=c["bg"], padx=44, pady=26)
    frame.grid(sticky="nsew")
    frame.columnconfigure(0, weight=1)

    grid_row = 0
    if logo is not None:
        tk.Label(frame, image=logo, bg=c["bg"]).grid(column=0, row=grid_row, pady=(0, 10))
        grid_row += 1

    tk.Label(
        frame,
        text="AirPlay Pairing",
        bg=c["bg"],
        fg=c["heading"],
        font=fonts["heading"],
    ).grid(column=0, row=grid_row, pady=(0, 4))
    grid_row += 1

    tk.Label(
        frame,
        text=f"Enter the code shown on “{device_name}”",
        bg=c["bg"],
        fg=c["subtitle"],
        font=fonts["subtitle"],
        justify="center",
        wraplength=300,
    ).grid(column=0, row=grid_row, pady=(0, 18))
    grid_row += 1

    pin_var = tk.StringVar()
    entry = tk.Entry(
        frame,
        textvariable=pin_var,
        justify="center",
        font=fonts["entry"],
        bg=c["entry_bg"],
        fg=c["entry_fg"],
        insertbackground=c["entry_fg"],
        relief="flat",
        highlightthickness=2,
        highlightbackground=c["entry_border"],
        highlightcolor=c["accent"],
    )
    entry.grid(column=0, row=grid_row, pady=(0, 20), ipady=7, sticky="ew")
    entry.focus_force()
    grid_row += 1

    def make_button(text, command, bg, active, fg):
        button = tk.Button(
            buttons,
            text=text,
            command=command,
            bg=bg,
            fg=fg,
            activebackground=active,
            activeforeground=fg,
            relief="flat",
            bd=0,
            highlightthickness=0,
            font=fonts["button"],
            pady=9,
            cursor="hand2",
        )
        button.bind("<Enter>", lambda _e: button.configure(bg=active))
        button.bind("<Leave>", lambda _e: button.configure(bg=bg))
        return button

    buttons = tk.Frame(frame, bg=c["bg"])
    buttons.grid(column=0, row=grid_row, sticky="ew")
    buttons.columnconfigure(0, weight=1, uniform="b")
    buttons.columnconfigure(1, weight=1, uniform="b")

    make_button("Cancel", cancel, c["cancel_bg"], c["cancel_active"], c["cancel_fg"]).grid(
        column=0, row=0, padx=(0, 6), sticky="ew"
    )
    make_button("Pair", submit, c["accent"], c["accent_active"], c["accent_fg"]).grid(
        column=1, row=0, padx=(6, 0), sticky="ew"
    )

    root.bind("<Return>", submit)
    root.bind("<Escape>", cancel)
    root.protocol("WM_DELETE_WINDOW", cancel)

    # Force a comfortable landscape-ish width (the natural width is just the
    # widest child, which makes for a cramped, too-tall column), keep the natural
    # height, then centre on screen.
    root.update_idletasks()
    w = max(root.winfo_reqwidth(), 400)
    h = root.winfo_reqheight()
    x = (root.winfo_screenwidth() - w) // 2
    y = (root.winfo_screenheight() - h) // 3
    root.geometry(f"{w}x{h}+{x}+{y}")
    root.deiconify()
    root.lift()
    root.after(100, lambda: root.attributes("-topmost", True))

    root.mainloop()

    if result["pin"]:
        if sys.stdout is not None:
            sys.stdout.write(result["pin"])
            sys.stdout.flush()
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(run_dialog(sys.argv[1] if len(sys.argv) > 1 else "AirPlay device"))
