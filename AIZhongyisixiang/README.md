# AI 涓尰鍥涜薄鍚堝弬 App锛坲ni-app + Node锛?
## 1. 椤圭洰缁撴瀯

- `pages/index/index.vue` 棣栭〉锛堝仴搴锋祴璇勫叆鍙ｏ級
- `pages/report/index.vue` 浣撹川鎶ュ憡椤碉紙绗簩椤垫眹鎬伙級
- `pages/report/detail.vue` 鍘嗗彶鎶ュ憡璇︽儏椤?- `pages/share/index.vue` 鍒嗕韩 App 椤甸潰
- `pages/user/index.vue` 鐢ㄦ埛椤?- `pages/settings/index.vue` 妯″瀷 API 閰嶇疆椤碉紙鍙充笂瑙掕缃寜閽彲杩涘叆锛?- `backend/server.js` 鍚庣鏈嶅姟锛堟ā鍨嬮厤缃?+ 鎶ュ憡鐢熸垚锛?
搴曢儴瀵艰埅锛歚棣栭〉 / 鍋ュ悍娴嬭瘎 / 鍒嗕韩app / 鎴戠殑`

## 2. 鍚庣鍚姩

```bash
node backend/server.js
```

榛樿鐩戝惉锛歚http://127.0.0.1:3000`

濡傛灉 `3000` 琚崰鐢紝鎺ㄨ崘锛?
```bash
npm run backend:3010
```

鐩戝惉鍦板潃锛歚http://127.0.0.1:3010`

涔熷彲鍙屽嚮杩愯锛歚start-backend-3010.cmd`

## 3. 鍓嶇杩愯

鏈」鐩负鏍囧噯 uni-app 鐩綍锛屽彲鐩存帴鐢?HBuilderX 瀵煎叆杩愯锛屾垨鍦ㄤ綘鐜版湁鐨?uni-app CLI 宸ョ▼涓鍒惰繖浜涢〉闈笌閰嶇疆銆?
## 4. API 璇存槑

- `GET /api/health` 鍋ュ悍妫€鏌?- `GET /api/providers` 鑾峰彇妯″瀷閰嶇疆锛圓PI Key 鑴辨晱锛?- `POST /api/providers` 淇濆瓨妯″瀷閰嶇疆
  - body: `{ provider, baseUrl, model, apiKey }`
- `POST /api/report/generate` 鐢熸垚鍥涜薄鍚堝弬鎶ュ憡
  - body: `{ provider, profile, inquiryAnswers }`

## 5. 鍚庡彴绠＄悊椤甸潰锛堢鐞嗗憳/瀹㈡湇鏉冮檺锛?
- `GET /admin/login` 鍚庡彴鐧诲綍椤?- `GET /admin` 鍚庡彴棣栭〉锛堝乏渚у姛鑳藉垪琛細鐢ㄦ埛鍒楄〃銆佺敤鎴蜂粯璐瑰垪琛級
- 鏀寔鎸夋墜鏈哄彿/璐﹀彿/鐢ㄦ埛鍚嶆悳绱紙椤堕儴鎼滅储妗嗭級
- 鐐瑰嚮鎶ュ憡缂栧彿鍙繘鍏ヨ缁嗘姤鍛婇〉锛歚/admin/report/:reportId`

榛樿璐﹀彿锛?- 绠＄悊鍛橈細`admin / 123456`锛堝彲澧炲垹鏀规煡锛?- 瀹㈡湇锛歚operator / op123456`锛堜粎鍙煡璇級

鍚庡彴鏁版嵁鎺ュ彛锛?- `GET /api/admin/users?q=鍏抽敭璇峘 鐢ㄦ埛涓庢姤鍛婂垪琛?- `GET /api/admin/payments?q=鍏抽敭璇峘 浠樿垂鍒楄〃
- `GET /api/admin/report/:reportId` 鍗曟潯鎶ュ憡璇︽儏 JSON

## 6. 鍓嶇鐢ㄦ埛鐧诲綍/娉ㄥ唽鎺ュ彛

- `POST /api/auth/register` 娉ㄥ唽
- `POST /api/auth/login` 鐧诲綍
- `POST /api/auth/logout` 閫€鍑?- `GET /api/auth/me` 褰撳墠鐧诲綍鐢ㄦ埛
- `GET /api/user/reports` 褰撳墠鐢ㄦ埛鍘嗗彶鎶ュ憡

## 7. API Key 璁剧疆

1. 鎵撳紑 App 鍙充笂瑙?`鈿檂 杩涘叆璁剧疆椤?2. 璁剧疆鍚庣鍦板潃锛堝 `http://127.0.0.1:3000`锛?3. 閫夋嫨 `DeepSeek / OpenAI / Qwen / GLM / Custom`
4. 杈撳叆 Base URL銆丮odel銆丄PI Key 鍚庝繚瀛?5. 杩斿洖棣栭〉鐐瑰嚮鈥滃紑濮嬪仴搴锋祴璇勨€濓紝鍗充細璋冪敤鍚庣妯″瀷杩涜鍒嗘瀽锛堟ā鍨嬩笉鍙敤鏃惰嚜鍔ㄥ洖閫€鏈湴璇勪及锛?
