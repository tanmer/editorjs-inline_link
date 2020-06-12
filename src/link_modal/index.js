import './style.scss'
import ModalVanilla from 'modal-vanilla'
import ajax from '@codexteam/ajax';

export default class HistoryModal {

  get CSS() {
    return {
    }
  }

  get ICONS() {
    return {
      close: `<svg t="1590031813115" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2411" width="32" height="32"><path d="M590.2 512l321.2-321.2c7.9-7.9 7.9-20.8 0-28.8L862 112.6c-7.9-7.9-20.8-7.9-28.8 0L512 433.8 192.8 114.7c-9.1-9.1-23.8-9.1-32.9 0L114.7 160c-9.1 9.1-9.1 23.8 0 32.9L433.8 512 112.6 833.2c-7.9 7.9-7.9 20.8 0 28.8l49.4 49.4c7.9 7.9 20.8 7.9 28.8 0L512 590.2l319.2 319.2c9.1 9.1 23.8 9.1 32.9 0l45.3-45.3c9.1-9.1 9.1-23.8 0-32.9L590.2 512z" p-id="2412"></path></svg>`,
      nodata: `<svg t="1591062400044" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2693" width="32" height="32"><path d="M958.66 288.643h0.025L511.996 65.304 66.12 288.236h-0.83V735.35l446.707 223.345L958.711 735.35V288.643h-0.05z m-446.664-169.23l335.907 168.38-127.914 64.487-337.52-167.877 129.527-64.99z m-188.06 96.672l341.852 164.713L511.972 455.3 176.095 288.643l147.84-72.558zM121.125 345.14h17.754l-17.754-0.653V316.57l362.96 181.485v390.872l-362.96-181.482V345.14z m781.74 27.275v335.031L539.906 888.928V498.056l362.962-181.485v55.844z" p-id="2694"></path></svg>`
    }
  }

  constructor(options) {
    this.linkSourceUrl = options.linkSourceUrl
    this.onSubmitCallback = options.onSubmitCallback || function () { }
    this.onCloseCallback = options.onCloseCallback || function () { }

    this.nodes = {}
    this.meta = {}
    this._init()

    // open view get data
    // this.historyInfo = {
    //   meta: {
    //     current_page: 1,
    //     total_pages: 0,
    //     total_count: 0
    //   },
    //   items: []
    // }
  }

  _init() {
    this.nodes = {
      body: this._make('div', 'link-modal__body'),
      innerBody: this._make('div', 'link-modal__inner-body'),

      submitBtn: this._createSubmitBtn(),

      ...this._createLinkBlocks(), // linkWrapperBlock
      ...this._createLinkSourceBlocks(), // linkSourceWrapperBlock
      ...this._createModal()
    }

    this.nodes.modalHeaderTitle.textContent = '编辑链接'

    // body
    this.nodes.modalBody.appendChild(this.nodes.body)
    this.nodes.body.appendChild(this.nodes.innerBody)
    // this.nodes.body.appendChild(this.nodes.linkSourceMoreBtn)
    this.nodes.innerBody.appendChild(this.nodes.linkWrapperBlock)
    this.nodes.innerBody.appendChild(this.nodes.linkSourceWrapperBlock)

    // footer
    this.nodes.modalFooter.appendChild(this.nodes.submitBtn)
    this.nodes.submitBtn.textContent = '确认'

    this.modalRef = new ModalVanilla({ el: this.nodes.modal })
    this.modalRef.on('hidden', () => {
      this.onCloseCallback(this.clearTitle)
      this.nodes.linkSourceInnerBlock.innerHTML = ''
    })
    document.body.appendChild(this.nodes.modal)
  }

  _createModal() {
    const nodes = {
      modal: this._make('div', ['modal', 'link-modal__modal'], {
        tabindex: '-1',
        role: 'dialog'
      }),
      modalDialog: this._make('div', ['modal-dialog', 'modal-lg', 'modal-dialog-scrollable']),
      modalContent: this._make('div', 'modal-content'),
      modalHeader: this._make('div', ['modal-header', 'link-modal__header']),
      modalHeaderTitle: this._make('h4', 'modal-title'),
      errorText: this._make('div', 'link-modal__error-text'),
      modalHeaderCloseBtn: this._createCloseBtn(),
      modalBody: this._make('div', 'modal-body'),
      modalFooter: this._make('div', ['modal-footer', 'link-modal__footer'])
    }
    nodes.modal.appendChild(nodes.modalDialog)
    nodes.modalDialog.appendChild(nodes.modalContent)

    nodes.modalHeader.appendChild(nodes.modalHeaderTitle)
    nodes.modalHeader.appendChild(nodes.errorText)
    nodes.modalHeader.appendChild(nodes.modalHeaderCloseBtn)

    nodes.modalContent.appendChild(nodes.modalHeader)
    nodes.modalContent.appendChild(nodes.modalBody)
    nodes.modalContent.appendChild(nodes.modalFooter)
    return nodes
  }

  _createSubmitBtn() {
    const dom = this._make('span', ['link-modal__footer-submit-btn', 'btn', 'btn-primary'])
    const self = this
    dom.addEventListener('click', function () {
      const { title, url } = self.getLinkInput()
      self.clearTitle = false
      self.onSubmitCallback(title, url)
      self.close()
    })
    return dom
  }

  _createCloseBtn() {
    const dom = this._make('span', 'link-modal__close-btn', {
      'data-dismiss': 'modal',
      'aria-label': 'Close'
    })
    dom.innerHTML = this.ICONS.close
    return dom
  }

  _createLoadMoreBtn() {
    const self = this
    const dom = this._make('div', 'link-modal__load-more-btn')
    dom.textContent = '点击加载更多'
    dom.addEventListener('click', function () {

      const { current_page = 1, total_pages = 0 } = self.meta
      let nextPage = current_page + 1
      if (nextPage > total_pages) return

      self._getData(nextPage)
      dom.textContent = '加载中...'
      // dom.innerHTML
    })
    return dom
  }

  _createLinkBlocks() {
    const nodes = {
      linkWrapperBlock: this._make('div', '', {
        style: 'margin-bottom: 10px'
      }),
      linkLabel: this._make('label', ''),
      linkInnerBlock: this._make('div', 'row'),

      linkTitleBlock: this._make('div', 'col-5'),
      linkTitleInput: this._make('input', 'form-control'),
      linkUrlBlock: this._make('div', 'col-7'),
      linkUrlInput: this._make('input', 'form-control'),
    }
    nodes.linkLabel.textContent = '链接'
    nodes.linkInnerBlock.appendChild(nodes.linkTitleBlock)
    nodes.linkInnerBlock.appendChild(nodes.linkUrlBlock)

    nodes.linkTitleBlock.appendChild(nodes.linkTitleInput)
    nodes.linkUrlBlock.appendChild(nodes.linkUrlInput)

    nodes.linkWrapperBlock.appendChild(nodes.linkLabel)
    nodes.linkWrapperBlock.appendChild(nodes.linkInnerBlock)
    // nodes.linkUrlInput.addEventListener('')
    // nodes.linkTitleInput.addEventListener('')

    return nodes
  }

  _createLinkSourceBlocks() {
    const nodes = {
      linkSourceWrapperBlock: this._make('div', ''),
      linkSourceLabel: this._make('label', ''),
      linkSourceInnerBlock: this._make('div', ''),
      linkSourceMoreBtn: this._createLoadMoreBtn(),
    }

    nodes.linkSourceLabel.textContent = '站点文章'
    nodes.linkSourceWrapperBlock.appendChild(nodes.linkSourceLabel)
    nodes.linkSourceWrapperBlock.appendChild(nodes.linkSourceInnerBlock)
    nodes.linkSourceWrapperBlock.appendChild(nodes.linkSourceMoreBtn)

    return nodes
  }

  _showNodataView() {
    if (!this.nodes.nodataView) {
      const dom = this._make('div', 'link-modal__nodata-block')
      const textDom = this._make('span', 'link-modal__nodata-block__text')
      textDom.textContent = '暂无数据'
      dom.innerHTML = this.ICONS.nodata
      dom.appendChild(textDom)
      this.nodes.nodataView = dom
      this.nodes.body.appendChild(this.nodes.nodataView)
    }
  }

  _hideBtn(node) {
    node && (node.hidden = true)
  }

  _showBtn(node) {
    node && (node.hidden = false)
  }

  showErrorText(text) {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout)
      this.errorTimeout = null
    }
    this.nodes.errorText = text
    this.errorTimeout = setTimeout(() => {
      this.nodes.errorText.textContent = ''
    }, 2000);
  }

  addItem({ id, path, name, channel_breadcrumb = []}) {
    const itemDom = this._make('div', 'link-modal__source-item', {
      'data-title': name,
      'data-url': path,
    })
    const ItemText = this._make('div', 'link-modal__source-item__title')
    ItemText.textContent = name
    itemDom.appendChild(ItemText)

    const ItemDescription = this._make('div', 'link-modal__source-item__description')

    ItemDescription.textContent = channel_breadcrumb.join(' > ')
    itemDom.appendChild(ItemDescription)

    this.nodes.linkSourceInnerBlock.appendChild(itemDom)

    const self = this
    itemDom.addEventListener('click', function (e) {
      self.selectItem(itemDom)
    })
  }

  setLinkInput(title = '', url = '') {
    this.nodes.linkTitleInput.value = title
    this.nodes.linkUrlInput.value = url
  }

  getLinkInput() {
    return {
      title: this.nodes.linkTitleInput.value || '',
      url: this.nodes.linkUrlInput.value || ''
    }
  }

  selectItem(target) {
    this.nodes.innerBody.querySelectorAll('.link-modal__source-item.active').forEach(function (dom) {
      dom.classList.remove('active')
    })
    this.lastSelected = target
    target.classList.add('active')

    const title = target.getAttribute('data-title')
    const url = target.getAttribute('data-url')
    this.setLinkInput(title, url)
  }

  view() {
    return this.nodes.modal
  }

  open(title, url, clearTitle = false) {
    this.clearTitle = clearTitle
    this._getData()
    this.modalRef.show()
    this.setLinkInput(title, url)
  }

  close() {
    this.modalRef.hide()
  }

  destroy() {
    this.nodes.modal.remove()
  }

  _getData(nextPage) {
    if (!this.linkSourceUrl) return
    if (this.loading) return
    this.loading = true

    const self = this
    const params = {
      page: nextPage || 1,
      per_page: 10,
    }
    ajax.request({
      url: self.linkSourceUrl,
      method: 'get',
      data: params,
      headers: {
        Accept: 'application/json,text/plain'
      }
    }).then(({ body }) => {
      self.loading = false
      if (body.status === 'ok') {
        self._success(body.message)
      } else {
        self._failed()
      }
    }).catch(() => {
      self.loading = false
      self._failed()
    })
  }

  _success({ meta = {}, items = [] }) {
    const { current_page, total_count, total_pages } = meta
    this.meta = { current_page, total_count, total_pages }
    if (total_pages === 0) {
      this._hideBtn(this.nodes.linkSourceMoreBtn)
      this._showNodataView()
    }
    if (current_page === total_pages) {
      this._hideBtn(this.nodes.linkSourceMoreBtn)
    }
    items.forEach(item => {
      this.addItem(item)
    })
    this.nodes.linkSourceMoreBtn.textContent = '点击加载更多'
  }

  _failed() {
    this.nodes.linkSourceMoreBtn.textContent = '点击加载更多'
    console.log('加载失败了');
  }

  _make(tag, classNames, attributes = {}) {
    let dom = document.createElement(tag)

    if (Array.isArray(classNames)) {
      dom.classList.add(...classNames);
    } else if (classNames) {
      dom.classList.add(classNames);
    }

    for (var attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        dom.setAttribute(attr, attributes[attr])
      }
    }
    return dom
  }
}
