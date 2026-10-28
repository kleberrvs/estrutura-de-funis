# Funil ao Vivo

Ferramenta visual para montar funis de marketing: blocos de anúncio, página, pop-up,
checkout, WhatsApp, e-mail e outros, ligados por setas, com números de entrada e avanço
por etapa e um modo demo que simula leads andando pelo funil.

**Usar agora:** https://kleberrvs.github.io/funil-ao-vivo/

- Não precisa de login nem de instalar nada. Cada pessoa cria os próprios funis, que
  ficam salvos no navegador dela.
- Já vem com 4 funis prontos (Embaixador, Captação, VSL e Fluxos de E-mail) e modelos
  para começar um funil novo.
- As mensagens D1 a D7 do funil VSL são exemplos, para editar.

## Rodar no computador

    cd painel
    npm install
    npm run dev

Para publicar: `npm run build` gera a pasta `painel/dist`, que é o que vai para o link acima.

## Miniaturas das páginas (opcional)

Sem servidor, os blocos de página mostram só o endereço. Com um servidor de miniaturas,
defina `VITE_FUNIL_API` com o endereço dele antes do `npm run build`.
