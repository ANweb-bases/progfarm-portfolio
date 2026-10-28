from PIL import Image, ImageDraw
def icon(path, bg, fg, kind):
    S=256; im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle((8,8,248,248),radius=56,fill=bg)
    if kind=='check':
        d.line((70,132,112,174,188,84),fill=fg,width=26,joint='curve')
    elif kind=='clip':
        d.rounded_rectangle((70,60,186,206),radius=18,outline=fg,width=16); d.rounded_rectangle((100,42,156,78),radius=10,fill=fg)
        d.line((98,118,158,118),fill=fg,width=12); d.line((98,148,158,148),fill=fg,width=12)
    else:
        d.ellipse((60,76,196,200),fill=fg); d.ellipse((100,52,130,82),fill=fg); d.ellipse((156,116,176,136),fill=bg); d.polygon([(70,110),(40,92),(60,134)],fill=fg)
    im.save(path,sizes=[(256,256),(64,64),(48,48),(32,32),(16,16)])
icon('habitflow/app.ico',(22,163,74,255),(255,255,255,255),'check')
icon('clipflow/app.ico',(37,99,235,255),(255,255,255,255),'clip')
icon('kopilka/app.ico',(234,88,12,255),(255,255,255,255),'pig')
