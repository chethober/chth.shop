-- Idempotent data-preserving upgrade, run before `prisma db push` (see Dockerfile / README).
-- Brings a database created by the pre-marketplace schema (artists) to a shape that
-- `db push` can finish without data loss. Every step is a no-op on fresh or upgraded databases.

DO $$
BEGIN
  -- artists -> stores (artists and merchants now share one table)
  IF to_regclass('public.artists') IS NOT NULL AND to_regclass('public.stores') IS NULL THEN
    ALTER TABLE "artists" RENAME TO "stores";
    ALTER TABLE "stores" RENAME CONSTRAINT "artists_pkey" TO "stores_pkey";
    ALTER INDEX IF EXISTS "artists_userId_key" RENAME TO "stores_userId_key";
    ALTER TABLE "stores" DROP CONSTRAINT IF EXISTS "artists_userId_fkey";
  END IF;

  -- products.artistId -> products.storeId
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'artistId') THEN
    ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_artistId_fkey";
    ALTER TABLE "products" RENAME COLUMN "artistId" TO "storeId";
  END IF;

  -- users.isArtist -> users.isSeller (and it is no longer nullable)
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'isArtist') THEN
    ALTER TABLE "users" RENAME COLUMN "isArtist" TO "isSeller";
    UPDATE "users" SET "isSeller" = false WHERE "isSeller" IS NULL;
  END IF;

  -- Cart lines now carry their base product type and options.
  IF to_regclass('public.cart_items') IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'cart_items' AND column_name = 'type') THEN
    DROP INDEX IF EXISTS "cart_items_cartId_productId_key";
    ALTER TABLE "cart_items" ADD COLUMN "type" TEXT,
      ADD COLUMN "options" JSONB NOT NULL DEFAULT '{}',
      -- sha1('{}'): existing lines have no options, so they stack with new identical ones.
      ADD COLUMN "optionsKey" TEXT NOT NULL DEFAULT 'bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f';
    UPDATE "cart_items" ci SET "type" = p."type" FROM "products" p WHERE p."id" = ci."productId";
    DELETE FROM "cart_items" WHERE "type" IS NULL;
    ALTER TABLE "cart_items" ALTER COLUMN "type" SET NOT NULL;
  END IF;

  -- Order lines now snapshot the product type and name.
  IF to_regclass('public.order_items') IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'type') THEN
    ALTER TABLE "order_items" ADD COLUMN "type" TEXT, ADD COLUMN "name" TEXT;
    UPDATE "order_items" oi SET "type" = p."type", "name" = p."name" FROM "products" p WHERE p."id" = oi."productId";
    UPDATE "order_items" SET "type" = COALESCE("type", 'tshirt'), "name" = COALESCE("name", 'Item');
    ALTER TABLE "order_items" ALTER COLUMN "type" SET NOT NULL, ALTER COLUMN "name" SET NOT NULL;
  END IF;
END $$;
