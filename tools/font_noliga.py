"""Pixelify Sans: unhook the 'liga'/'dlig'/'clig' GSUB features so canvas text never ligates "fi"/"fl"/"ffl".
The variable font's ligature glyphs render as a broken 'A' in Phaser text (e.g. "first" -> "Arst"). Idempotent.
Usage: python3 tools/font_noliga.py"""
import os
from fontTools.ttLib import TTFont
P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public/assets/fonts/PixelifySans.ttf')
f = TTFont(P); g = f['GSUB'].table
drop = {i for i, fr in enumerate(g.FeatureList.FeatureRecord) if fr.FeatureTag in ('liga', 'dlig', 'clig')}
for s in g.ScriptList.ScriptRecord:
    for L in [s.Script.DefaultLangSys] + [l.LangSys for l in s.Script.LangSysRecord]:
        if L is None: continue
        L.FeatureIndex = [i for i in L.FeatureIndex if i not in drop]; L.FeatureCount = len(L.FeatureIndex)
        if L.ReqFeatureIndex in drop: L.ReqFeatureIndex = 0xFFFF
f.save(P); print('font_noliga: unhooked features', sorted(drop))
