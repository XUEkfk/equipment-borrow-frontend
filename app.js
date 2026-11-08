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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "申請功能尚未啟用，請待系統完成後再使用。";
});

loadEquipment();
