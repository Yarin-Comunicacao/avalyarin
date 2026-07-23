# Estratégia Geográfica: Google Maps + GeoSampa

## Visão Geral

O sistema utiliza duas fontes de dados geográficos de forma complementar:

- **Google Maps** — Mapa interativo no app, rotas, busca, autocomplete de endereços
- **GeoSampa** — Dados administrativos oficiais (distritos, regiões, subprefeituras) da Prefeitura de SP

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Admin Panel)                              │
│  ┌─────────────────────────────────────────────────┐│
│  │ Campo de busca com autocomplete                 ││
│  │ → Chama geo.placeAutocomplete (Google Places)   ││
│  │ → Ao selecionar: geo.placeDetails              ││
│  │   → Google Geocoding (lat/lng, CEP, bairro)    ││
│  │   → GeoSampa point-in-polygon (distrito, região)││
│  │ → Campos preenchidos e bloqueados               ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Backend (server/)                                   │
│  ├── geo-lookup.ts        → Point-in-polygon engine │
│  ├── data/distritos-sp.json → 96 distritos (GeoJSON)│
│  └── data/distrito-regiao-map.json → Mapeamento     │
└─────────────────────────────────────────────────────┘
```

## Fluxo de Cadastro de Estabelecimento

1. Admin digita endereço no campo de busca
2. Google Places Autocomplete retorna sugestões em tempo real
3. Admin seleciona uma sugestão
4. Backend chama Google Place Details → obtém lat/lng, CEP, bairro, número
5. Backend faz point-in-polygon com GeoJSON dos distritos → obtém distrito e região
6. Campos são preenchidos automaticamente e ficam **bloqueados para edição**

## Campos Automáticos vs Manuais

| Campo | Fonte | Editável? |
|-------|-------|-----------|
| Nome | Manual | ✅ |
| Endereço (rua) | Google Places | 🔒 |
| Número | Google Places | 🔒 |
| CEP | Google Geocoding | 🔒 |
| Bairro | Google Geocoding | 🔒 |
| Distrito | GeoSampa (point-in-polygon) | 🔒 |
| Região | GeoSampa (point-in-polygon) | 🔒 |
| Lat/Lng | Google Geocoding | 🔒 |
| Categoria | Manual | ✅ |
| Telefone | Manual | ✅ |
| Instagram | Manual | ✅ |
| Horário | Manual | ✅ |

## Dados GeoSampa

- **Fonte**: WFS `http://wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/ows`
- **Camada**: `geoportal:distrito_municipal`
- **CRS original**: EPSG:31983 (SIRGAS 2000 / UTM zone 23S)
- **CRS convertido**: EPSG:4326 (WGS84 lat/lng)
- **Simplificação**: Douglas-Peucker (tolerância 0.0002°, ~22m)
- **Resultado**: 96 distritos, ~180KB

## Regiões Disponíveis

| Região | Distritos |
|--------|-----------|
| Centro | 10 |
| Leste | 32 |
| Norte | 17 |
| Oeste | 13 |
| Sul | 24 |

## Manutenção

- O GeoJSON dos distritos raramente muda (última atualização: Lei nº 11.220/1992)
- Se necessário atualizar: rodar `convert-districts.py` + `simplify-districts.py`
- O mapeamento bairro→distrito em `geo-lookup.ts` pode ser expandido conforme necessário

## Independência do Manus

O sistema funciona fora do Manus porque:
1. O GeoJSON está armazenado localmente no servidor (`server/data/`)
2. O point-in-polygon é calculado no backend (sem chamada externa)
3. Apenas o Google Maps Geocoding precisa de conexão (via proxy Manus ou API key direta)
