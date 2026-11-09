# GitHub Pages 部署流程整理紀錄

## 階段目的
移除重複的 GitHub Pages workflow，讓 `main` 更新只由一份正式部署流程處理。

## 本階段變更
- 保留：`.github/workflows/deploy.yml`
- 移除：`.github/workflows/static.yml`
- 未修改前端功能、GAS API 設定或借用表單狀態。
- 變更位於分支 `issues/10-remove-duplicate-pages-workflow`，不直接修改 `main`。

## 原因
兩份 workflow 都會在 `main` push 時執行，並使用相同的 Pages environment 與 concurrency group，卻採用不同的 deploy-pages action 版本及取消執行策略，可能造成重複部署與排程競爭。

## 檢驗
- [x] 已確認兩份 workflow 原始內容皆會部署 repository root。
- [x] 已在獨立分支刪除重複的 `static.yml`。
- [ ] PR diff 確認僅包含預期檔案。
- [ ] PR 合併後，確認後續 `main` push 僅執行保留的部署 workflow。

## 限制
目前只完成分支上的檔案整理；尚未合併 PR，因此正式 `main` 與線上部署行為尚未改變。本階段不執行部署，也不自動合併 PR。
