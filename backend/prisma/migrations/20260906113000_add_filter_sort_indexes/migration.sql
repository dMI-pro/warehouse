-- Indexes for current filters/sorts. Data unchanged (CREATE INDEX only).
-- Apply on VPS with: prisma migrate deploy (not migrate dev).

-- products
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");
CREATE INDEX "products_arrivalDate_idx" ON "products"("arrivalDate");
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX "products_warehouseId_idx" ON "products"("warehouseId");
CREATE INDEX "products_committeeId_idx" ON "products"("committeeId");

-- sales
CREATE INDEX "sales_soldAt_idx" ON "sales"("soldAt");
CREATE INDEX "sales_productId_idx" ON "sales"("productId");
CREATE INDEX "sales_soldBy_idx" ON "sales"("soldBy");

-- returns
CREATE INDEX "returns_returnedAt_idx" ON "returns"("returnedAt");
CREATE INDEX "returns_productId_idx" ON "returns"("productId");
CREATE INDEX "returns_returnedBy_idx" ON "returns"("returnedBy");

-- audit_logs
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "audit_logs"("entityType", "entityId", "createdAt");

-- refresh_tokens
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");
