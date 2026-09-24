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

      const childAge = calculateAge(child.birthDate ?? child.BirthDate) !== "-"
        ? calculateAge(child.birthDate ?? child.BirthDate)
        : (child.age ?? child.Age ?? "-");

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
    const response = await fetch(API_BASE + "Parent/GetMyChildren", {
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

function setBirthDateLimits() {
  const birthInput = $("birth");
  if (!birthInput) return;

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());

  const toDateValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  birthInput.min = toDateValue(minDate);
  birthInput.max = toDateValue(maxDate);
}

function openAdd() {
  editingId = null;

  setBirthDateLimits();

  $("formTitle").textContent = "إضافة طفل";

  $("name").value = "";

  $("birth").value = "";

  $("developmentalAge").value = "";

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

  setBirthDateLimits();

  $("formTitle").textContent = "تعديل بيانات الطفل";

  $("name").value = child.fullName || child.FullName || child.name || "";

  $("birth").value = inputDate(child.birthDate ?? child.BirthDate ?? "");

  $("developmentalAge").value =
    child.developmentalAge ??
    child.DevelopmentalAge ??
    child.developmental_age ??
    "";

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

  const developmentalAge = $("developmentalAge").value.trim();

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

  const actualAge = calculateAge(birth);

  if (actualAge < 2 || actualAge > 10) {
    $("formError").textContent = "لا يمكن إضافة الطفل إلا إذا كان عمره بين 2 و10 سنوات.";
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

  // الـ API يستقبل Age، وهو العمر الحقيقي للطفل.
  // العمر النمائي حقل واجهة فقط لأن الـ API المرسل لا يحتوي على حقل له.
  const apiAge = actualAge;

  formData.append("Age", String(apiAge));
  formData.append("gender", selectedGender);

  console.log("DevelopmentalAge:", developmentalAge || "غير محدد");

  console.log("========== CHILD REQUEST ==========");
  console.log("Mode:", editingId ? "EDIT" : "ADD");
  console.log("FullName:", name);
  console.log("Age:", apiAge);
  console.log("Gender:", selectedGender);
  console.log("===================================");

  const saveButton = $("save");

  const oldText = saveButton.textContent;

  saveButton.disabled = true;

  saveButton.textContent = "جاري الحفظ...";

  $("formError").style.display = "none";

  try {
    let url = API_BASE + "Parent";

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
      API_BASE + "Parent/" + encodeURIComponent(id),
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

  const childAge = calculateAge(child.birthDate ?? child.BirthDate) !== "-"
    ? calculateAge(child.birthDate ?? child.BirthDate)
    : (child.age ?? child.Age ?? "-");

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
    $("detailContent").innerHTML = `
      <div class="loading">
        جاري تحميل بيانات الطفل...
      </div>
    `;

    try {
      const response = await fetch(
        API_BASE + "Parent/" + encodeURIComponent(selectedId),
        { method: "GET", headers: headers() }
      );

      const responseText = await response.text();
      let result = null;

      if (responseText) {
        try { result = JSON.parse(responseText); } catch (_) {}
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(result, responseText));
      }

      const data = result?.data ?? result ?? child;
      const name = data.fullName || data.FullName || data.name || "-";
      const childAge = calculateAge(data.birthDate ?? data.BirthDate ?? child.birthDate ?? child.BirthDate) !== "-"
        ? calculateAge(data.birthDate ?? data.BirthDate ?? child.birthDate ?? child.BirthDate)
        : (data.age ?? data.Age ?? "-");
      const childGender = gender(data.gender ?? data.Gender);

      $("detailContent").innerHTML = `
        <div class="rows">
          <div><b>الاسم الكامل</b><span>${esc(name)}</span></div>
          <div><b>العمر</b><span>${childAge === "-" || childAge === null ? "غير محدد" : esc(childAge) + " سنوات"}</span></div>
          <div><b>الجنس</b><span>${esc(childGender)}</span></div>
          <div><b>معرّف الطفل</b><span>${esc(data.id || child.id || "-")}</span></div>
        </div>
      `;
    } catch (error) {
      console.error("ChildInfo failed:", error);
      $("detailContent").innerHTML = `<div class="noData">${esc(error.message)}</div>`;
    }

    return;
  }

  let endpoint = "";

  if (tab === "games") {
    endpoint = `Parent/${selectedId}`;
  } else if (tab === "tests") {
    endpoint = `Parent/${selectedId}`;
  } else if (tab === "reports") {
    endpoint = `Reports/child/${selectedId}`;
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

if (window.lucide) {
  lucide.createIcons();
}

loadChildren();
