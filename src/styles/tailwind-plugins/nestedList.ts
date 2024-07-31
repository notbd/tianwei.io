import plugin from 'tailwindcss/plugin'

export const nestedListPlugin = plugin(({ addComponents }) => {
  addComponents({
    '.nested-list-marker': {
      // '& > li::marker': {
      //   content: '"- "',
      // },
      '& > li > ul > li::marker': {
        content: '">  "',
      },
      '& > li > ul > li > ul > li::marker': {
        content: '"·  "',
      },
    },
  })
})
