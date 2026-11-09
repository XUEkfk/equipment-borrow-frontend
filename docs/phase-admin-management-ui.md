# Phase：管理員登入與待審核 UI

- 日期：2026-11-09
- Issue：[#8 建置管理員專用管理介面](https://github.com/XUEkfk/equipment-borrow-frontend/issues/8)
- 分支：`issues/8-admin-management-ui`
- 基礎分支：`main`
- 基礎 commit：`1a1f7bf1dec52129f834fc20e71d432f2ae4c926`

## 本階段範圍

- 一般首頁加入獨立管理員登入入口。
- 新增獨立 `admin.html` 管理員登入與待審核工作台。
- 使用既有 Email OTP 流程：`email.requestCode`、`email.verifyCode`。
- OTP 驗證後呼叫 `admin.session.create`，由後端判斷 `ADMIN_EMAIL` 管理員資格。
- Session 僅存於頁面 JavaScript 記憶體，不使用 localStorage 或 sessionStorage；重新整理需重新登入。
- 管理員清單呼叫 `admin.borrow.pending`；核准／拒絕呼叫 `admin.borrow.review`；登出呼叫 `admin.session.revoke`。
- 核准文案明確標示「已核准／待領取」，不誤稱已借出。

## 後端限制與未涵蓋功能

- 目前後端沒有獨立的確認交付 API，因此本階段不提供「確認已借出」按鈕。
- 目前沒有管理員取得所有已核准／部分歸還申請清單的 API，因此此階段僅呈現待審核申請。
- 不在前端模擬後端尚未提供的資料或狀態。
- 借用者 Email OTP 與正式借用申請流程尚未啟用，本階段不啟用借用表單。

## 安全界線

- 管理員權限以後端 Session 驗證為準，前端 UI 不作為授權依據。
- 不將 Session token 寫入持久化瀏覽器儲存。
- API URL 沿用使用者本機／部署設定，不在文件內記錄實際端點。
- 不呼叫借用寫入或歸還 API，不修改 Google Sheets。
- 不部署 GitHub Pages，不修改後端。

## 驗收狀態

- [x] 分支已建立並以指定 main commit 為基礎。
- [x] 首頁加入管理員入口。
- [x] 建立管理員登入及待審核 UI。
- [x] 依目前後端 action 串接 OTP、Session、待審核、審核及登出。
- [x] `admin.js` JavaScript 靜態語法解析（以 JavaScript Function parser 檢查，PASS）。
- [ ] 瀏覽器 UI 測試。
- [ ] 真實管理員 OTP／Session／審核流程整合測試（待前端完成後依測試計畫執行）。
- [ ] 後端測試結果同步記錄 Backend Issue #33。
- [ ] 建立 PR（不合併、不部署）。


## Issue #8 — 管理員 30 天免 OTP 登入（實作中）
- 登入頁先呼叫 `admin.session.login`，由後端決定是否需要 OTP。
- 後端回報 `otpRequired` 時，前端先顯示 OTP 欄位與重新寄送按鈕，再呼叫寄送 API；即使寄送失敗仍保留驗證畫面，避免管理員無法輸入或重新取得驗證碼。驗證後再次呼叫登入 action。
- 30 天內由後端直接核發 Session；前端不保存認證期限或持久化 Session。
- 尚待瀏覽器實測與後端整合測試。


## 2026-11-09 — 管理員 OTP 畫面切換修正

- 修正檔案：`admin.js`。
- 收到後端 `otpRequired: true` 後，先切換至 OTP 模式（顯示六位數欄位、重新寄送按鈕，主按鈕改為「驗證碼確認」），再呼叫寄送 API。
- 寄送 API 失敗時保留 OTP 欄位與重新寄送入口，並顯示明確錯誤訊息；不再因寄送失敗而讓驗證介面保持隱藏。
- 重新寄送沿用同一 OTP UI 狀態；登出／清除 Session 時才重設回初始登入畫面。
- 本次不修改後端、不實作 OTP 隔離、不修改 `main`，也未合併 PR。
- 靜態 JavaScript 語法解析：PASS。
- 瀏覽器與真實 GAS 寄信整合測試：尚未執行，需部署／更新前端後由使用者實測。


## 2026-11-09 — 修正 OTP 欄位無法隱藏

- 實際檢查發現 `styles.css` 的全域 `label { display: grid; }` 會覆蓋瀏覽器對 `hidden` 的預設隱藏呈現，造成 OTP label 即使設定 `hidden` 仍可能顯示。
- 已新增全域 `[hidden] { display: none !important; }`，確保初始登入頁及其他 hidden 元件遵守隱藏狀態。
- 本次只修正顯示層，不代表登入流程已通過；GAS API、OTP 寄送與 Session 尚待重新實測。
