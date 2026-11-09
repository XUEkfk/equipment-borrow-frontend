# 器材借用管理系統｜前端

本 Repository 存放器材借用管理系統的公開前端網站。

## 技術方向
- 原生 HTML、CSS、JavaScript，先降低建置與維護成本。
- GitHub Pages 負責靜態網站部署。
- 後端 API 使用私人 Repository 管理的 Google Apps Script（GAS）Web App。
- 初期資料儲存由 GAS 存取 Google Sheets。
- 前端不保存管理員密碼、服務金鑰或 Google API 私密憑證。

## GAS 設定
在 `config.js` 的 `GAS_API_URL` 填入 Apps Script「部署 → 管理部署作業」中的 Web App URL（`/exec`）。
此網址是公開 API 端點，不可在此放入管理員密碼或私密憑證。

前端以 `POST`、`Content-Type: text/plain;charset=utf-8` 傳送 JSON 字串，呼叫 `equipment.list`。這是目前已由 GitHub Pages 瀏覽器實測可通過的傳輸方式。

## 目前功能
- 設備清單：讀取已啟用設備的公開欄位（編號、名稱、描述、總數量）。
- 借用申請：仍停用，不傳送借用者個人資料。
- 管理員入口與待審核工作台：已加入獨立 `admin.html`，使用 Email OTP、後端管理員 Session、待審核清單與核准／拒絕 API；目前尚待瀏覽器與真實 GAS 整合驗收。
- 借用者 Email 驗證與正式借用申請：尚未啟用。
- 交付確認及完整管理總覽：後端尚未提供相應 API，前端不會模擬此功能。

## 本機預覽
目前為無建置工具的靜態網站，可直接以瀏覽器開啟 `index.html`，或使用本機靜態 HTTP Server。

## 部署
Repository 的 GitHub Pages workflow 會在推送至 `main` 後部署網站。首次使用時，請至 Settings → Pages，確認 Source 使用 GitHub Actions。
