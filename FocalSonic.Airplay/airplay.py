#!/usr/bin/env python
"""
Thin launcher so the host can spawn `python airplay.py …` without needing the
package on PYTHONPATH. Equivalent to `python -m focalsonic_airplay`.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from focalsonic_airplay.__main__ import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main())
