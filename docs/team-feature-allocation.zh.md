# 队伍 Feature 认领清单

这份文件给组长分工使用。当前项目已经搭好 MERN 框架，队员只需要按模块填功能、补测试/文档/commit evidence。

## 建议先确定的组内决策

1. 选择一个 approved variation，并拿到 tutor acknowledgement。
2. 决定 leaderboard 显示所有 attempts，还是每个用户 best attempt。
3. 确定每个人 primary subsystem，方便个人 reflection 写得有证据。
4. 约定 API response 一律使用 `{ success, data }` 或 `{ success, error }`。

## Feature 1: Authentication

负责人：TODO

后端范围：

- `backend/controllers/auth.controller.js`
- `backend/models/User.js`
- `backend/routes/auth.routes.js`
- `backend/middleware/auth.middleware.js`

前端范围：

- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/src/context/AuthContext.jsx`

交付标准：

- 用户可以 register/login/logout。
- 密码使用 bcrypt hash。
- login 返回 JWT，前端保存 token。
- `/api/auth/me` 可以恢复当前用户信息。
- 登录接口已经有 rate limiter。
- 所有表单使用 React Hook Form + Zod。

## Feature 2: Player Quiz Flow

负责人：TODO

后端范围：

- `backend/controllers/quiz.controller.js`
- `backend/models/Question.js`
- `backend/models/Score.js`
- `backend/routes/quiz.routes.js`

前端范围：

- `frontend/src/pages/Quiz.jsx`
- `frontend/src/context/QuizContext.jsx`

交付标准：

- 每次 quiz 返回 6-10 道 active questions。
- 每题正好 4 个 options。
- 后端返回题目时不能暴露 `correctAnswer`。
- 问题顺序随机。
- 用户每题只能选择一次，提交后不能改。
- 最终提交保存 `userId + score + answers[]`。
- quiz submit 已经有 rate limiter。

## Feature 3: Leaderboard + Attempts

负责人：TODO

后端范围：

- `backend/controllers/quiz.controller.js`
- `backend/models/Score.js`
- `backend/models/User.js`

前端范围：

- `frontend/src/pages/Leaderboard.jsx`
- `frontend/src/pages/Attempts.jsx`

交付标准：

- Leaderboard 显示 username 和 score，按 score 降序。
- README 说明是显示所有 attempts 还是每个用户 best attempt。
- Attempts 页面显示当前登录用户历史记录。
- 如果 variation 需要 review/answer details，history 里显示 selected answer 和 correct/incorrect。

## Feature 4: Admin Question Management

负责人：TODO

后端范围：

- `backend/controllers/admin.controller.js`
- `backend/routes/admin.routes.js`
- `backend/middleware/admin.middleware.js`
- `backend/models/Question.js`

前端范围：

- `frontend/src/pages/Admin.jsx`
- `frontend/src/routes/AdminRoute.jsx`

交付标准：

- Admin 可以 create/edit/delete question。
- Admin 可以 toggle active/inactive。
- Backend 必须检查 `role === "admin"`，不能只靠前端隐藏页面。
- 所有 question 输入都要 server-side validation。
- 前端表单使用 React Hook Form + Zod。

## Feature 5: Bulk Import

负责人：TODO

后端范围：

- `backend/controllers/admin.controller.js`

前端范围：

- `frontend/src/pages/Admin.jsx`

交付标准：

- Admin 页面有 textarea 粘贴 JSON array。
- 后端验证每一条 question。
- 返回成功数量和失败原因。
- malformed JSON、缺少 fields、options 不等于 4、correctAnswer 不在 options 中都要有清楚错误。

## Feature 6: Approved Variation

负责人：TODO

可能影响文件：

- `backend/models/Question.js`
- `backend/models/Score.js`
- `backend/controllers/quiz.controller.js`
- `backend/controllers/admin.controller.js`
- `frontend/src/pages/Quiz.jsx`
- `frontend/src/pages/Admin.jsx`
- `frontend/src/pages/Attempts.jsx`
- `README.md`

交付标准：

- 只实现一个 variation。
- README 写清楚选择、理由、数据模型变化和 demo 方式。
- Admin 创建/编辑题目时支持 variation 字段。
- Player quiz flow 明确展示 variation。

## Feature 7: Validation, Security, Robustness

负责人：三人组共享；四人组建议单独一人负责

范围：

- 后端所有 controller 的 Zod validation。
- 所有错误使用 consistent envelope。
- JWT protected routes。
- Admin RBAC。
- XSS/injection 基础防护。
- 边界情况处理。

交付标准：

- Duplicate username/email 有合理错误。
- 少于 6 道 active questions 时不能开始 quiz。
- 非法 ObjectId 不导致 server crash。
- JSON bulk import 错误不会写入半坏数据，或 README 说明 partial success 策略。
- 前后端错误提示一致。

## Feature 8: Documentation + Reflection Evidence

负责人：TODO

范围：

- `README.md`
- `docs/api/openapi.todo.yaml`
- `docs/individual-reflections/student-template.md`

交付标准：

- README 包含 setup、architecture diagram、variation、team roles、API docs 链接。
- 每个人保留 12-15 个 meaningful commits。
- 每个人 reflection 有 subsystem diagram、commit hashes、technical challenge、variation decision。

