-- Somente leitura. Executar na origem e no destino com acesso administrativo.
-- Não exibe nomes, e-mails, placas, senhas nem conteúdo dos registros.
BEGIN TRANSACTION READ ONLY;

-- Tabelas esperadas: ausência de tabela é informada, não tratada como zero registros.
WITH expected(name) AS (
  VALUES ('audit_logs'), ('clientes'), ('configuracoes'), ('despesas'),
         ('identidade_visual'), ('mensalistas'), ('movimentacoes'),
         ('pagamentos'), ('profiles'), ('unidades'), ('veiculos')
)
SELECT e.name AS tabela, c.oid IS NOT NULL AS existe, c.relrowsecurity AS rls,
       CASE WHEN c.oid IS NULL THEN NULL ELSE
         ((xpath('/row/total/text()', query_to_xml(
           format('SELECT count(*) AS total FROM public.%I', e.name),
           false, true, ''
         )))[1]::text)::bigint
       END AS registros
FROM expected e
LEFT JOIN pg_namespace n ON n.nspname = 'public'
LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = e.name AND c.relkind IN ('r', 'p')
ORDER BY e.name;

-- Autenticação: preservar os IDs e conferir identidades separadamente dos perfis.
SELECT count(*) AS usuarios_auth FROM auth.users;
SELECT provider, count(*) AS identidades FROM auth.identities GROUP BY provider ORDER BY provider;

-- Metadados não comprovam que os arquivos físicos foram transferidos.
SELECT b.id AS bucket, b.public, count(o.id) AS objetos
FROM storage.buckets b
LEFT JOIN storage.objects o ON o.bucket_id = b.id
GROUP BY b.id, b.public ORDER BY b.id;

SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, policyname;

SELECT tablename, indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' ORDER BY tablename, indexname;

SELECT conrelid::regclass AS tabela, conname, pg_get_constraintdef(oid) AS definicao
FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND contype = 'f'
ORDER BY tabela, conname;

SELECT event_object_schema, event_object_table, trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' OR (event_object_schema = 'auth' AND event_object_table = 'users')
ORDER BY event_object_table, trigger_name;

SELECT schemaname, tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' ORDER BY schemaname, tablename;

COMMIT;
