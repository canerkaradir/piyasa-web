B="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
C='["name","total_revenue_fq_h","net_income_fq_h","earnings_per_share_diluted_fq_h","free_cash_flow_fq_h","gross_profit_fq_h","total_revenue_fy_h","net_income_fy_h","free_cash_flow_fy_h","fiscal_period_end_fq","fiscal_period_end_fy","earnings_per_share_forecast_fq_h","earnings_per_share_fq_h","revenue_forecast_fq_h","earnings_per_share_forecast_fq","earnings_per_share_fq","revenue_fq","revenue_forecast_fq","earnings_release_date","earnings_release_next_date","earnings_per_share_forecast_next_fq","piotroski_f_score_ttm","altman_z_score_ttm","current_ratio","total_debt","cash_n_short_term_invest_fq","free_cash_flow_ttm","free_cash_flow_margin_ttm","net_margin","total_revenue_yoy_growth_ttm","price_earnings_growth_ttm","price_sales_current","return_on_invested_capital","dividend_payout_ratio_ttm","fundamental_currency_code","earnings_release_fq_h","earnings_release_date_fq_h"]'
for m in "turkey THYAO" "turkey AKBNK" "turkey ASELS" "america AAPL"; do set -- $m
echo "== $2"
curl -sS -A "$B" -m 20 -X POST "https://scanner.tradingview.com/$1/scan" -d "{\"filter\":[{\"left\":\"name\",\"operation\":\"equal\",\"right\":\"$2\"}],\"columns\":$C,\"range\":[0,1]}" | head -c 6000; echo
done
echo $C
