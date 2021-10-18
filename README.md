# editorjs-inline_link
> 提取editorjs中集成的inline_link，并额外增加功能

## Usage
  1. start
    `yarn install`
  2. build dev:
    `yarn build:dev` -> watch file change build to dist/bundle.js
  3. build prod:
    `yarn build` -> dist/bundle.js
## Config Params
  #### linkSourceUrl
  根据此地址获取数据列表，打开一个选择界面，选择后替换link文本、地址
  ```
  link: {
    class: InlineLink,
    config: {
      linkSourceUrl: this.linkSourceUrl
    }
  }
  ```
  此数据格式要求：(或自行修改)
  ```
  ajax.request({
    url: self.linkSourceUrl,
    method: 'get',
    data: params,
    headers: {
      Accept: 'application/json,text/plain'
    }
  }).then(({ body }) => {
    // body: {
    //   message: {
    //     meta: { current_page, total_count, total_pages },
    //     items: { id, path: data-url, name: data-title, channel_breadcrumb = [] }
    //   }
    // }
  })
  ```
