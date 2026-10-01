ALTER TABLE "arquivos" ADD COLUMN "dados" text;--> statement-breakpoint
ALTER TABLE "mensagens" ADD COLUMN "atualizado_em" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "mensagens_atualizado_idx" ON "mensagens" USING btree ("atualizado_em");