# Amigo Secreto online — como colocar no ar

Para funcionar em vários celulares, o app precisa de (1) um banco de dados compartilhado e (2) um endereço na internet. Os dois são grátis.

## 1. Banco de dados (Firebase) — ~5 minutos
1. Entre em https://console.firebase.google.com e faça login com a conta Google.
2. **Adicionar projeto** → dê um nome (ex.: amigo-secreto) → pode desativar o Google Analytics → Criar.
3. No menu **Build / Criação → Realtime Database → Criar banco de dados**. Escolha qualquer local e **Iniciar no modo de teste**.
4. Na aba **Regras**, cole e publique:
   ```json
   { "rules": { "amigo-secreto": { ".read": true, ".write": true } } }
   ```
5. Volte à **Visão geral do projeto** → ícone **`</>` (Web)** → registre o app (nome qualquer) → copie o objeto `firebaseConfig`.
   Se `databaseURL` não aparecer, copie o endereço que aparece no topo da aba Dados do Realtime Database.
6. Cole os valores em `firebase-config.js`.

## 2. Hospedar (Netlify Drop) — ~1 minuto
1. Abra https://app.netlify.com/drop
2. Arraste a pasta **PoleTotens** para a página.
3. Você recebe um link (ex.: https://nome-aleatorio.netlify.app). Mande para as amigas.

## Usando
- Cada uma abre o link na sua vez. Aparece "Agora é a vez de X"; X toca em **Sou eu! Sortear**, vê o nome e toca em **Já vi, esconder**.
- Para reiniciar: abra o link com `?admin=1` no final (ex.: `https://seu-link.netlify.app/?admin=1`) e toque em "Reiniciar sorteio".
