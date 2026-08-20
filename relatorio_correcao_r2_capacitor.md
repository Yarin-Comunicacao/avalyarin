# Relatório Técnico: Resolução de Acesso ao Cloudflare R2 e Configuração Nativa Capacitor

Este relatório documenta a investigação e a resolução definitiva do erro de autorização (`InvalidArgument` / `Authorization`) no armazenamento de mídias Cloudflare R2 do projeto **Avalyarin**, bem como as diretrizes para a homologação do aplicativo em ambiente nativo (Android).

---

## 1. Diagnóstico do Erro de Autorização no R2

### 1.1. Causa Raiz Identificada
As URLs armazenadas anteriormente nos itens de cardápio utilizavam o endpoint de gerenciamento/storage interno da API do Cloudflare (`*.r2.cloudflarestorage.com`). Este endpoint exige credenciais AWS Signature v4 (Access Key ID e Secret Access Key) em requisições HTTP diretas. Quando um aplicativo cliente (web ou nativo Capacitor) tentava carregar uma imagem diretamente via tag `<img>` sem assinatura criptográfica, o Cloudflare retornava o erro:

```xml
<Error>
  <Code>InvalidArgument</Code>
  <Message>Authorization</Message>
</Error>
```

### 1.2. Solução Aplicada
1. **Habilitação do Domínio Público (`r2.dev`)**: Através da API de gerenciamento de buckets do Cloudflare, foi validada e ativada a exposição pública via domínio gerenciado do bucket `avalyarin-assets` (`pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev`).
2. **Teste de Acessibilidade**: O acesso via protocolo HTTP direto ao novo domínio público passou a retornar `HTTP 200 OK` instantaneamente, confirmando a eliminação da barreira de autenticação.
3. **Atualização da Base de Dados**: Todos os registros da tabela `menu_items` que apontavam para o endpoint privado ou continham imagens padrão de bebidas (como as garrafas de 600ml de Spaten, Heineken, Amstel, Original, Brahma, Corona e Serramalte) foram atualizados em lote para o novo domínio público `r2.dev`.

---

## 2. Validação do Cardápio no "Julinho Clube Oficial"

Para garantir que a experiência do usuário final e dos parceiros comerciais esteja perfeita, realizamos uma varredura e validação completa no cardápio do estabelecimento **Julinho Clube Oficial** (`id: 30000199`):

* **Total de itens inspecionados**: 105 itens de cardápio.
* **Itens de Cervejas 600ml**: Todos os itens mapeados (Spaten, Heineken, Amstel, Original, Serramalte, Corona) tiveram suas chaves e URLs validadas.
* **Status HTTP**: 100% dos links de imagens associados aos produtos retornam código `200 OK` com os respectivos tipos MIME corretos (`image/jpeg`, `image/webp`).

| ID do Item | Nome do Produto | Categoria | Status HTTP | URL Pública R2 (`r2.dev`) |
| :--- | :--- | :--- | :--- | :--- |
| `480410` | Spaten 600ml | Cervejas 600ml | `200 OK` | `.../spaten_600ml.jpg` [1] |
| `480407` | Heineken 600ml | Cervejas 600ml | `200 OK` | `.../heineken_600ml.jpg` [2] |
| `480408` | Amstel 600ml | Cervejas 600ml | `200 OK` | `.../amstel_600ml.jpg` [3] |
| `480411` | Original 600ml | Cervejas 600ml | `200 OK` | `.../original_600ml.jpg` [4] |
| `480409` | Serramalte 600ml | Cervejas 600ml | `200 OK` | `.../serramalte_600ml.webp` [5] |
| `480406` | Corona 600ml | Cervejas 600ml | `200 OK` | `.../corona_600ml.webp` [6] |

---

## 3. Guia de Configuração para Testes Nativos (Capacitor na Rede Doméstica)

Para validar o aplicativo em execução em um dispositivo físico (como o Samsung A15 já conectado ao Android Studio via USB), siga os passos de rede local:

1. **Endereço IP Local (IPv4)**: No computador de desenvolvimento ou servidor de homologação, utilize o IP da rede local (ex: `192.168.15.165`).
2. **Configuração no Capacitor (`capacitor.config.ts`)**:
   Certifique-se de que o parâmetro `server.url`ponta para o servidor de desenvolvimento acessível na sua rede Wi-Fi residencial:
   ```typescript
   server: {
     url: "http://192.168.15.165:5173",
     cleartext: true
   }
   ```
3. **Sincronização Nativa**:
   No terminal do projeto, execute os comandos para atualizar o pacote nativo do Android:
   ```bash
   npx cap sync android
   ```
4. **Execução no Dispositivo**:
   Abra o Android Studio (`npx cap open android`), certifique-se de que o Samsung A15 está selecionado no menu de dispositivos conectados e clique em **Run (Shift + F10)**.

---

## 4. Referências

* [1] Cloudflare R2 Public Domain (`spaten_600ml.jpg`): [https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev/defaults/beverages/beers/600ml/spaten_600ml.jpg](https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev/defaults/beverages/beers/600ml/spaten_600ml.jpg)
* [2] Cloudflare R2 Public Domain (`heineken_600ml.jpg`): [https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev/defaults/beverages/beers/600ml/heineken_600ml.jpg](https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev/defaults/beverages/beers/600ml/heineken_600ml.jpg)
* [3] Cloudflare R2 Public Domain (`amstel_600ml.jpg`): [https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev/defaults/beverages/beers/600ml/amstel_600ml.jpg](https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev/defaults/beverages/beers/600ml/amstel_600ml.jpg)
* [4] Cloudflare R2 Public Domain (`original_600ml.jpg`): [https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev/defaults/beverages/beers/600ml/original_600ml.jpg](https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev/defaults/beverages/beers/600ml/original_600ml.jpg)
* [5] Cloudflare R2 Public Domain (`serramalte_600ml.webp`): [https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev/defaults/beverages/beers/600ml/serramalte_600ml.webp](https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev/defaults/beverages/beers/600ml/serramalte_600ml.webp)
* [6] Cloudflare R2 Public Domain (`corona_600ml.webp`): [https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev/defaults/beverages/beers/600ml/corona_600ml.webp](https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev/defaults/beverages/beers/600ml/corona_600ml.webp)

---
**Elaborado por:** Manus AI  
**Data:** 19 de Agosto de 2026
