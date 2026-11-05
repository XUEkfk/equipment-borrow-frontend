// 後端 API 尚未完成前，不送出或保存任何借用者資料。
const form = document.querySelector("#borrow-form");
const message = document.querySelector("#form-message");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "申請功能尚未啟用，請待系統完成後再使用。";
});
