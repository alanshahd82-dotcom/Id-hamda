const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = path.join(__dirname, "db.json");
const publicDir = path.join(__dirname, "public");

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "id-hamda-demo-session",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 8 }
}));

const sha = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const id = (prefix) => `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`;
const round = (value) => Math.round(Number(value || 0) * 100) / 100;
const now = () => new Date().toISOString();
const monthLabel = (period) => {
  const [year, month] = period.split("-");
  return `${month}/${year}`;
};

function makeSeed() {
  const centers = [
    { id: "center_1", name: "مركز إدحمدا", code: "IDH" },
    { id: "center_2", name: "مركز تامونت", code: "TAM" },
    { id: "center_3", name: "مركز إغرم", code: "IGH" }
  ];
  const firstNames = ["محمد", "أحمد", "حسن", "العربي", "مصطفى", "عبد الله", "إدريس", "يوسف", "رشيد", "سعيد", "فاطمة", "خديجة", "مريم", "زهرة", "عائشة", "نزهة"];
  const lastNames = ["أيت علي", "أيت بوعلي", "الحمداوي", "أيت لحسن", "المرابط", "بن ياسين", "أيت صالح", "الداودي", "أيت مبارك", "العلوي", "أيت موسى", "الزياني"];
  const periods = [];
  for (let year = 2025, month = 8; periods.length < 12; month++) {
    const actualMonth = month > 12 ? month - 12 : month;
    const actualYear = month > 12 ? year + 1 : year;
    periods.push(`${actualYear}-${String(actualMonth).padStart(2, "0")}`);
  }
  const subscribers = Array.from({ length: 250 }, (_, index) => {
    const number = index + 1;
    return {
      id: `sub_${number}`,
      contractNumber: String(number),
      fullName: `${firstNames[index % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]}`,
      cin: `AB${String(100000 + index).slice(-6)}`,
      phone: `06${String(10000000 + index * 731).slice(0, 8)}`,
      address: index % 3 === 0 ? "دوار إدحمدا" : index % 3 === 1 ? "دوار تامونت" : "دوار إغرم",
      centerId: centers[index % centers.length].id,
      meterNumber: `M-${String(10000 + index)}`,
      ownership: index % 4 === 0 ? "للكراء" : "ملكه",
      consumptionType: index % 10 === 0 ? "تجاري" : index % 17 === 0 ? "مكتب" : "منزلي",
      subscriptionDate: `2024-${String((index % 12) + 1).padStart(2, "0")}-15`,
      status: index === 247 ? "موقوف" : index === 248 ? "مقطوع" : "نشط"
    };
  });
  const readings = [];
  subscribers.forEach((subscriber, subscriberIndex) => {
    let previous = 120 + subscriberIndex * 2;
    periods.forEach((period, periodIndex) => {
      const consumption = 2 + ((subscriberIndex * 7 + periodIndex * 3) % 19);
      const current = previous + consumption;
      readings.push({
        id: id("read"),
        subscriberId: subscriber.id,
        period,
        previousReading: previous,
        reading: current,
        consumption,
        abnormal: consumption < 2 || consumption > 15,
        recordedAt: `${period}-25T09:00:00.000Z`
      });
      previous = current;
    });
  });
  const tariffs = [
    { id: "tariff_1", from: 1, to: 10, price: 2 },
    { id: "tariff_2", from: 11, to: 15, price: 3 },
    { id: "tariff_3", from: 16, to: 20, price: 4 }
  ];
  const settings = {
    associationName: "جمعية إدحمدا للتنمية والتواصل والماء الصالح للشرب",
    extraInfo: "جمعية قروية تهتم بتدبير وتوزيع الماء الصالح للشرب",
    address: "دوار إدحمدا، المغرب",
    email: "contact@idh-hamda.ma",
    phone: "0524-000000",
    fax: "0524-000001",
    president: "رئيس الجمعية",
    treasurer: "أمين المال",
    membershipFee: 350,
    cutoffPenalty: 20,
    abnormalMin: 2,
    abnormalMax: 15,
    billingFrequency: "شهر واحد",
    vatEnabled: false,
    vatRate: 20,
    cutoffWarningInvoices: 3,
    fixedFee: 7,
    thankYou: "شكرا لكم على تفهمكم شكرا جزيلا لكم",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%230d6efd'/%3E%3Cpath d='M50 17C39 34 28 45 28 59a22 22 0 0 0 44 0C72 45 61 34 50 17Z' fill='%23fff'/%3E%3C/svg%3E",
    usageClauses: Array.from({ length: 15 }, (_, i) => `${i + 1}. يلتزم المشترك باستعمال الماء الصالح للشرب في الأغراض المصرح بها والمحافظة على سلامة العداد.`),
    subscriptionTemplate: "أنا الموقع أسفله {name_abon} الحامل لبطاقة التعريف الوطنية {cin_abon}، أطلب الاشتراك في خدمة الماء بمقر {posit_abon}، العنوان {adresse_abon}، وألتزم باحترام شروط الجمعية.",
    commitmentTemplate: "ألتزم بأداء واجب الاستهلاك حسب التسعيرة المعتمدة: من 1 إلى 10 م³: 2.00 درهم، من 11 إلى 15 م³: 3.00 درهم، من 16 إلى 20 م³: 4.00 درهم.",
    debtVisaTemplate: "أنا أمين المال {name_tresorie} أشهد أن المشترك {name_abon}، رقم {num_abon}، عليه واجب قدره {devoir}، أدى {payi}، والباقي {reste}."
  };
  const invoices = [];
  periods.forEach((period, periodIndex) => {
    subscribers.filter((s) => s.status === "نشط").forEach((subscriber, subscriberIndex) => {
      const reading = readings.find((r) => r.subscriberId === subscriber.id && r.period === period);
      const amount = calculateAmount(reading.consumption, tariffs, settings.fixedFee, settings.vatEnabled, settings.vatRate);
      const unpaid = periodIndex === periods.length - 1 && subscriberIndex % 5 !== 0;
      const olderDebt = subscriberIndex < 15 && periodIndex >= 8 && periodIndex < 11;
      invoices.push({
        id: `inv_${period.replace("-", "")}_${subscriber.contractNumber}`,
        invoiceNumber: `F-${period.replace("-", "")}-${subscriber.contractNumber.padStart(3, "0")}`,
        subscriberId: subscriber.id,
        period,
        consumption: reading.consumption,
        amount,
        penalty: 0,
        status: unpaid || olderDebt ? "غير مؤداة" : "مؤداة",
        issuedAt: `${period}-28T10:00:00.000Z`,
        paidAt: unpaid || olderDebt ? null : `${period}-29T12:00:00.000Z`
      });
    });
  });
  return {
    meta: { createdAt: now(), schemaVersion: 1 },
    settings,
    centers,
    tariffs,
    users: [
      { id: "user_admin", username: "admin", name: "مدير النظام", role: "admin", passwordHash: sha("123456"), active: true },
      { id: "user_agent", username: "agent", name: "عون القراءة", role: "agent", passwordHash: sha("123456"), active: true },
      { id: "user_treasurer", username: "treasurer", name: "أمين المال", role: "treasurer", passwordHash: sha("123456"), active: true }
    ],
    subscribers,
    readings,
    invoices,
    expenses: [
      { id: "exp_1", date: "2026-01-04", label: "كهرباء المضخة", category: "الكهرباء", amount: 1840 },
      { id: "exp_2", date: "2026-01-12", label: "صيانة لوحة التحكم", category: "الصيانة", amount: 920 },
      { id: "exp_3", date: "2026-02-05", label: "أنابيب وقطع غيار", category: "التجهيز", amount: 2350 },
      { id: "exp_4", date: "2026-02-19", label: "قرطاسية", category: "الإدارة", amount: 370 },
      { id: "exp_5", date: "2026-03-09", label: "كهرباء المضخة", category: "الكهرباء", amount: 1760 },
      { id: "exp_6", date: "2026-03-21", label: "تنقلات لجنة التتبع", category: "التنقل", amount: 600 },
      { id: "exp_7", date: "2026-04-02", label: "إصلاح تسرب", category: "الصيانة", amount: 1280 },
      { id: "exp_8", date: "2026-04-14", label: "أنابيب", category: "التجهيز", amount: 1900 },
      { id: "exp_9", date: "2026-04-29", label: "مصاريف بنكية", category: "الإدارة", amount: 240 },
      { id: "exp_10", date: "2026-05-07", label: "كهرباء المضخة", category: "الكهرباء", amount: 1835 },
      { id: "exp_11", date: "2026-05-18", label: "صيانة العداد العام", category: "الصيانة", amount: 1475 },
      { id: "exp_12", date: "2026-06-03", label: "قرطاسية", category: "الإدارة", amount: 310 },
      { id: "exp_13", date: "2026-06-22", label: "خدمات الحراسة", category: "الموارد البشرية", amount: 900 },
      { id: "exp_14", date: "2026-07-01", label: "إصلاح شبكة", category: "الصيانة", amount: 2100 },
      { id: "exp_15", date: "2026-07-13", label: "كهرباء المضخة", category: "الكهرباء", amount: 1880 },
      { id: "exp_16", date: "2026-07-20", label: "وقود المصلحة", category: "التنقل", amount: 550 },
      { id: "exp_17", date: "2026-07-24", label: "مستلزمات مكتب", category: "الإدارة", amount: 420 },
      { id: "exp_18", date: "2025-12-15", label: "تنقية الخزان", category: "الصيانة", amount: 1650 },
      { id: "exp_19", date: "2025-11-10", label: "كهرباء المضخة", category: "الكهرباء", amount: 1710 },
      { id: "exp_20", date: "2025-10-06", label: "أنابيب", category: "التجهيز", amount: 980 }
    ],
    employees: [
      { id: "emp_1", name: "عبد الرحيم أيت علي", position: "تقني الشبكة", phone: "0611223344", salary: 2800, hiredAt: "2022-05-01", status: "نشط" },
      { id: "emp_2", name: "فاطمة الزهراء المرابط", position: "عون استخلاص", phone: "0622334455", salary: 2400, hiredAt: "2023-02-15", status: "نشط" },
      { id: "emp_3", name: "مصطفى أيت لحسن", position: "حارس الخزان", phone: "0633445566", salary: 2100, hiredAt: "2021-09-10", status: "نشط" }
    ],
    receipts: []
  };
}

function calculateAmount(consumption, tariffs, fixedFee, vatEnabled, vatRate) {
  let remaining = Math.max(0, Number(consumption || 0));
  let subtotal = Number(fixedFee || 0);
  tariffs.slice().sort((a, b) => a.from - b.from).forEach((tier) => {
    if (remaining <= 0) return;
    const units = Math.min(remaining, tier.to - tier.from + 1);
    subtotal += units * Number(tier.price);
    remaining -= units;
  });
  const vat = vatEnabled ? subtotal * Number(vatRate || 0) / 100 : 0;
  return round(subtotal + vat);
}

function readDb() {
  if (!fs.existsSync(DATA_FILE)) {
    const seed = makeSeed();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
let db = readDb();
const save = () => fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));

function currentUser(req) {
  return req.session.user || null;
}
function requireAuth(req, res, next) {
  if (!currentUser(req)) return res.status(401).json({ error: "يجب تسجيل الدخول أولا" });
  next();
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.session.user?.role)) return res.status(403).json({ error: "ليست لديك صلاحية لهذا الإجراء" });
    next();
  };
}
const withRelations = (collection) => collection.map((item) => {
  const subscriber = db.subscribers.find((s) => s.id === item.subscriberId);
  return subscriber ? { ...item, subscriberName: subscriber.fullName, contractNumber: subscriber.contractNumber, centerName: db.centers.find((c) => c.id === subscriber.centerId)?.name || "" } : item;
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = db.users.find((u) => u.username === username && u.active && u.passwordHash === sha(password));
  if (!user) return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  req.session.user = { id: user.id, username: user.username, name: user.name, role: user.role };
  res.json({ user: req.session.user });
});
app.post("/api/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get("/api/me", (req, res) => res.json({ user: currentUser(req) }));

app.get("/api/bootstrap", requireAuth, (req, res) => {
  const unpaidBySubscriber = {};
  db.invoices.filter((invoice) => invoice.status !== "مؤداة").forEach((invoice) => {
    unpaidBySubscriber[invoice.subscriberId] = (unpaidBySubscriber[invoice.subscriberId] || 0) + 1;
  });
  res.json({
    user: currentUser(req),
    settings: db.settings,
    centers: db.centers,
    tariffs: db.tariffs,
    users: db.users.map(({ passwordHash, ...user }) => user),
    subscribers: db.subscribers,
    readings: withRelations(db.readings),
    invoices: withRelations(db.invoices),
    expenses: db.expenses,
    employees: db.employees,
    receipts: db.receipts,
    alerts: Object.entries(unpaidBySubscriber).filter(([, count]) => count >= db.settings.cutoffWarningInvoices).map(([subscriberId, count]) => ({ subscriberId, count }))
  });
});

app.get("/api/dashboard", requireAuth, (req, res) => {
  const year = String(req.query.year || "2026");
  const invoices = db.invoices.filter((x) => x.period.startsWith(year));
  const collected = invoices.filter((x) => x.status === "مؤداة").reduce((sum, x) => sum + x.amount + x.penalty, 0);
  const expenses = db.expenses.filter((x) => x.date.startsWith(year)).reduce((sum, x) => sum + Number(x.amount), 0);
  const centerTotals = db.centers.map((center) => {
    const subscriberIds = db.subscribers.filter((s) => s.centerId === center.id).map((s) => s.id);
    return { label: center.name, value: round(invoices.filter((x) => subscriberIds.includes(x.subscriberId) && x.status === "مؤداة").reduce((sum, x) => sum + x.amount, 0)) };
  });
  const periodTotals = [...new Set(invoices.map((x) => x.period))].sort().map((period) => ({ label: monthLabel(period), value: round(invoices.filter((x) => x.period === period && x.status === "مؤداة").reduce((sum, x) => sum + x.amount, 0)) }));
  res.json({ stats: { invoices: invoices.length, subscriptions: db.subscribers.filter((x) => x.status === "نشط").length, expenses: round(expenses), employees: db.employees.filter((x) => x.status === "نشط").length, collected: round(collected) }, centerTotals, periodTotals });
});

app.get("/api/subscribers", requireAuth, (req, res) => {
  const query = String(req.query.q || "").trim().toLowerCase();
  const rows = db.subscribers.filter((s) => !query || [s.fullName, s.contractNumber, s.cin, s.phone, s.meterNumber].some((v) => String(v).toLowerCase().includes(query)));
  res.json(rows);
});
app.post("/api/subscribers", requireRole("admin"), (req, res) => {
  const payload = { ...req.body, id: id("sub"), contractNumber: String(req.body.contractNumber || db.subscribers.length + 1), status: req.body.status || "نشط" };
  db.subscribers.push(payload); save(); res.status(201).json(payload);
});
app.put("/api/subscribers/:id", requireRole("admin"), (req, res) => {
  const index = db.subscribers.findIndex((x) => x.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: "المشترك غير موجود" });
  db.subscribers[index] = { ...db.subscribers[index], ...req.body, id: req.params.id }; save(); res.json(db.subscribers[index]);
});
app.patch("/api/subscribers/:id/status", requireRole("admin"), (req, res) => {
  const subscriber = db.subscribers.find((x) => x.id === req.params.id);
  if (!subscriber) return res.status(404).json({ error: "المشترك غير موجود" });
  subscriber.status = req.body.status; save(); res.json(subscriber);
});

app.get("/api/tariffs", requireAuth, (req, res) => res.json(db.tariffs));
app.put("/api/tariffs", requireRole("admin"), (req, res) => { db.tariffs = req.body.tariffs || []; db.settings.fixedFee = Number(req.body.fixedFee || 0); save(); res.json({ tariffs: db.tariffs, fixedFee: db.settings.fixedFee }); });
app.put("/api/settings", requireRole("admin"), (req, res) => { db.settings = { ...db.settings, ...req.body, membershipFee: Number(req.body.membershipFee), cutoffPenalty: Number(req.body.cutoffPenalty), fixedFee: Number(req.body.fixedFee), abnormalMin: Number(req.body.abnormalMin), abnormalMax: Number(req.body.abnormalMax), cutoffWarningInvoices: Number(req.body.cutoffWarningInvoices) }; save(); res.json(db.settings); });

app.get("/api/readings", requireAuth, (req, res) => {
  const rows = withRelations(db.readings.filter((r) => (!req.query.period || r.period === req.query.period) && (!req.query.centerId || db.subscribers.find((s) => s.id === r.subscriberId)?.centerId === req.query.centerId)));
  res.json(rows);
});
app.post("/api/readings/bulk", requireRole("admin", "agent"), (req, res) => {
  const { period, readings } = req.body;
  (readings || []).forEach((payload) => {
    const existing = db.readings.find((x) => x.period === period && x.subscriberId === payload.subscriberId);
    const previous = existing?.previousReading ?? db.readings.filter((x) => x.subscriberId === payload.subscriberId).sort((a, b) => b.period.localeCompare(a.period))[0]?.reading ?? 0;
    const reading = { id: existing?.id || id("read"), subscriberId: payload.subscriberId, period, previousReading: Number(payload.previousReading ?? previous), reading: Number(payload.reading), consumption: Math.max(0, Number(payload.reading) - Number(payload.previousReading ?? previous)), abnormal: Number(payload.reading) - Number(payload.previousReading ?? previous) < db.settings.abnormalMin || Number(payload.reading) - Number(payload.previousReading ?? previous) > db.settings.abnormalMax, recordedAt: now() };
    if (existing) Object.assign(existing, reading); else db.readings.push(reading);
  });
  save(); res.json({ ok: true, count: readings?.length || 0 });
});

app.get("/api/invoices", requireAuth, (req, res) => res.json(withRelations(db.invoices.filter((x) => !req.query.period || x.period === req.query.period))));
app.post("/api/invoices/generate", requireRole("admin", "agent"), (req, res) => {
  const period = String(req.body.period);
  const active = db.subscribers.filter((s) => s.status === "نشط");
  let created = 0;
  active.forEach((subscriber) => {
    if (db.invoices.some((x) => x.subscriberId === subscriber.id && x.period === period)) return;
    const reading = db.readings.find((x) => x.subscriberId === subscriber.id && x.period === period);
    if (!reading) return;
    const invoice = { id: id("inv"), invoiceNumber: `F-${period.replace("-", "")}-${subscriber.contractNumber.padStart(3, "0")}`, subscriberId: subscriber.id, period, consumption: reading.consumption, amount: calculateAmount(reading.consumption, db.tariffs, db.settings.fixedFee, db.settings.vatEnabled, db.settings.vatRate), penalty: 0, status: "غير مؤداة", issuedAt: now(), paidAt: null };
    db.invoices.push(invoice); created++;
  });
  save(); res.json({ created, period });
});
app.post("/api/invoices/:id/print", requireAuth, (req, res) => {
  const invoice = db.invoices.find((x) => x.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: "الفاتورة غير موجودة" });
  res.json({ invoice: { ...invoice, ...withRelations([invoice])[0] }, settings: db.settings });
});

app.post("/api/payments", requireRole("admin", "treasurer"), (req, res) => {
  const invoiceIds = req.body.invoiceIds || [];
  const selected = db.invoices.filter((x) => invoiceIds.includes(x.id) && x.status !== "مؤداة");
  if (!selected.length) return res.status(400).json({ error: "لم يتم اختيار فواتير غير مؤداة" });
  const penalty = Number(req.body.penalty || 0);
  selected.forEach((invoice) => { invoice.status = "مؤداة"; invoice.penalty = penalty; invoice.paidAt = now(); });
  const total = round(selected.reduce((sum, x) => sum + x.amount + x.penalty, 0));
  const receipt = { id: id("receipt"), receiptNumber: `R-${Date.now().toString().slice(-8)}`, invoiceIds, total, paidAt: now(), treasurer: db.settings.treasurer };
  db.receipts.push(receipt); save();
  res.json({ receipt, invoices: withRelations(selected), settings: db.settings });
});

function collectionRoute(name, collection) {
  app.get(`/api/${name}`, requireAuth, (req, res) => res.json(db[collection]));
  app.post(`/api/${name}`, requireRole("admin"), (req, res) => {
    const item = { ...req.body, id: id(name.slice(0, 3)) };
    if (collection === "users") {
      if (!item.password) return res.status(400).json({ error: "كلمة المرور مطلوبة" });
      item.passwordHash = sha(item.password);
      delete item.password;
      item.active = true;
    }
    db[collection].push(item);
    save();
    res.status(201).json(collection === "users" ? { ...item, passwordHash: undefined } : item);
  });
  app.put(`/api/${name}/:id`, requireRole("admin"), (req, res) => { const item = db[collection].find((x) => x.id === req.params.id); if (!item) return res.status(404).json({ error: "العنصر غير موجود" }); Object.assign(item, req.body); save(); res.json(item); });
  app.delete(`/api/${name}/:id`, requireRole("admin"), (req, res) => { db[collection] = db[collection].filter((x) => x.id !== req.params.id); save(); res.json({ ok: true }); });
}
collectionRoute("expenses", "expenses");
collectionRoute("employees", "employees");
collectionRoute("centers", "centers");
collectionRoute("users", "users");

app.get("/api/reports/:type", requireAuth, (req, res) => {
  const type = req.params.type;
  const data = {
    financial: { title: "التقرير المالي", rows: [{ البيان: "التحصيلات", المبلغ: round(db.invoices.filter((x) => x.status === "مؤداة").reduce((s, x) => s + x.amount, 0)) }, { البيان: "المصاريف", المبلغ: round(db.expenses.reduce((s, x) => s + Number(x.amount), 0)) }] },
    monthly: { title: "التقرير الشهري", rows: [...new Set(db.invoices.map((x) => x.period))].sort().map((period) => ({ الفترة: period, الفواتير: db.invoices.filter((x) => x.period === period).length, المحصل: round(db.invoices.filter((x) => x.period === period && x.status === "مؤداة").reduce((s, x) => s + x.amount, 0)) })) },
    expenses: { title: "تقارير المصاريف", rows: db.expenses },
    payments: { title: "تقارير الدفعات", rows: db.receipts },
    subscribers: { title: "تقارير المشتركين", rows: db.subscribers },
    consumption: { title: "تقارير الإستهلاك", rows: db.readings },
    employees: { title: "تقارير الموظفين", rows: db.employees }
  }[type];
  res.json(data || { title: "تقرير", rows: [] });
});

app.use(express.static(publicDir));
app.get(/.*/, (req, res) => res.sendFile(path.join(publicDir, "index.html")));

app.listen(PORT);