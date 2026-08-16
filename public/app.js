const state = {
  user: null,
  settings: null,
  centers: [],
  tariffs: [],
  subscribers: [],
  readings: [],
  invoices: [],
  expenses: [],
  employees: [],
  users: [],
  receipts: [],
  alerts: [],
  page: "dashboard",
  year: "2026",
  period: "2026-07",
  centerId: "",
  tab: "general",
  modal: null,
  charts: []
};

const app = document.querySelector("#app");
const toastRegion = document.querySelector("#toast-region");
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const money = (value) => `${Number(value || 0).toLocaleString("ar-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
const date = (value) => value ? new Date(value).toLocaleDateString("ar-MA") : "—";
const monthLabel = (period) => {
  const [year, month] = String(period || "").split("-");
  return year && month ? `${month}/${year}` : "—";
};
const api = async (url, options = {}) => {
  const response = await fetch(url, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "تعذر تنفيذ العملية");
  return body;
};
const toast = (message, type = "normal") => {
  toastRegion.innerHTML = `<div class="toast ${type}">${esc(message)}</div>`;
  setTimeout(() => { toastRegion.innerHTML = ""; }, 3000);
};
const roleName = { admin: "مدير النظام", agent: "عون القراءة", treasurer: "أمين المال" };
const can = (...roles) => roles.includes(state.user?.role);
const centerName = (id) => state.centers.find((center) => center.id === id)?.name || "—";
const subscriber = (id) => state.subscribers.find((item) => item.id === id);
const periods = () => [...new Set(state.readings.map((item) => item.period).concat(state.invoices.map((item) => item.period)))].sort();

async function init() {
  const me = await api("/api/me");
  if (me.user) {
    state.user = me.user;
    await refresh();
  } else {
    renderLogin();
  }
}

async function refresh() {
  const data = await api("/api/bootstrap");
  Object.assign(state, data);
  render();
}

function renderLogin() {
  app.innerHTML = `
    <main class="login-page">
      <section class="login-card">
        <div class="brand-mark"><img src="${state.settings?.logo || defaultLogo()}" alt="" /></div>
        <h1>قطاع الماء الصالح للشرب</h1>
        <p>جمعية إدحمدا للتنمية والتواصل والماء الصالح للشرب</p>
        <form id="login-form">
          <div class="field"><label for="username">اسم المستخدم</label><input id="username" name="username" autocomplete="username" required placeholder="أدخل اسم المستخدم" /></div>
          <div class="field" style="margin-top:14px"><label for="password">كلمة المرور</label><input id="password" name="password" type="password" autocomplete="current-password" required placeholder="أدخل كلمة المرور" /></div>
          <button class="btn btn-primary" style="width:100%; margin-top:20px">دخول إلى النظام</button>
        </form>
        <div class="hint">للدخول التجريبي: admin / 123456</div>
      </section>
    </main>`;
  document.querySelector("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await api("/api/login", { method: "POST", body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) });
      state.user = result.user;
      await refresh();
    } catch (error) { toast(error.message, "error"); }
  });
}

function defaultLogo() {
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%230d6efd'/%3E%3Cpath d='M50 17C39 34 28 45 28 59a22 22 0 0 0 44 0C72 45 61 34 50 17Z' fill='white'/%3E%3C/svg%3E";
}

function render() {
  if (!state.user) return renderLogin();
  app.innerHTML = `
    <div class="shell">
      ${topbar()}
      <div class="layout">
        ${sidebar()}
        <main class="main">${pageView()}</main>
      </div>
    </div>
    ${state.modal || ""}`;
  bindShell();
  bindPage();
  if (state.page === "dashboard") drawCharts();
}

function topbar() {
  return `<header class="topbar">
    <div class="top-brand"><img src="${state.settings?.logo || defaultLogo()}" alt="شعار الجمعية" /><strong>قطاع الماء الصالح للشرب<br />جمعية إدحمدا</strong></div>
    <div class="searchbox"><span>⌕</span><input id="global-search" placeholder="بحث رقم العقدة" /></div>
    <div class="top-actions">
      <button class="icon-button" id="alerts-btn" title="تنبيهات قطع العداد">تنبيه <b class="alert-count">${state.alerts?.length || 0}</b></button>
      <button class="icon-button" title="البريد">بريد</button>
      <button class="performance" data-page="dashboard">لوحة الأداء</button>
      <div class="user-chip"><span class="avatar">${esc((state.user.name || "م").slice(0, 1))}</span><span>مرحبا ${esc(state.user.name)}</span></div>
      <button class="icon-button" id="logout-btn" title="تسجيل الخروج">خروج</button>
    </div>
  </header>`;
}

function sidebar() {
  const item = (page, label, icon) => `<button class="nav-item ${state.page === page ? "active" : ""}" data-page="${page}"><span>${label}</span><small>${icon}</small></button>`;
  return `<aside class="sidebar">
    <div class="nav-label">القائمة الرئيسية</div>
    ${item("dashboard", "الرئيسية", "01")}
    <div class="nav-group">إعدادات النظام</div>
    <div class="nav-sub">${item("settings", "الإعدادات العامة", "02")}${item("centers", "إدارة المراكز", "03")}${item("users", "إدارة المستخدمين", "04")}</div>
    ${item("subscribers", "بيانات المشتركين", "05")}
    ${item("tariffs", "التسعيرة", "06")}
    ${item("readings", "القراءات", "07")}
    ${item("invoices", "الفواتير", "08")}
    ${item("collection", "إستخلاص", "09")}
    ${item("expenses", "إدارة المصاريف", "10")}
    ${item("employees", "الموارد البشرية", "11")}
    <div class="nav-group">التقارير</div>
    <div class="nav-sub">${item("report-financial", "التقرير المالي", "12")}${item("report-monthly", "التقرير الشهري", "13")}${item("report-expenses", "تقارير المصاريف", "14")}${item("report-payments", "تقارير الدفعات", "15")}${item("report-subscribers", "تقارير المشتركين", "16")}${item("report-consumption", "تقارير الإستهلاك", "17")}${item("report-employees", "تقارير الموظفين", "18")}</div>
  </aside>`;
}

function pageHead(title, description, actions = "") {
  return `<div class="page-head"><div><h1>${title}</h1><p>${description}</p></div><div class="page-actions">${actions}</div></div>`;
}
function pageView() {
  const pages = {
    dashboard: dashboardPage,
    subscribers: subscribersPage,
    tariffs: tariffsPage,
    readings: readingsPage,
    invoices: invoicesPage,
    collection: collectionPage,
    expenses: expensesPage,
    employees: employeesPage,
    settings: settingsPage,
    centers: centersPage,
    users: usersPage
  };
  if (pages[state.page]) return pages[state.page]();
  if (state.page.startsWith("report-")) return reportPage(state.page.replace("report-", ""));
  return dashboardPage();
}

function dashboardPage() {
  return `${pageHead("الرئيسية", "ملخص مؤشرات تدبير الماء والتحصيل المالي للسنة المختارة.", `<select class="search" id="dashboard-year" style="width:auto">${["2026", "2025"].map((year) => `<option ${state.year === year ? "selected" : ""}>${year}</option>`).join("")}</select>`)}
    <div class="stat-grid">
      <div class="card stat-card"><div class="stat-label">الفواتير</div><div id="stat-invoices" class="stat-value">—</div><div class="stat-meta">الفترة المختارة</div></div>
      <div class="card stat-card"><div class="stat-label">الإشتراكات النشطة</div><div id="stat-subscriptions" class="stat-value">—</div><div class="stat-meta">مشترك مستفيد</div></div>
      <div class="card stat-card"><div class="stat-label">المصاريف</div><div id="stat-expenses" class="stat-value">—</div><div class="stat-meta">خلال السنة</div></div>
      <div class="card stat-card"><div class="stat-label">الموظفون</div><div id="stat-employees" class="stat-value">—</div><div class="stat-meta">موظف نشط</div></div>
    </div>
    <div class="charts">
      <section class="card"><div class="card-head"><h3>مبيان الاستهلاك للمراكز سنة: ${state.year}</h3></div><div class="chart-wrap"><canvas id="center-chart"></canvas></div></section>
      <section class="card"><div class="card-head"><h3>مبيان الاستهلاك للفترات سنة: ${state.year}</h3></div><div class="chart-wrap"><canvas id="period-chart"></canvas></div></section>
    </div>
    <section class="card" style="margin-top:17px"><div class="card-head"><h3>ملخص التحصيل</h3><span class="badge badge-success">محدث الآن</span></div><div style="padding:20px;font-size:14px;color:var(--muted)">إجمالي التحصيلات: <strong id="stat-collected" style="color:var(--navy);font-size:20px">—</strong></div></section>`;
}

async function drawCharts() {
  try {
    const data = await api(`/api/dashboard?year=${state.year}`);
    const stats = data.stats;
    ["invoices", "subscriptions", "expenses", "employees", "collected"].forEach((key) => {
      const element = document.querySelector(`#stat-${key}`);
      if (element) element.textContent = key === "expenses" || key === "collected" ? money(stats[key]) : Number(stats[key]).toLocaleString("ar-MA");
    });
    state.charts.forEach((chart) => chart.destroy());
    state.charts = [];
    const centerCanvas = document.querySelector("#center-chart");
    const periodCanvas = document.querySelector("#period-chart");
    if (centerCanvas && window.Chart) {
      state.charts.push(new Chart(centerCanvas, { type: "doughnut", data: { labels: data.centerTotals.map((x) => x.label), datasets: [{ data: data.centerTotals.map((x) => x.value), backgroundColor: ["#0d6efd", "#31a7a0", "#f2a43b"], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", rtl: true, labels: { font: { family: "Cairo" } } } } } }));
    }
    if (periodCanvas && window.Chart) {
      state.charts.push(new Chart(periodCanvas, { type: "line", data: { labels: data.periodTotals.map((x) => x.label), datasets: [{ label: "التحصيلات DH", data: data.periodTotals.map((x) => x.value), borderColor: "#0d6efd", backgroundColor: "rgba(13,110,253,.1)", fill: true, tension: .35 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } } }));
    }
  } catch (error) { toast(error.message, "error"); }
}

function subscribersPage() {
  const query = state.subscriberQuery || "";
  const rows = state.subscribers.filter((s) => !query || [s.fullName, s.contractNumber, s.cin, s.phone, s.meterNumber].some((v) => String(v).toLowerCase().includes(query.toLowerCase())));
  return `${pageHead("بيانات المشتركين", "إدارة بيانات المشتركين والعدادات والحالة التشغيلية.", can("admin") ? `<button class="btn btn-primary" id="add-subscriber">إضافة مشترك</button>` : "")}
    <section class="card table-card"><div class="card-head"><h3>قائمة المشتركين <span class="badge badge-info">${rows.length}</span></h3></div><div class="toolbar" style="padding:15px 17px 0"><input class="search" id="subscriber-search" value="${esc(query)}" placeholder="ابحث بالاسم أو رقم العقدة أو الهاتف" /></div><div class="table-scroll"><table><thead><tr><th>رقم العقدة</th><th>الاسم الكامل</th><th>CIN</th><th>الهاتف</th><th>المركز</th><th>العداد</th><th>الملكية</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>
    ${rows.slice(0, 250).map((s) => `<tr><td><strong>${esc(s.contractNumber)}</strong></td><td>${esc(s.fullName)}</td><td>${esc(s.cin)}</td><td>${esc(s.phone)}</td><td>${esc(centerName(s.centerId))}</td><td>${esc(s.meterNumber)}</td><td>${esc(s.ownership)}</td><td>${statusBadge(s.status)}</td><td>${can("admin") ? `<button class="btn btn-ghost edit-subscriber" data-id="${s.id}">تعديل</button><button class="btn btn-ghost toggle-subscriber" data-id="${s.id}">${s.status === "نشط" ? "تعليق" : "إعادة التشغيل"}</button>` : "—"}</td></tr>`).join("")}
    </tbody></table></div></section>`;
}
function statusBadge(status) { return `<span class="badge ${status === "نشط" || status === "مؤداة" ? "badge-success" : status === "موقوف" || status === "غير مؤداة" ? "badge-warning" : "badge-danger"}">${esc(status)}</span>`; }

function tariffsPage() {
  return `${pageHead("التسعيرة", "تعديل شرائح الاستهلاك والواجبات المعتمدة.", can("admin") ? `<button class="btn btn-primary" id="save-tariffs">حفظ التسعيرة</button>` : "")}
    <section class="card form-card"><h3 class="section-title">شرائح الاستهلاك</h3><div id="tariff-rows">${state.tariffs.map((t, index) => `<div class="form-grid tariff-row" data-index="${index}" style="margin-bottom:10px"><div class="field"><label>من (م³)</label><input data-key="from" type="number" value="${t.from}" ${can("admin") ? "" : "disabled"} /></div><div class="field"><label>إلى (م³)</label><input data-key="to" type="number" value="${t.to}" ${can("admin") ? "" : "disabled"} /></div><div class="field"><label>ثمن المتر المكعب (DH)</label><input data-key="price" type="number" step=".01" value="${t.price}" ${can("admin") ? "" : "disabled"} /></div><div class="field" style="display:flex;align-items:end"><button class="btn btn-danger remove-tariff" ${can("admin") ? "" : "disabled"}>حذف الشريحة</button></div></div>`).join("")}</div>${can("admin") ? `<button class="btn btn-secondary" id="add-tariff">إضافة شريحة</button>` : ""}</section>
    <section class="card form-card"><h3 class="section-title">الواجبات الإضافية</h3><div class="form-grid"><div class="field"><label>الواجب الثابت (DH)</label><input id="fixed-fee" type="number" step=".01" value="${state.settings.fixedFee}" ${can("admin") ? "" : "disabled"} /></div><div class="field"><label>واجب الانخراط (DH)</label><input value="${state.settings.membershipFee}" disabled /></div><div class="field"><label>غرامة قطع العداد (DH)</label><input value="${state.settings.cutoffPenalty}" disabled /></div></div></section>`;
}

function readingsPage() {
  const rows = state.readings.filter((r) => r.period === state.period && (!state.centerId || subscriber(r.subscriberId)?.centerId === state.centerId));
  return `${pageHead("القراءات", "إدخال قراءات العدادات ومراجعة الاستهلاك غير العادي.", `<button class="btn btn-primary" id="save-readings" ${can("admin", "agent") ? "" : "disabled"}>حفظ القراءات</button>`)}
    <section class="card table-card"><div class="toolbar" style="padding:17px"><select id="reading-period" class="search" style="width:auto">${periods().map((p) => `<option value="${p}" ${p === state.period ? "selected" : ""}>${monthLabel(p)}</option>`).join("")}</select><select id="reading-center" class="search" style="width:auto"><option value="">كل المراكز</option>${state.centers.map((c) => `<option value="${c.id}" ${c.id === state.centerId ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select><span class="badge badge-info">${rows.length} قراءة</span></div><div class="table-scroll"><table><thead><tr><th>رقم العقدة</th><th>المشترك</th><th>القراءة السابقة</th><th>القراءة الجديدة</th><th>الاستهلاك (م³)</th><th>الملاحظة</th></tr></thead><tbody>${rows.map((r) => `<tr data-reading-id="${r.id}" data-subscriber-id="${r.subscriberId}"><td>${esc(r.contractNumber)}</td><td>${esc(r.subscriberName)}</td><td>${r.previousReading}</td><td><input class="reading-input search" style="width:115px" type="number" value="${r.reading}" /></td><td class="consumption">${r.consumption}</td><td>${r.abnormal ? '<span class="badge badge-warning">قراءة شاذة</span>' : '<span class="badge badge-success">عادية</span>'}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function invoicesPage() {
  const rows = state.invoices.filter((x) => !state.invoicePeriod || x.period === state.invoicePeriod);
  return `${pageHead("الفواتير", "توليد الفواتير الشهرية وتتبع حالتها وطباعة نسخ A4.", `<button class="btn btn-primary" id="generate-invoices" ${can("admin", "agent") ? "" : "disabled"}>توليد فواتير الفترة</button>`)}
    <section class="card table-card"><div class="toolbar" style="padding:17px"><select id="invoice-period" class="search" style="width:auto"><option value="">كل الفترات</option>${periods().map((p) => `<option value="${p}" ${p === state.invoicePeriod ? "selected" : ""}>${monthLabel(p)}</option>`).join("")}</select><span class="badge badge-info">${rows.length} فاتورة</span></div><div class="table-scroll"><table><thead><tr><th>رقم الفاتورة</th><th>المشترك</th><th>رقم العقدة</th><th>الفترة</th><th>الاستهلاك</th><th>المبلغ</th><th>الغرامة</th><th>الحالة</th><th>طباعة</th></tr></thead><tbody>${rows.slice(0, 500).map((x) => `<tr><td>${esc(x.invoiceNumber)}</td><td>${esc(x.subscriberName)}</td><td>${esc(x.contractNumber)}</td><td>${monthLabel(x.period)}</td><td>${x.consumption} م³</td><td><strong>${money(x.amount)}</strong></td><td>${money(x.penalty)}</td><td>${statusBadge(x.status)}</td><td><button class="btn btn-ghost print-invoice" data-id="${x.id}">طباعة</button></td></tr>`).join("")}</tbody></table></div></section>`;
}

function collectionPage() {
  const q = (state.collectionQuery || "").toLowerCase();
  const unpaid = state.invoices.filter((x) => x.status !== "مؤداة" && (!q || [x.invoiceNumber, x.contractNumber, x.subscriberName].some((v) => String(v).toLowerCase().includes(q))));
  const selected = unpaid.filter((x) => (state.selectedInvoices || []).includes(x.id));
  return `${pageHead("إستخلاص", "تحصيل الفواتير المتأخرة وإصدار وصل الأداء.", "")}
    ${state.alerts.length ? `<div class="alert-box">تنبيه قطع العداد: يوجد ${state.alerts.length} مشترك بلغوا أو تجاوزوا ${state.settings.cutoffWarningInvoices} فواتير غير مؤداة.</div>` : ""}
    <div class="payment-layout"><section class="card table-card"><div class="toolbar" style="padding:17px"><input id="collection-search" class="search" value="${esc(state.collectionQuery || "")}" placeholder="أدخل رقم العقدة أو رقم الفاتورة أو امسح الباركود" /><span class="badge badge-warning">${unpaid.length} غير مؤداة</span></div><div class="table-scroll"><table><thead><tr><th></th><th>الفاتورة</th><th>المشترك</th><th>الفترة</th><th>المبلغ</th><th>الغرامة</th></tr></thead><tbody>${unpaid.slice(0, 500).map((x) => `<tr><td><input type="checkbox" class="invoice-check" data-id="${x.id}" ${(state.selectedInvoices || []).includes(x.id) ? "checked" : ""} /></td><td>${esc(x.invoiceNumber)}</td><td>${esc(x.subscriberName)} (${esc(x.contractNumber)})</td><td>${monthLabel(x.period)}</td><td>${money(x.amount)}</td><td>${money(x.penalty)}</td></tr>`).join("")}</tbody></table></div></section>
    <aside class="card selected-list"><h3 class="section-title">لائحة الفواتير</h3>${selected.length ? selected.map((x) => `<div class="selected-row"><span>${esc(x.invoiceNumber)}<br /><small>${esc(x.subscriberName)}</small></span><strong>${money(x.amount + x.penalty)}</strong></div>`).join("") : `<div class="empty" style="padding:25px 5px">اختر الفواتير المراد تحصيلها</div>`}<div class="total">${money(selected.reduce((sum, x) => sum + x.amount + x.penalty, 0))}</div><button class="btn btn-primary" id="pay-selected" style="width:100%" ${selected.length && can("admin", "treasurer") ? "" : "disabled"}>دفع وإصدار وصل</button></aside></div>
    <div class="card" style="margin-top:18px;padding:17px"><strong>التقرير اليومي ${new Date().toLocaleDateString("ar-MA")}</strong><span style="margin-right:28px;color:var(--muted)">عدد الفواتير المحصلة: ${state.receipts.length}</span><span style="margin-right:28px;color:var(--muted)">التحصيلات اليومية: ${money(state.receipts.filter((r) => date(r.paidAt) === new Date().toLocaleDateString("ar-MA")).reduce((s, r) => s + r.total, 0))}</span></div>`;
}

function expensesPage() {
  return `${pageHead("إدارة المصاريف", "تسجيل وتتبع مصاريف الجمعية حسب الصنف والشهر.", can("admin") ? `<button class="btn btn-primary" id="add-expense">إضافة مصروف</button>` : "")}
    <section class="card table-card"><div class="card-head"><h3>سجل المصاريف</h3><span class="badge badge-info">الإجمالي: ${money(state.expenses.reduce((sum, x) => sum + Number(x.amount), 0))}</span></div><div class="table-scroll"><table><thead><tr><th>التاريخ</th><th>البيان</th><th>الصنف</th><th>المبلغ</th><th>إجراء</th></tr></thead><tbody>${state.expenses.slice().sort((a,b)=>b.date.localeCompare(a.date)).map((x) => `<tr><td>${esc(x.date)}</td><td>${esc(x.label)}</td><td>${esc(x.category)}</td><td><strong>${money(x.amount)}</strong></td><td>${can("admin") ? `<button class="btn btn-danger delete-expense" data-id="${x.id}">حذف</button>` : "—"}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function employeesPage() {
  return `${pageHead("الموارد البشرية", "تدبير موظفي الجمعية وأجورهم ووضعيتهم.", can("admin") ? `<button class="btn btn-primary" id="add-employee">إضافة موظف</button>` : "")}
    <section class="card table-card"><div class="card-head"><h3>قائمة الموظفين</h3><button class="btn btn-secondary no-print" id="print-employees">طباعة القائمة</button></div><div class="table-scroll"><table><thead><tr><th>الاسم</th><th>المهمة</th><th>الهاتف</th><th>الأجرة</th><th>تاريخ التوظيف</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>${state.employees.map((x) => `<tr><td>${esc(x.name)}</td><td>${esc(x.position)}</td><td>${esc(x.phone)}</td><td>${money(x.salary)}</td><td>${esc(x.hiredAt)}</td><td>${statusBadge(x.status)}</td><td>${can("admin") ? `<button class="btn btn-danger delete-employee" data-id="${x.id}">حذف</button>` : "—"}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function settingsPage() {
  const tabs = [["general", "معلومات المؤسسة"], ["terms", "شروط الاستخدام"], ["subscription", "طلب اشتراك"], ["commitment", "إلتزام"], ["debt", "تأشيرة الدين"]];
  const tabContent = state.tab === "general" ? `<form id="settings-form" class="form-grid"><div class="field wide"><label>اسم المؤسسة</label><input name="associationName" value="${esc(state.settings.associationName)}" /></div><div class="field wide"><label>معلومات إضافية</label><input name="extraInfo" value="${esc(state.settings.extraInfo)}" /></div><div class="field"><label>العنوان</label><input name="address" value="${esc(state.settings.address)}" /></div><div class="field"><label>البريد الالكتروني</label><input name="email" value="${esc(state.settings.email)}" /></div><div class="field"><label>الهاتف</label><input name="phone" value="${esc(state.settings.phone)}" /></div><div class="field"><label>الفاكس</label><input name="fax" value="${esc(state.settings.fax)}" /></div><div class="field"><label>اسم الرئيس</label><input name="president" value="${esc(state.settings.president)}" /></div><div class="field"><label>اسم أمين المال</label><input name="treasurer" value="${esc(state.settings.treasurer)}" /></div><div class="field"><label>واجب الانخراط</label><input name="membershipFee" type="number" value="${state.settings.membershipFee}" /></div><div class="field"><label>غرامة قطع العداد</label><input name="cutoffPenalty" type="number" value="${state.settings.cutoffPenalty}" /></div><div class="field"><label>القراءات الشاذة من</label><input name="abnormalMin" type="number" value="${state.settings.abnormalMin}" /></div><div class="field"><label>القراءات الشاذة إلى</label><input name="abnormalMax" type="number" value="${state.settings.abnormalMax}" /></div><div class="field"><label>الفوترة</label><select name="billingFrequency"><option ${state.settings.billingFrequency === "شهر واحد" ? "selected" : ""}>شهر واحد</option><option ${state.settings.billingFrequency === "شهرين" ? "selected" : ""}>شهرين</option><option ${state.settings.billingFrequency === "ثلاثة أشهر" ? "selected" : ""}>ثلاثة أشهر</option></select></div><div class="field"><label>تنبيه قطع العداد بعد N فواتير</label><input name="cutoffWarningInvoices" type="number" value="${state.settings.cutoffWarningInvoices}" /></div><div class="field wide"><label>رسالة شكر في وصل الأداء</label><input name="thankYou" value="${esc(state.settings.thankYou)}" /></div><div class="field full"><button class="btn btn-primary">تحديث</button></div></form>` :
    state.tab === "terms" ? `<div class="field"><label>شروط الاستخدام (15 بندا)</label><textarea id="usage-clauses">${esc(state.settings.usageClauses.join("\n"))}</textarea></div><button class="btn btn-primary" id="save-clauses" style="margin-top:14px">تحديث الشروط</button>` :
    `<div class="field"><label>نموذج ${tabs.find((tab) => tab[0] === state.tab)?.[1]}</label><textarea id="template-text">${esc(state.settings[`${state.tab}Template`])}</textarea></div><button class="btn btn-primary" id="save-template" style="margin-top:14px">تحديث النموذج</button>`;
  return `${pageHead("الإعدادات العامة", "ضبط هوية المؤسسة، الشروط، نماذج الطباعة وقواعد التنبيه.", "")}<section class="card form-card"><div class="tabs">${tabs.map(([key, label]) => `<button class="tab ${state.tab === key ? "active" : ""}" data-tab="${key}">${label}</button>`).join("")}</div>${tabContent}</section>`;
}

function centersPage() {
  return `${pageHead("إدارة المراكز", "إضافة وتحديث مراكز توزيع الماء التابعة للجمعية.", can("admin") ? `<button class="btn btn-primary" id="add-center">إضافة مركز</button>` : "")}<section class="card table-card"><div class="table-scroll"><table><thead><tr><th>اسم المركز</th><th>الرمز</th><th>عدد المشتركين</th><th>إجراء</th></tr></thead><tbody>${state.centers.map((c) => `<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(c.code)}</td><td>${state.subscribers.filter((s) => s.centerId === c.id).length}</td><td>${can("admin") ? `<button class="btn btn-danger delete-center" data-id="${c.id}">حذف</button>` : "—"}</td></tr>`).join("")}</tbody></table></div></section>`;
}
function usersPage() {
  return `${pageHead("إدارة المستخدمين", "إدارة حسابات الدخول والصلاحيات.", can("admin") ? `<button class="btn btn-primary" id="add-user">إضافة مستخدم</button>` : "")}<section class="card table-card"><div class="table-scroll"><table><thead><tr><th>الاسم</th><th>اسم المستخدم</th><th>الدور</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>${state.users.map((u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.username)}</td><td>${esc(roleName[u.role] || u.role)}</td><td>${statusBadge(u.active ? "نشط" : "موقوف")}</td><td>${can("admin") && u.id !== "user_admin" ? `<button class="btn btn-danger delete-user" data-id="${u.id}">حذف</button>` : "—"}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function reportPage(type) {
  return `<div id="report-root">${pageHead("التقارير", "تقارير قابلة للبحث والطباعة حسب الوحدة.", `<button class="btn btn-secondary" id="print-report">طباعة التقرير</button>`)}<div class="notice">يمكنك تصفية البيانات من خلال بحث المتصفح ثم طباعة التقرير بصيغة A4.</div><section class="card table-card"><div class="card-head"><h3>جاري تحميل التقرير...</h3></div></section></div>`;
}

function bindShell() {
  document.querySelectorAll("[data-page]").forEach((element) => element.addEventListener("click", () => { state.page = element.dataset.page; state.modal = null; render(); }));
  document.querySelector("#logout-btn")?.addEventListener("click", async () => { await api("/api/logout", { method: "POST" }); state.user = null; renderLogin(); });
  document.querySelector("#global-search")?.addEventListener("keydown", (event) => { if (event.key === "Enter" && event.currentTarget.value.trim()) { state.subscriberQuery = event.currentTarget.value.trim(); state.page = "subscribers"; render(); } });
  document.querySelector("#alerts-btn")?.addEventListener("click", () => { state.collectionQuery = ""; state.page = "collection"; render(); });
}

function bindPage() {
  document.querySelector("#dashboard-year")?.addEventListener("change", (event) => { state.year = event.target.value; render(); });
  document.querySelector("#subscriber-search")?.addEventListener("input", (event) => { state.subscriberQuery = event.target.value; render(); setTimeout(() => document.querySelector("#subscriber-search")?.focus(), 0); });
  document.querySelector("#add-subscriber")?.addEventListener("click", () => openForm("إضافة مشترك", subscriberFields(), async (payload) => { await api("/api/subscribers", { method: "POST", body: JSON.stringify(payload) }); await refresh(); }));
  document.querySelectorAll(".edit-subscriber").forEach((button) => button.addEventListener("click", () => { const item = subscriber(button.dataset.id); openForm("تعديل بيانات المشترك", subscriberFields(item), async (payload) => { await api(`/api/subscribers/${item.id}`, { method: "PUT", body: JSON.stringify(payload) }); await refresh(); }); }));
  document.querySelectorAll(".toggle-subscriber").forEach((button) => button.addEventListener("click", async () => { const item = subscriber(button.dataset.id); const next = item.status === "نشط" ? "موقوف" : "نشط"; await api(`/api/subscribers/${item.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) }); toast("تم تحديث حالة المشترك"); await refresh(); }));
  document.querySelector("#add-tariff")?.addEventListener("click", () => { state.tariffs.push({ id: `tariff_${Date.now()}`, from: 1, to: 5, price: 2 }); render(); });
  document.querySelectorAll(".remove-tariff").forEach((button) => button.addEventListener("click", () => { state.tariffs.splice(Number(button.closest(".tariff-row").dataset.index), 1); render(); }));
  document.querySelector("#save-tariffs")?.addEventListener("click", async () => { const tariffs = [...document.querySelectorAll(".tariff-row")].map((row, index) => ({ id: state.tariffs[index]?.id || `tariff_${index}`, from: Number(row.querySelector('[data-key="from"]').value), to: Number(row.querySelector('[data-key="to"]').value), price: Number(row.querySelector('[data-key="price"]').value) })); await api("/api/tariffs", { method: "PUT", body: JSON.stringify({ tariffs, fixedFee: Number(document.querySelector("#fixed-fee").value) }) }); toast("تم حفظ التسعيرة"); await refresh(); });
  document.querySelector("#reading-period")?.addEventListener("change", (event) => { state.period = event.target.value; render(); });
  document.querySelector("#reading-center")?.addEventListener("change", (event) => { state.centerId = event.target.value; render(); });
  document.querySelectorAll(".reading-input").forEach((input) => input.addEventListener("input", () => { const row = input.closest("tr"); const previous = Number(row.children[2].textContent); row.querySelector(".consumption").textContent = Math.max(0, Number(input.value) - previous); }));
  document.querySelector("#save-readings")?.addEventListener("click", async () => { const readings = [...document.querySelectorAll("tr[data-reading-id]")].map((row) => ({ subscriberId: row.dataset.subscriberId, reading: Number(row.querySelector(".reading-input").value), previousReading: Number(row.children[2].textContent) })); await api("/api/readings/bulk", { method: "POST", body: JSON.stringify({ period: state.period, readings }) }); toast("تم حفظ القراءات"); await refresh(); });
  document.querySelector("#invoice-period")?.addEventListener("change", (event) => { state.invoicePeriod = event.target.value; render(); });
  document.querySelector("#generate-invoices")?.addEventListener("click", () => openPeriodModal());
  document.querySelectorAll(".print-invoice").forEach((button) => button.addEventListener("click", () => printInvoice(button.dataset.id)));
  document.querySelector("#collection-search")?.addEventListener("input", (event) => { state.collectionQuery = event.target.value; render(); setTimeout(() => { const el = document.querySelector("#collection-search"); el?.focus(); el?.setSelectionRange(el.value.length, el.value.length); }, 0); });
  document.querySelectorAll(".invoice-check").forEach((input) => input.addEventListener("change", () => { state.selectedInvoices = [...document.querySelectorAll(".invoice-check:checked")].map((item) => item.dataset.id); render(); }));
  document.querySelector("#pay-selected")?.addEventListener("click", paySelected);
  document.querySelector("#add-expense")?.addEventListener("click", () => openForm("إضافة مصروف", [{ name: "date", label: "التاريخ", type: "date", required: true }, { name: "label", label: "البيان", required: true }, { name: "category", label: "الصنف", required: true }, { name: "amount", label: "المبلغ", type: "number", required: true }], async (payload) => { await api("/api/expenses", { method: "POST", body: JSON.stringify(payload) }); await refresh(); }));
  document.querySelectorAll(".delete-expense").forEach((button) => button.addEventListener("click", () => deleteItem("expenses", button.dataset.id)));
  document.querySelector("#add-employee")?.addEventListener("click", () => openForm("إضافة موظف", [{ name: "name", label: "الاسم", required: true }, { name: "position", label: "المهمة", required: true }, { name: "phone", label: "الهاتف" }, { name: "salary", label: "الأجرة", type: "number", required: true }, { name: "hiredAt", label: "تاريخ التوظيف", type: "date", required: true }, { name: "status", label: "الحالة", type: "select", options: ["نشط", "موقوف"] }], async (payload) => { await api("/api/employees", { method: "POST", body: JSON.stringify(payload) }); await refresh(); }));
  document.querySelectorAll(".delete-employee").forEach((button) => button.addEventListener("click", () => deleteItem("employees", button.dataset.id)));
  document.querySelector("#print-employees")?.addEventListener("click", () => window.print());
  document.querySelectorAll(".tab").forEach((button) => button.addEventListener("click", () => { state.tab = button.dataset.tab; render(); }));
  document.querySelector("#settings-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const payload = Object.fromEntries(new FormData(event.currentTarget).entries()); await api("/api/settings", { method: "PUT", body: JSON.stringify(payload) }); toast("تم تحديث الإعدادات"); await refresh(); });
  document.querySelector("#save-clauses")?.addEventListener("click", async () => { await api("/api/settings", { method: "PUT", body: JSON.stringify({ usageClauses: document.querySelector("#usage-clauses").value.split("\n").filter(Boolean) }) }); toast("تم تحديث شروط الاستخدام"); await refresh(); });
  document.querySelector("#save-template")?.addEventListener("click", async () => { await api("/api/settings", { method: "PUT", body: JSON.stringify({ [`${state.tab}Template`]: document.querySelector("#template-text").value }) }); toast("تم تحديث النموذج"); await refresh(); });
  document.querySelector("#add-center")?.addEventListener("click", () => openForm("إضافة مركز", [{ name: "name", label: "اسم المركز", required: true }, { name: "code", label: "الرمز", required: true }], async (payload) => { await api("/api/centers", { method: "POST", body: JSON.stringify(payload) }); await refresh(); }));
  document.querySelectorAll(".delete-center").forEach((button) => button.addEventListener("click", () => deleteItem("centers", button.dataset.id)));
  document.querySelector("#add-user")?.addEventListener("click", () => openForm(
    "إضافة مستخدم",
    [
      { name: "name", label: "الاسم", required: true },
      { name: "username", label: "اسم المستخدم", required: true },
      { name: "password", label: "كلمة المرور", type: "password", required: true },
      { name: "role", label: "الدور", type: "select", options: ["admin", "agent", "treasurer"] }
    ],
    async (payload) => {
      await api("/api/users", { method: "POST", body: JSON.stringify(payload) });
      await refresh();
    }
  ));
  document.querySelectorAll(".delete-user").forEach((button) => button.addEventListener("click", () => deleteItem("users", button.dataset.id)));
  if (state.page.startsWith("report-")) loadReport(state.page.replace("report-", ""));
  document.querySelector("#print-report")?.addEventListener("click", () => window.print());
}

function subscriberFields(item = {}) {
  return [{ name: "contractNumber", label: "رقم العقدة", value: item.contractNumber || "", required: true }, { name: "fullName", label: "الاسم الكامل", value: item.fullName || "", required: true }, { name: "cin", label: "CIN", value: item.cin || "" }, { name: "phone", label: "الهاتف", value: item.phone || "" }, { name: "address", label: "العنوان", value: item.address || "" }, { name: "centerId", label: "المركز", type: "select", options: state.centers.map((c) => ({ value: c.id, label: c.name })), value: item.centerId || state.centers[0]?.id }, { name: "meterNumber", label: "رقم العداد", value: item.meterNumber || "" }, { name: "ownership", label: "الملكية", type: "select", options: ["ملكه", "للكراء"], value: item.ownership || "ملكه" }, { name: "consumptionType", label: "نوع الاستهلاك", type: "select", options: ["منزلي", "تجاري", "مكتب"], value: item.consumptionType || "منزلي" }, { name: "subscriptionDate", label: "تاريخ الاشتراك", type: "date", value: item.subscriptionDate || new Date().toISOString().slice(0, 10) }, { name: "status", label: "الحالة", type: "select", options: ["نشط", "موقوف", "مقطوع"], value: item.status || "نشط" }];
}
function openForm(title, fields, submit) {
  state.modal = `<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>${title}</h2><button class="modal-close" id="close-modal">×</button></div><div class="modal-body"><form id="modal-form" class="form-grid">${fields.map((field) => `<div class="field ${field.wide ? "wide" : ""}"><label>${field.label}</label>${field.type === "select" ? `<select name="${field.name}" ${field.required ? "required" : ""}>${field.options.map((option) => { const normalized = typeof option === "string" ? { value: option, label: option } : option; return `<option value="${esc(normalized.value)}" ${String(normalized.value) === String(field.value) ? "selected" : ""}>${esc(normalized.label)}</option>`; }).join("")}</select>` : `<input name="${field.name}" type="${field.type || "text"}" value="${esc(field.value || "")}" ${field.required ? "required" : ""} />`}</div>`).join("")}<div class="field full" style="display:flex;justify-content:flex-start;gap:9px;margin-top:6px"><button class="btn btn-primary">حفظ</button><button type="button" class="btn btn-secondary" id="cancel-modal">إلغاء</button></div></form></div></div></div>`;
  render();
  document.querySelector("#close-modal")?.addEventListener("click", () => { state.modal = null; render(); });
  document.querySelector("#cancel-modal")?.addEventListener("click", () => { state.modal = null; render(); });
  document.querySelector("#modal-form")?.addEventListener("submit", async (event) => { event.preventDefault(); try { await submit(Object.fromEntries(new FormData(event.currentTarget).entries())); state.modal = null; toast("تم الحفظ بنجاح"); } catch (error) { toast(error.message, "error"); } });
}
async function deleteItem(collection, itemId) { if (!confirm("هل تريد حذف هذا العنصر؟")) return; await api(`/api/${collection}/${itemId}`, { method: "DELETE" }); toast("تم الحذف"); await refresh(); }
function openPeriodModal() {
  openForm("توليد فواتير الفترة", [{ name: "period", label: "الفترة", type: "select", options: periods().map((p) => ({ value: p, label: monthLabel(p) })), value: state.period }], async (payload) => { const result = await api("/api/invoices/generate", { method: "POST", body: JSON.stringify(payload) }); toast(`تم توليد ${result.created} فاتورة`); await refresh(); });
}
async function paySelected() {
  try { const result = await api("/api/payments", { method: "POST", body: JSON.stringify({ invoiceIds: state.selectedInvoices || [] }) }); state.selectedInvoices = []; await refresh(); printReceipt(result); } catch (error) { toast(error.message, "error"); }
}
async function printInvoice(invoiceId) {
  const result = await api(`/api/invoices/${invoiceId}/print`, { method: "POST" });
  const invoice = result.invoice;
  printDocument(`<div class="print-sheet"><div class="print-header"><div><h1>${esc(result.settings.associationName)}</h1><div>${esc(result.settings.address)} — ${esc(result.settings.phone)}</div></div><img src="${result.settings.logo}" alt="" /></div><h2 style="text-align:center;margin:35px 0">فاتورة الماء الصالح للشرب</h2><p>رقم الفاتورة: <strong>${esc(invoice.invoiceNumber)}</strong> — الفترة: ${monthLabel(invoice.period)}</p><p>المشترك: <strong>${esc(invoice.subscriberName)}</strong> — رقم العقدة: ${esc(invoice.contractNumber)}</p><table><tr><th>الاستهلاك</th><th>المبلغ</th><th>الغرامة</th><th>الإجمالي</th></tr><tr><td>${invoice.consumption} م³</td><td>${money(invoice.amount)}</td><td>${money(invoice.penalty)}</td><td><strong>${money(invoice.amount + invoice.penalty)}</strong></td></tr></table><div style="margin-top:65px;text-align:left">توقيع الجمعية</div></div>`);
}
function printReceipt(result) {
  printDocument(`<div class="print-sheet"><div class="print-header"><div><h1>${esc(result.settings.associationName)}</h1><div>${esc(result.settings.address)} — ${esc(result.settings.phone)}</div></div><img src="${result.settings.logo}" alt="" /></div><h2 style="text-align:center;margin:35px 0">وصل الأداء</h2><p>وصل رقم: <strong>${esc(result.receipt.receiptNumber)}</strong> — التاريخ: ${date(result.receipt.paidAt)}</p><table><thead><tr><th>الفاتورة</th><th>المشترك</th><th>الفترة</th><th>المبلغ</th></tr></thead><tbody>${result.invoices.map((invoice) => `<tr><td>${esc(invoice.invoiceNumber)}</td><td>${esc(invoice.subscriberName)}</td><td>${monthLabel(invoice.period)}</td><td>${money(invoice.amount + invoice.penalty)}</td></tr>`).join("")}</tbody><tfoot><tr><th colspan="3">المجموع</th><th>${money(result.receipt.total)}</th></tr></tfoot></table><p style="margin-top:28px">${esc(result.settings.thankYou)}</p><div class="signature-row"><div>أمين المال<br /><br />${esc(result.settings.treasurer)}</div><div>الرئيس<br /><br />${esc(result.settings.president)}</div></div></div>`);
}
function printDocument(content) {
  const print = window.open("", "_blank", "width=900,height=700");
  if (!print) return toast("يرجى السماح بالنوافذ المنبثقة للطباعة", "error");
  print.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>طباعة</title><link rel="stylesheet" href="/styles.css"></head><body>${content}<script>window.onload=()=>window.print();</script></body></html>`);
  print.document.close();
}
async function loadReport(type) {
  const root = document.querySelector("#report-root");
  if (!root) return;
  try {
    const report = await api(`/api/reports/${type}`);
    const rows = report.rows || [];
    const headers = rows.length ? Object.keys(rows[0]) : [];
    root.querySelector(".card").innerHTML = `<div class="card-head"><h3>${esc(report.title)}</h3><span class="badge badge-info">${rows.length} سجل</span></div><div class="toolbar" style="padding:15px 17px 0"><input class="search" id="report-search" placeholder="بحث داخل التقرير" /></div><div class="table-scroll"><table id="report-table"><thead><tr>${headers.map((header) => `<th>${esc(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((header) => `<td>${esc(row[header])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    root.querySelector("#report-search")?.addEventListener("input", (event) => [...root.querySelectorAll("#report-table tbody tr")].forEach((row) => { row.style.display = row.textContent.toLowerCase().includes(event.target.value.toLowerCase()) ? "" : "none"; }));
  } catch (error) { toast(error.message, "error"); }
}

init().catch(() => renderLogin());