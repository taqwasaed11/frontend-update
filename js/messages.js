const API_BASE = "https://earlystep22.runasp.net/api/";

let conversations = [];
let users = [];

let selectedConversation = null;
let selectedUser = null;

let messages = [];

let loadingMessages = false;
let sendingMessage = false;
const $ = (id) => document.getElementById(id);

function headers(json = false) {
  const token = localStorage.getItem("accessToken");

  const result = {};

  if (token) {
    result.Authorization = "Bearer " + token;
  }

  if (json) {
    result["Content-Type"] = "application/json";
  }

  return result;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char];
  });
}

function arr(data) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of [
    "data",
    "items",
    "result",
    "conversations",
    "messages",
    "users",
  ]) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

function getId(item) {
  return (
    item?.id ?? item?.Id ?? item?.conversationId ?? item?.ConversationId ?? null
  );
}

function getName(item) {
  return (
    item?.name ??
    item?.Name ??
    item?.fullName ??
    item?.FullName ??
    item?.userName ??
    item?.username ??
    item?.receiverName ??
    item?.senderName ??
    "مستخدم"
  );
}

function getRole(item) {
  return item?.role ?? item?.Role ?? item?.userRole ?? "";
}

function getText(item) {
  return (
    item?.text ??
    item?.Text ??
    item?.message ??
    item?.Message ??
    item?.content ??
    item?.Content ??
    ""
  );
}

function getDate(item) {
  return (
    item?.createdAt ??
    item?.CreatedAt ??
    item?.date ??
    item?.Date ??
    item?.sentAt ??
    item?.SentAt ??
    null
  );
}

function getReceiverId(item) {
  return item?.receiverId ?? item?.ReceiverId ?? item?.receiverID ?? null;
}

function getSenderId(item) {
  return item?.senderId ?? item?.SenderId ?? item?.senderID ?? null;
}

function getConversationId(item) {
  return (
    item?.conversationId ?? item?.ConversationId ?? item?.id ?? item?.Id ?? null
  );
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return "";
  }
  date.setHours(date.getHours() + 1);
  return date.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
  });
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
  });
}
async function parseResponse(response) {
  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    let message = "تعذر تنفيذ العملية.";

    if (typeof data === "string" && data) {
      message = data;
    }

    if (data?.message) {
      message = data.message;
    }

    if (data?.title) {
      message = data.title;
    }

    throw new Error(message);
  }

  return data;
}

async function loadConversations() {
  const list = $("conversationList");

  list.innerHTML = `
    <div class="loadingSmall">
      جاري تحميل المحادثات...
    </div>
  `;

  try {
    const response = await fetch(API_BASE + "Chats/conversations", {
      method: "GET",
      headers: headers(),
    });

    const result = await parseResponse(response);

    conversations = arr(result);

    console.log("Conversations:", conversations);

    renderConversations();
  } catch (error) {
    console.error("Load conversations failed:", error);

    list.innerHTML = `
      <div class="noData">
        تعذر تحميل المحادثات
        <br>
        <small>${esc(error.message)}</small>
      </div>
    `;
  }
}

function renderConversations(list = conversations) {
  $("conversationCount").textContent = `${list.length} ${
    list.length === 1 ? "محادثة" : "محادثات"
  }`;

  if (!list.length) {
    $("conversationList").innerHTML = `
      <div class="noData">

        لا توجد محادثات حاليًا.

        <br>
        <br>

        اضغط على
        <b>رسالة جديدة</b>
        لبدء محادثة.

      </div>
    `;

    return;
  }

  $("conversationList").innerHTML = list
    .map((conversation) => {
      const id = getConversationId(conversation);

      const name = getName(conversation);

      const role = getRole(conversation);

      const lastText = getText(
        conversation.lastMessage || conversation.latestMessage || conversation,
      );

      const date = getDate(
        conversation.lastMessage || conversation.latestMessage || conversation,
      );

      const unread =
        conversation.unreadCount ??
        conversation.UnreadCount ??
        conversation.unread ??
        0;

      const active =
        selectedConversation &&
        String(getConversationId(selectedConversation)) === String(id)
          ? "active"
          : "";

      return `

        <div
          class="conversationItem ${active}"
          data-id="${esc(id)}"
        >

          <div class="conversationAvatar">
            ${esc(name[0] || "م")}
          </div>


          <div class="conversationInfo">

            <div class="conversationTop">

              <span class="conversationName">
                ${esc(name)}
              </span>

              ${
                date
                  ? `
                    <span class="conversationDate">
                      ${esc(formatDate(date))}
                    </span>
                  `
                  : ""
              }

            </div>


            <div class="conversationLast">

              ${esc(lastText || role || "لا توجد رسائل")}

            </div>

          </div>


          ${
            Number(unread) > 0
              ? `
                <span class="conversationUnread">
                  ${esc(unread)}
                </span>
              `
              : ""
          }

        </div>

      `;
    })
    .join("");

  document.querySelectorAll(".conversationItem").forEach((element) => {
    element.addEventListener("click", function () {
      const id = this.dataset.id;

      const conversation = conversations.find(
        (item) => String(getConversationId(item)) === String(id),
      );

      if (conversation) {
        openConversation(conversation);
      }
    });
  });
}

async function openConversation(conversation) {
  selectedConversation = conversation;

  const conversationId = getConversationId(conversation);

  $("emptyChat").style.display = "none";

  $("activeChat").classList.add("show");

  const name = getName(conversation);

  const role = getRole(conversation);

  $("chatName").textContent = name;

  $("chatRole").textContent = role || "مستخدم";

  $("chatAvatar").textContent = name[0] || "م";

  renderConversations();

  await loadConversationMessages(conversation);

  await markConversationSeen(conversationId);
}

async function loadConversationMessages(conversation) {
  if (loadingMessages) {
    return;
  }

  loadingMessages = true;

  $("messageList").innerHTML = `
    <div class="loadingSmall">
      جاري تحميل الرسائل...
    </div>
  `;

  try {
    const conversationId = getConversationId(conversation);

    const receiverId =
      conversation.receiverId ??
      conversation.ReceiverId ??
      conversation.userId ??
      conversation.UserId ??
      conversation.otherUserId ??
      conversation.OtherUserId ??
      conversation.participantId ??
      conversation.ParticipantId;

    let url =
      API_BASE +
      "Chats" +
      "?conversationId=" +
      encodeURIComponent(conversationId);

    if (receiverId) {
      url += "&receiverId=" + encodeURIComponent(receiverId);
    }

    url += "&take=20";

    const response = await fetch(url, {
      method: "GET",
      headers: headers(),
    });

    const result = await parseResponse(response);

    messages = arr(result);

    console.log("Messages:", messages);

    renderMessages();
  } catch (error) {
    console.error("Load messages failed:", error);

    $("messageList").innerHTML = `
      <div class="noData">
        تعذر تحميل الرسائل
        <br>
        <small>${esc(error.message)}</small>
      </div>
    `;
  } finally {
    loadingMessages = false;
  }
}

function renderMessages() {
  if (!messages.length) {
    $("messageList").innerHTML = `
      <div class="noData">
        لا توجد رسائل في هذه المحادثة.
      </div>
    `;

    return;
  }

  const currentUserId =
    localStorage.getItem("userId") ||
    localStorage.getItem("id") ||
    localStorage.getItem("userID");

  $("messageList").innerHTML = messages
    .map((message) => {
      const senderId = getSenderId(message);

      let isMine = false;

      if (senderId && currentUserId) {
        isMine = String(senderId) === String(currentUserId);
      } else {
        isMine =
          message.isMine === true ||
          message.IsMine === true ||
          message.isSender === true ||
          message.IsSender === true;
      }

      const text = getText(message);

      const date = getDate(message);

      return `

          <div
            class="message ${isMine ? "sent" : "received"}"
          >

            <div class="messageBubble">
              ${esc(text)}
            </div>

            ${
              date
                ? `
                  <div class="messageTime">
                    ${esc(formatTime(date))}
                  </div>
                `
                : ""
            }

          </div>

        `;
    })
    .join("");

  $("messageList").scrollTop = $("messageList").scrollHeight;
}
async function sendMessage(event) {
  event.preventDefault();

  if (sendingMessage) {
    return;
  }

  if (!selectedConversation) {
    return;
  }

  const input = $("messageInput");

  const text = input.value.trim();

  if (!text) {
    return;
  }
  const receiverId =
    selectedConversation.receiverId ??
    selectedConversation.ReceiverId ??
    selectedConversation.userId ??
    selectedConversation.UserId ??
    selectedConversation.otherUserId ??
    selectedConversation.OtherUserId ??
    selectedConversation.participantId ??
    selectedConversation.ParticipantId;

  if (!receiverId) {
    alert("لم يتم العثور على receiverId الخاص بالمستخدم.");

    console.error(
      "Conversation does not contain receiverId:",
      selectedConversation,
    );

    return;
  }

  const conversationId = getConversationId(selectedConversation);

  const payload = {
    conversationId: conversationId || null,

    receiverId: receiverId,

    text: text,
  };

  console.log("========== SEND MESSAGE ==========");

  console.log(payload);

  console.log("==================================");

  sendingMessage = true;

  $("sendButton").disabled = true;

  try {
    const response = await fetch(API_BASE + "Chats/send", {
      method: "POST",

      headers: headers(true),

      body: JSON.stringify(payload),
    });

    const result = await parseResponse(response);

    console.log("Message sent:", result);

    input.value = "";

    await loadConversationMessages(selectedConversation);

    await loadConversations();

    const updated = conversations.find(
      (item) =>
        String(getConversationId(item)) ===
        String(getConversationId(selectedConversation)),
    );

    if (updated) {
      selectedConversation = updated;

      renderConversations();
    }
  } catch (error) {
    console.error("Send message failed:", error);

    alert(error.message);
  } finally {
    sendingMessage = false;

    $("sendButton").disabled = false;
  }
}
async function markConversationSeen(conversationId) {
  if (!conversationId) {
    return;
  }

  try {
    const response = await fetch(
      API_BASE +
        "Chats/mark-conversation-seen" +
        "?conversationId=" +
        encodeURIComponent(conversationId),
      {
        method: "POST",
        headers: headers(),
      },
    );

    const result = await parseResponse(response);

    console.log("Conversation marked as seen:", result);

    await loadUnreadCount();
  } catch (error) {
    console.error("Mark seen failed:", error);
  }
}
async function loadUnreadCount() {
  try {
    const response = await fetch(API_BASE + "Chats/unread-count", {
      method: "GET",
      headers: headers(),
    });

    const result = await parseResponse(response);

    console.log("Unread count:", result);

    let count = 0;

    if (typeof result === "number") {
      count = result;
    } else if (typeof result === "string") {
      count = Number(result) || 0;
    } else {
      count =
        result?.count ??
        result?.Count ??
        result?.unreadCount ??
        result?.UnreadCount ??
        0;
    }

    updateUnreadUI(Number(count));
  } catch (error) {
    console.error("Unread count failed:", error);
  }
}

function updateUnreadUI(count) {
  const navUnread = $("navUnread");

  if (!navUnread) {
    return;
  }

  if (count > 0) {
    navUnread.textContent = count > 99 ? "99+" : count;
    navUnread.classList.add("show");
  } else {
    navUnread.classList.remove("show");
  }
}

async function loadOldMessages() {
  if (!selectedConversation) {
    return;
  }

  if (!messages.length) {
    return;
  }

  const conversationId = getConversationId(selectedConversation);

  const firstMessage = messages[0];

  const beforeId = getId(firstMessage);

  if (!conversationId || !beforeId) {
    return;
  }

  try {
    const url =
      API_BASE +
      "Chats/messages/old" +
      "?conversationId=" +
      encodeURIComponent(conversationId) +
      "&beforeId=" +
      encodeURIComponent(beforeId) +
      "&take=20";

    const response = await fetch(url, {
      method: "GET",
      headers: headers(),
    });

    const result = await parseResponse(response);

    const oldMessages = arr(result);

    if (!oldMessages.length) {
      return;
    }

    messages = [...oldMessages, ...messages];

    renderMessages();
  } catch (error) {
    console.error("Load old messages failed:", error);
  }
}

async function loadNewMessages() {
  if (!selectedConversation) {
    return;
  }

  if (!messages.length) {
    return;
  }

  const conversationId = getConversationId(selectedConversation);

  const lastMessage = messages[messages.length - 1];

  const afterId = getId(lastMessage);

  if (!conversationId || !afterId) {
    return;
  }

  try {
    const url =
      API_BASE +
      "Chats/messages/new" +
      "?conversationId=" +
      encodeURIComponent(conversationId) +
      "&afterId=" +
      encodeURIComponent(afterId) +
      "&take=20";

    const response = await fetch(url, {
      method: "GET",
      headers: headers(),
    });

    const result = await parseResponse(response);

    const newMessages = arr(result);

    if (!newMessages.length) {
      return;
    }

    messages = [...messages, ...newMessages];

    renderMessages();

    await markConversationSeen(conversationId);
  } catch (error) {
    console.error("Load new messages failed:", error);
  }
}
async function loadUsers() {
  $("usersList").innerHTML = `
    <div class="loadingSmall">
      جاري تحميل المستخدمين...
    </div>
  `;

  try {
    const response = await fetch(API_BASE + "Chats/users", {
      method: "GET",
      headers: headers(),
    });

    const result = await parseResponse(response);

    users = arr(result);

    console.log("Users:", users);

    renderUsers();
  } catch (error) {
    console.error("Load users failed:", error);

    $("usersList").innerHTML = `
      <div class="noData">
        تعذر تحميل المستخدمين
        <br>
        <small>${esc(error.message)}</small>
      </div>
    `;
  }
}

function renderUsers(list = users) {
  if (!list.length) {
    $("usersList").innerHTML = `
      <div class="noData">
        لا يوجد مستخدمون.
      </div>
    `;

    return;
  }

  $("usersList").innerHTML = list
    .map((user) => {
      const id = user.id ?? user.Id;

      const name = getName(user);

      const role = getRole(user);

      return `

          <div
            class="userItem"
            data-id="${esc(id)}"
          >

            <div class="userItemAvatar">
              ${esc(name[0] || "م")}
            </div>

            <div class="userItemInfo">

              <strong>
                ${esc(name)}
              </strong>

              <small>
                ${esc(role || "مستخدم")}
              </small>

            </div>

          </div>

        `;
    })
    .join("");

  document.querySelectorAll(".userItem").forEach((item) => {
    item.addEventListener("click", function () {
      const id = this.dataset.id;

      const user = users.find(
        (item) => String(item.id ?? item.Id) === String(id),
      );

      if (!user) {
        return;
      }

      startNewConversation(user);
    });
  });
}

async function startNewConversation(user) {
  selectedUser = user;

  const userId = user.id ?? user.Id;

  closeNewMessageModal();

  const existing = conversations.find((conversation) => {
    const receiverId =
      conversation.receiverId ??
      conversation.ReceiverId ??
      conversation.userId ??
      conversation.UserId ??
      conversation.otherUserId ??
      conversation.OtherUserId;

    return String(receiverId) === String(userId);
  });

  if (existing) {
    await openConversation(existing);

    return;
  }
  selectedConversation = {
    id: null,

    conversationId: null,

    receiverId: userId,

    name: getName(user),

    role: getRole(user),

    isNew: true,
  };

  $("emptyChat").style.display = "none";

  $("activeChat").classList.add("show");

  $("chatName").textContent = getName(user);

  $("chatRole").textContent = getRole(user) || "مستخدم";

  $("chatAvatar").textContent = getName(user)[0] || "م";

  messages = [];

  $("messageList").innerHTML = `
    <div class="noData">
      هذه محادثة جديدة.
      <br>
      اكتب أول رسالة لإرسالها.
    </div>
  `;

  renderConversations();

  $("messageInput").focus();
}

function openNewMessageModal() {
  $("newMessageOverlay").classList.add("show");

  $("userSearch").value = "";

  if (!users.length) {
    loadUsers();
  } else {
    renderUsers();
  }

  setTimeout(() => {
    $("userSearch").focus();
  }, 100);
}

function closeNewMessageModal() {
  $("newMessageOverlay").classList.remove("show");
}

$("userSearch").addEventListener("input", function () {
  const value = this.value.trim().toLowerCase();

  const filtered = users.filter((user) => {
    const name = getName(user).toLowerCase();

    const role = getRole(user).toLowerCase();

    return name.includes(value) || role.includes(value);
  });

  renderUsers(filtered);
});

$("conversationSearch").addEventListener("input", function () {
  const value = this.value.trim().toLowerCase();

  const filtered = conversations.filter((conversation) => {
    const name = getName(conversation).toLowerCase();

    const text = getText(
      conversation.lastMessage || conversation.latestMessage || conversation,
    ).toLowerCase();

    return name.includes(value) || text.includes(value);
  });

  renderConversations(filtered);
});
$("messageInput").addEventListener("input", function () {
  this.style.height = "45px";

  this.style.height = Math.min(this.scrollHeight, 120) + "px";
});

$("messageInput").addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    $("messageForm").requestSubmit();
  }
});

$("refreshChat").addEventListener("click", async function () {
  if (!selectedConversation) {
    return;
  }

  await loadConversationMessages(selectedConversation);

  await loadConversations();
});

setInterval(async function () {
  if (selectedConversation && !selectedConversation.isNew) {
    await loadNewMessages();

    await loadUnreadCount();
  }
}, 10000);


$("messageForm").addEventListener("submit", sendMessage);

$("newMessageBtn").addEventListener("click", openNewMessageModal);

$("closeNewMessage").addEventListener("click", closeNewMessageModal);

$("newMessageOverlay").addEventListener("click", function (event) {
  if (event.target === $("newMessageOverlay")) {
    closeNewMessageModal();
  }
});

if (window.lucide) {
  lucide.createIcons();
}

if (!localStorage.getItem("accessToken")) {
  window.location.href = "../login/login.html";
} else {
  loadConversations();

  loadUnreadCount();
}
