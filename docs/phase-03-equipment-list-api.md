# Phase：前端 GAS 設備清單 API 串接

- 日期：2026-11-08
- Issue：[#4 串接 GAS equipment.list 並顯示設備清單](https://github.com/XUEkfk/equipment-borrow-frontend/issues/4)
- 可靠性補強：[#6 設備清單 API 逾時與回應資料邊界](https://github.com/XUEkfk/equipment-borrow-frontend/issues/6)
- 分支：`issues/04-gas-equipment-list-api`
- 基礎分支：`main`
- 基礎 commit：`27a2e6789aba7a9d485fe35310c43f5b35883df4`

## 目標

前端讀取 GAS `equipment.list`，安全呈現啟用設備公開資料；借用申請繼續停用。

## 已完成的程式修改

- `config.js` 保留 GAS Web App URL 設定位置；未填入正式 URL。
- `app.js` 使用 `text/plain;charset=utf-8` POST JSON，呼叫唯讀 `equipment.list`。
- 使用 `AbortController` 設定 12 秒請求逾時，逾時後離開 loading 並顯示一般錯誤訊息。
- 設備清單限制最多 100 筆。
- 驗證設備 ID、編號、名稱、描述的型別與長度。
- 驗證總數量必須為 0 至 10000 的整數。
- 保留 DOM API 與 `textContent` 呈現後端資料。
- 借用申請表單維持停用，不呼叫借用寫入 API。

## 尚待完成／驗收

- [ ] 執行 JavaScript 靜態語法檢查。
- [ ] 測試正常設備資料與空清單。
- [ ] 測試逾時與網路錯誤狀態。
- [ ] 測試超量資料、錯誤欄位型別及過長字串。
- [ ] 在使用者授權並設定本機 URL 後，進行瀏覽器與 GAS 真實整合測試。
- [ ] 將結果記錄至後端統一測試 Issue #33。
- [ ] 完成 Issue #5 安全審查。

## 本次提交狀態

- 2026-11-08 已修改 `app.js`，commit：`1ca76adf60033f0823c6e4f4df3b43da19a3d8fc`。
- 本次為程式碼寫入與 Diff 檢查；尚未執行瀏覽器測試或 GAS 實際串接測試。
- 本紀錄不代表 Issue #6 已完成驗收。

## 安全界線

本階段僅呼叫唯讀 `equipment.list`。不呼叫 `borrow.create`，不提交表單，不寫入 Google Sheets，不寄送 Email。GAS URL 留在使用者端設定，不要求使用者貼到對話。
