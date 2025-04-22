-- إنشاء جدول ApiKeys
CREATE TABLE "ApiKeys" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "key" VARCHAR(255) NOT NULL UNIQUE,
  "expiryDate" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT true,
  "lastUsed" TIMESTAMP,
  "usageCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء فهرس على عمود key لتسريع البحث
CREATE INDEX idx_apikeys_key ON "ApiKeys"("key");

-- إنشاء جدول للرسائل (اختياري)
CREATE TABLE "Messages" (
  "id" SERIAL PRIMARY KEY,
  "fromNumber" VARCHAR(20) NOT NULL,
  "toNumber" VARCHAR(20) NOT NULL,
  "message" TEXT NOT NULL,
  "status" VARCHAR(20) DEFAULT 'pending',
  "apiKeyId" INTEGER REFERENCES "ApiKeys"("id"),
  "sentAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
); 