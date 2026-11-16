(function () {
  const round = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  function rate(state, currency) {
    return currency === "SGD" ? Number(state.exchangeRates.SGD || 3.32) : 1;
  }
  function convert(state, amount, from, to) {
    if (from === to) return round(amount);
    return round(Number(amount) * rate(state, from) / rate(state, to));
  }
  function accountBalances(state) {
    const balances = {};
    state.accounts.forEach(a => balances[a.id] = Number(a.openingBalance || 0));
    state.transactions.forEach(t => {
      if (t.status === "void") return;
      if (t.type === "income" && balances[t.accountId] !== undefined) balances[t.accountId] += Number(t.amount);
      if (t.type === "expense" && balances[t.accountId] !== undefined) balances[t.accountId] -= Number(t.amount);
    });
    (state.transfers || []).forEach(t => {
      if (balances[t.fromAccountId] !== undefined) balances[t.fromAccountId] -= Number(t.fromAmount);
      if (balances[t.toAccountId] !== undefined) balances[t.toAccountId] += Number(t.toAmount);
    });
    Object.keys(balances).forEach(k => balances[k] = round(balances[k]));
    return balances;
  }
  function totals(state, currency) {
    const balances = accountBalances(state);
    const cash = state.accounts.reduce((sum,a) => sum + convert(state, balances[a.id] || 0, a.currency, currency), 0);
    const investments = state.investments.reduce((sum,i) => sum + convert(state, i.marketValue || 0, i.currency, currency), 0);
    const otherAssets = state.assets.reduce((sum,a) => sum + convert(state, a.value || 0, a.currency, currency), 0);
    const liabilities = state.liabilities.reduce((sum,l) => sum + convert(state, l.balance || 0, l.currency, currency), 0);
    const totalAssets = round(cash + investments + otherAssets);
    return { cash:round(cash), investments:round(investments), otherAssets:round(otherAssets), totalAssets, liabilities:round(liabilities), netWorth:round(totalAssets-liabilities) };
  }
  function periodTransactions(state, start, end) {
    return state.transactions.filter(t => t.status !== "void" && t.date >= start && t.date <= end);
  }
  function monthRange(date = new Date()) {
    const y = date.getFullYear(), m = date.getMonth();
    return { start:new Date(y,m,1).toISOString().slice(0,10), end:new Date(y,m+1,0).toISOString().slice(0,10) };
  }
  function incomeExpense(state, start, end, currency) {
    const rows = periodTransactions(state,start,end);
    return rows.reduce((out,t) => {
      const value = convert(state,t.amount,t.currency,currency);
      if (t.type === "income") out.income += value;
      if (t.type === "expense") out.expenses += value;
      return out;
    }, {income:0,expenses:0});
  }
  function addTransaction(state, item) {
    if (!(Number(item.amount) > 0) || !Number.isFinite(Number(item.amount))) throw new Error("INVALID_AMOUNT");
    const account = state.accounts.find(a => a.id === item.accountId);
    if (!account) throw new Error("INVALID_ACCOUNT");
    if (item.type === "transfer") throw new Error("USE_TRANSFER");
    if (item.currency !== account.currency) throw new Error("CURRENCY_MISMATCH");
    if (!item.date || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) throw new Error("INVALID_DATE");
    const tx = Object.assign({ id:"tx-" + Date.now() + "-" + Math.random().toString(36).slice(2,7), status:"posted" }, item, { amount:round(item.amount), description:String(item.description||"").trim().slice(0,80) });
    state.transactions.unshift(tx);
    return tx;
  }
  function buildTransfer(state, item, id) {
    if (!(Number(item.amount) > 0) || !Number.isFinite(Number(item.amount))) throw new Error("INVALID_AMOUNT");
    if (!item.date || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) throw new Error("INVALID_DATE");
    if (item.fromAccountId === item.toAccountId) throw new Error("SAME_ACCOUNT");
    const from = state.accounts.find(a => a.id === item.fromAccountId);
    const to = state.accounts.find(a => a.id === item.toAccountId);
    if (!from || !to) throw new Error("INVALID_ACCOUNT");
    const fromAmount = round(item.amount);
    const toAmount = item.toAmount != null && item.toAmount !== "" ? round(item.toAmount) : convert(state,fromAmount,from.currency,to.currency);
    if (!(toAmount > 0)) throw new Error("INVALID_AMOUNT");
    return { id:id || ("tr-" + Date.now() + "-" + Math.random().toString(36).slice(2,7)), date:item.date, description:String(item.description || "Transfer").trim().slice(0,80), fromAccountId:from.id, toAccountId:to.id, fromAmount, toAmount, fromCurrency:from.currency, toCurrency:to.currency, fxRateSnapshot:round(toAmount / fromAmount) };
  }
  function addTransfer(state, item) {
    const transfer = buildTransfer(state,item);
    state.transfers.unshift(transfer);
    return transfer;
  }
  function updateTransfer(state,id,item) {
    const index = (state.transfers || []).findIndex(t => t.id === id);
    if (index < 0) throw new Error("NOT_FOUND");
    state.transfers[index] = buildTransfer(state,item,id);
    return state.transfers[index];
  }
  function deleteTransfer(state,id) {
    const before = (state.transfers || []).length;
    state.transfers = (state.transfers || []).filter(t => t.id !== id);
    return state.transfers.length !== before;
  }
  function updateTransaction(state,id,patch) {
    const index = state.transactions.findIndex(t => t.id === id);
    if (index < 0) throw new Error("NOT_FOUND");
    if (!(Number(patch.amount) > 0)) throw new Error("INVALID_AMOUNT");
    const account = state.accounts.find(a => a.id === patch.accountId);
    if (!account) throw new Error("INVALID_ACCOUNT");
    if (patch.currency !== account.currency) throw new Error("CURRENCY_MISMATCH");
    if (!patch.date || !/^\d{4}-\d{2}-\d{2}$/.test(patch.date)) throw new Error("INVALID_DATE");
    state.transactions[index] = Object.assign({},state.transactions[index],patch,{amount:round(patch.amount),description:String(patch.description||"").trim().slice(0,80)});
    return state.transactions[index];
  }
  function deleteTransaction(state,id) {
    const before = state.transactions.length;
    state.transactions = state.transactions.filter(t => t.id !== id);
    return state.transactions.length !== before;
  }
  window.FinoraFinance = { round, convert, accountBalances, totals, monthRange, incomeExpense, addTransaction, addTransfer, updateTransfer, deleteTransfer, updateTransaction, deleteTransaction };
})();