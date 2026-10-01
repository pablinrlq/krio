CREATE TABLE "arquivos" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dono_id" text,
	"caminho" text NOT NULL,
	"nome" text NOT NULL,
	"tipo" text NOT NULL,
	"tamanho" integer NOT NULL,
	"publico" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avisos" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"texto" text NOT NULL,
	"link" text,
	"lido_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidatos" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"nota_krio" text,
	"decisao_marca" text DEFAULT 'pendente' NOT NULL,
	"resposta_creator" text DEFAULT 'aguardando' NOT NULL,
	"match_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversas" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" text NOT NULL,
	"candidato_id" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"usuario_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"nome_artistico" text NOT NULL,
	"cidade" text,
	"uf" text,
	"nascimento" text,
	"idiomas" text[] DEFAULT '{}'::text[] NOT NULL,
	"nichos" text[] DEFAULT '{}'::text[] NOT NULL,
	"formatos" text[] DEFAULT '{}'::text[] NOT NULL,
	"linguagem" text,
	"bio" text,
	"foto_id" text,
	"video_url" text,
	"whatsapp" text,
	"status" text DEFAULT 'rascunho' NOT NULL,
	"nota_interna" text,
	"academy" boolean DEFAULT false NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creators_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "estados_oauth" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" text,
	"provedor" text NOT NULL,
	"verificador" text,
	"extra" jsonb,
	"expira_em" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favoritos" (
	"marca_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favoritos_marca_id_creator_id_pk" PRIMARY KEY("marca_id","creator_id")
);
--> statement-breakpoint
CREATE TABLE "leituras" (
	"conversa_id" text NOT NULL,
	"usuario_id" text NOT NULL,
	"lido_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leituras_conversa_id_usuario_id_pk" PRIMARY KEY("conversa_id","usuario_id")
);
--> statement-breakpoint
CREATE TABLE "marcas" (
	"usuario_id" text PRIMARY KEY NOT NULL,
	"empresa" text NOT NULL,
	"segmento" text,
	"site" text,
	"whatsapp" text
);
--> statement-breakpoint
CREATE TABLE "mensagens" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversa_id" text NOT NULL,
	"autor_id" text,
	"tipo" text DEFAULT 'texto' NOT NULL,
	"texto" text DEFAULT '' NOT NULL,
	"arquivo_id" text,
	"status_entrega" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"marca_id" text NOT NULL,
	"titulo" text NOT NULL,
	"objetivo" text NOT NULL,
	"produto" text NOT NULL,
	"publico" text NOT NULL,
	"canais" text[] DEFAULT '{}'::text[] NOT NULL,
	"pecas" integer NOT NULL,
	"creators_desejados" integer DEFAULT 1 NOT NULL,
	"perfil_creator" text,
	"nichos" text[] DEFAULT '{}'::text[] NOT NULL,
	"idiomas" text[] DEFAULT '{}'::text[] NOT NULL,
	"pacote" text,
	"modalidade" text DEFAULT 'UGC' NOT NULL,
	"prazo" text,
	"observacoes" text,
	"status" text DEFAULT 'briefing' NOT NULL,
	"rodadas_total" integer DEFAULT 1 NOT NULL,
	"rodadas_usadas" integer DEFAULT 0 NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" text NOT NULL,
	"rede" text NOT NULL,
	"id_externo" text NOT NULL,
	"usuario" text,
	"nome_exibicao" text,
	"avatar_url" text,
	"seguidores" integer,
	"publicacoes" integer,
	"engajamento" integer,
	"posts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"token_acesso" text,
	"token_renovacao" text,
	"token_expira_em" timestamp with time zone,
	"sincronizado_em" timestamp with time zone,
	"erro" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessoes" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" text NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"senha_hash" text,
	"google_id" text,
	"papel" text NOT NULL,
	"aceitou_termos_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email"),
	CONSTRAINT "usuarios_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "arquivos" ADD CONSTRAINT "arquivos_dono_id_usuarios_id_fk" FOREIGN KEY ("dono_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_creator_id_creators_usuario_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("usuario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_candidato_id_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."candidatos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creators" ADD CONSTRAINT "creators_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_marca_id_marcas_usuario_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("usuario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_creator_id_creators_usuario_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("usuario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leituras" ADD CONSTRAINT "leituras_conversa_id_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."conversas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leituras" ADD CONSTRAINT "leituras_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marcas" ADD CONSTRAINT "marcas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_conversa_id_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."conversas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_marca_id_marcas_usuario_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("usuario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redes" ADD CONSTRAINT "redes_creator_id_creators_usuario_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("usuario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "avisos_usuario_idx" ON "avisos" USING btree ("usuario_id","criado_em");--> statement-breakpoint
CREATE UNIQUE INDEX "candidatos_pedido_creator_idx" ON "candidatos" USING btree ("pedido_id","creator_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversas_pedido_candidato_idx" ON "conversas" USING btree ("pedido_id","candidato_id");--> statement-breakpoint
CREATE INDEX "mensagens_conversa_idx" ON "mensagens" USING btree ("conversa_id","criado_em");--> statement-breakpoint
CREATE INDEX "pedidos_marca_idx" ON "pedidos" USING btree ("marca_id");--> statement-breakpoint
CREATE UNIQUE INDEX "redes_creator_rede_idx" ON "redes" USING btree ("creator_id","rede");--> statement-breakpoint
CREATE INDEX "sessoes_usuario_idx" ON "sessoes" USING btree ("usuario_id");