ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS cancelado_em timestamptz, ADD COLUMN IF NOT EXISTS cancelado_por uuid, ADD COLUMN IF NOT EXISTS motivo_cancelamento text, ADD COLUMN IF NOT EXISTS valor_avulso numeric, ADD COLUMN IF NOT EXISTS valor_calculado numeric;
ALTER TABLE public.movimentacoes DROP CONSTRAINT movimentacoes_status_movimentacao_check;
ALTER TABLE public.movimentacoes ADD CONSTRAINT movimentacoes_status_movimentacao_check CHECK (status_movimentacao IN ('ativo','finalizado','cancelado'));

CREATE OR REPLACE FUNCTION public.cancelar_entrada(p_id uuid, p_motivo text) RETURNS public.movimentacoes LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE m public.movimentacoes;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre no sistema para cancelar'; END IF;
 IF length(trim(coalesce(p_motivo,''))) = 0 THEN RAISE EXCEPTION 'Informe o motivo do cancelamento'; END IF;
 SELECT * INTO m FROM public.movimentacoes WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Entrada não encontrada'; END IF;
 IF m.status_movimentacao <> 'ativo' OR m.status_pagamento = 'pago' OR EXISTS (SELECT 1 FROM public.pagamentos WHERE movimentacao_id=p_id AND status='pago') THEN RAISE EXCEPTION 'Somente entradas abertas e sem pagamento podem ser canceladas'; END IF;
 UPDATE public.movimentacoes SET status_movimentacao='cancelado', cancelado_em=now(), cancelado_por=auth.uid(), motivo_cancelamento=trim(p_motivo), valor_total=0, forma_pagamento=NULL WHERE id=p_id RETURNING * INTO m;
 RETURN m;
END;
$$;
REVOKE ALL ON FUNCTION public.cancelar_entrada(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_entrada(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.finalizar_saida(p_id uuid, p_forma_pagamento text, p_valor_avulso numeric DEFAULT NULL) RETURNS public.movimentacoes LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE m public.movimentacoes; c public.configuracoes; momento timestamptz := now(); minutos integer; horas integer; tolerancia integer; diaria numeric; calculado numeric; total numeric;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre no sistema para registrar a saída'; END IF;
 IF p_forma_pagamento NOT IN ('pix','dinheiro') OR p_forma_pagamento IS NULL THEN RAISE EXCEPTION 'Pagamento inválido'; END IF;
 IF p_valor_avulso IS NOT NULL AND (p_valor_avulso < 0 OR p_valor_avulso::text IN ('NaN','Infinity','-Infinity') OR p_valor_avulso <> round(p_valor_avulso,2)) THEN RAISE EXCEPTION 'Informe um valor válido com até duas casas decimais'; END IF;
 SELECT * INTO m FROM public.movimentacoes WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Entrada não encontrada'; END IF;
 IF m.status_movimentacao <> 'ativo' OR m.status_pagamento='pago' THEN RAISE EXCEPTION 'Esta entrada não está aberta'; END IF;
 SELECT * INTO c FROM public.configuracoes ORDER BY updated_at DESC, created_at DESC LIMIT 1;
 minutos := greatest(0, floor(extract(epoch FROM (momento-m.entrada))/60)::integer);
 tolerancia := greatest(0, coalesce(c.tolerancia_minutos,15));
 diaria := CASE WHEN m.categoria='moto' THEN coalesce(c.valor_maximo_diario_moto,15) ELSE coalesce(c.valor_maximo_diario,35) END;
 horas := CASE WHEN minutos >= 180+tolerancia+1 THEN 0 WHEN minutos >= 120+tolerancia+1 THEN 3 WHEN minutos >= 60+tolerancia+1 THEN 2 ELSE 1 END;
 calculado := CASE WHEN horas=0 THEN diaria ELSE horas*m.valor_hora END;
 total := coalesce(p_valor_avulso,calculado);
 UPDATE public.movimentacoes SET saida=momento, tempo_total=(minutos/60)::text || 'h ' || (minutos%60)::text || 'min', valor_total=total, valor_calculado=calculado, valor_avulso=p_valor_avulso, forma_pagamento=p_forma_pagamento, status_pagamento='pago', status_movimentacao='finalizado', operador_saida_id=auth.uid() WHERE id=p_id RETURNING * INTO m;
 INSERT INTO public.pagamentos(movimentacao_id,unidade_id,tipo,valor,status,data_pagamento) VALUES(p_id,m.unidade_id,p_forma_pagamento,total,'pago',momento);
 RETURN m;
END;
$$;
REVOKE ALL ON FUNCTION public.finalizar_saida(uuid,text,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalizar_saida(uuid,text,numeric) TO authenticated;