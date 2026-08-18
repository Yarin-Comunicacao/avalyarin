# Avalyarin — Guia Android/Capacitor

Este guia descreve como gerar o APK do Avalyarin, instalar uma versão de teste em um aparelho Android e validar as funções nativas já integradas. O projeto utiliza o identificador `br.com.avalyarin.app`, o nome `Avalyarin`, `dist/public` como diretório web e Android com `compileSdkVersion` e `targetSdkVersion` 36, `minSdkVersion` 24, Android Gradle Plugin 8.13.0 e Gradle Wrapper 8.14.3.

## 1. Pré-requisitos

Instale o Android Studio atualizado com Android SDK 36, Android SDK Platform-Tools, Android SDK Build-Tools e um dispositivo/emulador Android com API 24 ou superior. Tenha Node.js, pnpm e um JDK compatível com a versão do Android Studio/Gradle configurados no terminal. Valide o ambiente com:

```bash
node --version
pnpm --version
java -version
adb version
```

No Windows, habilite o modo desenvolvedor e a depuração USB no aparelho. No Android, confirme a autorização da chave RSA do computador quando o aparelho perguntar. No Linux, pode ser necessário configurar as regras udev do fabricante.

## 2. Preparar o projeto

Clone ou atualize a branch `main`, instale as dependências e carregue as variáveis de ambiente usadas pelo projeto. Os valores de produção devem ser obtidos no Render ou no cofre de segredos; não coloque chaves de R2, Google Maps, JWT ou banco dentro do repositório.

```bash
gh repo clone Yarin-Comunicacao/avalyarin
cd avalyarin
pnpm install
pnpm build
```

A compilação deve produzir `dist/public`. Se as variáveis de ambiente não estiverem disponíveis localmente, utilize um arquivo `.env` local não versionado com os mesmos nomes esperados pelo projeto.

## 3. Sincronizar a aplicação web com o Android

Sempre que o código React, os assets, permissões ou plugins nativos forem alterados, execute:

```bash
pnpm build
npx cap sync android
```

Para abrir o projeto no Android Studio:

```bash
npx cap open android
```

Para instalar e executar diretamente em um aparelho conectado ou em um emulador:

```bash
npx cap run android
```

O comando `npx cap sync android` atualiza os arquivos web, plugins e configurações nativas. Alterações feitas apenas no banco, nos cardápios, nos estabelecimentos ou no conteúdo servido pela API não exigem uma nova publicação na Play Store.

## 4. Gerar APK de debug

Para gerar o APK instalável de teste:

```bash
cd android
./gradlew assembleDebug
```

No Windows, use `gradlew.bat assembleDebug`. O arquivo ficará em:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Instale por USB com:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Se o aplicativo estiver instalado com uma assinatura diferente, remova primeiro a instalação antiga ou use um `applicationId` de teste separado. Para conferir o aparelho reconhecido:

```bash
adb devices
```

## 5. Gerar uma versão de release

Para testes internos próximos da versão de produção:

```bash
cd android
./gradlew assembleRelease
```

Antes de publicar, configure uma assinatura de release protegida fora do Git, preferencialmente usando o Play App Signing. Não versione o arquivo `.jks`, senhas, `keystore.properties` ou credenciais de publicação. O APK/AAB de release deve ser validado em um canal interno do Google Play antes da distribuição pública.

Para publicação na Play Store, o formato recomendado é o AAB:

```bash
./gradlew bundleRelease
```

O artefato normalmente ficará em `android/app/build/outputs/bundle/release/`.

## 6. Checklist de teste real

| Área | Teste esperado |
|---|---|
| Inicialização | O splash aparece antes da tela do app, sem exibir a página de destino por baixo. |
| Autenticação | Login por e-mail/senha, logout e retorno à tela intermediária de login funcionam sem sessão fantasma. |
| Câmera | Foto de perfil e foto de avaliação abrem a câmera nativa, sem redirecionar automaticamente para a galeria. |
| Fotos e vídeos | Envio de fotos no chat e vídeos dentro dos limites de duração definidos pelo produto. |
| Microfone | Mensagem de voz solicita microfone apenas no primeiro uso e respeita a chave da Central de Privacidade Social. |
| Localização | A chave de visibilidade no mapa respeita a permissão do sistema e, quando desligada no app, interrompe o uso pelo Avalyarin. |
| Notificações | Permissão, recebimento e abertura de notificações de marcações, reservas, promoções e mensagens. |
| Contatos | Busca de amigos só acessa a agenda após ação explícita e consentimento. |
| Rotas | `/busca`, `/suporte/chat`, `/suporte/resolvidos` e `/suporte/bugs` carregam sem 404 e preservam a aba ao recarregar. |
| Suporte | O botão universal de reporte envia protocolo, severidade, rota e contexto técnico; a inbox do suporte permite triagem. |
| Mapas | Pins de estabelecimentos cadastrados aparecem nas coordenadas corretas; localização do usuário, clustering e card do estabelecimento respondem ao toque. |
| Cardápios | Categorias, âncoras, fotos e itens carregam no mobile; nenhum item é movido para uma categoria alcoólica incorreta. |
| Offline/rede ruim | O app mostra estado de carregamento/erro compreensível e não duplica envios ao reconectar. |

## 7. Ciclo de atualização

Alterações no frontend, permissões, plugins Capacitor ou código nativo exigem um novo build Android e, para distribuição pública, normalmente uma nova versão na Play Store. Alterações em cardápios, estabelecimentos, avaliações e demais dados vindos do backend ficam disponíveis sem atualizar o aplicativo instalado.

Se a equipe adotar um serviço de Live Update posteriormente, ele deve ser tratado como uma camada adicional com controle de versão, rollback, assinatura e conformidade das lojas. Não se deve usar Live Update para contornar mudanças que exigem revisão da Play Store, como novas permissões ou alterações substanciais de comportamento nativo.

## 8. Migração do banco desta fase

A fase de suporte adicionou `drizzle/0049_universal_bug_reports.sql`. No ambiente de deploy, com `DATABASE_URL` configurada, execute o fluxo de migração aprovado pelo projeto:

```bash
pnpm db:push
```

Valide a existência da tabela `bug_reports` antes de testar o formulário em produção. O código continua compilável sem executar a migração localmente, mas a criação e leitura de reportes só funcionarão depois de o schema ser aplicado ao banco.

## 9. iOS

A geração e assinatura oficial para a App Store exigem macOS com Xcode e uma conta Apple Developer. O iPhone não substitui o Mac para compilar e assinar o projeto iOS localmente. A mesma rotina web pode ser sincronizada com `npx cap sync ios`, mas a etapa de assinatura/publicação deve ser feita em um Mac ou serviço de build compatível.
