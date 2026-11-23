from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
def make_pdf(video, path):
    an = video.analysis or {}; c = canvas.Canvas(str(path), pagesize=A4); y = 800
    def line(t, dy=16):
        nonlocal y; c.drawString(50, y, t[:95]); y -= dy
    c.setFont("Helvetica-Bold", 14); line(f"Traffic Analysis Report - Video {video.id}", 24); c.setFont("Helvetica", 10)
    line(f"File: {video.filename}"); line(f"Location: {video.loc_label or 'UNKNOWN (unconfirmed)'}  [{video.location_status}]", 22)
    line(f"Unique vehicles: {an.get('total_unique_vehicles')}"); line(f"By class: {an.get('counts')}")
    line(f"Density: {an.get('density')}", 22)
    line("Predicted risk events (NOT confirmed accidents):")
    for r in an.get("risk", [])[:20]: line(f" t={r['ts']}s ids={r['vehicle_ids']} {r['level']} TTC={r['ttc_s']}s")
    line("Note: heuristic, unvalidated risk scores. Verify before action.", 20)
    c.save()
