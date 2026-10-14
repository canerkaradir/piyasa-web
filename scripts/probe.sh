curl -sS -m 30 "https://ts-api.cnbc.com/harmony/app/bars/XAU%3D/1D/20231225000000/20260130000000/adjusted/EST5EDT.json" > /tmp/x.json
python3 - <<'P'
import json
j=json.load(open('/tmp/x.json'))
out=[]
for b in j['barData']['priceBars']:
    o,h,l,c=b.get('open'),b.get('high'),b.get('low'),b.get('close')
    if o==h==l==c: continue
    out.append((b['tradeTime'][:8], c))
print(len(out)); print(out[0], out[-1])
print("DATA", json.dumps(out))
P
