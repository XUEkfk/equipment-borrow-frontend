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

// Borrower OTP and 30-day single-browser trust use borrower-only backend actions.
const BORROWER_TRUST_STORAGE_PREFIX = "equipmentBorrow.borrowerDeviceTrust.v1:";
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
let trustCheckInProgressForEmail = "";

function normalizedBorrowerEmail() {
  return String(borrowerEmailInput.value || "").trim().toLowerCase();
}

function borrowerTrustStorageKey(email) {
  return BORROWER_TRUST_STORAGE_PREFIX + encodeURIComponent(email);
}

function readBorrowerTrustCredential(email) {
  try {
    return window.localStorage.getItem(borrowerTrustStorageKey(email)) || "";
  } catch (error) {
    return "";
  }
}

function storeBorrowerTrustCredential(email, credential) {
  if (!/^[a-f0-9]{64}$/.test(String(credential || ""))) {
    throw new Error("後端裝置信任憑證格式無效。");
  }
  window.localStorage.setItem(borrowerTrustStorageKey(email), credential);
}

function removeBorrowerTrustCredential(email) {
  try {
    window.localStorage.removeItem(borrowerTrustStorageKey(email));
  } catch (error) {
    console.warn("Unable to clear borrower device trust from this browser.");
  }
}

async function checkBorrowerDeviceTrust(email) {
  const credential = readBorrowerTrustCredential(email);
  if (!credential) return false;
  if (trustCheckInProgressForEmail === email) return false;

  trustCheckInProgressForEmail = email;
  otpStatus.textContent = "正在確認此瀏覽器的 30 天信任……";
  otpMessage.textContent = "正在向後端確認裝置信任狀態。";
  try {
    const result = await callBorrowerOtpApi("borrower.device.check", {
      email,
      deviceCredential: credential
    });
    if (normalizedBorrowerEmail() !== email) return false;
    if (result && result.trusted === true) {
      otpVerifiedForEmail = email;
      otpRequestEmail = email;
      otpEntry.hidden = true;
      otpInput.value = "";
      otpInput.disabled = true;
      otpStatus.textContent = "此瀏覽器已受信任";
      otpMessage.textContent = "此 Email 已在本瀏覽器完成驗證，30 天期限內不必重新輸入 OTP。";
      requestOtpButton.disabled = true;
      verifyOtpButton.disabled = true;
      resendOtpButton.disabled = true;
      return true;
    }
    removeBorrowerTrustCredential(email);
    otpStatus.textContent = "裝置信任已失效";
    otpMessage.textContent = "此瀏覽器的信任已過期、撤銷或被其他裝置取代，請重新驗證 Email。";
    return false;
  } catch (error) {
    otpStatus.textContent = "無法確認裝置信任";
    otpMessage.textContent = "暫時無法確認信任狀態，請重新驗證 Email。";
    return false;
  } finally {
    trustCheckInProgressForEmail = "";
  }
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
  if (!isResend && await checkBorrowerDeviceTrust(email)) return;
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
    otpStatus.textContent = "Email 驗證成功，正在建立 30 天裝置信任……";
    otpMessage.textContent = "正在將此瀏覽器設為唯一受信任裝置。";
    let issuedTrustCredential = "";
    try {
      // Check storage availability before issuing a credential that replaces another browser.
      const storageProbe = BORROWER_TRUST_STORAGE_PREFIX + "probe";
      window.localStorage.setItem(storageProbe, "1");
      window.localStorage.removeItem(storageProbe);
      const prepared = await callBorrowerOtpApi("borrower.device.prepare", { email });
      if (!prepared || prepared.prepared !== true || !/^[a-f0-9]{64}$/.test(String(prepared.deviceCredential || ""))) {
        throw new Error("後端未回傳有效的待啟用裝置信任憑證。");
      }
      issuedTrustCredential = prepared.deviceCredential;

      // Persist the pending credential locally before asking the server to replace
      // the currently active browser. The old browser remains trusted until activate succeeds.
      storeBorrowerTrustCredential(email, issuedTrustCredential);
      const activated = await callBorrowerOtpApi("borrower.device.activate", {
        email,
        deviceCredential: issuedTrustCredential
      });
      if (!activated || activated.trusted !== true) {
        removeBorrowerTrustCredential(email);
        throw new Error("裝置信任啟用失敗，原受信任裝置不應受到影響。");
      }
      otpStatus.textContent = "此瀏覽器已受信任";
      otpMessage.textContent = "Email 驗證成功。此瀏覽器已取得 30 天信任；其他瀏覽器的舊信任已失效。";
    } catch (trustError) {
      // If the API issued a token but browser persistence failed, revoke it to avoid
      // displacing the previously trusted browser without retaining the replacement.
      if (issuedTrustCredential) {
        removeBorrowerTrustCredential(email);
        try {
          await callBorrowerOtpApi("borrower.device.cancel", {
            email,
            deviceCredential: issuedTrustCredential
          });
        } catch (cancelError) {
          console.warn("Unable to cancel a pending borrower device credential.");
        }
      }
      otpStatus.textContent = "Email 已驗證（本頁面）";
      otpMessage.textContent = "Email 驗證成功，但無法保存 30 天裝置信任。請勿清除或關閉此頁面；需要時可重新驗證。";
      console.warn("Borrower device trust was not persisted.");
    }
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
