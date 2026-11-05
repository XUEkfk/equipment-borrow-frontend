# 器材借用管理系統｜前端

本 Repository 存放器材借用管理系統的公開前端網站。

## 技術方向
- 原生 HTML、CSS、JavaScript，先降低建置與維護成本。
- GitHub Pages 負責靜態網站部署。
- 後端 API 使用私人 Repository 管理的 Google Apps Script（GAS）Web App。
- 初期資料儲存由 GAS 存取 Google Sheets。
- 前端不保存管理員密碼、服務金鑰或 Google API 私密憑證。

## API 欄位命名
借用表單欄位與 GAS API 契約一致：
- `borrowerName`
- `borrowerPhone`
- `email`
- `equipmentId`
- `purpose`
- `startDate`
- `dueDate`

目前表單仍處於停用狀態，尚未連接 GAS；未完成後端安全及瀏覽器整合測試前，不會傳送借用者個人資料。

## 本機預覽
目前為無建置工具的靜態網站，可直接以瀏覽器開啟 `index.html`，或使用 VS Code Live Server。

## 部署
Repository 的 GitHub Pages workflow 會在推送至 `main` 後部署網站。首次使用時，請至 Settings → Pages，確認 Source 使用 GitHub Actions。

## 開發狀態
目前是第一階段前端骨架。設備清單、Email 驗證、借用申請及管理員功能，需等 GAS API 完成並通過整合測試後才會啟用。
