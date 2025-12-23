import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Search, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  X,
  Save,
  Menu,
  Home as HomeIcon,
  MapPin,
  User,
  HeartPulse,
  Pill,
  ClipboardList,
  Upload,
  Database,
  Check,
  AlertTriangle,
  FileInput,
  FileSpreadsheet,
  Info,
  Siren,
  Tent,
  Microscope,
  ArrowRightLeft,
  Phone,
  FolderOpen,
  Filter,
  Calendar,
  BarChart3
} from 'lucide-react';

// --- Supabase Config ---
const supabaseUrl = 'https://xdxbyeqynrfzomodmvws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkeGJ5ZXF5bnJmem9tb2RtdndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTIxMDcsImV4cCI6MjA4MTQ4ODEwN30.UViaUzSDD2t2n6KxrbpaQ7E1VdMwZ6KzLg1b-4mB9n8';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Extended Types (SINAN) ---

interface Paciente {
  NU_NOTIFIC: string;
  ID_BAIRRO?: string;
  DT_NOTIFIC?: string;
  NM_PACIENT?: string;
  STATUS_CASO?: string;
  NM_BAIRRO?: string;
  [key: string]: any; 
}

interface BairroInfo {
  rs: string; // Região de Saúde
  ra: string; // Região Administrativa
  bairro: string;
}

// --- Helper Functions ---

const formatDateToISO = (dateStr: string) => {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.length !== 10 || !dateStr.includes('/')) return null;
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;
};

const normalizeStr = (str: string) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

const getErrorMessage = (err: any): string => {
  if (!err) return 'Erro desconhecido.';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    if (err.message) return String(err.message);
    if (err.error_description) return String(err.error_description);
    try { return JSON.stringify(err).slice(0, 200); } catch (e) { return 'Erro objeto.'; }
  }
  return String(err);
};

// --- BAIRRO DATABASE MAPPING ---
const BAIRRO_DB: Record<string, BairroInfo> = {
  "242": { rs: "Região Sudoeste", ra: "Água Quente", bairro: "Setor Habitacional Água Quente" },
  "198": { rs: "Região Sudoeste", ra: "Águas Claras", bairro: "Águas Claras Vertical" },
  "203": { rs: "Região Sudoeste", ra: "Águas Claras", bairro: "IGN Águas Claras" },
  "199": { rs: "Região Sudoeste", ra: "Arniqueira", bairro: "ADE" },
  "200": { rs: "Região Sudoeste", ra: "Arniqueira", bairro: "Areal" },
  "201": { rs: "Região Sudoeste", ra: "Arniqueira", bairro: "Vereda da Cruz" },
  "216": { rs: "Região Norte", ra: "Arapoanga", bairro: "Arapoanga" },
  "202": { rs: "Região Sudoeste", ra: "Arniqueira", bairro: "Arniqueiras" },
  "262": { rs: "Região Oeste", ra: "Brazlândia", bairro: "Área Rural - Brazlândia" },
  "263": { rs: "Região Oeste", ra: "Brazlândia", bairro: "Brazlândia" },
  "264": { rs: "Região Oeste", ra: "Brazlândia", bairro: "INCRA 8" },
  "265": { rs: "Região Oeste", ra: "Brazlândia", bairro: "IGN Brazlandia" },
  "172": { rs: "Região Centro-Sul", ra: "Candangolândia", bairro: "Candangolândia" },
  "248": { rs: "Região Oeste", ra: "Ceilândia", bairro: "Privê Lucena Roriz" },
  "249": { rs: "Região Oeste", ra: "Ceilândia", bairro: "Setor M Ímpar" },
  "250": { rs: "Região Oeste", ra: "Ceilândia", bairro: "Setor M Par" },
  "251": { rs: "Região Oeste", ra: "Ceilândia", bairro: "Setor N Ímpar" },
  "252": { rs: "Região Oeste", ra: "Ceilândia", bairro: "Setor N Par" },
  "253": { rs: "Região Oeste", ra: "Ceilândia", bairro: "Setor O e Expansão" },
  "254": { rs: "Região Oeste", ra: "Ceilândia", bairro: "Setor P Norte" },
  "255": { rs: "Região Oeste", ra: "Ceilândia", bairro: "Setor P Sul" },
  "256": { rs: "Região Oeste", ra: "Ceilândia", bairro: "Setor R" },
  "257": { rs: "Região Oeste", ra: "Ceilândia", bairro: "Setor de Indústrias Ceilandia" },
  "258": { rs: "Região Oeste", ra: "Ceilândia", bairro: "Área Rural - Brazlândia" },
  "261": { rs: "Região Oeste", ra: "Ceilândia", bairro: "IGN Ceilândia" },
  "158": { rs: "Região Central", ra: "Cruzeiro", bairro: "SHCES" },
  "159": { rs: "Região Central", ra: "Cruzeiro", bairro: "SRES" },
  "160": { rs: "Região Central", ra: "Cruzeiro", bairro: "IGN Cruzeiro" },
  "275": { rs: "Região Norte", ra: "Fercal", bairro: "Area Rural - Fercal" },
  "276": { rs: "Região Norte", ra: "Fercal", bairro: "Fercal" },
  "277": { rs: "Região Norte", ra: "Fercal", bairro: "IGN Fercal" },
  "180": { rs: "Região Sul", ra: "Gama", bairro: "Setor Norte Gama" },
  "181": { rs: "Região Sul", ra: "Gama", bairro: "Setor Sul Gama" },
  "182": { rs: "Região Sul", ra: "Gama", bairro: "Setor Leste Gama" },
  "183": { rs: "Região Sul", ra: "Gama", bairro: "Setor Oeste Gama" },
  "184": { rs: "Região Sul", ra: "Gama", bairro: "Setor Central Gama" },
  "185": { rs: "Região Sul", ra: "Gama", bairro: "Ponte Alta Norte" },
  "186": { rs: "Região Sul", ra: "Gama", bairro: "Engenho das Lajes" },
  "187": { rs: "Região Sul", ra: "Gama", bairro: "Área Rural" },
  "188": { rs: "Região Sul", ra: "Gama", bairro: "ING Gama" },
  "204": { rs: "Região Centro-Sul", ra: "Guará", bairro: "Guará I" },
  "205": { rs: "Região Centro-Sul", ra: "Guará", bairro: "Guará II" },
  "285": { rs: "Região Centro-Sul", ra: "Guará", bairro: "Lúcio Costa" },
  "206": { rs: "Região Centro-Sul", ra: "Guará", bairro: "Colônia Agrícola Águas Claras" },
  "207": { rs: "Região Centro-Sul", ra: "Guará", bairro: "Colônia Agrícola Bernardo Sayão" },
  "208": { rs: "Região Centro-Sul", ra: "Guará", bairro: "Colonia Agrícoa IAPI" },
  "209": { rs: "Região Centro-Sul", ra: "Guará", bairro: "Setor Parque Sul + Reserva Ecológica Guará" },
  "210": { rs: "Região Centro-Sul", ra: "Guará", bairro: "IGN GUARA" },
  "229": { rs: "Região Leste", ra: "Itapoã", bairro: "Itapoã" },
  "230": { rs: "Região Leste", ra: "Itapoã", bairro: "Condomínio Entrelagos" },
  "231": { rs: "Região Leste", ra: "Itapoã", bairro: "Área Rural - Itapõa" },
  "232": { rs: "Região Leste", ra: "Itapoã", bairro: "IGN Itapoã" },
  "141": { rs: "Região Leste", ra: "Jardim Botânico", bairro: "Tororó" },
  "142": { rs: "Região Leste", ra: "Jardim Botânico", bairro: "Jardim Magueiral" },
  "143": { rs: "Região Leste", ra: "Jardim Botânico", bairro: "Condominios Jardim Botânico" },
  "281": { rs: "Região Leste", ra: "Jardim Botânico", bairro: "Papuda" },
  "145": { rs: "Região Leste", ra: "Jardim Botânico", bairro: "IGN Jardim Botanico" },
  "152": { rs: "Região Central", ra: "Lago Norte", bairro: "Granja do Torto" },
  "153": { rs: "Região Central", ra: "Lago Norte", bairro: "Lago Norte/Taquar" },
  "154": { rs: "Região Central", ra: "Lago Norte", bairro: "Mansões Lago Norte" },
  "155": { rs: "Região Central", ra: "Lago Norte", bairro: "Península do Lago Norte" },
  "156": { rs: "Região Central", ra: "Lago Norte", bairro: "IGN Lago Norte" },
  "137": { rs: "Região Central", ra: "Lago Sul", bairro: "Setor Habitacional Individual Sul" },
  "138": { rs: "Região Central", ra: "Lago Sul", bairro: "Setor de Mansões Dom Bosco" },
  "139": { rs: "Região Central", ra: "Lago Sul", bairro: "Villages Alvorada/Ermida Dom Bosco" },
  "140": { rs: "Região Central", ra: "Lago Sul", bairro: "IGN Lago Sul" },
  "164": { rs: "Região Centro-Sul", ra: "Núcleo Bandeirante", bairro: "Metropolitana" },
  "165": { rs: "Região Centro-Sul", ra: "Núcleo Bandeirante", bairro: "Núcleo Bandeirante" },
  "166": { rs: "Região Centro-Sul", ra: "Núcleo Bandeirante", bairro: "Vila Cahuy" },
  "167": { rs: "Região Centro-Sul", ra: "Núcleo Bandeirante", bairro: "IGN Núcleo Bandeirante" },
  "223": { rs: "Região Leste", ra: "Paranoá", bairro: "Área Rural - Paranoá" },
  "224": { rs: "Região Leste", ra: "Paranoá", bairro: "Morada Quintas do Campo" },
  "225": { rs: "Região Leste", ra: "Paranoá", bairro: "Paranoá" },
  "226": { rs: "Região Leste", ra: "Paranoá", bairro: "Residencial La Font" },
  "227": { rs: "Região Leste", ra: "Paranoá", bairro: "Paranoá Parque" },
  "228": { rs: "Região Leste", ra: "Paranoá", bairro: "IGN Paranoá" },
  "168": { rs: "Região Centro-Sul", ra: "Park Way", bairro: "SMPW Trecho 1" },
  "169": { rs: "Região Centro-Sul", ra: "Park Way", bairro: "SMPW Trecho 2" },
  "170": { rs: "Região Centro-Sul", ra: "Park Way", bairro: "SMPW Trecho 3" },
  "171": { rs: "Região Centro-Sul", ra: "Park Way", bairro: "Vargem Bonita" },
  "280": { rs: "Região Centro-Sul", ra: "Park Way", bairro: "IGN Park Way" },
  "217": { rs: "Região Norte", ra: "Planaltina", bairro: "Condomínio Planaltina" },
  "218": { rs: "Região Norte", ra: "Planaltina", bairro: "Condomínio Mestre D Armas" },
  "219": { rs: "Região Norte", ra: "Planaltina", bairro: "Planaltina Tradicional" },
  "220": { rs: "Região Norte", ra: "Planaltina", bairro: "Vale do Amanhecer" },
  "221": { rs: "Região Norte", ra: "Planaltina", bairro: "Área Rural" },
  "222": { rs: "Região Norte", ra: "Planaltina", bairro: "IGN Planaltina" },
  "128": { rs: "Região Central", ra: "Plano Piloto", bairro: "Asa Norte" },
  "129": { rs: "Região Central", ra: "Plano Piloto", bairro: "Asa Sul" },
  "279": { rs: "Região Central", ra: "Plano Piloto", bairro: "SMU" },
  "133": { rs: "Região Central", ra: "Plano Piloto", bairro: "Vila Planalto" },
  "134": { rs: "Região Central", ra: "Plano Piloto", bairro: "Vila Telebrasília" },
  "135": { rs: "Região Central", ra: "Plano Piloto", bairro: "Setor Noroeste" },
  "136": { rs: "Região Central", ra: "Plano Piloto", bairro: "IGN Plano Piloto" },
  "240": { rs: "Região Sudoeste", ra: "Recanto das Emas", bairro: "Área Rural - Recanto das Emas" },
  "241": { rs: "Região Sudoeste", ra: "Recanto das Emas", bairro: "Recanto das Emas" },
  "243": { rs: "Região Sudoeste", ra: "Recanto das Emas", bairro: "IGN Recanto das Emas" },
  "173": { rs: "Região Centro-Sul", ra: "Riacho Fundo I", bairro: "Riacho Fundo" },
  "174": { rs: "Região Centro-Sul", ra: "Riacho Fundo I", bairro: "Colônia Agricola Sucupira + Cond. Riacho Fundo" },
  "175": { rs: "Região Centro-Sul", ra: "Riacho Fundo I", bairro: "IGN Riacho Fundo I" },
  "176": { rs: "Região Centro-Sul", ra: "Riacho Fundo II", bairro: "Riacho Fundo II" },
  "177": { rs: "Região Centro-Sul", ra: "Riacho Fundo II", bairro: "Riacho Fundo Parque" },
  "178": { rs: "Região Centro-Sul", ra: "Riacho Fundo II", bairro: "Área Rural - Riacho Fundo II" },
  "179": { rs: "Região Centro-Sul", ra: "Riacho Fundo II", bairro: "IGN Riacho Fundo II" },
  "244": { rs: "Região Sudoeste", ra: "Samambaia", bairro: "Área Rural - Samambaia" },
  "245": { rs: "Região Sudoeste", ra: "Samambaia", bairro: "Samambaia 100 300 500" },
  "246": { rs: "Região Sudoeste", ra: "Samambaia", bairro: "Samambaia 200 400 600 800" },
  "247": { rs: "Região Sudoeste", ra: "Samambaia", bairro: "IGN Samambaia" },
  "233": { rs: "Região Sul", ra: "Santa Maria", bairro: "Área Rural - Santa Maria" },
  "234": { rs: "Região Sul", ra: "Santa Maria", bairro: "Condominios Santa Maria" },
  "235": { rs: "Região Sul", ra: "Santa Maria", bairro: "Residencial Santos Dummont" },
  "236": { rs: "Região Sul", ra: "Santa Maria", bairro: "Santa Maria" },
  "237": { rs: "Região Sul", ra: "Santa Maria", bairro: "Vila DVO" },
  "238": { rs: "Região Sul", ra: "Santa Maria", bairro: "Residencial Total Ville" },
  "239": { rs: "Região Sul", ra: "Santa Maria", bairro: "IGN Santa Maria" },
  "146": { rs: "Região Leste", ra: "São Sebastião", bairro: "Área Rural - São Sebastião" },
  "147": { rs: "Região Leste", ra: "São Sebastião", bairro: "Morro da Cruz" },
  "148": { rs: "Região Leste", ra: "São Sebastião", bairro: "Núcleo Rural Capão Comprido" },
  "149": { rs: "Região Leste", ra: "São Sebastião", bairro: "São Sebastião" },
  "150": { rs: "Região Leste", ra: "São Sebastião", bairro: "Residencial Crixás" },
  "151": { rs: "Região Leste", ra: "São Sebastião", bairro: "IGN São Sebastião" },
  "211": { rs: "Região Centro-Sul", ra: "SCIA / Estrutural", bairro: "Vila Estrutural + Cidade dos Automóveis" },
  "212": { rs: "Região Centro-Sul", ra: "SCIA / Estrutural", bairro: "Chácara Santa Luzia" },
  "213": { rs: "Região Centro-Sul", ra: "SCIA / Estrutural", bairro: "Área Rural - SCIA" },
  "214": { rs: "Região Centro-Sul", ra: "SCIA / Estrutural", bairro: "IGN Estrutural" },
  "215": { rs: "Região Centro-Sul", ra: "SIA", bairro: "SIA" },
  "266": { rs: "Região Norte", ra: "Sobradinho", bairro: "Área Rural - Sobradinho" },
  "267": { rs: "Região Norte", ra: "Sobradinho", bairro: "Condomínio RK" },
  "268": { rs: "Região Norte", ra: "Sobradinho", bairro: "Nova Colina" },
  "269": { rs: "Região Norte", ra: "Sobradinho", bairro: "Sobradinho" },
  "274": { rs: "Região Norte", ra: "Sobradinho", bairro: "IGN Sobradinho" },
  "271": { rs: "Região Norte", ra: "Sobradinho II", bairro: "Area Rural - Sobradinho II" },
  "272": { rs: "Região Norte", ra: "Sobradinho II", bairro: "Lago Oeste" },
  "273": { rs: "Região Norte", ra: "Sobradinho II", bairro: "Sobradinho II" },
  "270": { rs: "Região Norte", ra: "Sobradinho II", bairro: "IGN Sobradinho II" },
  "259": { rs: "Região Oeste", ra: "Sol Nascente/ Pôr do Sol", bairro: "Sol Nascente" },
  "260": { rs: "Região Oeste", ra: "Sol Nascente/ Pôr do Sol", bairro: "Pôr do Sol" },
  "189": { rs: "Região Sudoeste", ra: "Taguatinga", bairro: "Taguatinga Norte" },
  "190": { rs: "Região Sudoeste", ra: "Taguatinga", bairro: "Taguatinga Sul" },
  "191": { rs: "Região Sudoeste", ra: "Taguatinga", bairro: "Chacaras Taguatinga + Primavera" },
  "192": { rs: "Região Sudoeste", ra: "Taguatinga", bairro: "IGN Taguatinga" },
  "157": { rs: "Região Central", ra: "Varjão", bairro: "Varjão" },
  "193": { rs: "Região Sudoeste", ra: "Vicente Pires", bairro: "Colônia Agrícola Vicente Pires" },
  "194": { rs: "Região Sudoeste", ra: "Vicente Pires", bairro: "Colônia Agrícola Samambaia" },
  "195": { rs: "Região Sudoeste", ra: "Vicente Pires", bairro: "Colônia Agrícola São José" },
  "196": { rs: "Região Sudoeste", ra: "Vicente Pires", bairro: "26 de Setembro" },
  "197": { rs: "Região Sudoeste", ra: "Vicente Pires", bairro: "IGN Vicente Pires" },
  "161": { rs: "", ra: "Sudoeste/Octogonal", bairro: "Octogonal" },
  "162": { rs: "", ra: "Sudoeste/Octogonal", bairro: "Sudoeste" },
  "163": { rs: "", ra: "Sudoeste/Octogonal", bairro: "IGN Sudoeste/Octogonal" },
  "82": { rs: "Ignorado", ra: "Ignorado", bairro: "IGN DF" },
};

const BAIRRO_NAME_MAP: Record<string, BairroInfo> = {};
Object.values(BAIRRO_DB).forEach(info => {
  if (info.bairro) {
    BAIRRO_NAME_MAP[normalizeStr(info.bairro)] = info;
  }
});

const LEGENDAS_SINAN: Record<string, { descricao: string; opcoes?: string }> = {
  NU_NOTIFIC: { descricao: "Número da Notificação. Chave Primária.", opcoes: "Gerado pelo SINAN." },
  TP_NOT: { descricao: "Tipo de Notificação", opcoes: "2-Individual" },
  ID_AGRAVO: { descricao: "Agravo/Doença", opcoes: "A30-Tuberculose" },
  DT_NOTIFIC: { descricao: "Data da Notificação", opcoes: "DD/MM/AAAA" },
  ID_UNIDADE: { descricao: "Unidade de Saúde Notificadora" },
  ID_MUNICIP: { descricao: "Município de Notificação" },
  DT_DIGITA: { descricao: "Data de Digitação" },
  NM_PACIENT: { descricao: "Nome do Paciente" },
  NM_MAE_PAC: { descricao: "Nome da Mãe do Paciente" },
  DT_NASC: { descricao: "Data de Nascimento" },
  NU_IDADE_N: { descricao: "Idade (anos)" },
  CS_SEXO: { descricao: "Sexo Biológico", opcoes: "M-Masculino, F-Feminino" },
  CS_RACA: { descricao: "Raça/Cor", opcoes: "1-Branca, 2-Preta, 4-Parda..." },
  CS_ESCOL_N: { descricao: "Escolaridade" },
  CS_GESTANT: { descricao: "Situação Gestacional" },
  ID_CNS_SUS: { descricao: "Cartão SUS (CNS)" },
  NM_LOGRADO: { descricao: "Logradouro (Rua/Av)" },
  NU_NUMERO: { descricao: "Número" },
  NM_BAIRRO: { descricao: "Bairro" },
  ID_BAIRRO: { descricao: "Código do Bairro (TB-DF)", opcoes: "Mapeamento automático de Região." },
  ID_MN_RESI: { descricao: "Município de Residência" },
  NU_CEP: { descricao: "CEP" },
  NU_TELEFON: { descricao: "Telefone de contato" },
  CS_ZONA: { descricao: "Zona Residencial", opcoes: "1-Urbana, 2-Rural" },
  POP_LIBER: { descricao: "População Privada de Liberdade", opcoes: "1-Sim, 2-Não" },
  POP_RUA: { descricao: "População em Situação de Rua", opcoes: "1-Sim, 2-Não" },
  POP_SAUDE: { descricao: "Profissional de Saúde", opcoes: "1-Sim, 2-Não" },
  POP_IMIG: { descricao: "Imigrante", opcoes: "1-Sim, 2-Não" },
  BENEF_GOV: { descricao: "Beneficiário de Prog. Governo", opcoes: "1-Sim, 2-Não" },
  DT_DIAG: { descricao: "Data do Diagnóstico" },
  FORMA: { descricao: "Forma Clínica", opcoes: "1-Pulmonar, 2-Extrapulmonar" },
  AGRAVAIDS: { descricao: "Agravo: AIDS", opcoes: "1-Sim, 2-Não" },
  AGRAVDIABE: { descricao: "Agravo: Diabetes", opcoes: "1-Sim, 2-Não" },
  AGRAVALCOO: { descricao: "Agravo: Alcoolismo", opcoes: "1-Sim, 2-Não" },
  AGRAVDROGA: { descricao: "Uso de Drogas Ilícitas", opcoes: "1-Sim, 2-Não" },
  AGRAVTABAC: { descricao: "Tabagismo", opcoes: "1-Sim, 2-Não" },
  RAIOX_TORA: { descricao: "Raio-X de Tórax", opcoes: "1-Suspeito, 2-Normal..." },
  TESTE_TUBE: { descricao: "Teste Tuberculínico", opcoes: "1-Não Reator, 2-Reator..." },
  TEST_MOLEC: { descricao: "Teste Rápido Molecular", opcoes: "1-Detectável, 2-Não Detec." },
  HIV: { descricao: "Sorologia HIV", opcoes: "1-Positivo, 2-Negativo" },
  BACILOSC_E: { descricao: "Baciloscopia Diagnóstico" },
  BACILOSC_1: { descricao: "Baciloscopia 1º Mês" },
  BACILOSC_2: { descricao: "Baciloscopia 2º Mês" },
  BACILOSC_3: { descricao: "Baciloscopia 3º Mês" },
  BACILOSC_4: { descricao: "Baciloscopia 4º Mês" },
  BACILOSC_5: { descricao: "Baciloscopia 5º Mês" },
  BACILOSC_6: { descricao: "Baciloscopia 6º Mês" },
  CULTURA_ES: { descricao: "Cultura de Escarro" },
  DT_INIC_TR: { descricao: "Data Início Tratamento" },
  TRATAMENTO: { descricao: "Tipo de Tratamento", opcoes: "1-Caso Novo, 2-Retratamento" },
  TRAT_SUPER: { descricao: "Tratamento Supervisionado (TDO)" },
  SITUA_ENCE: { descricao: "Situação de Encerramento (SINAN)" },
  DT_ENCERRA: { descricao: "Data do Encerramento" },
  STATUS_CASO: { descricao: "STATUS DE GESTÃO (TB-DF)", opcoes: "Campo estratégico para painel." },
  OBSERVACOES: { descricao: "OBSERVAÇÕES CLÍNICAS", opcoes: "Campo livre para equipe." }
};

const SINAN_SAMPLE_DATA = `NU_NOTIFIC\tDT_NOTIFIC\tNM_PACIENT\tDT_NASC\tCS_SEXO\tCS_RACA\tNM_MAE_PAC\tID_AGRAVO\tDT_DIAG\tSITUA_ENCE
999001\t01/01/2024\tJOÃO DA SILVA\t15/03/1985\tM\t1\tMARIA DA SILVA\tA30\t02/01/2024\t 
999002\t10/02/2024\tMARIA OLIVEIRA\t20/07/1990\tF\t2\tANA OLIVEIRA\tA30\t12/02/2024\t1
999003\t05/03/2024\tPEDRO SANTOS\t02/12/1978\tM\t4\tJULIA SANTOS\tA30\t06/03/2024\t2`;

// --- Components ---

const TooltipAjuda = ({ fieldKey }: { fieldKey: string }) => {
  const info = LEGENDAS_SINAN[fieldKey] || { descricao: `Campo SINAN: ${fieldKey}`, opcoes: "" };
  return (
    <div className="group relative ml-1.5 inline-flex items-center cursor-help">
       <div className="text-brand-primary/60 hover:text-brand-primary transition-colors">
         <Info size={13} />
       </div>
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-50">
          <p className="font-bold mb-1 text-blue-200">{fieldKey}</p>
          <p className="mb-2 leading-relaxed">{info.descricao}</p>
          {info.opcoes && (
            <>
              <div className="h-px bg-white/20 my-2"></div>
              <p className="font-bold mb-1 text-blue-200">Opções:</p>
              <p className="opacity-90 leading-relaxed">{info.opcoes}</p>
            </>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
       </div>
    </div>
  )
}

const ImportModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [textData, setTextData] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [log, setLog] = useState<string>('');
  const [stats, setStats] = useState({ total: 0, imported: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanValue = (val: string) => {
    if (!val) return null;
    let cleaned = val.replace(/[\uFEFF\u200B]/g, '').trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    return cleaned === '' ? null : cleaned;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('processing');
    setLog('Lendo arquivo...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error("Falha ao ler o arquivo.");
        if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
           setTextData(data as string);
           setStatus('idle');
           setLog('Arquivo carregado. Verifique os dados abaixo e clique em Processar.');
        } else {
           const workbook = XLSX.read(data, { type: 'array' });
           const firstSheetName = workbook.SheetNames[0];
           const worksheet = workbook.Sheets[firstSheetName];
           const csvOutput = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
           setTextData(csvOutput);
           setStatus('idle');
           setLog('Excel convertido. Verifique os dados abaixo e clique em Processar.');
        }
      } catch (err: any) {
        setStatus('error');
        setLog(`Erro ao ler arquivo: ${getErrorMessage(err)}`);
      }
    };
    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
       reader.readAsText(file);
    } else {
       reader.readAsArrayBuffer(file);
    }
  };

  const handleImport = async () => {
    if (!textData.trim()) return;
    setStatus('processing');
    setLog('Iniciando análise dos dados...');

    try {
      const rawRows = textData.trim().split(/\r?\n/);
      if (rawRows.length < 2) throw new Error("Dados insuficientes. Cole o cabeçalho e pelo menos uma linha.");
      let headerRowIndex = -1;
      let delimiter = '\t';

      for (let i = 0; i < Math.min(rawRows.length, 50); i++) {
        const rowSample = rawRows[i].toUpperCase().replace(/[\uFEFF\u200B]/g, '');
        if (rowSample.includes('NU_NOTIFIC')) {
          headerRowIndex = i;
          if (rawRows[i].includes('\t')) delimiter = '\t';
          else if (rawRows[i].includes(';')) delimiter = ';';
          else delimiter = ',';
          break;
        }
      }

      if (headerRowIndex === -1) throw new Error("Não foi possível encontrar a linha de cabeçalho contendo 'NU_NOTIFIC'.");

      const headerRow = rawRows[headerRowIndex];
      const headers = headerRow.split(delimiter).map(h => cleanValue(h)?.toUpperCase() || `COL_${Math.random()}`);
      const notificIndex = headers.findIndex(h => h === 'NU_NOTIFIC');
      if (notificIndex === -1) throw new Error("Coluna 'NU_NOTIFIC' não encontrada.");

      const duplicateMap = new Map<string, any>(); 
      for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const rowStr = rawRows[i];
        if (!rowStr.trim()) continue;
        const row = rowStr.split(delimiter);
        const patientObj: any = {};
        
        headers.forEach((header, index) => {
          if (!header || header.startsWith('COL_')) return;
          let value = cleanValue(row[index] || '');
          if (value) {
             if (header.startsWith('DT_') && value.includes('/')) {
                patientObj[header] = formatDateToISO(value);
             } else {
                patientObj[header] = value;
             }
          } else {
            patientObj[header] = null;
          }
        });

        if (!patientObj.STATUS_CASO) {
            const situa = patientObj.SITUA_ENCE;
            if (situa === '1' || situa === 'CURA') patientObj.STATUS_CASO = 'Tratamento Concluído';
            else if (situa === '2' || situa === 'ABANDONO') patientObj.STATUS_CASO = 'Abandono';
            else if (situa === '3' || situa === 'OBITO' || situa === 'ÓBITO') patientObj.STATUS_CASO = 'Óbito';
            else patientObj.STATUS_CASO = 'Em Tratamento';
        }
        if (patientObj.NU_NOTIFIC) {
           duplicateMap.set(patientObj.NU_NOTIFIC, patientObj);
        }
      }

      const uniquePatients = Array.from(duplicateMap.values());
      setStats({ total: rawRows.length - 1 - headerRowIndex, imported: uniquePatients.length });
      setLog(`Processando ${uniquePatients.length} registros válidos...`);

      if (uniquePatients.length === 0) throw new Error("Nenhum registro válido.");

      const { error } = await supabase.from('tb_casos').upsert(uniquePatients, { onConflict: 'NU_NOTIFIC' });
      if (error) throw error;

      setStatus('success');
      setLog('Importação concluída com sucesso!');
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch (err: any) {
      setStatus('error');
      setLog(`Erro: ${getErrorMessage(err)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-primary/10 p-2 rounded-lg text-brand-primary"><Database size={24} /></div>
            <div><h2 className="text-xl font-bold text-slate-800">Importação de Dados SINAN</h2><p className="text-xs text-slate-500">Suporta Excel ou CSV</p></div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        <div className="flex-1 p-6 overflow-hidden flex flex-col space-y-4">
          {status === 'success' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
               <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><Check size={32} /></div>
               <h3 className="text-2xl font-bold text-slate-800">Sucesso!</h3>
               <p className="text-slate-600">{stats.imported} casos importados.</p>
            </div>
          ) : (
             <div className="flex flex-col h-full space-y-4">
                 <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-slate-50 transition group">
                    <input type="file" accept=".csv, .txt, .xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <div className="bg-blue-50 text-brand-primary p-3 rounded-full mb-3 group-hover:scale-110 transition"><FileSpreadsheet size={24} /></div>
                    <p className="text-sm font-medium text-slate-700">Clique para selecionar arquivo</p>
                 </div>
                 <div className="flex items-center justify-between">
                     <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ou cole os dados</span>
                     <button onClick={() => setTextData(SINAN_SAMPLE_DATA)} className="text-xs text-brand-primary font-medium hover:underline flex items-center"><FileInput size={12} className="mr-1" /> Carregar Exemplo</button>
                 </div>
                 <textarea className="flex-1 w-full p-4 border border-slate-300 rounded-lg font-mono text-xs leading-relaxed focus:ring-2 focus:ring-brand-primary outline-none resize-none bg-slate-50 whitespace-pre" placeholder="Cole aqui..." value={textData} onChange={(e) => setTextData(e.target.value)} spellCheck={false} />
             </div>
          )}
          {status === 'error' && <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center text-sm border border-red-200"><AlertTriangle size={18} className="mr-2 shrink-0" />{log}</div>}
          {(status === 'processing' || (status === 'idle' && log && !textData)) && log && <div className="bg-blue-50 text-brand-primary p-4 rounded-lg flex items-center text-sm border border-blue-200"><div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>{log}</div>}
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
           <div className="text-xs text-slate-500 max-w-md">*O sistema detecta automaticamente o cabeçalho.</div>
           <div className="flex space-x-3">
             <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition text-sm font-medium">Cancelar</button>
             {status !== 'success' && <button onClick={handleImport} disabled={status === 'processing' || !textData} className="flex items-center px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-[#093452] transition shadow-md disabled:opacity-50 text-sm font-medium"><Upload size={18} className="mr-2" />Processar</button>}
           </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ data }: { data: Paciente[] }) => {
  const [selectedRS, setSelectedRS] = useState('');
  const [selectedRA, setSelectedRA] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const enrichedData = useMemo(() => {
    return data.map(p => {
      let rs = 'N/I';
      let ra = 'N/I';
      const cleanId = p.ID_BAIRRO ? p.ID_BAIRRO.toString().trim() : '';
      let info = BAIRRO_DB[cleanId];
      if (!info && p.NM_BAIRRO) {
          const normName = normalizeStr(p.NM_BAIRRO);
          info = BAIRRO_NAME_MAP[normName];
      }
      if (info) {
          rs = info.rs || 'Não Mapeado';
          ra = info.ra || 'Não Mapeado';
      }
      let year = '';
      let month = '';
      if (p.DT_NOTIFIC) {
         year = p.DT_NOTIFIC.substring(0, 4);
         month = p.DT_NOTIFIC.substring(0, 7);
      }
      return { ...p, regiaoSaude: rs, regiaoAdmin: ra, notificYear: year, notificMonth: month };
    });
  }, [data]);

  const availableRS = useMemo(() => Array.from(new Set(enrichedData.map(d => d.regiaoSaude).filter(d => d !== 'N/I' && d !== 'Não Mapeado'))).sort(), [enrichedData]);
  const availableRA = useMemo(() => Array.from(new Set(enrichedData.map(d => d.regiaoAdmin).filter(d => d !== 'N/I' && d !== 'Não Mapeado'))).sort(), [enrichedData]);
  const availableYears = useMemo(() => Array.from(new Set(enrichedData.map(d => d.notificYear).filter(Boolean))).sort().reverse(), [enrichedData]);

  const filteredData = enrichedData.filter(p => {
      const matchRS = selectedRS ? p.regiaoSaude === selectedRS : true;
      const matchRA = selectedRA ? p.regiaoAdmin === selectedRA : true;
      const matchYear = selectedYear ? p.notificYear === selectedYear : true;
      return matchRS && matchRA && matchYear;
  });

  const total = filteredData.length;
  const active = filteredData.filter(p => p.STATUS_CASO === 'Em Tratamento').length;
  const abandoned = filteredData.filter(p => p.STATUS_CASO === 'Abandono').length;
  const abandonmentRate = total > 0 ? ((abandoned / total) * 100).toFixed(1) : '0.0';

  const statusCounts = filteredData.reduce((acc, curr) => {
    const s = curr.STATUS_CASO || 'N/I';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const trendData = useMemo(() => {
    const groups = filteredData.reduce((acc, curr) => {
       const m = curr.notificMonth;
       if (m) { acc[m] = (acc[m] || 0) + 1; }
       return acc;
    }, {} as Record<string, number>);
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredData]);

  const maxTrend = Math.max(...trendData.map(d => d[1]), 0);

  const getStatusColor = (status: string) => {
      switch (status) {
        case 'Em Tratamento': return 'bg-blue-500';
        case 'Tratamento Concluído': return 'bg-green-500';
        case 'Abandono': return 'bg-red-500';
        case 'Óbito': return 'bg-slate-700';
        case 'Transferido': return 'bg-orange-400';
        default: return 'bg-gray-400';
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Painel de Indicadores</h2>
            <p className="text-slate-500 text-sm">Visualização estratégica dos casos notificados.</p>
         </div>
         <div className="flex flex-wrap gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
             <div className="relative">
                 <select value={selectedRS} onChange={(e) => setSelectedRS(e.target.value)} className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-primary outline-none appearance-none cursor-pointer hover:bg-slate-100 min-w-[140px]">
                    <option value="">Todas Reg. Saúde</option>
                    {availableRS.map(rs => <option key={rs} value={rs}>{rs}</option>)}
                 </select>
                 <Activity size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
             </div>
             <div className="relative">
                 <select value={selectedRA} onChange={(e) => setSelectedRA(e.target.value)} className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-primary outline-none appearance-none cursor-pointer hover:bg-slate-100 min-w-[140px]">
                    <option value="">Todas Reg. Admin.</option>
                    {availableRA.map(ra => <option key={ra} value={ra}>{ra}</option>)}
                 </select>
                 <MapPin size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
             </div>
             <div className="relative">
                 <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-primary outline-none appearance-none cursor-pointer hover:bg-slate-100 min-w-[100px]">
                    <option value="">Todos Anos</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
                 <Calendar size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
             </div>
             {(selectedRS || selectedRA || selectedYear) && (
                 <button onClick={() => { setSelectedRS(''); setSelectedRA(''); setSelectedYear(''); }} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition"><X size={16} /></button>
             )}
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
          <div><p className="text-sm font-medium text-slate-500">Total de Notificações</p><p className="text-3xl font-bold text-slate-800 mt-1">{total}</p></div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
          <div><p className="text-sm font-medium text-slate-500">Casos Ativos</p><p className="text-3xl font-bold text-brand-primary mt-1">{active}</p><p className="text-xs text-green-600 flex items-center mt-1"><Activity size={12} className="mr-1" /> No filtro selecionado</p></div>
          <div className="p-3 bg-indigo-50 text-brand-primary rounded-lg"><HeartPulse size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
          <div><p className="text-sm font-medium text-slate-500">Taxa de Abandono</p><p className="text-3xl font-bold text-red-600 mt-1">{abandonmentRate}%</p><p className="text-xs text-slate-400 mt-1">Meta: &lt; 5%</p></div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertCircle size={24} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-1 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><CheckCircle2 size={20} className="mr-2 text-brand-primary" />Desfecho do Tratamento</h3>
            <div className="flex-1 flex flex-col justify-center space-y-5">
                {Object.entries(statusCounts).sort(([, a], [, b]) => (b as number) - (a as number)).map(([status, count]) => (
                    <div key={status} className="group">
                        <div className="flex justify-between items-end mb-1"><span className="text-sm font-semibold text-slate-700">{status}</span><span className="text-lg font-bold text-slate-900">{count as number}</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"><div className={`h-full rounded-full ${getStatusColor(status)} opacity-80 group-hover:opacity-100 transition-all duration-500`} style={{ width: `${total > 0 ? ((count as number) / total) * 100 : 0}%` }}></div></div>
                    </div>
                ))}
                {filteredData.length === 0 && <div className="text-center text-slate-400 py-10">Sem dados para exibir</div>}
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800 flex items-center"><BarChart3 size={20} className="mr-2 text-brand-primary" />Tendência de Notificações</h3>
             <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Por Mês de Notificação</span>
          </div>
          <div className="flex-1 relative min-h-[250px] flex items-end space-x-2 md:space-x-4 overflow-x-auto custom-scrollbar pb-2 px-2">
             {trendData.length > 0 ? (
                 trendData.map(([month, count]) => {
                     const countNum = count as number;
                     const heightPercent = maxTrend > 0 ? (countNum / maxTrend) * 100 : 0;
                     const [yyyy, mm] = month.split('-');
                     return (
                         <div key={month} className="flex flex-col items-center group flex-1 min-w-[40px]">
                             <div className="relative w-full flex justify-center items-end h-[200px]">
                                 <div className="w-full max-w-[30px] bg-brand-primary/80 hover:bg-brand-primary rounded-t-sm transition-all duration-300 relative group-hover:shadow-lg" style={{ height: `${heightPercent}%` }}>
                                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{countNum} casos</div>
                                 </div>
                             </div>
                             <div className="mt-3 text-[10px] text-slate-500 font-medium rotate-0 text-center">{mm}/{yyyy.substring(2)}</div>
                         </div>
                     )
                 })
             ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">Nenhum dado encontrado.</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PatientModal = ({ patient, onClose, onSave }: { patient: Paciente | null, onClose: () => void, onSave: (p: Paciente) => Promise<void> }) => {
  const [formData, setFormData] = useState<Paciente | null>(null);
  const [activeTab, setActiveTab] = useState('vigilancia');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setFormData(patient); }, [patient]);
  if (!patient || !formData) return null;

  const handleChange = (field: keyof Paciente, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleSave = async () => {
    if (formData) {
      setSaving(true);
      await onSave(formData);
      setSaving(false);
      onClose();
    }
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button onClick={() => setActiveTab(id)} className={`flex items-center whitespace-nowrap space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? 'border-brand-primary text-brand-primary bg-slate-50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
      <Icon size={16} /><span>{label}</span>
    </button>
  );

  const InputField = ({ label, field, type = "text", width="full", readOnly=false }: { label: string, field: keyof Paciente, type?: string, width?: string, readOnly?: boolean }) => {
    const rawValue = formData[field];
    const safeValue = (rawValue === null || rawValue === undefined) ? '' : (typeof rawValue === 'object' ? '' : rawValue);
    let colSpanClass = "col-span-1 md:col-span-2";
    if (width === "half") colSpanClass = "col-span-1 md:col-span-1";
    if (width === "wide") colSpanClass = "col-span-1 md:col-span-4";
    return (
      <div className={colSpanClass}>
        <div className="flex items-center mb-1"><label className="block text-xs font-medium text-slate-500">{label}</label><TooltipAjuda fieldKey={field as string} /></div>
        <input type={type} value={safeValue} onChange={(e) => handleChange(field, e.target.value)} readOnly={readOnly} className={`w-full p-2 border border-slate-200 rounded text-sm outline-none transition ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-primary'}`} />
      </div>
    );
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="col-span-1 md:col-span-4 mt-6 border-t border-slate-200 pt-4 mb-2">
      <h4 className="font-bold text-slate-700 uppercase text-xs tracking-wider flex items-center"><div className="w-1 h-4 bg-brand-primary mr-2 rounded-full"></div>{title}</h4>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-brand-primary text-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-white/10 p-2 rounded-lg"><FileText size={20} /></div>
             <div><h3 className="text-lg font-bold leading-tight">Prontuário SINAN</h3><div className="flex items-center gap-2 text-xs text-blue-100"><span className="font-mono bg-white/10 px-1.5 rounded text-white">{formData.NU_NOTIFIC}</span><span className="opacity-80">|</span><span className="uppercase font-medium tracking-wide">{formData.NM_PACIENT}</span></div></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white"><X size={20} /></button>
        </div>
        <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center shrink-0">
            <div>
                <div className="flex items-center mb-1.5"><label className="block text-xs font-bold text-brand-primary uppercase tracking-wider">Status de Gestão</label><TooltipAjuda fieldKey="STATUS_CASO" /></div>
                <div className="relative">
                   <select value={typeof formData.STATUS_CASO === 'string' ? formData.STATUS_CASO : 'Em Tratamento'} onChange={(e) => handleChange('STATUS_CASO', e.target.value)} className="w-full pl-3 pr-8 py-2 border border-blue-200 rounded-lg bg-white text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none shadow-sm appearance-none">
                     <option value="Em Tratamento">Em Tratamento</option><option value="Tratamento Concluído">Tratamento Concluído (Cura)</option><option value="Abandono">Abandono</option><option value="Óbito">Óbito</option><option value="Transferido">Transferido</option><option value="Em Investigação">Em Investigação</option>
                   </select>
                   <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                </div>
            </div>
             <div>
                <div className="flex items-center mb-1.5"><label className="block text-xs font-bold text-brand-primary uppercase tracking-wider">Observações / Pendências</label></div>
                <input type="text" value={typeof formData.OBSERVACOES === 'string' ? formData.OBSERVACOES : ''} onChange={(e) => handleChange('OBSERVACOES', e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm text-slate-700 focus:ring-2 focus:ring-brand-primary outline-none shadow-sm placeholder:text-slate-400" placeholder="Resumo rápido do caso..." />
            </div>
        </div>
        <div className="flex overflow-x-auto border-b border-slate-200 bg-white custom-scrollbar shrink-0">
          <TabButton id="vigilancia" label="Vigilância" icon={Siren} /><TabButton id="pessoal" label="Identificação" icon={User} /><TabButton id="endereco" label="Endereço" icon={MapPin} /><TabButton id="social" label="Social" icon={Tent} /><TabButton id="clinico" label="Clínico" icon={ClipboardList} /><TabButton id="exames" label="Exames" icon={Microscope} /><TabButton id="tratamento" label="Tratamento" icon={Pill} /><TabButton id="mudancas" label="Mudanças" icon={ArrowRightLeft} /><TabButton id="contatos" label="Contatos" icon={Phone} /><TabButton id="encerramento" label="Encerramento" icon={CheckCircle2} /><TabButton id="seguimento" label="Seguimento" icon={FolderOpen} />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 content-start">
                {activeTab === 'vigilancia' && (<><SectionTitle title="Dados da Notificação" /><InputField label="Nº Notificação" field="NU_NOTIFIC" readOnly /><InputField label="Tipo Notificação" field="TP_NOT" width="half" /><InputField label="Agravo" field="ID_AGRAVO" width="half" /><InputField label="Data Notificação" field="DT_NOTIFIC" type="date" width="half" /><InputField label="Ano" field="NU_ANO" width="half" /><SectionTitle title="Origem" /><InputField label="UF Notificação" field="SG_UF_NOT" width="half" /><InputField label="Município Notificação" field="ID_MUNICIP" width="full" /><InputField label="Unidade de Saúde" field="ID_UNIDADE" width="full" /><InputField label="Regional" field="ID_REGIONA" width="half" /><InputField label="Data Digitação" field="DT_DIGITA" type="date" width="half" /></>)}
                {activeTab === 'pessoal' && (<><SectionTitle title="Identificação Civil" /><InputField label="Nome do Paciente" field="NM_PACIENT" width="wide" /><InputField label="Nome da Mãe" field="NM_MAE_PAC" width="wide" /><InputField label="Data Nascimento" field="DT_NASC" type="date" width="half" /><InputField label="Idade" field="NU_IDADE_N" width="half" /><InputField label="Sexo" field="CS_SEXO" width="half" /><InputField label="Raça/Cor" field="CS_RACA" width="half" /><SectionTitle title="Complementares" /><InputField label="Gestante" field="CS_GESTANT" width="half" /><InputField label="Escolaridade" field="CS_ESCOL_N" width="half" /><InputField label="CNS (SUS)" field="ID_CNS_SUS" width="full" /></>)}
                {activeTab === 'endereco' && (<><SectionTitle title="Localização" /><InputField label="Logradouro" field="NM_LOGRADO" width="wide" /><InputField label="Número" field="NU_NUMERO" width="half" /><InputField label="Complemento" field="NM_COMPLEM" width="half" /><InputField label="Bairro (SINAN)" field="NM_BAIRRO" width="full" /><InputField label="ID Bairro (TB-DF)" field="ID_BAIRRO" width="half" /><InputField label="Município Residência" field="ID_MN_RESI" width="half" /><InputField label="CEP" field="NU_CEP" width="half" /><InputField label="UF Residência" field="SG_UF" width="half" /><SectionTitle title="Contato & Território" /><InputField label="Telefone" field="NU_TELEFON" width="full" /><InputField label="Ponto Referência" field="NM_REFEREN" width="full" /><InputField label="Zona" field="CS_ZONA" width="half" /><InputField label="Distrito Sanitário" field="ID_DISTRIT" width="half" /></>)}
                {activeTab === 'social' && (<><SectionTitle title="Populações Especiais e Vulnerabilidades" /><div className="col-span-1 md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4"><InputField label="Privado de Liberdade?" field="POP_LIBER" width="half" /><InputField label="Situação de Rua?" field="POP_RUA" width="half" /><InputField label="Profissional de Saúde?" field="POP_SAUDE" width="half" /><InputField label="Imigrante?" field="POP_IMIG" width="half" /><InputField label="Beneficiário Gov.?" field="BENEF_GOV" width="half" /></div></>)}
                {activeTab === 'clinico' && (<><SectionTitle title="Diagnóstico Inicial" /><InputField label="Data Diagnóstico" field="DT_DIAG" type="date" width="half" /><InputField label="Forma Clínica" field="FORMA" width="half" /><InputField label="Tipo Entrada" field="TP_ENTRADA" width="full" /><SectionTitle title="Extrapulmonar" /><InputField label="Extrapulmonar 1" field="EXTRAPU1_N" width="half" /><InputField label="Extrapulmonar 2" field="EXTRAPU2_N" width="half" /><SectionTitle title="Comorbidades e Agravos" /><div className="col-span-1 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4"><InputField label="AIDS" field="AGRAVAIDS" width="half" /><InputField label="Alcoolismo" field="AGRAVALCOO" width="half" /><InputField label="Diabetes" field="AGRAVDIABE" width="half" /><InputField label="Doença Mental" field="AGRAVDOENC" width="half" /><InputField label="Drogas Ilícitas" field="AGRAVDROGA" width="half" /><InputField label="Tabagismo" field="AGRAVTABAC" width="half" /></div></>)}
                {activeTab === 'exames' && (<><SectionTitle title="Baciloscopias" /><InputField label="Diagnóstico" field="BACILOSC_E" width="half" /><InputField label="1º Mês" field="BACILOSC_1" width="half" /><InputField label="2º Mês" field="BACILOSC_2" width="half" /><InputField label="3º Mês" field="BACILOSC_3" width="half" /><InputField label="4º Mês" field="BACILOSC_4" width="half" /><InputField label="5º Mês" field="BACILOSC_5" width="half" /><InputField label="6º Mês" field="BACILOSC_6" width="half" /><SectionTitle title="Outros Métodos" /><InputField label="Cultura Escarro" field="CULTURA_ES" width="half" /><InputField label="Teste Rápido Molecular" field="TEST_MOLEC" width="half" /><InputField label="Teste de Sensibilidade" field="TEST_SENSI" width="half" /><InputField label="Histopatologia" field="HISTOPATOL" width="half" /><SectionTitle title="Imagem e Triagem" /><InputField label="Raio-X Tórax" field="RAIOX_TORA" width="half" /><InputField label="HIV" field="HIV" width="half" /><InputField label="Terapia Antirretroviral" field="ANT_RETRO" width="half" /><InputField label="Teste Tuberculínico" field="TESTE_TUBE" width="half" /></>)}
                {activeTab === 'tratamento' && (<><SectionTitle title="Esquema Terapêutico" /><InputField label="Data Início" field="DT_INIC_TR" type="date" width="half" /><InputField label="Situação Tratamento" field="TRATAMENTO" width="half" /><InputField label="TDO Realizado?" field="TRAT_SUPER" width="half" /><SectionTitle title="Medicamentos Prescritos" /><div className="flex gap-3 col-span-1 md:col-span-4 flex-wrap">{['RIFAMPICIN', 'ISONIAZIDA', 'PIRAZINAMI', 'ETAMBUTOL', 'ESTREPTOMI', 'ETIONAMIDA'].map(med => (<label key={med} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition select-none ${formData[med] === '1' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><input type="checkbox" checked={formData[med] === '1'} onChange={(e) => handleChange(med as keyof Paciente, e.target.checked ? '1' : '0')} className="rounded text-brand-primary focus:ring-brand-primary h-4 w-4" /><span className="text-sm font-medium">{med.charAt(0) + med.slice(1).toLowerCase()}</span></label>))}</div></>)}
                {activeTab === 'mudancas' && (<><SectionTitle title="Histórico de Transferências" /><InputField label="Data Mudança" field="DT_MUDANCA" type="date" width="half" /><InputField label="UF Destino" field="UF_TRANSF" width="half" /><InputField label="Município Destino" field="MUN_TRANSF" width="full" /><SectionTitle title="Vínculos" /><InputField label="Prontuário Unidade" field="NU_PRONTUA" width="full" /></>)}
                {activeTab === 'contatos' && (<><SectionTitle title="Investigação de Contatos" /><InputField label="Nº de Contatos Identificados" field="NU_CONTATO" width="half" /><InputField label="Nº de Contatos Examinados" field="NU_COMU_EX" width="half" /></>)}
                {activeTab === 'encerramento' && (<><SectionTitle title="Desfecho do Caso" /><InputField label="Situação Encerramento" field="SITUA_ENCE" width="full" /><InputField label="Data Encerramento" field="DT_ENCERRA" type="date" width="half" /><InputField label="Status 9º Mês" field="SITUA_9_M" width="half" /><InputField label="Status 12º Mês" field="SITUA_12_M" width="half" /></>)}
                {activeTab === 'seguimento' && (<><SectionTitle title="Atualizações e Reentradas" /><InputField label="UF Atual" field="SG_UF_AT" width="half" /><InputField label="Município Atual" field="ID_MUNIC_A" width="half" /><InputField label="Notificação Atual" field="NU_NOTI_AT" width="full" /><InputField label="Unidade Atual" field="ID_UNID_AT" width="full" /><InputField label="Data Atualização" field="DT_NOTI_AT" type="date" width="half" /></>)}
            </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-400">Última atualização: {new Date().toLocaleDateString()}</div>
          <div className="flex gap-3">
             <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition">Cancelar</button>
             <button onClick={handleSave} disabled={saving} className="flex items-center px-6 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-[#093452] transition shadow-md hover:shadow-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 duration-150"><Save size={18} className="mr-2" />{saving ? 'Salvando...' : 'Salvar Alterações'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PatientsList = ({ data, onEdit, loading }: { data: Paciente[], onEdit: (p: Paciente) => void, loading: boolean }) => {
  const [search, setSearch] = useState('');
  const [filterRegiaoSaude, setFilterRegiaoSaude] = useState('');
  const [filterRegiaoAdmin, setFilterRegiaoAdmin] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const getBairroInfo = (idBairro?: string): BairroInfo => {
    if (!idBairro) return { rs: 'N/I', ra: 'N/I', bairro: '' };
    const cleanId = idBairro.toString().trim();
    return BAIRRO_DB[cleanId] || { rs: 'Não Mapeado', ra: 'Não Mapeado', bairro: '' };
  };

  const enrichedData = useMemo(() => {
    return data.map(p => {
      let bairroInfo = getBairroInfo(p.ID_BAIRRO);
      let rs = bairroInfo.rs;
      let ra = bairroInfo.ra;
      let inferred = false;
      if ((!p.ID_BAIRRO || rs === 'Não Mapeado' || rs === 'N/I') && p.NM_BAIRRO) {
          const normName = normalizeStr(p.NM_BAIRRO);
          const found = BAIRRO_NAME_MAP[normName];
          if (found) { rs = found.rs + " (Est.)"; ra = found.ra + " (Est.)"; inferred = true; }
      }
      let monthStr = '';
      if (p.DT_NOTIFIC) { monthStr = p.DT_NOTIFIC.substring(0, 7); }
      return { ...p, regiaoSaude: rs, regiaoAdmin: ra, notificMonth: monthStr, inferredLocation: inferred };
    });
  }, [data]);

  const uniqueRegiaoSaude = useMemo(() => Array.from(new Set(enrichedData.map(d => d.regiaoSaude).filter(Boolean))).sort(), [enrichedData]);
  const uniqueRegiaoAdmin = useMemo(() => Array.from(new Set(enrichedData.map(d => d.regiaoAdmin).filter(Boolean))).sort(), [enrichedData]);
  const uniqueMonths = useMemo(() => Array.from(new Set(enrichedData.map(d => d.notificMonth).filter(Boolean))).sort().reverse(), [enrichedData]);
  const uniqueStatus = useMemo(() => Array.from(new Set(enrichedData.map(d => d.STATUS_CASO).filter(Boolean))).sort(), [enrichedData]);

  const filtered = enrichedData.filter(p => {
    const matchesSearch = (typeof p.NM_PACIENT === 'string' && p.NM_PACIENT.toLowerCase().includes(search.toLowerCase())) || (typeof p.NU_NOTIFIC === 'string' && p.NU_NOTIFIC.includes(search));
    const matchesRS = filterRegiaoSaude ? p.regiaoSaude === filterRegiaoSaude : true;
    const matchesRA = filterRegiaoAdmin ? p.regiaoAdmin === filterRegiaoAdmin : true;
    const matchesMonth = filterMonth ? p.notificMonth === filterMonth : true;
    const matchesStatus = filterStatus ? p.STATUS_CASO === filterStatus : true;
    return matchesSearch && matchesRS && matchesRA && matchesMonth && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Em Tratamento': return 'bg-blue-100 text-blue-700';
      case 'Tratamento Concluído': return 'bg-green-100 text-green-700';
      case 'Abandono': return 'bg-red-100 text-red-700';
      case 'Óbito': return 'bg-slate-200 text-slate-700';
      case 'Transferido': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatMonth = (isoMonth: string) => {
    if (!isoMonth) return '-';
    const [year, month] = isoMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
  }

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div></div>);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Lista Nominal</h2>
        <div className="relative w-full md:w-96">
          <input type="text" placeholder="Buscar por nome ou notificação..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none shadow-sm" />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
         <div className="flex items-center mb-3 text-slate-500 text-xs font-semibold uppercase tracking-wider"><Filter size={14} className="mr-2" /> Filtros Avançados</div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><label className="block text-xs font-medium text-slate-500 mb-1">Região de Saúde</label><select className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-brand-primary" value={filterRegiaoSaude} onChange={(e) => { setFilterRegiaoSaude(e.target.value); setCurrentPage(1); }}><option value="">Todas</option>{uniqueRegiaoSaude.map(rs => <option key={rs} value={rs}>{rs}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">Região Administrativa</label><select className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-brand-primary" value={filterRegiaoAdmin} onChange={(e) => { setFilterRegiaoAdmin(e.target.value); setCurrentPage(1); }}><option value="">Todas</option>{uniqueRegiaoAdmin.map(ra => <option key={ra} value={ra}>{ra}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">Mês da Notificação</label><select className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-brand-primary" value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}><option value="">Todos</option>{uniqueMonths.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">Status do Paciente</label><select className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-brand-primary" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}><option value="">Todos</option>{uniqueStatus.map(st => <option key={st} value={st}>{st}</option>)}</select></div>
         </div>
         {(filterRegiaoSaude || filterRegiaoAdmin || filterMonth || filterStatus) && (<button onClick={() => { setFilterRegiaoSaude(''); setFilterRegiaoAdmin(''); setFilterMonth(''); setFilterStatus(''); setCurrentPage(1); }} className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium flex items-center"><X size={12} className="mr-1" /> Limpar filtros</button>)}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr><th className="px-4 py-3">Paciente</th><th className="px-4 py-3">Notificação</th><th className="px-4 py-3">Região de Saúde</th><th className="px-4 py-3">Região Admin.</th><th className="px-4 py-3">Mês Notif.</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length > 0 ? (paginated.map((p) => (
                  <tr key={p.NU_NOTIFIC} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{typeof p.NM_PACIENT === 'string' ? p.NM_PACIENT : '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{typeof p.NU_NOTIFIC === 'string' ? p.NU_NOTIFIC : '-'}</td>
                    <td className="px-4 py-3 text-slate-500"><span className={p.inferredLocation ? "text-orange-600 font-medium" : ""}>{p.regiaoSaude}</span></td>
                    <td className="px-4 py-3 text-slate-500"><span className={p.inferredLocation ? "text-orange-600 font-medium" : ""}>{p.regiaoAdmin}</span></td>
                    <td className="px-4 py-3 text-slate-500 capitalize">{formatMonth(p.notificMonth)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(p.STATUS_CASO)}`}>{p.STATUS_CASO || 'N/I'}</span></td>
                    <td className="px-4 py-3 text-right"><button onClick={() => onEdit(p)} className="text-brand-primary hover:text-[#093452] font-medium text-xs border border-brand-primary/30 hover:bg-blue-50 px-3 py-1.5 rounded transition">Prontuário</button></td>
                  </tr>
                ))) : (<tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">{data.length === 0 ? "Nenhum dado importado. Verifique o Supabase." : "Nenhum paciente encontrado com os filtros atuais."}</td></tr>)}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (<div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between"><p className="text-xs text-slate-500">Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)} a {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length}</p><div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-xs font-medium border rounded hover:bg-slate-50 disabled:opacity-50">Anterior</button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-xs font-medium border rounded hover:bg-slate-50 disabled:opacity-50">Próxima</button></div></div>)}
      </div>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState<'home' | 'pacientes' | 'dashboard'>('home');
  const [data, setData] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: tbData, error } = await supabase.from('tb_casos').select('*').order('DT_NOTIFIC', { ascending: false });
      if (!error) { setData(tbData as Paciente[] || []); }
    } catch (err) { console.error('Supabase error', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdatePatient = async (updated: Paciente) => {
    try {
        const { error } = await supabase.from('tb_casos').update(updated).eq('NU_NOTIFIC', updated.NU_NOTIFIC);
        if (!error) { setData(prev => prev.map(p => p.NU_NOTIFIC === updated.NU_NOTIFIC ? updated : p)); } else { alert('Erro ao salvar.'); }
    } catch (e) { alert('Erro de conexão.'); }
  };

  const NavItem = ({ viewName, icon: Icon, label }: any) => (
    <button onClick={() => setView(viewName)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${view === viewName ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <Icon size={20} /><span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3"><div className="bg-brand-primary p-2 rounded-lg"><Activity size={24} className="text-white" /></div><div><h1 className="font-bold text-lg leading-tight">TB-DF</h1><p className="text-xs text-slate-400">SINAN Integrado</p></div></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem viewName="home" icon={HomeIcon} label="Início" />
          <NavItem viewName="dashboard" icon={LayoutDashboard} label="Indicadores" />
          <NavItem viewName="pacientes" icon={Users} label="Pacientes" />
           <button onClick={() => setShowImportModal(true)} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"><Upload size={20} /><span className="font-medium">Importar Dados</span></button>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-10">
           <div className="flex items-center space-x-2"><Activity size={24} className="text-brand-primary" /><span className="font-bold">TB-DF</span></div><button className="text-white"><Menu size={24} /></button>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          {view === 'home' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <h2 className="text-3xl font-bold mb-2 relative z-10">Bem-vindo ao Sistema TB-DF</h2>
                <p className="text-slate-300 relative z-10 max-w-lg">Plataforma centralizada para monitoramento e gestão de casos de Tuberculose (Base SINAN).</p>
                <div className="mt-8 flex gap-4 relative z-10">
                   <button onClick={() => setView('pacientes')} className="bg-brand-primary hover:bg-[#093452] text-white px-6 py-2 rounded-lg font-medium transition shadow-lg shadow-brand-primary/30">Acessar Pacientes</button>
                   <button onClick={() => setShowImportModal(true)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition backdrop-blur-sm flex items-center"><Upload size={18} className="mr-2" />Importar Dados</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div onClick={() => setView('dashboard')} className="cursor-pointer bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                    <div className="flex items-start justify-between"><div className="p-3 bg-blue-50 text-brand-primary rounded-lg group-hover:bg-brand-primary group-hover:text-white transition"><Activity size={24} /></div></div>
                    <h3 className="mt-4 text-lg font-bold text-slate-800">Monitoramento</h3><p className="text-sm text-slate-500 mt-1">Visualize indicadores epidemiológicos em tempo real.</p>
                 </div>
                 <div onClick={() => setShowImportModal(true)} className="cursor-pointer bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                    <div className="flex items-start justify-between"><div className="p-3 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition"><Database size={24} /></div></div>
                    <h3 className="mt-4 text-lg font-bold text-slate-800">Carga de Dados</h3><p className="text-sm text-slate-500 mt-1">Importação em massa via copiar/colar de planilhas Excel.</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 opacity-75">
                    <div className="flex items-start justify-between"><div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><CheckCircle2 size={24} /></div></div>
                    <h3 className="mt-4 text-lg font-bold text-slate-800">Encerramento</h3><p className="text-sm text-slate-500 mt-1">Funcionalidade para validação de encerramento de casos.</p>
                 </div>
              </div>
            </div>
          )}
          {view === 'dashboard' && <Dashboard data={data} />}
          {view === 'pacientes' && <PatientsList data={data} onEdit={(p) => setSelectedPatient(p)} loading={loading} />}
        </div>
        <PatientModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} onSave={handleUpdatePatient} />
        {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} onSuccess={fetchData} />}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}