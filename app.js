// GAS equipment.list integration only. Borrow submission remains intentionally disabled.
const apiConfig = window.APP_CONFIG || {};
const equipmentList = document.querySelector("#equipment-list");
const form = document.querySelector("#borrow-form");
const message = document.querySelector("#form-message");

const EQUIPMENT_REQUEST_TIMEOUT_MS = 12000;
const MAX_EQUIPMENT_ITEMS = 100;
const EQUIPMENT_FIELD_LIMITS = Object.freeze({
  equipmentId: 128,
  equipmentCode: 64,
  name: 120,
  description: 1000
});
const MAX_EQUIPMENT_QUANTITY = 10000;

async function loadEquipment() {
  const apiUrl = String(apiConfig.GAS_API_URL || "").trim();

  if (!apiUrl) {
    renderEquipmentMessage("尚未設定 GAS Web App URL，設備資料暫時無法載入。", "empty-state");
    return;
  }

  renderEquipmentMessage("正在載入設備資料……", "empty-state");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EQUIPMENT_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({ action: "equipment.list" }),
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error("Equipment API request failed");
    }

    const result = await response.json();
    if (!result || result.ok !== true || !Array.isArray(result.data)) {
      throw new Error("Equipment API response is invalid");
    }

    const equipment = validateEquipmentList(result.data);
    renderEquipment(equipment);
  } catch (error) {
    if (error && error.name === "AbortError") {
      console.warn("Equipment API request timed out.");
    } else {
      console.error("Equipment API request failed.");
    }
    renderEquipmentMessage("設備資料載入失敗或逾時，請稍後重新整理頁面。", "empty-state");
  } finally {
    clearTimeout(timeoutId);
  }
}

function validateEquipmentList(items) {
  if (items.length > MAX_EQUIPMENT_ITEMS) {
    throw new Error("Equipment list exceeds the allowed item count");
  }

  return items.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Equipment item is invalid");
    }

    const equipmentId = validateEquipmentText(item.equipmentId, "equipmentId", false);
    const equipmentCode = validateEquipmentText(item.equipmentCode, "equipmentCode", true);
    const name = validateEquipmentText(item.name, "name", false);
    const description = validateEquipmentText(item.description, "description", true);

    if (
      typeof item.totalQuantity !== "number" ||
      !Number.isInteger(item.totalQuantity) ||
      item.totalQuantity < 0 ||
      item.totalQuantity > MAX_EQUIPMENT_QUANTITY
    ) {
      throw new Error("Equipment quantity is invalid");
    }

    return { equipmentId, equipmentCode, name, description, totalQuantity: item.totalQuantity };
  });
}

function validateEquipmentText(value, fieldName, optional) {
  if (optional && value === "") return "";

  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > EQUIPMENT_FIELD_LIMITS[fieldName]
  ) {
    throw new Error("Equipment text field is invalid");
  }

  return value;
}

function renderEquipmentMessage(text, className) {
  equipmentList.replaceChildren();
  equipmentList.className = className;
  equipmentList.textContent = text;
}

function renderEquipment(items) {
  equipmentList.replaceChildren();

  if (items.length === 0) {
    renderEquipmentMessage("目前沒有已啟用的設備。", "empty-state");
    return;
  }

  equipmentList.className = "equipment-grid";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "equipment-card";

    const heading = document.createElement("h3");
    heading.textContent = item.name;
    card.append(heading);

    if (item.equipmentCode) {
      const code = document.createElement("p");
      code.className = "equipment-code";
      code.textContent = `設備編號：${item.equipmentCode}`;
      card.append(code);
    }

    if (item.description) {
      const description = document.createElement("p");
      description.textContent = item.description;
      card.append(description);
    }

    const quantity = document.createElement("p");
    quantity.className = "equipment-quantity";
    quantity.textContent = `總數量：${item.totalQuantity}`;
    card.append(quantity);

    equipmentList.append(card);
  });
}

// Borrower OTP uses borrower-only backend actions; administrator OTP state is isolated.
// Device trust is not persisted until the backend token contract and storage decision are complete.
const borrowerEmailInput = form.elements.namedItem("email");
const otpInput = document.querySelector("#borrower-otp");
const otpEntry = document.querySelector("#otp-entry");
const otpStatus = document.querySelector("#otp-status");
const otpMessage = document.querySelector("#otp-message");
const requestOtpButton = document.querySelector("#request-otp");
const verifyOtpButton = document.querySelector("#verify-otp");
const resendOtpButton = document.querySelector("#resend-otp");

let otpVerifiedForEmail = "";
let otpRequestEmail = "";
let resendCooldownTimer = null;

function normalizedBorrowerEmail() {
  return String(borrowerEmailInput.value || "").trim().toLowerCase();
}

function resetBorrowerOtp(messageText = "Email 尚未驗證。") {
  otpVerifiedForEmail = "";
  otpRequestEmail = "";
  otpInput.value = "";
  otpInput.disabled = false;
  otpEntry.hidden = true;
  otpStatus.textContent = "尚未驗證";
  otpMessage.textContent = messageText;
  requestOtpButton.disabled = false;
  verifyOtpButton.disabled = false;
  verifyOtpButton.textContent = "確認驗證";
  resendOtpButton.disabled = true;
  resendOtpButton.textContent = "重新寄送";
  if (resendCooldownTimer !== null) {
    window.clearTimeout(resendCooldownTimer);
    resendCooldownTimer = null;
  }
}

async function callBorrowerOtpApi(action, payload = {}) {
  const apiUrl = String(apiConfig.GAS_API_URL || "").trim();
  if (!apiUrl) throw new Error("尚未設定 GAS Web App URL，無法寄送驗證碼。");

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), EQUIPMENT_REQUEST_TIMEOUT_MS);
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
    window.clearTimeout(timeoutId);
  }
}

function startOtpResendCooldown() {
  resendOtpButton.disabled = true;
  resendOtpButton.textContent = "60 秒後可重新寄送";
  resendCooldownTimer = window.setTimeout(() => {
    resendOtpButton.disabled = false;
    resendOtpButton.textContent = "重新寄送";
    resendCooldownTimer = null;
  }, 60000);
}

async function requestBorrowerOtp(isResend = false) {
  const email = normalizedBorrowerEmail();
  if (!borrowerEmailInput.reportValidity()) return;
  if (isResend && email !== otpRequestEmail) {
    resetBorrowerOtp("Email 已變更，請重新寄送驗證碼。");
    return;
  }

  requestOtpButton.disabled = true;
  resendOtpButton.disabled = true;
  otpMessage.textContent = "正在寄送六位數驗證碼……";
  try {
    await callBorrowerOtpApi("borrower.email.requestCode", { email });
    if (normalizedBorrowerEmail() !== email) {
      resetBorrowerOtp("Email 已變更。請使用目前的 Email 重新寄送驗證碼。");
      return;
    }
    otpRequestEmail = email;
    otpVerifiedForEmail = "";
    otpInput.value = "";
    otpInput.disabled = false;
    verifyOtpButton.disabled = false;
    verifyOtpButton.textContent = "確認驗證";
    otpEntry.hidden = false;
    otpStatus.textContent = "等待驗證";
    otpMessage.textContent = "驗證碼已寄出，請於 5 分鐘內輸入。";
    startOtpResendCooldown();
  } catch (error) {
    otpMessage.textContent = "驗證碼寄送失敗：" + error.message;
    requestOtpButton.disabled = false;
    resendOtpButton.disabled = true;
  }
}

requestOtpButton.addEventListener("click", () => requestBorrowerOtp(false));
resendOtpButton.addEventListener("click", () => requestBorrowerOtp(true));

verifyOtpButton.addEventListener("click", async () => {
  const email = normalizedBorrowerEmail();
  if (!borrowerEmailInput.reportValidity()) return;
  if (!otpInput.reportValidity()) {
    otpInput.focus();
    return;
  }
  if (!otpRequestEmail || email !== otpRequestEmail) {
    resetBorrowerOtp("Email 已變更，請重新寄送驗證碼。");
    return;
  }

  verifyOtpButton.disabled = true;
  otpMessage.textContent = "正在驗證 Email……";
  try {
    await callBorrowerOtpApi("borrower.email.verifyCode", { email, code: otpInput.value.trim() });
    otpVerifiedForEmail = email;
    otpStatus.textContent = "已驗證（本頁面）";
    otpMessage.textContent = "Email 驗證成功。本次頁面已確認；30 天裝置信任尚未啟用。";
    otpInput.disabled = true;
    verifyOtpButton.textContent = "已完成驗證";
    requestOtpButton.disabled = true;
    resendOtpButton.disabled = true;
  } catch (error) {
    otpStatus.textContent = "驗證未成功";
    otpMessage.textContent = "Email 驗證失敗：" + error.message;
  } finally {
    verifyOtpButton.disabled = Boolean(otpVerifiedForEmail);
  }
});

borrowerEmailInput.addEventListener("input", () => {
  if (otpRequestEmail && normalizedBorrowerEmail() !== otpRequestEmail) {
    resetBorrowerOtp("Email 已變更，請重新寄送並驗證新的 Email。");
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "申請功能尚未啟用，請待系統完成後再使用。";
});

loadEquipment();
