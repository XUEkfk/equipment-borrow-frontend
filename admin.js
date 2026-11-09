(() => {
  "use strict";

  const config = window.APP_CONFIG || {};
  const apiUrl = String(config.GAS_API_URL || "").trim();
  const emailInput = document.querySelector("#admin-email");
  const codeInput = document.querySelector("#admin-code");
  const codeLabel = codeInput.closest("label");
  const loginForm = document.querySelector("#login-form");
  const sendCodeButton = document.querySelector("#send-code");
  const verifyButton = document.querySelector("#verify-login");
  const logoutButton = document.querySelector("#logout");
  const loginMessage = document.querySelector("#login-message");
  const requestMessage = document.querySelector("#request-message");
  const requestList = document.querySelector("#request-list");
  const sessionNote = document.querySelector("#session-note");

  // Deliberately memory-only: reload closes the UI session and requires OTP login again.
  let adminSession = "";
  let verifiedEmail = "";
  let otpRequired = false;

  codeLabel.hidden = true;
  codeInput.required = false;
  sendCodeButton.hidden = true;
  verifyButton.textContent = "登入";

  async function callApi(action, payload = {}) {
    if (!apiUrl) throw new Error("尚未設定 GAS Web App URL，無法連線後端。");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...payload }),
        redirect: "follow",
        signal: controller.signal
      });
      if (!response.ok) throw new Error("後端連線失敗，請稍後再試。");
      const result = await response.json();
      if (!result || result.ok !== true) {
        throw new Error(result && result.message ? result.message : "後端無法處理此請求。");
      }
      return result.data;
    } catch (error) {
      if (error && error.name === "AbortError") throw new Error("連線逾時，請稍後再試。");
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function showMessage(element, text) {
    element.textContent = text || "";
  }

  function setLoggedIn(token, email) {
    adminSession = token;
    verifiedEmail = email;
    loginMessage.textContent = "登入成功。管理員身分已由後端確認。";
    sessionNote.textContent = "已登入：" + email + "（Session 約 30 分鐘有效；重新整理頁面會登出）";
    otpRequired = false;
    logoutButton.hidden = false;
    emailInput.disabled = true;
    codeInput.disabled = true;
    sendCodeButton.disabled = true;
    verifyButton.disabled = true;
    loadPendingRequests();
  }

  async function requestOtp(email) {
    await callApi("email.requestCode", { email });
    otpRequired = true;
    codeLabel.hidden = false;
    codeInput.required = true;
    sendCodeButton.hidden = false;
    verifyButton.textContent = "驗證並登入";
    showMessage(loginMessage, "首次登入或已超過 30 天未登入，驗證碼已寄出，請於 5 分鐘內輸入。");
  }

  sendCodeButton.addEventListener("click", async () => {
    const email = emailInput.value.trim().toLowerCase();
    if (!emailInput.reportValidity()) return;
    sendCodeButton.disabled = true;
    try {
      await requestOtp(email);
    } catch (error) {
      showMessage(loginMessage, error.message);
    } finally {
      sendCodeButton.disabled = false;
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    if (!emailInput.reportValidity()) return;
    if (otpRequired && !codeInput.reportValidity()) return;
    verifyButton.disabled = true;
    showMessage(loginMessage, otpRequired ? "正在驗證 Email……" : "正在確認管理員認證狀態……");
    try {
      if (otpRequired) {
        const code = codeInput.value.trim();
        await callApi("email.verifyCode", { email, code });
      }
      const session = await callApi("admin.session.login", { email });
      if (session && session.otpRequired === true) {
        await requestOtp(email);
        return;
      }
      if (!session || typeof session.adminSession !== "string" || !session.adminSession) {
        throw new Error("後端未回傳有效管理員 Session。");
      }
      setLoggedIn(session.adminSession, email);
    } catch (error) {
      showMessage(loginMessage, error.message);
    } finally {
      verifyButton.disabled = Boolean(adminSession);
    }
  });

  async function loadPendingRequests() {
    if (!adminSession) return;
    requestList.className = "empty-admin";
    requestList.textContent = "正在讀取待審核申請……";
    try {
      const data = await callApi("admin.borrow.pending", { adminSession });
      if (!Array.isArray(data)) throw new Error("待審核清單回應格式不正確。");
      renderRequests(data);
      showMessage(requestMessage, "清單已更新。");
    } catch (error) {
      requestList.className = "empty-admin";
      requestList.textContent = "無法讀取待審核申請。";
      showMessage(requestMessage, error.message);
      if (error.message.includes("Admin authentication required")) clearSession("登入已失效，請重新登入。");
    }
  }

  function appendMeta(container, label, value) {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value == null || value === "" ? "—" : String(value);
    wrapper.append(term, description);
    container.append(wrapper);
  }

  function renderRequests(items) {
    requestList.replaceChildren();
    if (!items.length) {
      requestList.className = "empty-admin";
      requestList.textContent = "目前沒有待審核申請。";
      return;
    }
    requestList.className = "request-list";
    items.forEach((item) => {
      if (!item || typeof item !== "object" || typeof item.requestId !== "string") return;
      const card = document.createElement("article");
      card.className = "request-card";
      const heading = document.createElement("h3");
      heading.textContent = "申請單 " + item.requestId;
      const meta = document.createElement("dl");
      meta.className = "request-meta";
      appendMeta(meta, "借用人", item.borrowerName);
      appendMeta(meta, "聯絡電話", item.borrowerPhone);
      appendMeta(meta, "Email", item.borrowerEmail);
      appendMeta(meta, "設備編號", item.equipmentId);
      appendMeta(meta, "數量", item.quantity);
      appendMeta(meta, "借用日期", item.startDate + " 至 " + item.dueDate);
      appendMeta(meta, "申請時間", item.createdAt);
      const purpose = document.createElement("p");
      purpose.className = "request-purpose";
      purpose.textContent = "借用原因：" + String(item.purpose || "—");
      const actions = document.createElement("div");
      actions.className = "request-actions";
      const approve = document.createElement("button");
      approve.type = "button";
      approve.textContent = "核准／待領取";
      approve.addEventListener("click", () => reviewRequest(item.requestId, "approve", ""));
      const reject = document.createElement("button");
      reject.type = "button";
      reject.className = "button-danger";
      reject.textContent = "拒絕申請";
      reject.addEventListener("click", () => {
        const reason = window.prompt("請輸入拒絕原因（必填，最多 500 字）：");
        if (reason === null) return;
        if (!reason.trim() || reason.trim().length > 500) {
          showMessage(requestMessage, "拒絕原因不可空白，且不得超過 500 字。");
          return;
        }
        reviewRequest(item.requestId, "reject", reason.trim());
      });
      actions.append(approve, reject);
      card.append(heading, meta, purpose, actions);
      requestList.append(card);
    });
  }

  async function reviewRequest(requestId, decision, rejectionReason) {
    if (!adminSession) return;
    if (decision === "approve" && !window.confirm("確定核准此申請？核准後為「已核准／待領取」，不代表已實際交付器材。")) return;
    if (decision === "reject" && !window.confirm("確定拒絕此申請？")) return;
    try {
      await callApi("admin.borrow.review", { adminSession, requestId, decision, rejectionReason });
      showMessage(requestMessage, decision === "approve" ? "已核准，狀態為待領取。" : "申請已拒絕。");
      await loadPendingRequests();
    } catch (error) {
      showMessage(requestMessage, error.message);
    }
  }

  function clearSession(message) {
    adminSession = "";
    verifiedEmail = "";
    emailInput.disabled = false;
    codeInput.disabled = false;
    sendCodeButton.disabled = false;
    verifyButton.disabled = false;
    otpRequired = false;
    codeInput.value = "";
    codeInput.required = false;
    codeLabel.hidden = true;
    sendCodeButton.hidden = true;
    verifyButton.textContent = "登入";
    logoutButton.hidden = true;
    sessionNote.textContent = "尚未登入。登入後才能讀取受保護的申請資料。";
    requestList.className = "empty-admin";
    requestList.textContent = "請先以管理員身分登入。";
    if (message) showMessage(loginMessage, message);
  }

  logoutButton.addEventListener("click", async () => {
    if (!adminSession) return;
    logoutButton.disabled = true;
    try {
      await callApi("admin.session.revoke", { adminSession });
      clearSession("已安全登出。");
    } catch (error) {
      showMessage(loginMessage, error.message);
    } finally {
      logoutButton.disabled = false;
    }
  });

  if (!apiUrl) showMessage(loginMessage, "尚未設定 GAS Web App URL。");
})();
