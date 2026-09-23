const API_BASE = "https://earlystep22.runasp.net/api/";

let children = [];
let editingId = null;
let selectedId = null;

const $ = (id) => document.getElementById(id);

function headers() {
  const token = localStorage.getItem("accessToken");

  return token
    ? {
        Authorization: "Bearer " + token,
      }
    : {};
}

function arr(data) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of ["data", "children", "items", "result"]) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

function esc(value) {
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

function gender(value) {
  if (!value) {
    return "غير محدد";
  }

  const valueLower = String(value).toLowerCase();

  if (
    valueLower === "female" ||
    valueLower === "بنت" ||
    valueLower === "girl"
  ) {
    return "بنت";
  }

  if (valueLower === "male" || valueLower === "ولد" || valueLower === "boy") {
    return "ولد";
  }

  return value;
}

function calculateAge(birthDate) {
  if (!birthDate) {
    return "-";
  }

  const birth = new Date(birthDate);

  if (isNaN(birth.getTime())) {
    return "-";
  }

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return Math.max(0, age);
}

function inputDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const value = String(dateValue);

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);

  if (match) {
    return match[1];
  }

  return "";
}

function apiDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  return `${dateValue}T00:00:00.000Z`;
}

function getApiErrorMessage(result, responseText) {
  if (result?.message) {
    return result.message;
  }

  if (
    result?.title &&
    result.title !== "One or more validation errors occurred."
  ) {
    return result.title;
  }

  if (result?.errors) {
    const messages = [];

    Object.keys(result.errors).forEach((key) => {
      const fieldErrors = result.errors[key];

      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((error) => {
          messages.push(`${key}: ${error}`);
        });
      } else if (fieldErrors) {
        messages.push(`${key}: ${fieldErrors}`);
      }
    });

    if (messages.length > 0) {
      return messages.join(" | ");
    }
  }

  if (result?.error) {
    return result.error;
  }

  if (
    responseText &&
    responseText !== "One or more validation errors occurred."
  ) {
    return responseText;
  }

  return "تعذر تنفيذ العملية.";
}

function renderChildren(list = children) {
  const countElement = $("count");

  if (countElement) {
    countElement.textContent = `${list.length} ${
      list.length === 1 ? "طفل" : "أطفال"
    }`;
  }

  if (!list.length) {
    $("grid").innerHTML = `
      <div class="empty">

        <div class="emptyIcon">
          <i data-lucide="users-round"></i>
        </div>

        <b>
          لا يوجد أطفال مضافون بعد
        </b>

        <p>
          أضف طفلًا لبدء متابعة
          الاختبارات والألعاب والتقارير.
        </p>

        <button
          class="primary"
          onclick="openAdd()"
        >
          + إضافة طفل
        </button>

      </div>
    `;

    if (window.lucide) {
      lucide.createIcons();
    }

    return;
  }

  $("grid").innerHTML = list
    .map((child) => {
      const name = child.fullName || child.FullName || child.name || "بدون اسم";

      const childGender = gender(child.gender ?? child.Gender);

      const childAge =
        child.age ??
        child.Age ??
        calculateAge(child.birthDate ?? child.BirthDate);

      return `
        <article class="child">

          <div class="childTop">

            <div class="avatarChild">
              ${esc(name[0] || "ط")}
            </div>

            <div class="childName">

              <b>
                ${esc(name)}
              </b>

              <small>
                ${esc(childGender)}
                •
                ${
                  childAge === "-" || childAge === null
                    ? "العمر غير محدد"
                    : esc(childAge) + " سنوات"
                }
              </small>

            </div>

            <button
              class="dots"
              onclick="showChildDetails('${child.id}')"
            >
              •••
            </button>

          </div>

          <div class="info">

            <div>

              <small>
                العمر
              </small>

              <b>
                ${
                  childAge === "-" || childAge === null
                    ? "غير محدد"
                    : esc(childAge) + " سنوات"
                }
              </b>

            </div>

            <div>

              <small>
                الجنس
              </small>

              <b>
                ${esc(childGender)}
              </b>

            </div>

          </div>

          <div class="actions">

            <button
              onclick="showChildDetails('${child.id}')"
            >
              👁 الملف
            </button>

            <button
              onclick="editChild('${child.id}')"
            >
              ✎ تعديل
            </button>

            <button
              onclick="showChildDetails('${child.id}', 'games')"
            >
              🎮 الألعاب
            </button>

            <button
              class="danger"
              onclick="deleteChild('${child.id}')"
            >
              🗑 حذف
            </button>

          </div>

        </article>
      `;
    })
    .join("");

  if (window.lucide) {
    lucide.createIcons();
  }
}

async function loadChildren() {
  if (!localStorage.getItem("accessToken")) {
    window.location.href = "../login/login.html";
    return;
  }

  $("grid").innerHTML = `
    <div class="loading">
      جاري تحميل الأطفال...
    </div>
  `;

  try {
    const response = await fetch(API_BASE + "Children/GetMyChildren", {
      method: "GET",
      headers: headers(),
    });

    const responseText = await response.text();

    let result = null;

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (error) {
        console.error("Response is not JSON:", responseText);
      }
    }

    if (!response.ok) {
      throw new Error(getApiErrorMessage(result, responseText));
    }

    children = arr(result);

    console.log("Children loaded:", children);

    renderChildren();
  } catch (error) {
    console.error("Get children failed:", error);

    $("grid").innerHTML = `
      <div class="empty">

        <div class="emptyIcon">
          ⚠️
        </div>

        <b>
          تعذر تحميل الأطفال
        </b>

        <p>
          ${esc(error.message)}
        </p>

        <button
          class="primary"
          onclick="loadChildren()"
        >
          إعادة المحاولة
        </button>

      </div>
    `;
  }
}

function openAdd() {
  editingId = null;

  $("formTitle").textContent = "إضافة طفل";

  $("name").value = "";

  $("birth").value = "";

  $("gender").value = "";

  $("formError").textContent = "";

  $("formError").style.display = "none";

  $("overlay").classList.add("show");
}

function editChild(id) {
  const child = children.find((item) => String(item.id) === String(id));

  if (!child) {
    return;
  }

  editingId = id;

  $("formTitle").textContent = "تعديل بيانات الطفل";

  $("name").value = child.fullName || child.FullName || child.name || "";

  $("birth").value = inputDate(child.birthDate ?? child.BirthDate ?? "");

  $("gender").value = gender(child.gender ?? child.Gender);

  $("formError").textContent = "";

  $("formError").style.display = "none";

  $("overlay").classList.add("show");
}

function closeForm() {
  $("overlay").classList.remove("show");

  editingId = null;
}

async function saveChild(event) {
  event.preventDefault();

  const name = $("name").value.trim();

  const birth = $("birth").value;

  const selectedGender = $("gender").value;

  if (!name) {
    $("formError").textContent = "الرجاء إدخال اسم الطفل.";

    $("formError").style.display = "block";

    $("name").focus();

    return;
  }

  if (!birth) {
    $("formError").textContent = "الرجاء تحديد تاريخ ميلاد الطفل.";

    $("formError").style.display = "block";

    $("birth").focus();

    return;
  }

  if (!selectedGender) {
    $("formError").textContent = "الرجاء اختيار جنس الطفل.";

    $("formError").style.display = "block";

    $("gender").focus();

    return;
  }

  const formData = new FormData();

  if (editingId) {
    formData.append("fullName", name);
  } else {
    formData.append("FullName", name);
  }

  const formattedBirthDate = apiDate(birth);

  formData.append("birthDate", formattedBirthDate);

  formData.append("gender", selectedGender);

  console.log("========== CHILD REQUEST ==========");

  console.log("Mode:", editingId ? "EDIT" : "ADD");

  console.log("FullName:", name);

  console.log("BirthDate:", formattedBirthDate);

  console.log("Gender:", selectedGender);

  console.log("===================================");

  const saveButton = $("save");

  const oldText = saveButton.textContent;

  saveButton.disabled = true;

  saveButton.textContent = "جاري الحفظ...";

  $("formError").style.display = "none";

  try {
    let url = API_BASE + "Children";

    if (editingId) {
      url += "/" + encodeURIComponent(editingId);
    }

    const response = await fetch(url, {
      method: editingId ? "PATCH" : "POST",

      headers: headers(),

      body: formData,
    });

    const responseText = await response.text();

    console.log("API Status:", response.status);

    console.log("API Response:", responseText);

    let result = null;

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (error) {
        console.log("Response is not JSON");
      }
    }

    if (!response.ok) {
      throw new Error(getApiErrorMessage(result, responseText));
    }

    console.log("Child saved successfully:", result);

    const wasEditing = Boolean(editingId);

    closeForm();

    await loadChildren();

    alert(
      wasEditing ? "تم تعديل بيانات الطفل بنجاح." : "تمت إضافة الطفل بنجاح.",
    );
  } catch (error) {
    console.error("Save child failed:", error);

    $("formError").textContent = error.message;

    $("formError").style.display = "block";
  } finally {
    saveButton.disabled = false;

    saveButton.textContent = oldText;
  }
}

async function deleteChild(id) {
  const child = children.find((item) => String(item.id) === String(id));

  const name = child?.fullName || child?.FullName || child?.name || "هذا الطفل";

  const confirmed = confirm(`هل أنت متأكد من حذف "${name}"؟`);

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      API_BASE + "Children/" + encodeURIComponent(id),
      {
        method: "DELETE",
        headers: headers(),
      },
    );

    const responseText = await response.text();

    let result = null;

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (error) {}
    }

    if (!response.ok) {
      throw new Error(getApiErrorMessage(result, responseText));
    }

    console.log("Child deleted successfully");

    await loadChildren();

    alert("تم حذف الطفل بنجاح.");
  } catch (error) {
    console.error("Delete child failed:", error);

    alert(error.message);
  }
}

function showChildDetails(id, tab = "info") {
  selectedId = id;

  const child = children.find((item) => String(item.id) === String(id));

  if (!child) {
    return;
  }

  const name = child.fullName || child.FullName || child.name || "بدون اسم";

  const childGender = gender(child.gender ?? child.Gender);

  const childAge =
    child.age ?? child.Age ?? calculateAge(child.birthDate ?? child.BirthDate);

  $("detailName").textContent = name;

  $("detailBasic").textContent = `${childGender} • ${
    childAge === "-" || childAge === null
      ? "العمر غير محدد"
      : childAge + " سنوات"
  }`;

  $("detailAvatar").textContent = name[0] || "ط";

  document.querySelectorAll(".tab").forEach((tabElement) => {
    tabElement.classList.toggle("active", tabElement.dataset.tab === tab);
  });

  $("details").classList.add("show");

  loadChildTab(tab);
}

async function loadChildTab(tab) {
  const child = children.find((item) => String(item.id) === String(selectedId));

  if (!child) {
    return;
  }

  if (tab === "info") {
    const name = child.fullName || child.FullName || child.name || "-";

    const childAge =
      child.age ??
      child.Age ??
      calculateAge(child.birthDate ?? child.BirthDate);

    const childGender = gender(child.gender ?? child.Gender);

    $("detailContent").innerHTML = `
      <div class="rows">

        <div>

          <b>
            الاسم الكامل
          </b>

          <span>
            ${esc(name)}
          </span>

        </div>

        <div>

          <b>
            العمر
          </b>

          <span>
            ${
              childAge === "-" || childAge === null
                ? "العمر غير محدد"
                : esc(childAge) + " سنوات"
            }
          </span>

        </div>

        <div>

          <b>
            الجنس
          </b>

          <span>
            ${esc(childGender)}
          </span>

        </div>

        <div>

          <b>
            معرّف الطفل
          </b>

          <span>
            ${esc(child.id || "-")}
          </span>

        </div>

      </div>
    `;

    return;
  }

  let endpoint = "";

  if (tab === "games") {
    endpoint = `Children/${selectedId}/games`;
  } else if (tab === "tests") {
    endpoint = `Children/${selectedId}/tests`;
  } else if (tab === "reports") {
    endpoint = `Children/${selectedId}/reports`;
  }

  $("detailContent").innerHTML = `
    <div class="loading">
      جاري التحميل...
    </div>
  `;

  try {
    const response = await fetch(API_BASE + endpoint, {
      method: "GET",
      headers: headers(),
    });

    const responseText = await response.text();

    let result = null;

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (error) {
        console.log("Response is not JSON");
      }
    }

    if (!response.ok) {
      throw new Error(getApiErrorMessage(result, responseText));
    }

    const data = arr(result);

    if (!data.length) {
      $("detailContent").innerHTML = `
        <div class="noData">
          لا توجد بيانات حاليًا.
        </div>
      `;

      return;
    }

    $("detailContent").innerHTML = `
      <div class="rows">

        ${data
          .map((item) => {
            const title =
              item.name ||
              item.title ||
              item.activityName ||
              item.gameName ||
              item.testName ||
              item.reportName ||
              "عنصر";

            let extra = "";

            if (item.score !== undefined && item.score !== null) {
              extra += `النتيجة: ${esc(item.score)}`;
            }

            if (item.date) {
              if (extra) {
                extra += " • ";
              }

              const date = new Date(item.date);

              if (!isNaN(date.getTime())) {
                extra += date.toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              }
            }

            return `
              <div>

                <b>
                  ${esc(title)}
                </b>

                <span>
                  ${esc(extra)}
                </span>

              </div>
            `;
          })
          .join("")}

      </div>
    `;
  } catch (error) {
    console.error("Load child data failed:", error);

    $("detailContent").innerHTML = `
      <div class="noData">
        ${esc(error.message)}
      </div>
    `;
  }
}

$("form").addEventListener("submit", saveChild);

$("addBtn").addEventListener("click", openAdd);

$("closeForm").addEventListener("click", closeForm);

$("cancel").addEventListener("click", closeForm);

$("closeDetails").addEventListener("click", function () {
  $("details").classList.remove("show");
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", function () {
    document.querySelectorAll(".tab").forEach((item) => {
      item.classList.remove("active");
    });

    this.classList.add("active");

    loadChildTab(this.dataset.tab);
  });
});

$("search").addEventListener("input", function (event) {
  const searchValue = event.target.value.trim().toLowerCase();

  const filtered = children.filter((child) => {
    const name = child.fullName || child.FullName || child.name || "";

    return String(name).toLowerCase().includes(searchValue);
  });

  renderChildren(filtered);
});

const fullName = localStorage.getItem("fullName") || "المستخدم";

if ($("userName")) {
  $("userName").textContent = fullName;
}

if ($("userAvatar")) {
  $("userAvatar").textContent = fullName[0] || "م";
}

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

function updateThemeIcon() {
  $("theme").innerHTML = document.body.classList.contains("dark")
    ? '<i data-lucide="moon"></i>'
    : '<i data-lucide="sun"></i>';

  if (window.lucide) {
    lucide.createIcons();
  }
}

updateThemeIcon();

$("theme").addEventListener("click", function () {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  localStorage.setItem("theme", isDark ? "dark" : "light");

  updateThemeIcon();
});
$("bell").addEventListener("click", function (event) {
  event.stopPropagation();

  $("notifications").classList.toggle("show");
});

document.addEventListener("click", function (event) {
  if (
    !event.target.closest("#bell") &&
    !event.target.closest("#notifications")
  ) {
    $("notifications").classList.remove("show");
  }
});

if (window.lucide) {
  lucide.createIcons();
}

loadChildren();
