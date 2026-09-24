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
