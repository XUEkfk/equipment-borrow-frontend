# Phase：前端 GAS 設備清單 API 串接

- 日期：2026-11-06
- Issue：[#4 串接 GAS equipment.list 並顯示設備清單](https://github.com/XUEkfk/equipment-borrow-frontend/issues/4)
- 分支：`issues/04-gas-equipment-list-api`
- 基礎分支：`main`
- 基礎 commit：`27a2e6789aba7a9d485fe35310c43f5b35883df4`

## 目標
前端讀取 GAS `equipment.list`，安全呈現啟用設備公開資料；借用申請繼續停用。

## 修改
- 新增 `config.js`，供部署 Web App URL 設定。
- `app.js` 使用 `text/plain;charset=utf-8` POST JSON，解析 `{ ok, data }`。
- 設備清單支援載入、空資料、錯誤及資料卡片。
- 使用 DOM API 與 `textContent` 呈現後端欄位，避免將資料字串當作 HTML。
- 借用申請表單維持停用。
- 更新 README 與設備清單樣式。

## 尚待完成／驗收
- [ ] 將正式 GAS Web App `/exec` URL 填入 `config.js`。
- [ ] 在瀏覽器實測 GitHub Pages 設備清單載入。
- [ ] 測試空資料、設備資料及 API 失敗狀態。
- [ ] 執行 JavaScript 靜態語法檢查。
- [ ] 完成後更新本紀錄及 Issue。

## 安全界線
本階段僅呼叫唯讀 `equipment.list`。不呼叫 `borrow.create`，不提交表單，不寫入 Google Sheets，不寄送 Email。
