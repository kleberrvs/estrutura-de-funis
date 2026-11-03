# Estrutura de Funis

Ferramenta visual para montar funis de marketing: blocos de anúncio, página, pop-up,
checkout, WhatsApp, e-mail e outros, ligados por setas, com números de entrada e avanço
por etapa e um modo demo que simula leads andando pelo funil.

**Usar agora:** https://kleberrvs.github.io/estrutura-de-funis/

- Não precisa de login nem de instalar nada. Cada pessoa cria os próprios funis, que
  ficam salvos no navegador dela.
- Já vem com o Funil VSL pronto e modelos para começar um funil novo.
- As mensagens D1 a D7 do funil VSL são exemplos, para editar.

## Rodar no computador

    cd painel
    npm install
    npm run dev

Para publicar: `npm run build` gera a pasta `painel/dist`, que é o que vai para o link acima.

## Miniaturas das páginas (opcional)

Sem servidor, os blocos de página mostram só o endereço. Com um servidor de miniaturas,
defina `VITE_FUNIL_API` com o endereço dele antes do `npm run build`.

## Páginas (construtor de páginas)

Além dos funis, o painel tem uma área **Páginas** (`#/paginas`): escolher uma página pronta, editar texto, imagem, cor, vídeo e blocos direto na tela, ver no computador e no celular ao mesmo tempo, e baixar o HTML final.

- As páginas ficam salvas no navegador de quem as criou (como os funis).
- Os blocos vêm da Vitrine de Páginas da Revolução: `npm run` não é preciso, mas para atualizar a biblioteca rode `python3 painel/scripts/importar-vitrine.py`.
