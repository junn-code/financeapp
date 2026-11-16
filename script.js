(() => {
  "use strict";

  const DATA = window.FINORA_DATA;
  const LANGUAGES = window.FINORA_TRANSLATIONS;

  const state = {
    page: "overview",
    language: "EN",
    currency: "MYR",
    theme: "light",
    range: "6m",
    hidden: false,
    transactionType: "expense",
    transactions: [...DATA.transactions]
  };

  const main = document.getElementById("mainContent");
  const currencySelect = document.getElementById("currencySelect");
  const languageSelect = document.getElementById("languageSelect");
  const modal = document.getElementById("transactionModal");

  const $ = (selector, parent = document) => parent.querySelector(selector);

  function t(key) {
    return LANGUAGES[state.language][key] || LANGUAGES.EN[key] || key;
  }

  function exchangeRate() {
    return state.currency === "SGD" ? 0.29 : 1;
  }

  function money(value, decimals = 0) {
    const converted = Number(value || 0) * exchangeRate();
    const currency = state.currency;

    return new Intl.NumberFormat(
      state.language === "ZH" ? "zh-MY" : "en-MY",
      {
        style: "currency",
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }
    ).format(converted);
  }

  function greeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return t("morning");
    if (hour >= 12 && hour < 18) return t("afternoon");
    return t("evening");
  }

  function formattedDate() {
    const locale = {
      EN: "en-MY",
      ZH: "zh-CN",
      BM: "ms-MY"
    }[state.language];

    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date());
  }

  function displayAmount(value) {
    return state.hidden ? "••••••" : money(value);
  }

  function iconForCategory(category) {
    const icons = {
      Food: "◌",
      Salary: "↙",
      Transport: "↗",
      Bills: "⌁",
      Shopping: "◇",
      Other: "·"
    };

    return icons[category] || "·";
  }

  function dateLabel(dateString) {
    const date = new Date(`${dateString}T12:00:00`);

    return new Intl.DateTimeFormat(
      state.language === "ZH" ? "zh-CN" : state.language === "BM" ? "ms-MY" : "en-MY",
      { day: "numeric", month: "short" }
    ).format(date);
  }

  function pageHeading(title, subtitle, eyebrow = "FINORA") {
    return `
      <div class="page-heading">
        <span class="eyebrow">${eyebrow}</span>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
    `;
  }

  function panelHeading(title, right = "") {
    return `
      <div class="section-heading">
        <h2>${title}</h2>
        ${right ? `<span>${right}</span>` : ""}
      </div>
    `;
  }

  function renderOverview() {
    const d = DATA.overview;
    const cashFlow = DATA.cashFlow;
    const maxBar = Math.max(...cashFlow.map(x => x.income));

    const chartBars = cashFlow.map(item => `
      <div class="bar-group">
        <div class="bar" style="height:${Math.max(8, item.income / maxBar * 85)}%"></div>
        <div class="bar secondary" style="height:${Math.max(8, item.expenses / maxBar * 85)}%"></div>
      </div>
    `).join("");

    const chartLabels = cashFlow.map(item => `<span>${item.month}</span>`).join("");

    const allocations = DATA.allocations.map(item => `
      <div class="allocation-item">
        <span class="allocation-name">${item.name}</span>
        <span class="allocation-value">${item.value}%</span>
        <div class="allocation-track">
          <div class="allocation-fill" style="width:${item.value}%"></div>
        </div>
      </div>
    `).join("");

    const recent = [...state.transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return `
      <section class="page-intro">
        <span class="eyebrow">${formattedDate()}</span>
        <h1 class="greeting">${greeting()}</h1>
        <p class="intro-subtitle">${t("tagline")}</p>
      </section>

      <div class="overview-toolbar">
        <div class="range-switch">
          <button class="range-button ${state.range === "1m" ? "active" : ""}" data-range="1m">1M</button>
          <button class="range-button ${state.range === "3m" ? "active" : ""}" data-range="3m">3M</button>
          <button class="range-button ${state.range === "6m" ? "active" : ""}" data-range="6m">6M</button>
          <button class="range-button ${state.range === "12m" ? "active" : ""}" data-range="12m">12M</button>
          <button class="range-button ${state.range === "year" ? "active" : ""}" data-range="year">Year</button>
        </div>
      </div>

      <section class="panel net-worth-panel">
        <div class="net-worth-top">
          <div>
            <span class="metric-label">${t("netWorth")}</span>
            <div class="metric-value">${displayAmount(d.netWorth)}</div>
            <div class="metric-change">
              <span>↗</span>
              <span>${d.netWorthChange}%</span>
              <span>${t("thisMonth")}</span>
            </div>
          </div>

          <svg class="sparkline" viewBox="0 0 280 115" role="img" aria-label="Net worth trend">
            <defs>
              <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6c9d86" stop-opacity=".22"/>
                <stop offset="100%" stop-color="#6c9d86" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path class="spark-area" d="M0 95 C25 88 34 60 59 68 S90 81 113 53 S151 61 177 37 S218 57 239 24 S264 17 280 5 L280 115 L0 115Z"/>
            <path d="M0 95 C25 88 34 60 59 68 S90 81 113 53 S151 61 177 37 S218 57 239 24 S264 17 280 5"/>
          </svg>
        </div>

        <div class="net-worth-divider"></div>

        <div class="net-worth-details">
          <div class="detail-block">
            <span>${t("totalAssets")}</span>
            <strong>${displayAmount(d.assets)}</strong>
          </div>
          <div class="detail-block">
            <span>${t("liabilities")}</span>
            <strong>${displayAmount(d.liabilities)}</strong>
          </div>
        </div>
      </section>

      <section class="stats-grid">
        <article class="panel stat-card">
          <div class="stat-icon">↓</div>
          <div class="stat-title">${t("monthlyIncome")}</div>
          <div class="stat-amount">${displayAmount(d.income)}</div>
          <div class="stat-foot">
            <span class="positive">↑ ${d.incomeChange}%</span>
            ${t("vsLastMonth")}
          </div>
        </article>

        <article class="panel stat-card expense">
          <div class="stat-icon">↗</div>
          <div class="stat-title">${t("monthlyExpenses")}</div>
          <div class="stat-amount">${displayAmount(d.expenses)}</div>
          <div class="stat-foot">
            <span class="negative">↓ ${d.expenseChange}%</span>
            ${t("vsLastMonth")}
          </div>
        </article>
      </section>

      <section class="content-grid">
        <article class="panel section-panel">
          ${panelHeading(t("cashFlow"), t("lastSixMonths"))}
          <div class="bar-chart">${chartBars}</div>
          <div class="chart-labels">${chartLabels}</div>
        </article>

        <article class="panel section-panel">
          ${panelHeading(t("assetAllocation"))}
          <div class="allocation-list">${allocations}</div>
        </article>
      </section>

      <section class="bottom-grid">
        <article class="panel section-panel">
          ${panelHeading(t("recentTransactions"), t("viewAll"))}
          <div class="transaction-list">
            ${recent.map(transactionRow).join("")}
          </div>
        </article>

        <article class="panel section-panel">
          ${panelHeading(t("yourAccounts"), t("viewAll"))}
          <div class="account-list">
            ${DATA.accounts.slice(0, 4).map(accountRow).join("")}
          </div>
        </article>
      </section>
    `;
  }

  function transactionRow(item) {
    const isIncome = item.type === "income";

    return `
      <div class="transaction-row">
        <div class="transaction-icon">${iconForCategory(item.category)}</div>
        <div class="transaction-info">
          <strong>${escapeHTML(item.title)}</strong>
          <span>${escapeHTML(item.category)} · ${dateLabel(item.date)}</span>
        </div>
        <div class="transaction-amount ${isIncome ? "income" : "expense"}">
          ${isIncome ? "+" : "−"}${displayAmount(item.amount)}
        </div>
      </div>
    `;
  }

  function accountRow(item) {
    return `
      <div class="account-row">
        <div class="account-symbol">${escapeHTML(item.symbol)}</div>
        <div class="account-info">
          <strong>${escapeHTML(item.name)}</strong>
          <span>${escapeHTML(item.type)}</span>
        </div>
        <div class="account-balance">${displayAmount(item.balance)}</div>
      </div>
    `;
  }

  function renderTransactions() {
    const rows = [...state.transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(item => `
        <tr>
          <td><strong>${escapeHTML(item.title)}</strong></td>
          <td>${escapeHTML(item.category)}</td>
          <td><span class="pill ${item.type === "income" ? "" : "neutral"}">${t(item.type)}</span></td>
          <td>${escapeHTML(item.account || "—")}</td>
          <td>${dateLabel(item.date)}</td>
          <td style="text-align:right" class="${item.type === "income" ? "positive" : ""}">
            ${item.type === "income" ? "+" : item.type === "expense" ? "−" : ""}
            ${displayAmount(item.amount)}
          </td>
        </tr>
      `).join("");

    return `
      ${pageHeading(t("transactions"), t("transactionSubtitle"))}
      <section class="page-grid">
        <article class="panel summary-card">
          <span class="metric-label">${t("monthlyIncome")}</span>
          <div class="summary-value">${displayAmount(DATA.overview.income)}</div>
        </article>
        <article class="panel summary-card">
          <span class="metric-label">${t("monthlyExpenses")}</span>
          <div class="summary-value">${displayAmount(DATA.overview.expenses)}</div>
        </article>
      </section>

      <article class="panel section-panel" style="margin-top:20px">
        ${panelHeading(t("allTransactions"), `${state.transactions.length} records`)}
        <div class="table-wrap">
          <table class="simple-table">
            <thead>
              <tr>
                <th>${t("transactionName")}</th>
                <th>${t("category")}</th>
                <th>${t("type")}</th>
                <th>${t("account")}</th>
                <th>${t("date")}</th>
                <th style="text-align:right">${t("amountColumn")}</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="6">${t("noTransactions")}</td></tr>`}</tbody>
          </table>
        </div>
      </article>
    `;
  }

  function renderAccounts() {
    const total = DATA.accounts.reduce((sum, item) => sum + item.balance, 0);

    return `
      ${pageHeading(t("accounts"), t("accountSubtitle"))}
      <article class="panel investment-highlight">
        <span class="metric-label">${t("accountBalance")}</span>
        <div class="summary-value">${displayAmount(total)}</div>
        <p>${DATA.accounts.length} ${t("accounts").toLowerCase()}</p>
      </article>

      <article class="panel section-panel">
        ${panelHeading(t("yourAccounts"))}
        <div class="account-list">
          ${DATA.accounts.map(accountRow).join("")}
        </div>
      </article>
    `;
  }

  function renderAssets() {
    const totalAssets = DATA.assets.reduce((sum, item) => sum + item.value, 0);
    const totalLiabilities = DATA.liabilities.reduce((sum, item) => sum + item.value, 0);

    const assetRows = DATA.assets.map(item => `
      <div class="account-row">
        <div class="account-symbol">＋</div>
        <div class="account-info">
          <strong>${escapeHTML(item.name)}</strong>
          <span>${escapeHTML(item.type)}</span>
        </div>
        <div class="account-balance">${displayAmount(item.value)}</div>
      </div>
    `).join("");

    const liabilityRows = DATA.liabilities.map(item => `
      <div class="account-row">
        <div class="account-symbol">−</div>
        <div class="account-info">
          <strong>${escapeHTML(item.name)}</strong>
          <span>${escapeHTML(item.type)}</span>
        </div>
        <div class="account-balance">${displayAmount(item.value)}</div>
      </div>
    `).join("");

    return `
      ${pageHeading(t("assets"), t("assetsSubtitle"))}

      <section class="page-grid">
        <article class="panel summary-card">
          <span class="metric-label">${t("totalAssetsTitle")}</span>
          <div class="summary-value">${displayAmount(totalAssets)}</div>
        </article>
        <article class="panel summary-card">
          <span class="metric-label">${t("totalLiabilities")}</span>
          <div class="summary-value">${displayAmount(totalLiabilities)}</div>
        </article>
      </section>

      <section class="page-grid" style="margin-top:20px">
        <article class="panel section-panel">
          ${panelHeading(t("assetItems"))}
          <div class="account-list">${assetRows}</div>
        </article>
        <article class="panel section-panel">
          ${panelHeading(t("liabilityItems"))}
          <div class="account-list">${liabilityRows}</div>
        </article>
      </section>
    `;
  }

  function renderInvestments() {
    const totalValue = DATA.investments.reduce((sum, item) => sum + item.marketValue, 0);
    const totalCost = DATA.investments.reduce((sum, item) => sum + item.quantity * item.averageCost, 0);
    const gain = totalValue - totalCost;

    const rows = DATA.investments.map(item => `
      <tr>
        <td><strong>${escapeHTML(item.name)}</strong></td>
        <td>${escapeHTML(item.type)}</td>
        <td>${item.quantity}</td>
        <td>${money(item.quantity * item.averageCost)}</td>
        <td>${money(item.marketValue)}</td>
        <td style="text-align:right;color:var(--green)">+${money(item.gain)}</td>
      </tr>
    `).join("");

    return `
      ${pageHeading(t("investments"), t("investmentSubtitle"))}

      <article class="panel investment-highlight">
        <span class="metric-label">${t("portfolioValue")}</span>
        <div class="summary-value">${displayAmount(totalValue)}</div>
        <div class="metric-change">↗ +${money(gain)} (${((gain / totalCost) * 100).toFixed(1)}%)</div>
      </article>

      <section class="page-grid">
        <article class="panel summary-card">
          <span class="metric-label">${t("investedValue")}</span>
          <div class="summary-value">${displayAmount(totalCost)}</div>
        </article>
        <article class="panel summary-card">
          <span class="metric-label">${t("unrealizedGain")}</span>
          <div class="summary-value">${displayAmount(gain)}</div>
        </article>
      </section>

      <article class="panel section-panel" style="margin-top:20px">
        ${panelHeading(t("holdings"))}
        <div class="table-wrap">
          <table class="simple-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Average cost</th>
                <th>Market value</th>
                <th style="text-align:right">P&L</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </article>
    `;
  }

  function renderBudgets() {
    const totalBudget = DATA.budgets.reduce((sum, item) => sum + item.limit, 0);
    const totalSpent = DATA.budgets.reduce((sum, item) => sum + item.spent, 0);
    const remaining = totalBudget - totalSpent;

    const items = DATA.budgets.map(item => {
      const percentage = Math.min(100, item.spent / item.limit * 100);
      const color = percentage >= 90 ? "var(--red)" : "var(--green)";

      return `
        <div class="budget-item">
          <div class="budget-top">
            <strong>${escapeHTML(item.name)}</strong>
            <span>${displayAmount(item.spent)} / ${displayAmount(item.limit)}</span>
          </div>
          <div class="budget-progress">
            <span style="width:${percentage}%;background:${color}"></span>
          </div>
        </div>
      `;
    }).join("");

    return `
      ${pageHeading(t("budgets"), t("budgetSubtitle"))}

      <section class="page-grid">
        <article class="panel summary-card">
          <span class="metric-label">${t("spent")}</span>
          <div class="summary-value">${displayAmount(totalSpent)}</div>
        </article>
        <article class="panel summary-card">
          <span class="metric-label">${t("remaining")}</span>
          <div class="summary-value">${displayAmount(remaining)}</div>
        </article>
      </section>

      <article class="panel section-panel" style="margin-top:20px">
        ${panelHeading(t("budgetProgress"), `${((totalSpent / totalBudget) * 100).toFixed(0)}%`)}
        ${items}
      </article>
    `;
  }

  function renderReports() {
    const d = DATA.overview;
    const savingsRate = (d.savings / d.income * 100).toFixed(1);

    return `
      ${pageHeading(t("reports"), t("reportsSubtitle"))}

      <article class="panel section-panel">
        ${panelHeading(t("financialSummary"), t("thisMonth"))}

        <section class="page-grid">
          <div class="summary-card">
            <span class="metric-label">${t("monthlyIncome")}</span>
            <div class="summary-value">${displayAmount(d.income)}</div>
          </div>
          <div class="summary-card">
            <span class="metric-label">${t("monthlyExpenses")}</span>
            <div class="summary-value">${displayAmount(d.expenses)}</div>
          </div>
          <div class="summary-card">
            <span class="metric-label">${t("savings")}</span>
            <div class="summary-value">${displayAmount(d.savings)}</div>
          </div>
          <div class="summary-card">
            <span class="metric-label">${t("savingsRate")}</span>
            <div class="summary-value">${savingsRate}%</div>
          </div>
        </section>

        <p class="empty-note">${t("sampleReport")}</p>
        <span class="pill neutral">${t("demo")}</span>
      </article>
    `;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function render() {
    const pages = {
      overview: renderOverview,
      transactions: renderTransactions,
      accounts: renderAccounts,
      assets: renderAssets,
      investments: renderInvestments,
      budgets: renderBudgets,
      reports: renderReports
    };

    main.innerHTML = (pages[state.page] || renderOverview)();

    document.querySelectorAll(".nav-item").forEach(button => {
      button.classList.toggle("active", button.dataset.page === state.page);
    });

    document.querySelectorAll("[data-range]").forEach(button => {
      button.classList.toggle("active", button.dataset.range === state.range);
    });
  }

  function updateTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(element => {
      const key = element.dataset.i18n;
      element.textContent = t(key);
    });

    document.documentElement.lang = state.language.toLowerCase();
    document.title = "Finora — Personal Wealth";
  }

  function updateModalCurrency() {
    $("#modalCurrency").textContent = state.currency === "MYR" ? "RM" : "S$";
  }

  function openModal() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    $("#transactionDate").value = new Date().toISOString().slice(0, 10);
    updateModalCurrency();
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  function bindEvents() {
    document.querySelectorAll(".nav-item").forEach(button => {
      button.addEventListener("click", () => {
        state.page = button.dataset.page;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    document.getElementById("themeToggle").addEventListener("click", () => {
      state.theme = state.theme === "light" ? "dark" : "light";
      document.body.classList.toggle("dark", state.theme === "dark");
    });

    currencySelect.addEventListener("change", () => {
      state.currency = currencySelect.value;
      updateModalCurrency();
      render();
    });

    languageSelect.addEventListener("change", () => {
      state.language = languageSelect.value;
      updateTranslations();
      render();
    });

    document.getElementById("openAddTransaction").addEventListener("click", openModal);
    document.getElementById("closeTransactionModal").addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeModal();
    });

    document.getElementById("transactionForm").addEventListener("click", event => {
      const option = event.target.closest(".type-option");
      if (!option) return;

      state.transactionType = option.dataset.type;

      document.querySelectorAll(".type-option").forEach(button => {
        button.classList.toggle("selected", button === option);
      });
    });

    document.getElementById("transactionForm").addEventListener("submit", event => {
      event.preventDefault();

      const amount = Number($("#transactionAmount").value);
      const title = $("#transactionTitle").value.trim();
      const category = $("#transactionCategory").value;
      const date = $("#transactionDate").value;

      if (!Number.isFinite(amount) || amount <= 0) {
        alert(t("invalidAmount"));
        return;
      }

      if (!title || !date) return;

      const newTransaction = {
        id: Date.now(),
        title,
        category,
        type: state.transactionType,
        amount,
        date,
        account: DATA.accounts[0].name
      };

      state.transactions.unshift(newTransaction);

      event.target.reset();
      state.transactionType = "expense";

      document.querySelectorAll(".type-option").forEach(button => {
        button.classList.toggle("selected", button.dataset.type === "expense");
      });

      closeModal();
      state.page = "transactions";
      render();
      alert(t("saved"));
    });

    main.addEventListener("click", event => {
      const rangeButton = event.target.closest("[data-range]");
      if (!rangeButton) return;

      state.range = rangeButton.dataset.range;
      render();
    });
  }

  function initialize() {
    currencySelect.value = state.currency;
    languageSelect.value = state.language;

    updateTranslations();
    updateModalCurrency();
    bindEvents();
    render();
  }

  initialize();
})();