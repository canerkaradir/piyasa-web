curl -sS -m 30 -A "Mozilla/5.0 (Linux; Android 14) Chrome/126 Mobile" "https://ts-api.cnbc.com/harmony/app/bars/TRY%3D/1D/20250305000000/20250317000000/adjusted/EST5EDT.json" | python3 -c "
import json,sys;b=json.load(sys.stdin)['barData']['priceBars']
for x in b: print(x['tradeTime'][:8], x['open'], x['close'], x.get('volume'))"
