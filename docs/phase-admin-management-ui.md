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
- [ ] JavaScript 靜態語法檢查。
- [ ] 瀏覽器 UI 測試。
- [ ] 真實管理員 OTP／Session／審核流程整合測試（待前端完成後依測試計畫執行）。
- [ ] 後端測試結果同步記錄 Backend Issue #33。
- [ ] 建立 PR（不合併、不部署）。
