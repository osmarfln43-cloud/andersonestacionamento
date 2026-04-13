export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          registro_id: string | null
          tabela: string
          usuario_email: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          registro_id?: string | null
          tabela: string
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacao: string | null
          status: string
          telefone: string | null
          tipo: string
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacao?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacao?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave_pix: string | null
          cnpj: string | null
          created_at: string
          dias_funcionamento: string | null
          disclaimer_comprovante: string | null
          endereco: string | null
          horario_abertura: string | null
          horario_fechamento: string | null
          id: string
          largura_papel: string | null
          mensagem_comprovante: string | null
          nome_beneficiario: string | null
          nome_estacionamento: string
          qr_code_url: string | null
          telefone: string | null
          tipo_chave_pix: string | null
          tolerancia_minutos: number
          unidade_id: string | null
          updated_at: string
          valor_hora: number
          valor_hora_moto: number
          valor_maximo_diario: number | null
          valor_maximo_diario_moto: number | null
          valor_minimo: number | null
        }
        Insert: {
          chave_pix?: string | null
          cnpj?: string | null
          created_at?: string
          dias_funcionamento?: string | null
          disclaimer_comprovante?: string | null
          endereco?: string | null
          horario_abertura?: string | null
          horario_fechamento?: string | null
          id?: string
          largura_papel?: string | null
          mensagem_comprovante?: string | null
          nome_beneficiario?: string | null
          nome_estacionamento?: string
          qr_code_url?: string | null
          telefone?: string | null
          tipo_chave_pix?: string | null
          tolerancia_minutos?: number
          unidade_id?: string | null
          updated_at?: string
          valor_hora?: number
          valor_hora_moto?: number
          valor_maximo_diario?: number | null
          valor_maximo_diario_moto?: number | null
          valor_minimo?: number | null
        }
        Update: {
          chave_pix?: string | null
          cnpj?: string | null
          created_at?: string
          dias_funcionamento?: string | null
          disclaimer_comprovante?: string | null
          endereco?: string | null
          horario_abertura?: string | null
          horario_fechamento?: string | null
          id?: string
          largura_papel?: string | null
          mensagem_comprovante?: string | null
          nome_beneficiario?: string | null
          nome_estacionamento?: string
          qr_code_url?: string | null
          telefone?: string | null
          tipo_chave_pix?: string | null
          tolerancia_minutos?: number
          unidade_id?: string | null
          updated_at?: string
          valor_hora?: number
          valor_hora_moto?: number
          valor_maximo_diario?: number | null
          valor_maximo_diario_moto?: number | null
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: true
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      mensalistas: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          plano: string
          status: string
          unidade_id: string | null
          updated_at: string
          valor_mensal: number
          veiculo_id: string | null
          vencimento: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          plano?: string
          status?: string
          unidade_id?: string | null
          updated_at?: string
          valor_mensal: number
          veiculo_id?: string | null
          vencimento: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          plano?: string
          status?: string
          unidade_id?: string | null
          updated_at?: string
          valor_mensal?: number
          veiculo_id?: string | null
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensalistas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensalistas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensalistas_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes: {
        Row: {
          categoria: string
          cliente_id: string | null
          cor: string | null
          created_at: string
          entrada: string
          forma_pagamento: string | null
          foto_url: string | null
          id: string
          modelo: string | null
          observacao: string | null
          operador_entrada_id: string | null
          operador_saida_id: string | null
          placa: string
          saida: string | null
          status_movimentacao: string
          status_pagamento: string
          tempo_total: string | null
          tipo_cliente: string
          unidade_id: string | null
          updated_at: string
          valor_hora: number
          valor_total: number | null
          veiculo_id: string | null
        }
        Insert: {
          categoria?: string
          cliente_id?: string | null
          cor?: string | null
          created_at?: string
          entrada?: string
          forma_pagamento?: string | null
          foto_url?: string | null
          id?: string
          modelo?: string | null
          observacao?: string | null
          operador_entrada_id?: string | null
          operador_saida_id?: string | null
          placa: string
          saida?: string | null
          status_movimentacao?: string
          status_pagamento?: string
          tempo_total?: string | null
          tipo_cliente?: string
          unidade_id?: string | null
          updated_at?: string
          valor_hora?: number
          valor_total?: number | null
          veiculo_id?: string | null
        }
        Update: {
          categoria?: string
          cliente_id?: string | null
          cor?: string | null
          created_at?: string
          entrada?: string
          forma_pagamento?: string | null
          foto_url?: string | null
          id?: string
          modelo?: string | null
          observacao?: string | null
          operador_entrada_id?: string | null
          operador_saida_id?: string | null
          placa?: string
          saida?: string | null
          status_movimentacao?: string
          status_pagamento?: string
          tempo_total?: string | null
          tipo_cliente?: string
          unidade_id?: string | null
          updated_at?: string
          valor_hora?: number
          valor_total?: number | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          codigo_pix: string | null
          created_at: string
          data_pagamento: string | null
          id: string
          movimentacao_id: string
          qr_code: string | null
          status: string
          tipo: string
          troco: number | null
          unidade_id: string | null
          valor: number
          valor_recebido: number | null
        }
        Insert: {
          codigo_pix?: string | null
          created_at?: string
          data_pagamento?: string | null
          id?: string
          movimentacao_id: string
          qr_code?: string | null
          status?: string
          tipo: string
          troco?: number | null
          unidade_id?: string | null
          valor: number
          valor_recebido?: number | null
        }
        Update: {
          codigo_pix?: string | null
          created_at?: string
          data_pagamento?: string | null
          id?: string
          movimentacao_id?: string
          qr_code?: string | null
          status?: string
          tipo?: string
          troco?: number | null
          unidade_id?: string | null
          valor?: number
          valor_recebido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          perfil: string
          status: string
          unidade_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          perfil?: string
          status?: string
          unidade_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          perfil?: string
          status?: string
          unidade_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          chave_pix: string | null
          created_at: string
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string
          telefone: string | null
          updated_at: string
          vagas: number
          valor_hora: number
        }
        Insert: {
          chave_pix?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          telefone?: string | null
          updated_at?: string
          vagas?: number
          valor_hora?: number
        }
        Update: {
          chave_pix?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
          vagas?: number
          valor_hora?: number
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          cor: string | null
          created_at: string
          id: string
          marca: string | null
          modelo: string
          observacao: string | null
          placa: string
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          marca?: string | null
          modelo: string
          observacao?: string | null
          placa: string
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          marca?: string | null
          modelo?: string
          observacao?: string | null
          placa?: string
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veiculos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
