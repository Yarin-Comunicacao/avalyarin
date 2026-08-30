# Modelo de importação em massa — Avalyarin

Use `modelo-estabelecimentos-avalyarin.xlsx` ou `modelo-estabelecimentos-avalyarin.csv`. O CSV deve ser guardado em **UTF-8**. Não altere os nomes dos cabeçalhos.

## Campos obrigatórios

`nome`, `categoria`, `endereco`, `numero`, `bairro`, `cidade`, `google_maps_url`, `instagram` e `horario`. Em `numero`, utilize um número entre 1 e 15000 ou `s/n`. A categoria deve corresponder ao nome de uma categoria existente no Avalyarin.

## Campos opcionais

`telefone`, `complemento`, `regiao`, `estado`, `cep`, `facebook`, `site`, `descricao`, `latitude`, `longitude`, `foto_fundo_url`, `logo_url`, `menu_url`, `last_menu_update` e `validation_score`.

## Formatos recomendados

| Coluna | Exemplo | Observação |
|---|---|---|
| `horario` | `segunda-feira: Fechado | terça-feira: 11:30–15:00 e 17:00–01:00` | Obrigatório; até 370 caracteres. |
| `numero` | `88` ou `s/n` | Obrigatório; aceita número inteiro de 1 a 15000 ou `s/n`. |
| `cidade` | `São Paulo` | Obrigatório. |
| `google_maps_url` | `https://maps.google.com/?cid=...` | Obrigatório; use uma URL completa. |
| `telefone` | `(11) 99999-9999` | Opcional. |
| `estado` | `SP` | Opcional; sigla ou nome, conforme a sua base. |
| `cep` | `01000-000` | Texto; mantenha o zero inicial. |
| `latitude` / `longitude` | `-23.5612463` / `-46.5697117` | Números decimais. |
| `last_menu_update` | `31/08/2026` ou `2026-08-31` | Data opcional. |
| `validation_score` | `8.5` | Número; também aceita vírgula decimal. |
| `foto_fundo_url` / `logo_url` | `https://...` | Actualmente são guardadas como URLs de referência; não são enviadas automaticamente para o R2 pela importação CSV. |

O sistema gera automaticamente `id`, `code`, `slug`, `createdAt`, `status` e `source`. `hasMenu` começa como `false`; as configurações de reserva usam os defaults do banco.
