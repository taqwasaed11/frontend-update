const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.innerHTML = '<i class="fa-solid fa-eye"></i>';

togglePassword.addEventListener("click", function () {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";

    togglePassword.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';

    togglePassword.setAttribute("aria-label", "إخفاء كلمة المرور");
  } else {
    passwordInput.type = "password";

    togglePassword.innerHTML = '<i class="fa-solid fa-eye"></i>';

    togglePassword.setAttribute("aria-label", "إظهار كلمة المرور");
  }
});

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();

  const password = document.getElementById("password").value;

  const rememberMe = document.getElementById("remember").checked;

  if (email === "") {
    alert("الرجاء إدخال البريد الإلكتروني");

    document.getElementById("email").focus();

    return;
  }

  if (password === "") {
    alert("الرجاء إدخال كلمة المرور");

    passwordInput.focus();

    return;
  }

  const formData = new FormData();

  formData.append("email", email);
  formData.append("password", password);
  formData.append("rememberMe", rememberMe);

  const loginButton = document.querySelector(".login-button");

  const originalButton = loginButton.innerHTML;

  loginButton.disabled = true;

  loginButton.innerHTML = "<span>جارٍ تسجيل الدخول...</span>";

  try {
    const response = await fetch(
      "https://earlystep22.runasp.net/api/Auth/login",
      {
        method: "POST",
        body: formData,
        redirect: "follow",
      },
    );

    const resultText = await response.text();

    console.log("Status:", response.status);
    console.log("Response Text:", resultText);

    let result = null;

    try {
      result = JSON.parse(resultText);
    } catch (error) {
      console.error("Response is not valid JSON:", error);
    }

    if (!response.ok) {
      let message = "البريد الإلكتروني أو كلمة المرور غير صحيحة";

      if (result) {
        message = result.message || result.title || result.error || message;
      }

      alert(message);

      return;
    }

    if (!result) {
      alert("تم تسجيل الدخول، ولكن لم يتم استلام بيانات المستخدم.");

      return;
    }

    if (!result.id || !result.fullName || !result.accessToken || !result.role) {
      console.error("Incomplete login response:", result);

      alert("تم تسجيل الدخول، ولكن بيانات المستخدم غير مكتملة.");

      return;
    }

    localStorage.setItem("userId", result.id);

    localStorage.setItem("fullName", result.fullName);

    localStorage.setItem("accessToken", result.accessToken);

    localStorage.setItem("role", result.role);

    console.log("User ID:", result.id);
    console.log("Full Name:", result.fullName);
    console.log("Role:", result.role);

    switch (result.role) {
      case "ولي أمر":
        window.location.href = "../parent/dashboard.html";

        break;

      case "معلم/ة":
        window.location.href = "../teacher/dashboard.html";

        break;

      case "أخصائي/ة":
        window.location.href = "../specialist/dashboard.html";

        break;

      case "Admin":
        window.location.href = "../admin/dashboard.html";

        break;

      default:
        console.error("Unknown role:", result.role);

        alert("تم تسجيل الدخول، ولكن دور المستخدم غير معروف.");

        break;
    }
  } catch (error) {
    console.error("Login request failed:", error);

    alert(
      "تعذّر الاتصال بالخادم. " + "تأكد من اتصالك بالإنترنت وحاول مرة أخرى.",
    );
  } finally {
    loginButton.disabled = false;
    loginButton.innerHTML = originalButton;
  }
});
