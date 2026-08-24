---
title: Java 开发最佳实践
scope: projects
tags: [java, best-practices, spring]
verified: false
---

# Java 开发最佳实践

## 项目约定
- 使用 Spring Boot 3.x
- Java 版本：JDK 17+
- 包名规范：`com.company.project.module`

## 代码规范
- Controller 层只做请求转发，业务逻辑放 Service
- 统一异常处理用 `@ControllerAdvice`
- 数据库操作用 MyBatis-Plus，避免手写 SQL
- 日志使用 SLF4J + Logback，不直接用 `System.out.println`

## 常见坑点
- 注意 @Transactional 只对有返回值的方法生效（proxy 机制）
- 日期格式化用 `DateTimeFormatter`，禁用 `SimpleDateFormat`（线程不安全）
- 大列表分批处理，避免 OOM
