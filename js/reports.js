const API_BASE = "https://earlystep22.runasp.net/api/";

if (window.lucide) {
  lucide.createIcons();
}
const reportsGrid = document.getElementById("reportsGrid");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const retryBtn = document.getElementById("retryBtn");

const reportsCount = document.getElementById("reportsCount");

const searchInput = document.getElementById("searchInput");
const childFilter = document.getElementById("childFilter");

const currentDate = document.getElementById("currentDate");

const themeToggle = document.getElementById("themeToggle");

const notificationToggle = document.getElementById("notificationToggle");

const notificationPanel = document.getElementById("notificationPanel");

const sidebarUserName = document.getElementById("sidebarUserName");

const userAvatar = document.getElementById("userAvatar");

const reportModal = document.getElementById("reportModal");

const closeModal = document.getElementById("closeModal");

const modalTitle = document.getElementById("modalTitle");

const modalChild = document.getElementById("modalChild");

const modalWeaknesses = document.getElementById("modalWeaknesses");

const modalRecommendations = document.getElementById("modalRecommendations");

const modalDownload = document.getElementById("modalDownload");

let allReports = [];

let currentReportId = null;

function loadUserInfo() {
  const fullName = localStorage.getItem("fullName");

  if (fullName && fullName.trim() !== "") {
    if (sidebarUserName) {
      sidebarUserName.textContent = fullName;
    }

    if (userAvatar) {
      userAvatar.textContent = fullName.trim().charAt(0);
    }
  } else {
    if (sidebarUserName) {
      sidebarUserName.textContent = "المستخدم";
    }

    if (userAvatar) {
      userAvatar.textContent = "م";
    }
  }
}

function updateCurrentDate() {
  if (!currentDate) {
    return;
  }

  const today = new Date();

  const formattedDate = today.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  currentDate.textContent = formattedDate;
}

function updateThemeIcon() {
  if (!themeToggle) {
    return;
  }

  const isDark = document.body.classList.contains("dark-mode");

  themeToggle.innerHTML = `
    <i data-lucide="${isDark ? "moon" : "sun"}"></i>
  `;

  themeToggle.title = isDark ? "تفعيل المظهر الفاتح" : "تفعيل المظهر الداكن";

  themeToggle.setAttribute("aria-label", themeToggle.title);

  if (window.lucide) {
    lucide.createIcons();
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }

  updateThemeIcon();
}

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    localStorage.setItem("theme", isDark ? "dark" : "light");

    updateThemeIcon();
  });
}

if (notificationToggle) {
  notificationToggle.addEventListener("click", function (event) {
    event.stopPropagation();

    if (notificationPanel) {
      notificationPanel.classList.toggle("show");
    }
  });
}

document.addEventListener("click", function (event) {
  if (notificationPanel && !event.target.closest(".notification-wrapper")) {
    notificationPanel.classList.remove("show");
  }
});

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", function (event) {
    event.preventDefault();

    localStorage.removeItem("accessToken");

    localStorage.removeItem("fullName");

    window.location.href = "../login.html";
  });
}
function getToken() {
  return localStorage.getItem("accessToken");
}

function showLoading() {
  if (loading) {
    loading.style.display = "flex";
  }

  if (emptyState) {
    emptyState.style.display = "none";
  }

  if (errorState) {
    errorState.style.display = "none";
  }

  if (reportsGrid) {
    reportsGrid.innerHTML = "";
  }
}

function showEmpty() {
  if (loading) {
    loading.style.display = "none";
  }

  if (errorState) {
    errorState.style.display = "none";
  }

  if (emptyState) {
    emptyState.style.display = "flex";
  }

  if (reportsGrid) {
    reportsGrid.innerHTML = "";
  }
}
function showError(message) {
  if (loading) {
    loading.style.display = "none";
  }

  if (emptyState) {
    emptyState.style.display = "none";
  }

  if (errorState) {
    errorState.style.display = "flex";
  }

  if (errorMessage) {
    errorMessage.textContent = message || "حدث خطأ أثناء تحميل البيانات.";
  }

  if (reportsGrid) {
    reportsGrid.innerHTML = "";
  }
}

function hideStates() {
  if (loading) {
    loading.style.display = "none";
  }

  if (emptyState) {
    emptyState.style.display = "none";
  }

  if (errorState) {
    errorState.style.display = "none";
  }
}

function extractArray(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (result && Array.isArray(result.data)) {
    return result.data;
  }

  if (result && Array.isArray(result.reports)) {
    return result.reports;
  }

  if (result && Array.isArray(result.items)) {
    return result.items;
  }

  if (result && Array.isArray(result.result)) {
    return result.result;
  }

  return [];
}

async function loadChildren() {
  const token = getToken();

  if (!token) {
    console.error("Access Token غير موجود");

    return;
  }

  try {
    const response = await fetch(API_BASE + "Children/GetMyChildren", {
      method: "GET",

      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const responseText = await response.text();

    let result = null;

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (error) {
        console.error("Children response is not JSON:", responseText);

        return;
      }
    }

    if (!response.ok) {
      console.error("GetMyChildren failed:", result);

      return;
    }

    const children = extractArray(result);

    if (!childFilter) {
      return;
    }

    childFilter.innerHTML = `
      <option value="">
        جميع الأطفال
      </option>
    `;

    children.forEach(function (child) {
      const childId = child.id || child.childId || child.Id || child.ChildId;

      const childName =
        child.name ||
        child.fullName ||
        child.childName ||
        child.Name ||
        child.FullName ||
        "طفل";

      if (!childId) {
        return;
      }

      const option = document.createElement("option");

      option.value = childId;

      option.textContent = childName;

      childFilter.appendChild(option);
    });
  } catch (error) {
    console.error("Load children failed:", error);
  }
}

async function loadAllReports() {
  const token = getToken();

  if (!token) {
    showError("لم يتم العثور على رمز تسجيل الدخول.");

    return;
  }

  showLoading();

  try {
    const response = await fetch(API_BASE + "Reports/my", {
      method: "GET",

      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const responseText = await response.text();

    let result = null;

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (error) {
        console.error("Reports response is not JSON:", responseText);
      }
    }

    if (!response.ok) {
      throw new Error(
        result?.message ||
          result?.title ||
          responseText ||
          "تعذر تحميل التقارير",
      );
    }

    allReports = extractArray(result);

    console.log("Reports:", allReports);

    renderReports(allReports);
  } catch (error) {
    console.error("Load reports failed:", error);

    showError(error.message || "حدث خطأ أثناء تحميل التقارير.");
  }
}
async function loadReportsByChildId(childId) {
  const token = getToken();

  if (!token) {
    showError("لم يتم العثور على رمز تسجيل الدخول.");

    return;
  }

  if (!childId) {
    await loadAllReports();

    return;
  }

  showLoading();

  try {
    const response = await fetch(
      API_BASE + "Reports/child/" + encodeURIComponent(childId),
      {
        method: "GET",

        headers: {
          Authorization: "Bearer " + token,
        },
      },
    );

    const responseText = await response.text();

    let result = null;

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (error) {
        console.error("Child reports response is not JSON:", responseText);
      }
    }

    if (!response.ok) {
      throw new Error(
        result?.message ||
          result?.title ||
          responseText ||
          "تعذر تحميل تقارير الطفل",
      );
    }

    allReports = extractArray(result);

    console.log("Child Reports:", allReports);

    renderReports(allReports);
  } catch (error) {
    console.error("Load child reports failed:", error);

    showError(error.message || "تعذر تحميل تقارير الطفل.");
  }
}

function getReportId(report) {
  return report?.id || report?.reportId || report?.Id || report?.ReportId || "";
}

function getReportTitle(report) {
  return (
    report?.title ||
    report?.name ||
    report?.Title ||
    report?.Name ||
    "تقرير تقييم"
  );
}

function getReportChildId(report) {
  return (
    report?.childId ||
    report?.ChildId ||
    report?.child?.id ||
    report?.child?.childId ||
    ""
  );
}

function getReportChildName(report) {
  return (
    report?.childName ||
    report?.ChildName ||
    report?.child?.name ||
    report?.child?.fullName ||
    report?.child?.Name ||
    report?.child?.FullName ||
    "الطفل"
  );
}
function getWeaknesses(report) {
  return report?.weaknesses || report?.Weaknesses || "لا توجد نقاط ضعف مسجلة.";
}
function getRecommendations(report) {
  return (
    report?.recommendations ||
    report?.Recommendations ||
    "لا توجد توصيات مسجلة."
  );
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char];
  });
}
function renderReports(reports) {
  hideStates();

  if (!reports || !reports.length) {
    if (reportsCount) {
      reportsCount.textContent = "0 تقرير";
    }

    showEmpty();

    return;
  }

  if (reportsCount) {
    reportsCount.textContent =
      reports.length + (reports.length === 1 ? " تقرير" : " تقارير");
  }

  reportsGrid.innerHTML = reports
    .map(function (report) {
      const id = getReportId(report);

      const title = getReportTitle(report);

      const childName = getReportChildName(report);

      const weaknesses = getWeaknesses(report);

      const recommendations = getRecommendations(report);

      return `
            <article
              class="report-card"
              data-report-id="${escapeHTML(id)}"
              data-title="${escapeHTML(title)}"
              data-child="${escapeHTML(childName)}"
            >

              <div class="report-card-top">

                <div class="report-card-icon">
                  <i data-lucide="file-text"></i>
                </div>

                <span class="report-badge">
                  تقرير تقييم
                </span>

              </div>


              <div class="report-card-body">

                <h3>
                  ${escapeHTML(title)}
                </h3>

                <div class="report-child">

                  <i data-lucide="user-round"></i>

                  <span>
                    ${escapeHTML(childName)}
                  </span>

                </div>


                <div class="report-preview">

                  <div class="preview-item">

                    <span>
                      نقاط الضعف
                    </span>

                    <p>
                      ${escapeHTML(truncateText(weaknesses, 100))}
                    </p>

                  </div>


                  <div class="preview-item">

                    <span>
                      التوصيات
                    </span>

                    <p>
                      ${escapeHTML(truncateText(recommendations, 100))}
                    </p>

                  </div>

                </div>

              </div>


              <div class="report-card-actions">

                <button
                  class="view-report-btn"
                  onclick="openReportModal('${escapeHTML(id)}')"
                >
                  <i data-lucide="eye"></i>
                  عرض التقرير
                </button>


                <button
                  class="download-card-btn"
                  title="تنزيل التقرير"
                  onclick="downloadReport('${escapeHTML(id)}')"
                >
                  <i data-lucide="download"></i>
                </button>

              </div>

            </article>
          `;
    })
    .join("");

  if (window.lucide) {
    lucide.createIcons();
  }

  applySearchFilter();
}
function truncateText(text, maxLength) {
  const value = String(text ?? "");

  if (value.length <= maxLength) {
    return value;
  }

  return value.substring(0, maxLength) + "...";
}
function applySearchFilter() {
  if (!reportsGrid) {
    return;
  }

  const searchValue = (searchInput?.value || "").trim().toLowerCase();

  const cards = reportsGrid.querySelectorAll(".report-card");

  let visibleCount = 0;

  cards.forEach(function (card) {
    const title = (card.dataset.title || "").toLowerCase();

    const child = (card.dataset.child || "").toLowerCase();

    const matches =
      !searchValue ||
      title.includes(searchValue) ||
      child.includes(searchValue);

    card.style.display = matches ? "" : "none";

    if (matches) {
      visibleCount++;
    }
  });

  const existingSearchEmpty = document.getElementById("searchEmpty");

  if (visibleCount === 0 && cards.length > 0) {
    if (!existingSearchEmpty) {
      const message = document.createElement("div");

      message.id = "searchEmpty";

      message.className = "search-empty";

      message.innerHTML = `
        <div class="state-icon">
          <i data-lucide="search-x"></i>
        </div>

        <strong>
          لا توجد نتائج
        </strong>

        <p>
          لم نجد تقريرًا مطابقًا لبحثك.
        </p>
      `;

      reportsGrid.appendChild(message);

      if (window.lucide) {
        lucide.createIcons();
      }
    }
  } else {
    if (existingSearchEmpty) {
      existingSearchEmpty.remove();
    }
  }
}

if (searchInput) {
  searchInput.addEventListener("input", applySearchFilter);
}

if (childFilter) {
  childFilter.addEventListener("change", function () {
    const childId = childFilter.value;

    if (childId) {
      loadReportsByChildId(childId);
    } else {
      loadAllReports();
    }
  });
}
async function openReportModal(reportId) {
  if (!reportId) {
    alert("معرّف التقرير غير موجود.");

    return;
  }

  const report = allReports.find(function (item) {
    return String(getReportId(item)) === String(reportId);
  });

  if (report) {
    fillReportModal(report);

    return;
  }

  await loadSingleReport(reportId);
}

async function loadSingleReport(reportId) {
  const token = getToken();

  if (!token) {
    return;
  }

  try {
    const response = await fetch(
      API_BASE + "Reports/" + encodeURIComponent(reportId),
      {
        method: "GET",

        headers: {
          Authorization: "Bearer " + token,
        },
      },
    );

    const responseText = await response.text();

    let result = null;

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (error) {
        console.error("Get One Report response is not JSON:", responseText);
      }
    }

    if (!response.ok) {
      throw new Error(
        result?.message ||
          result?.title ||
          responseText ||
          "التقرير غير موجود.",
      );
    }

    fillReportModal(result);
  } catch (error) {
    console.error("Load single report failed:", error);

    alert(error.message || "تعذر تحميل التقرير.");
  }
}
function fillReportModal(report) {
  const id = getReportId(report);

  currentReportId = id;

  if (modalTitle) {
    modalTitle.textContent = getReportTitle(report);
  }

  if (modalChild) {
    modalChild.textContent = getReportChildName(report);
  }

  if (modalWeaknesses) {
    modalWeaknesses.textContent = getWeaknesses(report);
  }

  if (modalRecommendations) {
    modalRecommendations.textContent = getRecommendations(report);
  }

  if (reportModal) {
    reportModal.classList.add("show");

    document.body.style.overflow = "hidden";
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

function closeReportModal() {
  if (reportModal) {
    reportModal.classList.remove("show");
  }

  document.body.style.overflow = "";

  currentReportId = null;
}

if (closeModal) {
  closeModal.addEventListener("click", closeReportModal);
}

if (reportModal) {
  reportModal.addEventListener("click", function (event) {
    if (event.target === reportModal) {
      closeReportModal();
    }
  });
}

document.addEventListener("keydown", function (event) {
  if (
    event.key === "Escape" &&
    reportModal &&
    reportModal.classList.contains("show")
  ) {
    closeReportModal();
  }
});
if (modalDownload) {
  modalDownload.addEventListener("click", function () {
    if (currentReportId) {
      downloadReport(currentReportId);
    }
  });
}
async function downloadReport(reportId) {
  if (!reportId) {
    alert("معرّف التقرير غير موجود.");

    return;
  }

  const token = getToken();

  if (!token) {
    alert("انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.");

    return;
  }

  try {
    const response = await fetch(
      API_BASE + "Reports/" + encodeURIComponent(reportId) + "/download",
      {
        method: "GET",

        headers: {
          Authorization: "Bearer " + token,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      let errorResult = null;

      try {
        errorResult = JSON.parse(errorText);
      } catch (error) {}

      throw new Error(
        errorResult?.message ||
          errorResult?.title ||
          errorText ||
          "تعذر تنزيل التقرير.",
      );
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "report-" + reportId + ".pdf";

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download report failed:", error);

    alert(error.message || "تعذر تنزيل التقرير.");
  }
}
if (retryBtn) {
  retryBtn.addEventListener("click", function () {
    loadAllReports();
  });
}

document.querySelectorAll(".nav-item").forEach(function (item) {
  item.addEventListener("click", function () {
    document.querySelectorAll(".nav-item").forEach(function (x) {
      x.classList.remove("active");
    });

    this.classList.add("active");
  });
});

document.addEventListener("DOMContentLoaded", async function () {
  loadUserInfo();

  updateCurrentDate();

  initializeTheme();

  await loadChildren();

  await loadAllReports();

  if (window.lucide) {
    lucide.createIcons();
  }
});
