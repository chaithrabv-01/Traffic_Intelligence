"""OCR evidence extraction. Degrades gracefully if EasyOCR is not installed."""
_reader = None
def _get():
    global _reader
    if _reader is None:
        import easyocr
        _reader = easyocr.Reader(["en"], gpu=False)  # add "kn" for Kannada signage
    return _reader

def read_text(frames, min_conf=0.5):
    try: r = _get()
    except Exception as e:
        return [], f"OCR unavailable: {e}"
    seen = {}
    for fr in frames:
        for _, text, conf in r.readtext(fr["path"]):
            t = text.strip()
            if len(t) >= 4 and conf >= min_conf:
                k = t.lower()
                if k not in seen or conf > seen[k]["conf"]:
                    seen[k] = {"text": t, "conf": round(float(conf), 2), "ts": fr["ts"]}
    return list(seen.values()), None
