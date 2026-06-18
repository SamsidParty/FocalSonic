"""
tkinter PIN dialog. Run as its own process (see pairing.ask_pin) so tkinter gets
a real process main thread — running it on a worker thread of the asyncio host
process is unreliable. In production the pairing flow relaunches the compiled exe
with ``--pin-dialog "Device Name"`` (airplay.main dispatches here).

``run_dialog`` writes the entered PIN to stdout and returns 0, or returns 1 if the
dialog was cancelled.
"""

import sys


def run_dialog(device_name: str = "AirPlay device") -> int:
    import tkinter as tk
    from tkinter import ttk

    result = {"pin": None}

    root = tk.Tk()
    root.title("AirPlay Pairing")
    root.resizable(False, False)
    root.attributes("-topmost", True)

    frame = ttk.Frame(root, padding=20)
    frame.grid()

    ttk.Label(
        frame,
        text=f"Enter the code shown on\n“{device_name}”",
        justify="center",
    ).grid(column=0, row=0, pady=(0, 12))

    pin_var = tk.StringVar()
    entry = ttk.Entry(frame, textvariable=pin_var, justify="center", font=("Segoe UI", 18), width=8)
    entry.grid(column=0, row=1, pady=(0, 12))
    entry.focus_force()

    def submit(*_):
        value = pin_var.get().strip()
        if value:
            result["pin"] = value
            root.destroy()

    def cancel(*_):
        result["pin"] = None
        root.destroy()

    buttons = ttk.Frame(frame)
    buttons.grid(column=0, row=2)
    ttk.Button(buttons, text="Cancel", command=cancel).grid(column=0, row=0, padx=4)
    ttk.Button(buttons, text="Pair", command=submit).grid(column=1, row=0, padx=4)

    root.bind("<Return>", submit)
    root.bind("<Escape>", cancel)
    root.protocol("WM_DELETE_WINDOW", cancel)

    # Centre on screen and force to the foreground.
    root.update_idletasks()
    w, h = root.winfo_width(), root.winfo_height()
    x = (root.winfo_screenwidth() - w) // 2
    y = (root.winfo_screenheight() - h) // 3
    root.geometry(f"+{x}+{y}")
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
