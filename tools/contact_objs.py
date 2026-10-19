import sys; sys.path.insert(0,'/workspace/lantern-night/tools')
from objdefs import OBJS
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
ROOT="/workspace/lantern-night/_dl/pack/Ninja Adventure - Asset Pack/"
def extract(sheet,box):
    im=Image.open(ROOT+sheet).convert("RGBA")
    x0,y0,x1,y1=box; x1=min(x1,im.width); y1=min(y1,im.height)
    sub=np.array(im.crop((x0,y0,x1,y1)))
    a=sub[:,:,3]>0
    lab,n=ndi.label(a)
    if n==0: return None
    # keep components that are bigger than 6px (to retain pieces like separated bits), but drop those touching clip edge if tiny
    sizes=ndi.sum(a,lab,range(1,n+1))
    keep=np.zeros_like(a)
    for i,s in enumerate(sizes):
        if s>=max(6,0.25*sizes.max()): keep|=(lab==i+1)
    ys,xs=np.where(keep)
    out=sub.copy(); out[~keep]=0
    return Image.fromarray(out).crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
if __name__=="__main__":
    names=list(OBJS)
    ims=[(n,extract(*OBJS[n])) for n in names]
    W=1000; x=y=0; rowh=0; sc=2
    sheet=Image.new("RGBA",(W,1400),(70,70,90,255)); d=ImageDraw.Draw(sheet)
    for n,im in ims:
        if im is None: print("EMPTY",n); continue
        w,h=im.width*sc,im.height*sc
        if x+max(w,70)>W: x=0; y+=rowh+14; rowh=0
        sheet.alpha_composite(im.resize((w,h),Image.NEAREST),(x,y+10))
        d.text((x,y),n[:14],fill=(255,255,0,255)); x+=max(w,70)+6; rowh=max(rowh,h+10)
    sheet.crop((0,0,W,y+rowh+16)).save("/workspace/lantern-night/_dl/view/objs3.png")
