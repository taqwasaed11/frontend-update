function setupPasswordToggle(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);

  toggle.addEventListener("click", function () {
    if (input.type === "password") {
      input.type = "text";

      toggle.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';

      toggle.setAttribute("aria-label", "إخفاء كلمة المرور");
    } else {
      input.type = "password";

      toggle.innerHTML = '<i class="fa-solid fa-eye"></i>';

      toggle.setAttribute("aria-label", "إظهار كلمة المرور");
    }
  });
}

setupPasswordToggle("toggleCurrentPassword", "currentPassword");

setupPasswordToggle("toggleNewPassword", "newPassword");

setupPasswordToggle("toggleConfirmPassword", "confirmPassword");

const form = document.getElementById("changePasswordForm");

const currentPassword = document.getElementById("currentPassword");

const newPassword = document.getElementById("newPassword");

const confirmPassword = document.getElementById("confirmPassword");

const confirmError = document.getElementById("confirmError");

const errorMessage = document.getElementById("errorMessage");

const successMessage = document.getElementById("successMessage");

const changeButton = document.getElementById("changeButton");

const buttonText = document.getElementById("buttonText");

const buttonIcon = document.getElementById("buttonIcon");
function checkPasswordRules(password) {
  const rules = {
    length: password.length >= 8,

    upper: /[A-Z]/.test(password),

    lower: /[a-z]/.test(password),

    number: /[0-9]/.test(password),

    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  document.getElementById("ruleLength").classList.toggle("valid", rules.length);

  document.getElementById("ruleUpper").classList.toggle("valid", rules.upper);

  document.getElementById("ruleLower").classList.toggle("valid", rules.lower);

  document.getElementById("ruleNumber").classList.toggle("valid", rules.number);

  document
    .getElementById("ruleSpecial")
    .classList.toggle("valid", rules.special);

  return rules;
}

newPassword.addEventListener("input", function () {
  checkPasswordRules(newPassword.value);
});

function validateConfirmPassword() {
  const valid = newPassword.value === confirmPassword.value;

  if (confirmPassword.value.length > 0 && !valid) {
    confirmError.style.display = "block";
  } else {
    confirmError.style.display = "none";
  }

  return valid;
}

confirmPassword.addEventListener("input", validateConfirmPassword);

newPassword.addEventListener("input", function () {
  if (confirmPassword.value.length > 0) {
    validateConfirmPassword();
  }
});

function showError(message) {
  successMessage.style.display = "none";

  errorMessage.textContent = message;

  errorMessage.style.display = "block";
}

function showSuccess(message) {
  errorMessage.style.display = "none";

  successMessage.textContent = message;

  successMessage.style.display = "block";
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  errorMessage.style.display = "none";

  successMessage.style.display = "none";

  const current = currentPassword.value;

  const newPass = newPassword.value;

  const confirm = confirmPassword.value;

  if (current === "") {
    showError("الرجاء إدخال كلمة المرور الحالية.");

    currentPassword.focus();

    return;
  }

  const rules = checkPasswordRules(newPass);

  const allRulesValid = Object.values(rules).every(Boolean);

  if (!allRulesValid) {
    showError("كلمة المرور الجديدة لا تحقق جميع الشروط المطلوبة.");

    newPassword.focus();

    return;
  }

  if (!validateConfirmPassword()) {
    showError("كلمتا المرور غير متطابقتين.");

    confirmPassword.focus();

    return;
  }

  if (current === newPass) {
    showError("كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية.");

    newPassword.focus();

    return;
  }

  const token = localStorage.getItem("accessToken");

  if (!token) {
    showError("انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.");

    return;
  }

  changeButton.disabled = true;

  buttonText.textContent = "جارٍ تغيير كلمة المرور...";

  buttonIcon.className = "fa-solid fa-spinner fa-spin";

  try {
    const response = await fetch(
      "https://earlystep22.runasp.net/api/Auth/change-password",
      {
        method: "POST",

        headers: {
          Authorization: "Bearer " + token,

          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          currentPassword: current,

          newPassword: newPass,

          confirmPassword: confirm,
        }),
      },
    );

    const responseText = await response.text();

    console.log("Change Password Status:", response.status);

    console.log("Change Password Response:", responseText);

    if (!response.ok) {
      let message = "تعذر تغيير كلمة المرور.";

      try {
        const data = JSON.parse(responseText);

        message = data.message || data.title || data.error || message;
      } catch (error) {
        if (responseText) {
          message = responseText;
        }
      }

      showError(message);

      return;
    }

    showSuccess("تم تغيير كلمة المرور بنجاح.");

    currentPassword.value = "";

    newPassword.value = "";

    confirmPassword.value = "";

    checkPasswordRules("");
    setTimeout(function () {
      window.location.href = "./login.html";
    }, 2000);
  } catch (error) {
    console.error("Change password request failed:", error);

    showError("تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
  } finally {
    changeButton.disabled = false;

    buttonText.textContent = "تغيير كلمة المرور";

    buttonIcon.className = "fa-solid fa-key";
  }
});
