---
name: elementary-science-fair-topic-evaluator
description: "Batch-evaluate elementary-school science-fair topic proposals stored as Markdown files. Use when asked to scan a folder tree of .md research ideas, extract structured proposal data, group related topics, score and risk-adjust them, and create a complete results dashboard and recommendations without modifying source Markdown files."
---

# 國小科展題目批次評估

以唯讀方式評估目前工作資料夾中的 Markdown 科展題目，將所有產物寫入 `<root>/results/`。不要修改、重新命名或移動任何原始 Markdown 檔案。

## 開始前

1. 將使用者指定的資料夾視為 `root`；未指定時使用目前工作資料夾。
2. 執行 `scripts/inventory_markdown.py --root <root> --results <root>/results`。它只讀取來源檔案，並遞迴排除 `node_modules`、`.git`、`results`、`output`、`archive`。
3. 在任何內容評估之前，回報程式輸出的掃描 MD 總數。若為零，停止並說明原因。
4. 將工具產生的 `file_inventory.csv` 保留為盤點基準；可補充欄位，但不得遺失既有檔案列。保留或更新 `unreadable_files.md`。

## 資料抽取與可評估性

逐一閱讀每一份可解析 Markdown，建立 `topic_database.json`。每個來源檔都要有一筆可追溯紀錄，至少含 `source_file`、`parse_status` 與 `evaluation_status`。

對可評估題目，抽取下列欄位：`title`、`subject`、`suitable_grades`、`motivation`、`real_problem`、`scientific_mechanism`、`objectives`、`independent_variables`、`dependent_variables`、`controlled_variables`、`experiment_count`、`measurement_method`、`materials_equipment`、`estimated_cost`、`estimated_weeks`、`emerging_technology_potential`、`prototype_potential`、`real_world_validation`、`safety_risks`、`feasibility_risks`、`keywords`。

只能根據原文抽取；缺漏以 JSON `null` 或「未提供」表示，絕不可補寫未提及的實驗細節。可以將同一文件的多個候選題目拆成多筆，但每筆都必須有來源檔與明確片段或標題。純索引、說明、模板或沒有可辨識研究題目的文件，標記 `evaluation_status: excluded` 並在 `exclusion_reason` 說明；它們仍計入最終核對。

## 相似研究家族

以題目、科學機制、研究變因、量測方法與應用情境共同判斷，而非只用標題文字。建立 `similarity_groups.md`，對每群提供家族名稱、成員、共同點、差異與判定：`exact_duplicate`、`highly_similar`、`same_theme_different_method` 或 `integratable`。標記完全重複、同題不同版本與可跨題整合的組合。

排行榜必須家族多樣化：先推薦每一研究家族的最高分代表題，再考慮同家族的其他版本；不要讓同一家族的多版本佔據前列。

## 評分

先分別評估「題目潛力」和「前置作業完整度」。文件篇幅或欄位完整度不得提高題目潛力。

在 `complete_scores.csv` 為每個可評估題目記錄分數、上限與一句具體理由：

| 指標 | 上限 |
| --- | ---: |
| 真實問題與研究價值 | 10 |
| 創新性及差異化 | 15 |
| 科學機制深度 | 15 |
| 可量測性 | 10 |
| 實驗設計品質 | 15 |
| 國小學生可操作性 | 10 |
| 材料及設備可取得性 | 5 |
| 原型或新興科技整合潛力 | 5 |
| 真實情境驗證能力 | 5 |
| 競賽發展潛力 | 10 |

另列 `preparation_completeness`（0–100）與理由，但不納入基礎分數。列出每一項適用風險扣分及理由：歷屆作品高度重複、材料季節性或來源不穩、核心變因難控制、數據難重現、時間過長、預算或設備過高、安全／倫理／生物培養風險、學生無法實際參與、僅有比較結果而缺少科學機制。使用 `base_score`、`risk_deduction`、`adjusted_score = base_score - risk_deduction`，不可產生負分。

防止偏誤：不要因文件長或完整而加分；高科技元件只有在改變研究設計、量測或驗證能力時才加分；僅換材料的常見題目不屬高度創新；難題不等於高品質；必須檢驗國小生能否理解、操作與答辯。

## 必備交付物

在 `results/` 建立並核對下列檔案：

```
file_inventory.csv
topic_database.json
complete_scores.csv
complete_ranking.md
similarity_groups.md
top_10_recommendations.md
pilot_test_candidates.md
unreadable_files.md
evaluation_report.html
README.md
```

`complete_ranking.md` 要列出全部可評估題目、分數、風險與家族。`top_10_recommendations.md` 要以家族多樣化後的排名給出明確推薦理由。`pilot_test_candidates.md` 選出 3–5 題並說明最小可行預試、要驗證的變因與停止條件。

`evaluation_report.html` 必須為可離線開啟的單一 HTML 檔，含內嵌資料與篩選功能：總題目數、成功／失敗解析數、題目分類、年級、科別、預算、研究週數篩選、完整排行榜、指標分數、風險警示、相似題目群、創新性與可行性比較、前 10 推薦與 3–5 個預試題。不要依賴 CDN 或網路資源。

## 完整性核對與交接

在 `README.md` 記錄方法、欄位定義、執行時間與下式的實際數字：

`掃描到的 MD 數量 = 成功評估數量 + 無法評估數量 + 被明確排除檔案數量`

三者不一致時，找出來源路徑與狀態，修正資料庫或分類後才可完成。最後回覆實際讀取 MD 數、未成功分析的檔案、綜合前 10、優先預試的 3–5 題及資料不足、相似性判讀與未驗證假設等限制。
