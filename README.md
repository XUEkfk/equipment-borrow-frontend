# 器材借用管理系統｜前端

本 Repository 存放器材借用管理系統的公開前端網站。

## 技術方向
- 原生 HTML、CSS、JavaScript，先降低建置與維護成本。
- GitHub Pages 負責靜態網站部署。
- 後端 API 由私人 Repository 管理，預計部署至 Supabase Edge Functions。
- 前端不保存管理員密碼、服務金鑰或 Google API 私密憑證。

## 本機預覽
目前為無建置工具的靜態網站，可直接以瀏覽器開啟 `index.html`，或使用 VS Code Live Server。

## 部署
Repository 的 GitHub Pages workflow 會在推送至 `main` 後部署網站。首次使用時，請至 Settings → Pages，確認 Source 使用 GitHub Actions。

## 開發狀態
目前是第一階段前端骨架。表單送出、Email 驗證、設備即時數量與管理員功能，必須等後端 API 完成後才會啟用。
