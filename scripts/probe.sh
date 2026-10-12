for ua in "PiyasaPusulasi veri-botu@users.noreply.github.com" "Piyasa Pusulasi admin@piyasapusulasi.com" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"; do
 for u in "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&owner=include&count=10&output=atom" "https://efts.sec.gov/LATEST/search-index?forms=4&dateRange=custom" "https://www.sec.gov/Archives/edgar/daily-index/" "https://data.sec.gov/submissions/CIK0001045810.json"; do
  echo "== [$ua] $u"; curl -sS -A "$ua" -m 20 -o /tmp/x -w "%{http_code}\n" "$u"; head -c 150 /tmp/x | tr '\n' ' '; echo
 done
done
