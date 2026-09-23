lucide.createIcons();
const fullName = localStorage.getItem("fullName") || "المستخدم";
document.getElementById("sidebarUserName").textContent = fullName;
document.getElementById("avatar").textContent =
  fullName.trim().charAt(0) || "م";
if (localStorage.getItem("theme") === "dark")
  document.body.classList.add("dark");
function updateThemeIcon() {
  document.getElementById("themeBtn").innerHTML =
    document.body.classList.contains("dark")
      ? '<i data-lucide="moon"></i>'
      : '<i data-lucide="sun"></i>';
  lucide.createIcons();
}
updateThemeIcon();
document.getElementById("themeBtn").onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light",
  );
  updateThemeIcon();
};
document.getElementById("bellBtn").onclick = () =>
  document.getElementById("notifications").classList.toggle("show");
document.addEventListener("click", (e) => {
  if (!e.target.closest("#bellBtn") && !e.target.closest("#notifications"))
    document.getElementById("notifications").classList.remove("show");
});
