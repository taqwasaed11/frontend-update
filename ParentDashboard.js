const API_BASE = "https://earlystep22.runasp.net/api/";
lucide.createIcons();

const fullName = localStorage.getItem("fullName");

const userFullName = document.getElementById("userFullName");

const sidebarUserName = document.getElementById("sidebarUserName");

if (fullName && fullName.trim() !== "") {
  userFullName.textContent = fullName;

  sidebarUserName.textContent = fullName;
} else {
  userFullName.textContent = "المستخدم";

  sidebarUserName.textContent = "المستخدم";
}

const themeToggle = document.getElementById("themeToggle");

function updateThemeIcon() {
  const isDark = document.body.classList.contains("dark-mode");

  themeToggle.innerHTML = `
    <i data-lucide="${isDark ? "moon" : "sun"}"></i>
  `;

  themeToggle.title = isDark ? "تفعيل المظهر الفاتح" : "تفعيل المظهر الداكن";

  themeToggle.setAttribute("aria-label", themeToggle.title);

  lucide.createIcons();
}

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
}

updateThemeIcon();

themeToggle.addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");

  const isDark = document.body.classList.contains("dark-mode");

  localStorage.setItem("theme", isDark ? "dark" : "light");

  updateThemeIcon();
});

const notificationToggle = document.getElementById("notificationToggle");

const notificationPanel = document.getElementById("notificationPanel");

notificationToggle.addEventListener("click", function (event) {
  event.stopPropagation();

  notificationPanel.classList.toggle("show");
});

document.addEventListener("click", function (event) {
  if (!event.target.closest(".notification-wrapper")) {
    notificationPanel.classList.remove("show");
  }
});

function goToPage(page) {
  window.location.href = page;
}

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function () {
    document.querySelectorAll(".nav-item").forEach((x) => {
      x.classList.remove("active");
    });

    this.classList.add("active");
  });
});
async function loadChildrenCount() {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    console.error("Access Token غير موجود");

    return;
  }

  try {
    const response = await fetch(
      "https://earlystep22.runasp.net/api/Children/GetMyChildren",
      {
        method: "GET",

        headers: {
          Authorization: "Bearer " + token,
        },
      },
    );

    const responseText = await response.text();

    console.log("Children API Response:", responseText);

    let result = null;

    try {
      result = JSON.parse(responseText);
    } catch (error) {
      console.error("Children response is not JSON:", responseText);

      return;
    }
    let children = [];

    if (Array.isArray(result)) {
      children = result;
    } else if (Array.isArray(result.data)) {
      children = result.data;
    } else if (Array.isArray(result.children)) {
      children = result.children;
    } else if (Array.isArray(result.items)) {
      children = result.items;
    } else if (Array.isArray(result.result)) {
      children = result.result;
    }
    if (!response.ok) {
      console.error("GetMyChildren failed:", result);

      return;
    }
    const childrenCount = children.length;

    console.log("عدد الأطفال:", childrenCount);
    const childrenCountElement = document.getElementById("childrenCount");

    if (childrenCountElement) {
      childrenCountElement.textContent = childrenCount;
    } else {
      console.error("لم يتم العثور على العنصر childrenCount في الصفحة");
    }
  } catch (error) {
    console.error("Error loading children count:", error);
  }
}
document.addEventListener("DOMContentLoaded", function () {
  const fullName = localStorage.getItem("fullName");

  console.log("Full Name from localStorage:", fullName);

  const userFullName = document.getElementById("userFullName");

  const sidebarUserName = document.getElementById("sidebarUserName");

  if (fullName && fullName.trim() !== "") {
    userFullName.textContent = fullName;

    sidebarUserName.textContent = fullName;
  } else {
    userFullName.textContent = "المستخدم";

    sidebarUserName.textContent = "المستخدم";

    console.log("لم يتم العثور على fullName في localStorage");
  }

  loadChildrenCount();
});
function updateDashboardDate() {
  const today = new Date();

  const formattedDate = today.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dateElement = document.getElementById("dashboardDate");

  if (dateElement) {
    dateElement.textContent = formattedDate;
  }
}

updateDashboardDate();
async function loadLatestReports() {
  const container = document.getElementById("latestReports");

  if (!container) {
    return;
  }

  const token = localStorage.getItem("accessToken");

  if (!token) {
    return;
  }

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

    let data = [];

    if (Array.isArray(result)) {
      data = result;
    } else {
      for (const key of ["data", "reports", "items", "result"]) {
        if (Array.isArray(result?.[key])) {
          data = result[key];
          break;
        }
      }
    }

    if (!data.length) {
      container.innerHTML = `
        <div class="latest-empty">

          <div class="latest-empty-icon">
            <i data-lucide="file-text"></i>
          </div>

          <strong>
            لا توجد تقارير حديثة
          </strong>

        </div>
      `;

      if (window.lucide) {
        lucide.createIcons();
      }

      return;
    }

    const latest = data.slice(0, 3);

    container.innerHTML = latest
      .map((report) => {
        const id = report.id || report.reportId || "";

        const title = report.title || report.name || "تقرير تقييم";

        const childName =
          report.childName ||
          report.child?.fullName ||
          report.child?.name ||
          "الطفل";

        return `
          <div class="latest-report">

            <div class="latest-report-icon">
              <i data-lucide="file-text"></i>
            </div>

            <div class="latest-report-info">

              <strong>
                ${escapeDashboardText(title)}
              </strong>

              <span>
                ${escapeDashboardText(childName)}
              </span>

            </div>

            <button
              class="latest-report-download"
              title="تنزيل التقرير"
              onclick="downloadDashboardReport('${id}')"
            >
              <i data-lucide="download"></i>
            </button>

          </div>
        `;
      })
      .join("");

    if (window.lucide) {
      lucide.createIcons();
    }
  } catch (error) {
    console.error("Load latest reports failed:", error);

    container.innerHTML = `
      <div class="latest-empty">

        <div class="latest-empty-icon">
          <i data-lucide="file-warning"></i>
        </div>

        <strong>
          تعذر تحميل التقارير
        </strong>

      </div>
    `;

    if (window.lucide) {
      lucide.createIcons();
    }
  }
}

async function downloadDashboardReport(id) {
  if (!id) {
    alert("معرّف التقرير غير موجود.");

    return;
  }

  try {
    const response = await fetch(
      API_BASE + "Reports/" + encodeURIComponent(id) + "/download",
      {
        method: "GET",

        headers: {
          Authorization: "Bearer " + localStorage.getItem("accessToken"),
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();

      throw new Error(text || "تعذر تنزيل التقرير");
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "report-" + id + ".pdf";

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Dashboard report download failed:", error);

    alert(error.message);
  }
}

function escapeDashboardText(value) {
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

loadLatestReports();
