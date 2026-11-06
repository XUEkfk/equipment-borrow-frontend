// GAS equipment.list integration only. Borrow submission remains intentionally disabled.
const apiConfig = window.APP_CONFIG || {};
const equipmentList = document.querySelector("#equipment-list");
const form = document.querySelector("#borrow-form");
const message = document.querySelector("#form-message");

async function loadEquipment() {
  const apiUrl = String(apiConfig.GAS_API_URL || "").trim();

  if (!apiUrl) {
    renderEquipmentMessage("尚未設定 GAS Web App URL，設備資料暫時無法載入。", "empty-state");
    return;
  }

  renderEquipmentMessage("正在載入設備資料……", "empty-state");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({ action: "equipment.list" }),
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!result || result.ok !== true || !Array.isArray(result.data)) {
      throw new Error("後端回傳格式不符合預期");
    }

    renderEquipment(result.data);
  } catch (error) {
    console.error("Equipment API request failed:", error);
    renderEquipmentMessage("設備資料載入失敗，請稍後重新整理頁面。", "empty-state");
  }
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
    heading.textContent = String(item.name || "未命名設備");
    card.append(heading);

    if (item.equipmentCode) {
      const code = document.createElement("p");
      code.className = "equipment-code";
      code.textContent = `設備編號：${String(item.equipmentCode)}`;
      card.append(code);
    }

    if (item.description) {
      const description = document.createElement("p");
      description.textContent = String(item.description);
      card.append(description);
    }

    const quantity = document.createElement("p");
    quantity.className = "equipment-quantity";
    const total = Number(item.totalQuantity);
    quantity.textContent = `總數量：${Number.isFinite(total) ? total : 0}`;
    card.append(quantity);

    equipmentList.append(card);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "申請功能尚未啟用，請待系統完成後再使用。";
});

loadEquipment();
