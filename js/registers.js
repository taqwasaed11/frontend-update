let selectedType = "guardian";

const typeCards = document.querySelectorAll(".account-type");

typeCards.forEach((card) => {
  card.addEventListener("click", () => {
    typeCards.forEach((c) => {
      c.classList.remove("active");
    });

    card.classList.add("active");

    selectedType = card.dataset.type;
  });
});

function setupToggle(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);

  const input = document.getElementById(inputId);

  toggle.addEventListener("click", () => {
    const isPassword = input.type === "password";

    input.type = isPassword ? "text" : "password";

    toggle.textContent = isPassword ? "🙈" : "👁️";
  });
}

setupToggle("togglePassword", "password");

setupToggle("toggleConfirmPassword", "confirmPassword");

const passwordInput = document.getElementById("password");

const strengthBar = document.getElementById("strengthBar");

const strengthSpans = strengthBar.querySelectorAll("span");

const ruleEls = document.querySelectorAll(".rule");

function checkPassword(value) {
  const rules = {
    length: value.length >= 8,

    upper: /[A-Z]/.test(value),

    lower: /[a-z]/.test(value),

    number: /[0-9]/.test(value),

    special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
  };

  ruleEls.forEach((el) => {
    const ruleName = el.dataset.rule;

    el.classList.toggle("valid", rules[ruleName]);
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

  strengthSpans.forEach((span, index) => {
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

passwordInput.addEventListener("input", (event) =>
  checkPassword(event.target.value),
);

const emailInput = document.getElementById("email");

const emailError = document.getElementById("emailError");

function validateEmail(value) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  emailError.style.display = value.length > 0 && !valid ? "block" : "none";

  return valid;
}

emailInput.addEventListener("input", (event) =>
  validateEmail(event.target.value),
);

const confirmInput = document.getElementById("confirmPassword");

const confirmError = document.getElementById("confirmError");

function validateConfirm() {
  const match = passwordInput.value === confirmInput.value;

  confirmError.style.display =
    confirmInput.value.length > 0 && !match ? "block" : "none";

  return match;
}

confirmInput.addEventListener("input", validateConfirm);

passwordInput.addEventListener("input", () => {
  if (confirmInput.value.length > 0) {
    validateConfirm();
  }
});

const form = document.getElementById("registerForm");

const fullNameInput = document.getElementById("fullName");

const submitBtn = document.getElementById("submitBtn");

const spinner = document.getElementById("spinner");

const btnText = document.getElementById("btnText");

const apiError = document.getElementById("apiError");

const apiSuccess = document.getElementById("apiSuccess");

const API_URL = "https://earlystep22.runasp.net/api/Auth/register";

const roleMap = {
  specialist: "أخصائي/ة",

  teacher: "معلم/ة",

  guardian: "ولي أمر",

  admin: "Admin",
};

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;

  spinner.style.display = isLoading ? "inline-block" : "none";

  btnText.textContent = isLoading ? "جارٍ إنشاء الحساب..." : "✨ إنشاء حساب";
}

function showApiError(message) {
  apiSuccess.style.display = "none";

  apiError.textContent = message;

  apiError.style.display = "block";
}

function showApiSuccess(message) {
  apiError.style.display = "none";

  apiSuccess.textContent = message;

  apiSuccess.style.display = "block";
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  apiError.style.display = "none";

  apiSuccess.style.display = "none";

  const rules = checkPassword(passwordInput.value);

  const emailValid = validateEmail(emailInput.value);

  const confirmValid = validateConfirm();

  const allRulesValid = Object.values(rules).every(Boolean);

  const nameValid = fullNameInput.value.trim().length > 0;

  if (!nameValid) {
    showApiError("الرجاء إدخال الاسم الكامل");

    fullNameInput.focus();

    return;
  }

  if (!emailValid) {
    emailInput.focus();

    return;
  }

  if (!allRulesValid) {
    showApiError("كلمة المرور لا تحقق جميع الشروط المطلوبة");

    passwordInput.focus();

    return;
  }

  if (!confirmValid) {
    confirmInput.focus();

    return;
  }

  const selectedRole = roleMap[selectedType];

  if (!selectedRole) {
    showApiError("الرجاء اختيار نوع الحساب");

    return;
  }

  const formData = new FormData();

  formData.append("fullName", fullNameInput.value.trim());

  formData.append("email", emailInput.value.trim());

  formData.append("password", passwordInput.value);

  formData.append("confirmPassword", confirmInput.value);

  formData.append("role", selectedRole);

  console.log("Registration data:");

  console.log("fullName:", fullNameInput.value.trim());

  console.log("email:", emailInput.value.trim());

  console.log("role:", selectedRole);

  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      body: formData,
    });

    const responseText = await response.text();

    console.log("Status:", response.status);

    console.log("Response:", responseText);

    let result = null;

    try {
      result = JSON.parse(responseText);
    } catch (error) {
      console.log("Response is not JSON");
    }

    if (!response.ok) {
      let message = "فشل إنشاء الحساب";

      if (result) {
        message = result.message || result.title || result.error || message;
      } else if (responseText) {
        message = responseText;
      }

      showApiError(message);

      return;
    }

    console.log("Account created successfully:", result);

    showApiSuccess(result?.message || "تم إنشاء الحساب بنجاح.");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
  } catch (error) {
    console.error("Register request failed:", error);

    showApiError(
      "تعذّر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.",
    );
  } finally {
    setLoading(false);
  }
});
