document.querySelectorAll('a[href="#learn-more"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelector(".cta-banner")
      .scrollIntoView({ behavior: "smooth" });
  });
});

document.querySelectorAll(".float-badge").forEach((el, i) => {
  el.style.animationDuration = 3 + i * 0.4 + "s";
});
