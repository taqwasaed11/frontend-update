const form = document.getElementById("resetPasswordForm");

const newPassword = document.getElementById("newPassword");

const confirmPassword = document.getElementById("confirmPassword");

const confirmError = document.getElementById("confirmError");

const togglePassword = document.getElementById("togglePassword");

const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

const strengthBar = document.getElementById("strengthBar");

const strengthSpans = strengthBar.querySelectorAll("span");

const ruleElements = document.querySelectorAll(".rule");

const submitButton = document.getElementById("submitButton");

const buttonText = document.getElementById("buttonText");

const spinner = document.getElementById("spinner");

const apiMessage = document.getElementById("apiMessage");

const API_URL = "https://earlystep22.runasp.net/api/Auth/reset-password";

const email = sessionStorage.getItem("resetEmail");

const code = sessionStorage.getItem("resetCode");

if (!email || !code) {
  alert("انتهت عملية استعادة كلمة المرور. يرجى البدء من جديد.");

  window.location.href = "./ForgetPassword.html";
}

function setupPasswordToggle(button, input) {
  button.addEventListener("click", function () {
    if (input.type === "password") {
      input.type = "text";

      button.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';

      button.setAttribute("aria-label", "إخفاء كلمة المرور");
    } else {
      input.type = "password";

      button.innerHTML = '<i class="fa-solid fa-eye"></i>';

      button.setAttribute("aria-label", "إظهار كلمة المرور");
    }
  });
}

setupPasswordToggle(togglePassword, newPassword);

setupPasswordToggle(toggleConfirmPassword, confirmPassword);

function checkPassword(value) {
  const rules = {
    length: value.length >= 8,

    upper: /[A-Z]/.test(value),

    lower: /[a-z]/.test(value),

    number: /[0-9]/.test(value),

    special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
  };

  ruleElements.forEach(function (element) {
    const ruleName = element.dataset.rule;

    element.classList.toggle("valid", rules[ruleName]);
  });

  const passedCount = Object.values(rules).filter(Boolean).length;

  let strengthLevel = 0;

  if (value.length === 0) {
    strengthLevel = 0;
  } else if (passedCount <= 2) {
    strengthLevel = 1;
  } else if (passedCount <= 4) {
    strengthLevel = 2;
  } else {
    strengthLevel = 4;
  }

  strengthSpans.forEach(function (span, index) {
    span.className = "";

    if (index < strengthLevel) {
      if (strengthLevel <= 1) {
        span.classList.add("weak");
      } else if (strengthLevel <= 2) {
        span.classList.add("mid");
      } else {
        span.classList.add("on");
      }
    }
  });

  return rules;
}

newPassword.addEventListener("input", function () {
  checkPassword(newPassword.value);

  if (confirmPassword.value.length > 0) {
    validateConfirmPassword();
  }
});

function validateConfirmPassword() {
  const match = newPassword.value === confirmPassword.value;

  if (confirmPassword.value.length > 0 && !match) {
    confirmError.textContent = "كلمتا المرور غير متطابقتين";

    confirmError.style.display = "block";
  } else {
    confirmError.style.display = "none";
  }

  return match;
}

confirmPassword.addEventListener("input", validateConfirmPassword);

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  apiMessage.className = "api-message";

  apiMessage.textContent = "";

  const password = newPassword.value;

  const confirm = confirmPassword.value;

  const rules = checkPassword(password);

  const allRulesValid = Object.values(rules).every(Boolean);

  if (!allRulesValid) {
    apiMessage.textContent = "كلمة المرور لا تحقق جميع الشروط المطلوبة.";

    apiMessage.className = "api-message error";

    newPassword.focus();

    return;
  }

  if (!validateConfirmPassword()) {
    confirmPassword.focus();

    return;
  }

  submitButton.disabled = true;

  buttonText.textContent = "جارٍ تغيير كلمة المرور...";

  spinner.style.display = "inline-block";

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: email,

        code: code,

        newPassword: password,

        confirmPassword: confirm,
      }),

      redirect: "follow",
    });

    const responseText = await response.text();

    console.log("Reset Password Status:", response.status);

    console.log("Reset Password Response:", responseText);

    let result = null;

    try {
      result = JSON.parse(responseText);
    } catch (error) {
      result = null;
    }

    if (!response.ok) {
      const message =
        (result && (result.message || result.title || result.error)) ||
        responseText ||
        "تعذر تغيير كلمة المرور.";

      apiMessage.textContent = message;

      apiMessage.className = "api-message error";

      return;
    }

    const successMessage =
      (result && result.message) ||
      responseText ||
      "تم تغيير كلمة المرور بنجاح.";

    apiMessage.textContent = successMessage;

    apiMessage.className = "api-message success";

    sessionStorage.removeItem("resetEmail");

    sessionStorage.removeItem("resetCode");

    setTimeout(function () {
      window.location.href = "./login.html";
    }, 2000);
  } catch (error) {
    console.error("Reset Password Request Failed:", error);

    apiMessage.textContent = "تعذر الاتصال بالخادم. حاول مرة أخرى.";

    apiMessage.className = "api-message error";
  } finally {
    submitButton.disabled = false;

    buttonText.textContent = "تغيير كلمة المرور";

    spinner.style.display = "none";
  }
});
