UA="Mozilla/5.0 (Linux; Android 14) Chrome/126 Mobile"
for spec in "XAU%3D/1D/19800101000000/19801231000000" "XAU%3D/1W/19800101000000/19801231000000" "XAU%3D/1W/19600101000000/20261114000000" ".SPX/1D/19800101000000/19801231000000" "XAU%3D/1D/20150101000000/20261114000000"; do
  echo "== $spec"
  curl -sS -m 40 -A "$UA" "https://ts-api.cnbc.com/harmony/app/bars/$spec/adjusted/EST5EDT.json" | python3 -c "
import json,sys
try:
  b=json.load(sys.stdin)['barData']['priceBars']; print(len(b), b[0]['tradeTime'][:8] if b else '-', b[-1]['tradeTime'][:8] if b else '-')
except Exception as e: print('ERR',e)"
done
