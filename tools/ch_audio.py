"""Chapter music (lazy-loaded at runtime, see Audio.bgm LAZY): encodes extra Ninja Adventure tracks (CC0) without rebuilding all assets."""
import os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = os.path.join(os.environ.get("LN_DL", os.path.join(ROOT, "_dl")), "pack/Ninja Adventure - Asset Pack/Audio/Musics") + "/"
O = os.path.join(ROOT, "public/assets/bgm") + "/"
CH = {"forest": "11", "forest_far": "37", "grove": "9", "crossing": "39", "crossing_far": "18", "willow": "16", "willow_far": "14"}
def mus(p): return M + [f for f in sorted(os.listdir(M)) if f.startswith(p + " ")][0]
for k, p in CH.items():
    dst = O + k + ".ogg"
    if os.path.exists(dst) and '--force' not in sys.argv: continue
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mus(p), "-c:a", "libvorbis", "-b:a", "64k", "-ac", "1", dst], check=True)
print('chapter bgm:', sorted(CH))
