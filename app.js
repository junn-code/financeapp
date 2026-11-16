(function () {
  const $ = s => document.querySelector(s);
  let state = FinoraStorage.load();
  let page = "overview";
  let filters = { search:"", type:"", account:"", category:"", from:"", to:"" };
  const t = key => (FINORA_I18N[state.settings.language] || FINORA_I18N.en)[key] || key;
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = (n,c=state.settings.currency) => new Intl.NumberFormat(state.settings.language==="zh"?"zh-MY":state.settings.language==="bm"?"ms-MY":"en-MY",{style:"currency",currency:c,minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
  const fmt = n => money(n,state.settings.currency);
  const save = () => { FinoraStorage.save(state); render(); };
  const balances = () => FinoraFinance.accountBalances(state);
  const accountName = id => state.accounts.find(a=>a.id===id)?.name || "—";
  const categoryLabel = value => t("cat_" + String(value||"other").toLowerCase()) || value || "—";
  const typeLabel = value => value==="income"?t("incomeType"):value==="expense"?t("expense"):t("transfer");
  function greeting() {
    const h=new Date().getHours();
    const title=state.settings.language==="zh"?(h<12?"早上好。":h<18?"下午好。":"晚上好。"):(state.settings.language==="bm"?(h<12?"Selamat pagi.":h<18?"Selamat tengah hari.":"Selamat malam."):(h<12?"Good morning.":h<18?"Good afternoon.":"Good evening."));
    $("#greetingTitle").textContent=title;
    $("#todayLabel").textContent=new Intl.DateTimeFormat(state.settings.language==="zh"?"zh-CN":state.settings.language==="bm"?"ms-MY":"en-MY",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date()).toUpperCase();
  }
  function card(title,body,extra=""){return `<section class="card ${extra}"><h3 class="card-title">${title}</h3>${body}</section>`}
  function metric(label,value,sub,icon="◌"){return `<div class="card stat-card"><div class="stat-top"><span class="metric-label">${label}</span><span class="stat-icon">${icon}</span></div><div class="metric-value">${value}</div><div class="metric-foot">${sub||""}</div></div>`}
  function allLedgerRows() {
    const txs=state.transactions.map(x=>({...x,ledgerType:x.type,ledgerId:x.id,accountDisplay:accountName(x.accountId)}));
    const transfers=(state.transfers||[]).map(x=>({...x,ledgerType:"transfer",ledgerId:x.id,description:x.description||"Transfer",amount:x.fromAmount,currency:x.fromCurrency,accountDisplay:`${accountName(x.fromAccountId)} → ${accountName(x.toAccountId)}`}));
    return [...txs,...transfers].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  }
  function transactionRows(rows) {
    if(!rows.length)return `<tr><td colspan="6" class="empty">${t("noTransactions")}</td></tr>`;
    return rows.map(x=>{
      const isTransfer=x.ledgerType==="transfer";
      const amountText=isTransfer?money(x.fromAmount,x.fromCurrency):money(x.amount,x.currency);
      const sign=isTransfer?"↔":x.type==="income"?"+":"−";
      const tone=isTransfer?"transfer-amount":x.type==="income"?"positive":"negative";
      const actions=isTransfer?`<button class="small-action" data-transfer-edit="${esc(x.id)}">${t("edit")}</button><button class="small-action" data-transfer-delete="${esc(x.id)}">×</button>`:`<button class="small-action" data-edit="${esc(x.id)}">${t("edit")}</button><button class="small-action" data-delete="${esc(x.id)}">×</button>`;
      return `<tr><td><strong>${esc(x.description)}</strong><br><span class="metric-foot">${esc(x.date)}</span></td><td><span class="pill ${isTransfer?"transfer-pill":""}">${esc(typeLabel(x.ledgerType))}</span></td><td>${isTransfer?"—":esc(categoryLabel(x.category))}</td><td>${esc(x.accountDisplay)}</td><td class="amount ${tone}">${sign}${amountText}</td><td><div class="row-actions">${actions}</div></td></tr>`;
    }).join("");
  }
  function table(rows) {return `<div class="table-wrap"><table><thead><tr><th>${t("transaction")}</th><th>${t("typeLabel")}</th><th>${t("categoryLabel")}</th><th>${t("accountLabel")}</th><th class="amount">${t("amount")}</th><th>${t("actions")}</th></tr></thead><tbody>${transactionRows(rows)}</tbody></table></div>`;}
  function overview() {
    const range=FinoraFinance.monthRange(), flow=FinoraFinance.incomeExpense(state,range.start,range.end,state.settings.currency), totals=FinoraFinance.totals(state,state.settings.currency), bal=balances();
    const recent=allLedgerRows().slice(0,5);
    const cat={};state.transactions.filter(x=>x.type==="expense"&&x.status!=="void").forEach(x=>cat[x.category]=(cat[x.category]||0)+FinoraFinance.convert(state,x.amount,x.currency,state.settings.currency));
    const categoryRows=Object.entries(cat).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([label,value])=>({label:categoryLabel(label),value}));
    const accounts=state.accounts.map(a=>`<div class="account-row"><span class="account-icon">${a.type==="Cash"?"💵":a.type==="E-wallet"?"📱":"▤"}</span><div class="account-meta"><strong>${esc(a.name)}</strong><small>${esc(a.type)} · ${a.currency}</small></div><span class="account-balance">${money(bal[a.id],a.currency)}</span></div>`).join("");
    return `<div class="grid hero-grid">
      <section class="card net-card"><div class="metric-label">${t("netWorth")}</div><div class="metric-value">${fmt(totals.netWorth)}</div><div class="metric-foot">${t("netWorthSub")} · ${t("demoNotice")}</div>${FinoraCharts.sparkline([62,65,63,68,67,72,74,73,79,82,84,88])}</section>
      <div class="grid"><div class="grid two-col">${metric(t("totalAssets"),fmt(totals.totalAssets),t("financialSnapshot"),"◈")}${metric(t("totalLiabilities"),fmt(totals.liabilities),t("accountActivity"),"◇")}</div><div class="grid two-col">${metric(t("income"),fmt(flow.income),t("thisMonth"),"↗")}${metric(t("expenses"),fmt(flow.expenses),t("thisMonth"),"↘")}</div></div>
    </div>
    <div class="section-head"><div><h2>${t("financialSnapshot")}</h2><p>${t("thisMonth")} · ${t("demoNotice")}</p></div></div>
    <div class="grid two-col">
      ${card(t("cashFlow"),`<div class="grid two-col">${metric(t("monthlyIncome"),fmt(flow.income),"","↗")}${metric(t("monthlyExpenses"),fmt(flow.expenses),"","↘")}</div><div class="metric-foot">${t("cashFlow")}: <strong class="${flow.income-flow.expenses>=0?"positive":"negative"}">${fmt(flow.income-flow.expenses)}</strong></div>`)}
      ${card(t("assetAllocation"),`<div class="donut-wrap"><div class="donut"></div><div class="legend"><span><i class="dot"></i>${t("accountsOverview")}: ${fmt(totals.cash)}</span><span><i class="dot" style="background:#a8bacb"></i>${t("investments")||"Investments"}: ${fmt(totals.investments)}</span><span><i class="dot" style="background:#d4dce4"></i>${t("assetsBreakdown")}: ${fmt(totals.otherAssets)}</span></div></div>`)}
    </div>
    <div class="section-head"><div><h2>${t("recentTransactions")}</h2><p>${t("demoNotice")}</p></div><button class="secondary-button" data-goto="transactions">${t("viewAll")}</button></div>
    ${card(t("recentTransactions"),table(recent))}
    <div class="section-head"><div><h2>${t("accountsOverview")}</h2></div><button class="secondary-button" data-goto="accounts">${t("viewAll")}</button></div>
    ${card(t("accountsOverview"),accounts)}
    <div class="section-head"><div><h2>${t("expenses")}</h2></div></div>${card(t("assetAllocation"),FinoraCharts.bars(categoryRows,fmt))}`;
  }
  function transactionsPage() {
    const all=allLedgerRows();
    const rows=all.filter(x=>{
      const isTransfer=x.ledgerType==="transfer";
      const hay=[x.description,x.category,x.ledgerType,x.accountDisplay].join(" ").toLowerCase();
      return (!filters.search||hay.includes(filters.search.toLowerCase()))&&(!filters.type||x.ledgerType===filters.type)&&(!filters.account||(isTransfer?(x.fromAccountId===filters.account||x.toAccountId===filters.account):x.accountId===filters.account))&&(!filters.category||(x.category===filters.category))&&(!filters.from||x.date>=filters.from)&&(!filters.to||x.date<=filters.to);
    });
    const range=FinoraFinance.monthRange(), flow=FinoraFinance.incomeExpense(state,range.start,range.end,state.settings.currency);
    const categories=[...new Set(state.transactions.map(x=>x.category).filter(Boolean))].sort();
    const accountOptions=state.accounts.map(a=>`<option value="${esc(a.id)}" ${filters.account===a.id?"selected":""}>${esc(a.name)}</option>`).join("");
    return `<div class="section-head"><div><h2>${t("navTransactions")}</h2><p>${all.length} ${t("transactionCount")} · ${t("thisMonth")}</p></div><button class="primary-button" id="pageAddTransaction">＋ ${t("addTransaction")}</button></div>
      <div class="grid three-col ledger-summary">${metric(t("income"),fmt(flow.income),t("thisMonth"),"↗")}${metric(t("expenses"),fmt(flow.expenses),t("thisMonth"),"↘")}${metric(t("netCashFlow"),fmt(flow.income-flow.expenses),t("thisMonth"),"⌁")}</div>
      <section class="card ledger-card"><div class="ledger-toolbar"><input id="txSearch" type="search" placeholder="${t("search")}" value="${esc(filters.search)}"><select id="txFilterType"><option value="">${t("allTypes")}</option><option value="income" ${filters.type==="income"?"selected":""}>${t("incomeType")}</option><option value="expense" ${filters.type==="expense"?"selected":""}>${t("expense")}</option><option value="transfer" ${filters.type==="transfer"?"selected":""}>${t("transfer")}</option></select><select id="txFilterAccount"><option value="">${t("allAccounts")}</option>${accountOptions}</select><select id="txFilterCategory"><option value="">${t("allCategories")}</option>${categories.map(c=>`<option value="${esc(c)}" ${filters.category===c?"selected":""}>${esc(categoryLabel(c))}</option>`).join("")}</select><label class="date-filter"><span>${t("fromDate")}</span><input id="txFrom" type="date" value="${esc(filters.from)}"></label><label class="date-filter"><span>${t("toDate")}</span><input id="txTo" type="date" value="${esc(filters.to)}"></label><button class="secondary-button" id="clearTxFilters">${t("clearFilters")}</button></div>
      <div class="ledger-results"><span>${t("showing")} <strong>${rows.length}</strong> / ${all.length}</span><span>${t("transfersExcluded")}</span></div>${table(rows)}</section>`;
  }
  function accountsPage() {
    const b=balances();
    const month = new Date().toISOString().slice(0,7);
    const accountOptions = state.accounts.map(a=>`<option value="${esc(a.id)}">${esc(a.name)} · ${a.currency}</option>`).join("");
    return `<div class="section-head"><div><h2>${t("navAccounts")}</h2><p>${t("demoNotice")}</p></div></div>
      <div class="grid two-col account-cards">${state.accounts.map(a=>metric(esc(a.name),money(b[a.id],a.currency),`${esc(a.type)} · ${a.currency}`,"▤")).join("")}</div>
      <div class="section-head statement-section-head"><div><h2>${t("statementTitle")}</h2><p>${t("statementDescription")}</p></div></div>
      <section class="card statement-builder">
        <div class="statement-builder-copy"><span class="eyebrow">${t("documentCenter")}</span><h3>${t("generateStatement")}</h3><p>${t("statementHint")}</p></div>
        <div class="statement-controls">
          <label><span>${t("account")}</span><select id="statementAccount">${accountOptions}</select></label>
          <label><span>${t("statementPeriod")}</span><input id="statementMonth" type="month" value="${month}"></label>
          <button class="primary-button" id="generateStatement">⇩ ${t("exportPdfStatement")}</button>
        </div>
      </section>`;
  }

  function statementData(accountId, month) {
    const account = state.accounts.find(a=>a.id===accountId);
    if (!account || !/^\d{4}-\d{2}$/.test(month)) throw new Error("INVALID_STATEMENT");
    const start = `${month}-01`;
    const [year, mon] = month.split("-").map(Number);
    const end = `${month}-${String(new Date(year,mon,0).getDate()).padStart(2,"0")}`;
    let opening = Number(account.openingBalance || 0);
    const rows = [];
    state.transactions.filter(x=>x.status!=="void" && x.accountId===accountId).forEach(x=>{
      if(x.date < start) opening += x.type==="income" ? Number(x.amount) : -Number(x.amount);
      else if(x.date <= end) rows.push({date:x.date,description:x.description,reference:x.id,type:x.type,debit:x.type==="expense"?Number(x.amount):0,credit:x.type==="income"?Number(x.amount):0});
    });
    (state.transfers||[]).forEach(x=>{
      if(x.fromAccountId===accountId){
        if(x.date < start) opening -= Number(x.fromAmount);
        else if(x.date <= end) rows.push({date:x.date,description:x.description||"Transfer out",reference:x.id,type:"transfer",debit:Number(x.fromAmount),credit:0});
      }
      if(x.toAccountId===accountId){
        if(x.date < start) opening += Number(x.toAmount);
        else if(x.date <= end) rows.push({date:x.date,description:x.description||"Transfer in",reference:x.id,type:"transfer",debit:0,credit:Number(x.toAmount)});
      }
    });
    rows.sort((a,b)=>a.date.localeCompare(b.date)||a.reference.localeCompare(b.reference));
    let running = FinoraFinance.round(opening), totalDebit=0, totalCredit=0;
    rows.forEach(r=>{totalDebit+=r.debit;totalCredit+=r.credit;running=FinoraFinance.round(running+r.credit-r.debit);r.balance=running;});
    return {account,start,end,opening:FinoraFinance.round(opening),closing:running,totalDebit:FinoraFinance.round(totalDebit),totalCredit:FinoraFinance.round(totalCredit),rows};
  }

  function printStatement() {
    const accountId=$("#statementAccount")?.value;
    const month=$("#statementMonth")?.value;
    let data;
    try { data=statementData(accountId,month); }
    catch(error) { alert(t("statementInvalid")); return; }
    const lang=state.settings.language;
    const locale=lang==="zh"?"zh-MY":lang==="bm"?"ms-MY":"en-MY";
    const dateFormat=new Intl.DateTimeFormat(locale,{day:"2-digit",month:"short",year:"numeric"});
    const fmtDate=s=>dateFormat.format(new Date(`${s}T12:00:00`));
    const fmtMoney=n=>new Intl.NumberFormat(locale,{style:"currency",currency:data.account.currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
    const period=`${fmtDate(data.start)} – ${fmtDate(data.end)}`;
    const generated=fmtDate(new Date().toISOString().slice(0,10));
    const labels=lang==="zh"?{
      statement:"账户月结单",period:"结单期间",account:"账户",accountType:"账户类型",currency:"账户货币",opening:"期初余额",moneyIn:"总存入",moneyOut:"总支出",closing:"期末余额",date:"日期",description:"交易说明",reference:"参考编号",debit:"支出",credit:"存入",balance:"余额",noRows:"本期间没有交易记录。",generated:"生成日期",notice:"演示文件 — 此文件由 Finora 根据示例数据生成，并非银行或金融机构正式签发。",page:"Finora 账户结单"
    }:lang==="bm"?{
      statement:"Penyata Akaun",period:"Tempoh Penyata",account:"Akaun",accountType:"Jenis Akaun",currency:"Mata Wang Akaun",opening:"Baki Awal",moneyIn:"Jumlah Masuk",moneyOut:"Jumlah Keluar",closing:"Baki Akhir",date:"Tarikh",description:"Butiran Transaksi",reference:"Rujukan",debit:"Debit",credit:"Kredit",balance:"Baki",noRows:"Tiada transaksi dalam tempoh ini.",generated:"Tarikh Dijana",notice:"Dokumen demo — dijana oleh Finora menggunakan data contoh dan bukan dikeluarkan oleh bank atau institusi kewangan.",page:"Penyata Akaun Finora"
    }:{
      statement:"Account Statement",period:"Statement Period",account:"Account",accountType:"Account Type",currency:"Account Currency",opening:"Opening Balance",moneyIn:"Total Credits",moneyOut:"Total Debits",closing:"Closing Balance",date:"Date",description:"Transaction Details",reference:"Reference",debit:"Debit",credit:"Credit",balance:"Balance",noRows:"No transactions were recorded during this period.",generated:"Generated",notice:"DEMO DOCUMENT — Generated by Finora from sample data. This is not an official statement issued by a bank or financial institution.",page:"Finora Account Statement"
    };
    const rows=data.rows.length?data.rows.map(r=>`<tr><td>${esc(fmtDate(r.date))}</td><td><strong>${esc(r.description)}</strong><small>${esc(r.type==="income"?(lang==="zh"?"收入":lang==="bm"?"Pendapatan":"Income"):r.type==="expense"?(lang==="zh"?"支出":lang==="bm"?"Perbelanjaan":"Expense"):(lang==="zh"?"转账":lang==="bm"?"Pindahan":"Transfer"))}</small></td><td class="ref">${esc(r.reference)}</td><td class="num">${r.debit?fmtMoney(r.debit):"—"}</td><td class="num">${r.credit?fmtMoney(r.credit):"—"}</td><td class="num balance">${fmtMoney(r.balance)}</td></tr>`).join(""):`<tr><td colspan="6" class="empty">${labels.noRows}</td></tr>`;
    const w=window.open("","_blank");
    if(!w){alert(t("statementPopupBlocked"));return;}
    w.document.open();
    w.document.write(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${labels.page} - ${esc(data.account.name)} - ${month}</title>
      <style>
      @page{size:A4 portrait;margin:16mm 14mm 17mm}
      *{box-sizing:border-box}body{margin:0;color:#18212b;background:#fff;font:10px/1.45 Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .sheet{max-width:900px;margin:0 auto}.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #24384b;padding:0 0 18px;margin-bottom:22px}
      .brand{font-size:21px;letter-spacing:2px;font-weight:700;color:#263d52}.brand small{display:block;font-size:8px;letter-spacing:2.4px;color:#758393;font-weight:500;margin-top:3px}
      .doc{text-align:right}.doc h1{font-size:19px;letter-spacing:-.3px;margin:0 0 5px;font-weight:600}.doc p{margin:0;color:#667483;font-size:9px}
      .account-line{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:12px;background:#f3f6f8;border:1px solid #e2e8ed;padding:13px 15px;margin-bottom:17px}
      .field span{display:block;color:#73808d;text-transform:uppercase;font-size:7px;letter-spacing:1px;margin-bottom:4px}.field strong{font-size:10px;font-weight:600}
      .summary{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #e1e6eb;margin:0 0 23px}
      .sum{padding:12px 13px;border-right:1px solid #e1e6eb}.sum:last-child{border:0}.sum span{display:block;color:#6d7985;font-size:7px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:7px}.sum strong{font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}
      h2{font-size:10px;letter-spacing:.6px;text-transform:uppercase;margin:0 0 9px;color:#31485d}
      table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}th{text-align:left;background:#eef2f5;color:#566575;font-size:7px;text-transform:uppercase;letter-spacing:.6px;padding:9px 7px;border-top:1px solid #dfe5ea;border-bottom:1px solid #dfe5ea}
      td{padding:9px 7px;border-bottom:1px solid #e8edf1;font-size:8px;vertical-align:top;overflow-wrap:anywhere}td small{display:block;color:#87919b;font-size:7px;margin-top:2px}.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.ref{font-family:monospace;color:#697887;font-size:7px}.balance{font-weight:700}
      th:nth-child(1){width:14%}th:nth-child(2){width:28%}th:nth-child(3){width:16%}th:nth-child(4),th:nth-child(5){width:14%}th:nth-child(6){width:14%}
      .empty{text-align:center;padding:25px;color:#84909c}.foot{display:flex;justify-content:space-between;border-top:1px solid #dfe5ea;margin-top:22px;padding-top:10px;color:#7a8793;font-size:7px}.notice{margin-top:14px;padding:9px 11px;background:#f7f8fa;border-left:3px solid #a5b4c2;color:#697786;font-size:7px}
      @media screen{body{background:#e9edf1;padding:24px}.sheet{background:#fff;padding:22mm 18mm;box-shadow:0 8px 36px #26384a22;min-height:297mm}}
      @media print{body{background:#fff}.sheet{max-width:none}.no-print{display:none}}
      </style></head><body><main class="sheet">
      <header class="top"><div class="brand">finora<small>WEALTH · WITH CLARITY</small></div><div class="doc"><h1>${labels.statement}</h1><p>${labels.period}: ${esc(period)}</p></div></header>
      <section class="account-line"><div class="field"><span>${labels.account}</span><strong>${esc(data.account.name)}</strong></div><div class="field"><span>${labels.accountType}</span><strong>${esc(data.account.type)}</strong></div><div class="field"><span>${labels.currency}</span><strong>${esc(data.account.currency)}</strong></div></section>
      <section class="summary">
      <div class="sum"><span>${labels.opening}</span><strong>${fmtMoney(data.opening)}</strong></div><div class="sum"><span>${labels.moneyIn}</span><strong>${fmtMoney(data.totalCredit)}</strong></div><div class="sum"><span>${labels.moneyOut}</span><strong>${fmtMoney(data.totalDebit)}</strong></div><div class="sum"><span>${labels.closing}</span><strong>${fmtMoney(data.closing)}</strong></div>
      </section>
      <h2>${labels.statement}</h2><table><thead><tr><th>${labels.date}</th><th>${labels.description}</th><th>${labels.reference}</th><th class="num">${labels.debit}</th><th class="num">${labels.credit}</th><th class="num">${labels.balance}</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="notice">${labels.notice}</div><footer class="foot"><span>${labels.page}</span><span>${labels.generated}: ${esc(generated)}</span></footer>
      <div class="no-print" style="text-align:right;margin-top:18px"><button onclick="window.print()" style="border:0;background:#263d52;color:#fff;padding:11px 18px;border-radius:6px;font-weight:600;cursor:pointer">Print / Save as PDF</button></div>
      </main><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350));</script></body></html>`);
    w.document.close();
    w.focus();
  }
  function assetsPage() {
    const total=FinoraFinance.totals(state,state.settings.currency);
    return `<div class="section-head"><div><h2>${t("navAssets")}</h2><p>${t("netWorthSub")}</p></div></div><div class="grid three-col">${metric(t("totalAssets"),fmt(total.totalAssets),"","◈")}${metric(t("totalLiabilities"),fmt(total.liabilities),"","◇")}${metric(t("netWorth"),fmt(total.netWorth),"","✧")}</div><div class="section-head"><div><h2>${t("assetsBreakdown")}</h2></div></div><div class="grid two-col">${card(t("accountsOverview"),`<p>${t("accountBalance")}: <strong>${fmt(total.cash)}</strong></p>`)}${card(t("investmentPortfolio"),`<p>${t("marketValue")}: <strong>${fmt(total.investments)}</strong></p>`)}</div>`;
  }
  function investmentsPage() {
    return `<div class="section-head"><div><h2>${t("navInvestments")}</h2><p>${t("demoNotice")}</p></div></div>${card(t("investmentPortfolio"),`<div class="table-wrap"><table><thead><tr><th>${t("investment")}</th><th>${t("symbol")}</th><th>${t("holdings")}</th><th>${t("costBasis")}</th><th>${t("marketValue")}</th></tr></thead><tbody>${state.investments.map(i=>`<tr><td>${esc(i.name)}</td><td>${esc(i.symbol)}</td><td>${i.units}</td><td>${money(i.averageCost,i.currency)}</td><td class="amount">${money(i.marketValue,i.currency)}</td></tr>`).join("")}</tbody></table></div>`)}`;
  }
  function budgetsPage() {
    const range=FinoraFinance.monthRange(), rows=FinoraFinance.periodTransactions(state,range.start,range.end);
    return `<div class="section-head"><div><h2>${t("navBudgets")}</h2><p>${t("budgetProgress")}</p></div></div>${card(t("budgetProgress"),state.budgets.map(b=>{const spent=rows.filter(x=>x.type==="expense"&&x.category===b.category).reduce((s,x)=>s+FinoraFinance.convert(state,x.amount,x.currency,b.currency),0),pct=b.limit>0?Math.min(100,spent/b.limit*100):0;return `<div class="budget-line"><header><strong>${esc(categoryLabel(b.category))}</strong><span>${money(spent,b.currency)} / ${money(b.limit,b.currency)}</span></header><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><small>${t("remaining")}: ${money(Math.max(0,b.limit-spent),b.currency)}</small></div>`}).join(""))}`;
  }
  function reportsPage() {
    const range=FinoraFinance.monthRange(),flow=FinoraFinance.incomeExpense(state,range.start,range.end,state.settings.currency),total=FinoraFinance.totals(state,state.settings.currency);
    return `<div class="section-head"><div><h2>${t("navReports")}</h2><p>${t("thisMonth")}</p></div></div><div class="grid three-col">${metric(t("income"),fmt(flow.income),"","↗")}${metric(t("expenses"),fmt(flow.expenses),"","↘")}${metric(t("cashFlow"),fmt(flow.income-flow.expenses),"","⌁")}</div><div class="section-head"><div><h2>${t("reportSummary")}</h2></div><button class="secondary-button" id="exportCsv">${t("exportCsv")}</button></div>${card(t("netWorth"),`<div class="metric-value">${fmt(total.netWorth)}</div><p class="metric-foot">${t("demoNotice")}</p>`)}`;
  }
  function render() {
    document.documentElement.lang=state.settings.language;
    document.body.classList.toggle("dark",state.settings.theme==="dark");
    document.querySelectorAll("[data-lang]").forEach(b=>b.classList.toggle("selected",b.dataset.lang===state.settings.language));
    document.querySelectorAll("[data-currency]").forEach(b=>b.classList.toggle("selected",b.dataset.currency===state.settings.currency));
    document.querySelectorAll("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
    document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));
    const greetingEl=$(".greeting");greetingEl.classList.toggle("is-hidden",page!=="overview");if(page==="overview")greeting();
    const views={overview,transactions:transactionsPage,accounts:accountsPage,assets:assetsPage,investments:investmentsPage,budgets:budgetsPage,reports:reportsPage};
    $("#pageContent").innerHTML=views[page]();
    const accountOptions=state.accounts.map(a=>`<option value="${esc(a.id)}">${esc(a.name)} (${a.currency})</option>`).join("");
    $("#txAccount").innerHTML=accountOptions;$("#txToAccount").innerHTML=accountOptions;
    $("#txCurrency").value=state.settings.currency;
  }
  function openDialog(tx, transfer) {
    $("#transactionForm").reset();$("#formError").textContent="";
    $("#editId").value=tx?.id||"";$("#txType").value=transfer?"transfer":(tx?.type||"expense");
    $("#txAmount").value=transfer?(tx?.fromAmount??""):(tx?.amount??"");
    $("#txDescription").value=tx?.description||"";$("#txCategory").value=tx?.category||"Food";
    $("#txAccount").value=transfer?(tx?.fromAccountId||state.accounts[0]?.id):(tx?.accountId||state.accounts[0]?.id);
    $("#txToAccount").value=transfer?(tx?.toAccountId||state.accounts[1]?.id):(state.accounts[1]?.id||state.accounts[0]?.id);
    $("#txDate").value=tx?.date||new Date().toISOString().slice(0,10);
    const selectedAccount=state.accounts.find(a=>a.id===$("#txAccount").value);
    $("#txCurrency").value=tx?.currency||selectedAccount?.currency||state.settings.currency;
    $("#toAccountWrap").classList.toggle("hidden",!transfer&&$("#txType").value!=="transfer");
    $("#transactionDialog").showModal();
  }
  function exportCsv() {
    const rows=[["Date","Description","Type","Category","Account","Amount","Currency"],...allLedgerRows().map(x=>[x.date,x.description,x.ledgerType,x.category||"",x.accountDisplay,x.ledgerType==="transfer"?x.fromAmount:x.amount,x.ledgerType==="transfer"?x.fromCurrency:x.currency])];
    const csv=rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="finora-ledger.csv";a.click();URL.revokeObjectURL(url);
  }
  document.addEventListener("click",e=>{
    const nav=e.target.closest("[data-page]");if(nav){page=nav.dataset.page;render();return;}
    const goto=e.target.closest("[data-goto]");if(goto){page=goto.dataset.goto;render();return;}
    if(e.target.closest("#pageAddTransaction")){openDialog();return;}
    const edit=e.target.closest("[data-edit]");if(edit){const tx=state.transactions.find(x=>x.id===edit.dataset.edit);if(tx)openDialog(tx,false);return;}
    const transferEdit=e.target.closest("[data-transfer-edit]");if(transferEdit){const tx=(state.transfers||[]).find(x=>x.id===transferEdit.dataset.transferEdit);if(tx)openDialog(tx,true);return;}
    const del=e.target.closest("[data-delete]");if(del){if(confirm(t("confirmDelete"))){FinoraFinance.deleteTransaction(state,del.dataset.delete);save();}return;}
    const transferDel=e.target.closest("[data-transfer-delete]");if(transferDel){if(confirm(t("confirmDelete"))){FinoraFinance.deleteTransfer(state,transferDel.dataset.transferDelete);save();}return;}
    if(e.target.closest("#clearTxFilters")){filters={search:"",type:"",account:"",category:"",from:"",to:""};render();return;}
    if(e.target.closest("#exportCsv")){exportCsv();return;}
    if(e.target.closest("#generateStatement")){printStatement();return;}
  });
  document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>{state.settings.language=b.dataset.lang;save();}));
  document.querySelectorAll("[data-currency]").forEach(b=>b.addEventListener("click",()=>{state.settings.currency=b.dataset.currency;save();}));
  $("#themeToggle").addEventListener("click",()=>{state.settings.theme=state.settings.theme==="dark"?"light":"dark";save();});
  $("#addTransaction").addEventListener("click",()=>openDialog());
  $("#closeDialog").addEventListener("click",()=>$("#transactionDialog").close());
  $("#cancelDialog").addEventListener("click",()=>$("#transactionDialog").close());
  $("#txType").addEventListener("change",()=>$("#toAccountWrap").classList.toggle("hidden",$("#txType").value!=="transfer"));
  $("#txAccount").addEventListener("change",()=>{const account=state.accounts.find(a=>a.id===$("#txAccount").value);if(account)$("#txCurrency").value=account.currency;});
  $("#transactionForm").addEventListener("submit",e=>{
    e.preventDefault();
    const id=$("#editId").value,type=$("#txType").value,amount=Number($("#txAmount").value),accountId=$("#txAccount").value,currency=$("#txCurrency").value;
    if(!(amount>0)){$("#formError").textContent=t("invalidAmount");return;}
    try{
      if(type==="transfer"){
        const payload={amount,fromAccountId:accountId,toAccountId:$("#txToAccount").value,date:$("#txDate").value,description:$("#txDescription").value};
        if(id)FinoraFinance.updateTransfer(state,id,payload);else FinoraFinance.addTransfer(state,payload);
      }else{
        if(id&&id.startsWith("tr-"))throw new Error("TRANSFER_TYPE_LOCK");
        const payload={type,amount,accountId,currency,description:$("#txDescription").value,category:$("#txCategory").value,date:$("#txDate").value};
        if(id)FinoraFinance.updateTransaction(state,id,payload);else FinoraFinance.addTransaction(state,payload);
      }
      $("#transactionDialog").close();save();
    }catch(err){$("#formError").textContent=t(err.message==="SAME_ACCOUNT"?"sameAccount":err.message==="INVALID_AMOUNT"?"invalidAmount":err.message==="INVALID_DATE"?"invalidDate":err.message==="INVALID_ACCOUNT"?"missingAccount":"saveError");}
  });
  document.addEventListener("input",e=>{if(e.target.id==="txSearch"){filters.search=e.target.value;const pos=e.target.selectionStart;render();const el=$("#txSearch");el.focus();el.setSelectionRange(pos,pos);}});
  document.addEventListener("change",e=>{
    const map={txFilterType:"type",txFilterAccount:"account",txFilterCategory:"category",txFrom:"from",txTo:"to"};
    if(map[e.target.id]){filters[map[e.target.id]]=e.target.value;render();}
  });
  render();
})();
