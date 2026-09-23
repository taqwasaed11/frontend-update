const form = document.getElementById("forgotPasswordForm");

const emailInput = document.getElementById("email");

const emailError = document.getElementById("emailError");

const submitButton = document.getElementById("submitButton");

const buttonText = document.getElementById("buttonText");

const spinner = document.getElementById("spinner");

const apiMessage = document.getElementById("apiMessage");

const API_URL = "https://earlystep22.runasp.net/api/Auth/ForgotPassword";

function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return pattern.test(email);
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  emailError.style.display = "none";

  apiMessage.className = "api-message";

  apiMessage.textContent = "";

  const email = emailInput.value.trim();

  if (email === "") {
    emailError.textContent = "الرجاء إدخال البريد الإلكتروني";

    emailError.style.display = "block";

    emailInput.focus();

    return;
  }

  if (!validateEmail(email)) {
    emailError.textContent = "الرجاء إدخال بريد إلكتروني صحيح";

    emailError.style.display = "block";

    emailInput.focus();

    return;
  }

  submitButton.disabled = true;

  buttonText.textContent = "جارٍ إرسال الكود...";

  spinner.style.display = "inline-block";

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: email,
      }),
    });

    const responseText = await response.text();

    console.log("Forgot Password Status:", response.status);

    console.log("Forgot Password Response:", responseText);

    let result = null;

    try {
      result = JSON.parse(responseText);
    } catch (error) {
      result = null;
    }

    if (!response.ok) {
      const message =
        (result && (result.message || result.title || result.error)) ||
        "تعذر إرسال كود التحقق. تأكد من البريد الإلكتروني.";

      apiMessage.textContent = message;

      apiMessage.className = "api-message error";

      return;
    }

    sessionStorage.setItem("resetEmail", email);

    apiMessage.textContent = "تم إرسال كود التحقق إلى بريدك الإلكتروني.";

    apiMessage.className = "api-message success";

    setTimeout(function () {
      window.location.href = "./VerifyCode.html";
    }, 1200);
  } catch (error) {
    console.error("Forgot Password Request Failed:", error);

    apiMessage.textContent = "تعذر الاتصال بالخادم. حاول مرة أخرى.";

    apiMessage.className = "api-message error";
  } finally {
    submitButton.disabled = false;

    buttonText.textContent = "إرسال كود التحقق";

    spinner.style.display = "none";
  }
});
