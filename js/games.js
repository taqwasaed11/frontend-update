lucide.createIcons();

const fullName = localStorage.getItem("fullName") || "المستخدم";

document.getElementById("sidebarUserName").textContent = fullName;

document.getElementById("avatar").textContent =
  fullName.trim().charAt(0) || "م";
