for ua in "Piyasa Pusulasi veri-botu@users.noreply.github.com" "Piyasa Pusulasi piyasa-web@github.io"; do
  echo "== [$ua]"; curl -sS -A "$ua" -m 20 -o /tmp/x -w "%{http_code}\n" "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&owner=include&count=10&output=atom"
done
