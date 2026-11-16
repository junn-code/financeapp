(function () {
  const today = new Date().toISOString().slice(0, 10);
  window.FINORA_DEFAULTS = {
    version: 1,
    settings: { language: "en", currency: "MYR", theme: "light" },
    exchangeRates: { MYR: 1, SGD: 3.32 }, // Demo reference only; not live FX
    accounts: [
      { id: "acc-maybank", name: "Maybank Savings", type: "Bank", currency: "MYR", openingBalance: 12420.50, active: true },
      { id: "acc-cimb", name: "CIMB Account", type: "Bank", currency: "MYR", openingBalance: 11940, active: true },
      { id: "acc-tng", name: "Touch 'n Go", type: "E-wallet", currency: "MYR", openingBalance: 890, active: true },
      { id: "acc-cash", name: "Cash Wallet", type: "Cash", currency: "MYR", openingBalance: 500, active: true },
      { id: "acc-dbs", name: "DBS Singapore", type: "Bank", currency: "SGD", openingBalance: 3200, active: true }
    ],
    transactions: [
      { id: "tx-1", description: "Monthly salary", type: "income", category: "Salary", accountId: "acc-maybank", amount: 6500, currency: "MYR", date: "2026-11-01", status: "posted" },
      { id: "tx-2", description: "Grocery shopping", type: "expense", category: "Food", accountId: "acc-maybank", amount: 185.50, currency: "MYR", date: "2026-11-03", status: "posted" },
      { id: "tx-3", description: "Fuel", type: "expense", category: "Transport", accountId: "acc-maybank", amount: 90, currency: "MYR", date: "2026-11-05", status: "posted" },
      { id: "tx-4", description: "Online shopping", type: "expense", category: "Shopping", accountId: "acc-cimb", amount: 240, currency: "MYR", date: "2026-11-08", status: "posted" },
      { id: "tx-5", description: "Electricity bill", type: "expense", category: "Bills", accountId: "acc-maybank", amount: 145, currency: "MYR", date: "2026-11-10", status: "posted" },
      { id: "tx-6", description: "Freelance project", type: "income", category: "Other", accountId: "acc-cimb", amount: 800, currency: "MYR", date: "2026-11-12", status: "posted" },
      { id: "tx-7", description: "Lunch", type: "expense", category: "Food", accountId: "acc-tng", amount: 28, currency: "MYR", date: "2026-11-14", status: "posted" }
    ],
    transfers: [],
    liabilities: [
      { id: "liab-1", name: "Credit Card (Demo)", type: "Credit card", balance: 2835, currency: "MYR" }
    ],
    assets: [
      { id: "asset-1", name: "Property", type: "Property", value: 0, currency: "MYR" },
      { id: "asset-2", name: "Vehicle", type: "Vehicle", value: 0, currency: "MYR" }
    ],
    investments: [
      { id: "inv-1", name: "Global Equity ETF", symbol: "VWRA", units: 12, averageCost: 480, marketValue: 6250, currency: "MYR" },
      { id: "inv-2", name: "Technology ETF", symbol: "CNDX", units: 5, averageCost: 650, marketValue: 3650, currency: "MYR" },
      { id: "inv-3", name: "Singapore REIT", symbol: "C38U", units: 200, averageCost: 2.1, marketValue: 1550, currency: "SGD" }
    ],
    budgets: [
      { id: "bud-1", category: "Food", limit: 900, currency: "MYR" },
      { id: "bud-2", category: "Transport", limit: 450, currency: "MYR" },
      { id: "bud-3", category: "Shopping", limit: 600, currency: "MYR" },
      { id: "bud-4", category: "Bills", limit: 500, currency: "MYR" },
      { id: "bud-5", category: "Health", limit: 300, currency: "MYR" }
    ]
  };
})();