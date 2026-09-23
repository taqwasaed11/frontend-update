const form = document.getElementById("verifyForm");

const codeInput = document.getElementById("code");

const codeError = document.getElementById("codeError");

const verifyButton = document.getElementById("verifyButton");

const buttonText = document.getElementById("buttonText");

const spinner = document.getElementById("spinner");

const emailDisplay = document.getElementById("emailDisplay");

const email = sessionStorage.getItem("resetEmail");

if (!email) {
  alert(
    "لم يتم العثور على البريد الإلكتروني. ابدأ عملية استعادة كلمة المرور من جديد.",
  );

  window.location.href = "./ForgetPassword.html";
}

if (email) {
  emailDisplay.textContent = email;
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  codeError.style.display = "none";

  const code = codeInput.value.trim();

  if (code === "") {
    codeError.textContent = "الرجاء إدخال كود التحقق";

    codeError.style.display = "block";

    codeInput.focus();

    return;
  }

  sessionStorage.setItem("resetCode", code);

  verifyButton.disabled = true;

  buttonText.textContent = "جارٍ التحقق...";

  spinner.style.display = "inline-block";

  setTimeout(function () {
    window.location.href = "./ResetPassword.html";
  }, 500);
});
