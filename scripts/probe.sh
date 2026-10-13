B="Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36"
C='["name","earnings_per_share_diluted_fq_h","free_cash_flow_fq_h","net_income_fy_h","gross_profit_fq_h","operating_income_fq_h","cash_f_operating_activities_fq_h","total_shares_outstanding_fy_h","fiscal_period_end_fq_h","fiscal_period_fq_h","earnings_release_date","earnings_release_fq_h","fiscal_period_end_fq","total_debt_fq_h","cash_n_short_term_invest_fq_h","gross_margin_fy_h","net_margin_fy_h","earnings_per_share_diluted_fy_h","total_assets","total_liabilities_fq","total_equity_fq","fiscal_period_end_fy_h","revenue_per_share_ttm","research_and_dev_ratio_ttm","free_cash_flow_fy","diluted_shares_outstanding_fq_h","net_margin_fq_h","operating_margin_fq_h","total_revenue_yoy_growth_fy","number_of_employees","sector","industry","country","fundamental_currency_code"]'
for s in AAPL IONQ; do
curl -sS -A "$B" -m 20 -X POST "https://scanner.tradingview.com/america/scan" -d "{\"filter\":[{\"left\":\"name\",\"operation\":\"equal\",\"right\":\"$s\"}],\"columns\":$C,\"range\":[0,1]}" | head -c 5000; echo
done
echo $C
