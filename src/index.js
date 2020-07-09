import LinkModal from './link_modal';
import SelectionUtils from './utils/selection';

export default class InlineLink {
  static get isInline() {
    return true
  }

  static get sanitize() {
    return {
      a: true
    }
  }

  constructor({ api, config }) {
    this.config = config
    this.api = api
    this.toolbar = api.toolbar;
    this.inlineToolbar = api.inlineToolbar;
    this.notifier = api.notifier;
    this.i18n = api.i18n;
    this.selection = api.selection;
    this.nodes = {}
    this.selectionUtil = new SelectionUtils();

    if (config.linkSourceUrl) {
      let self = this
      this.linkModalExp = new LinkModal({
        linkSourceUrl: this.config.linkSourceUrl,
        onSubmitCallback: (title, url, rangeOptions) => {
          self.selectionUtil.savedSelectionRange.setStart(rangeOptions.startContainer, rangeOptions.startOffset)
          self.selectionUtil.savedSelectionRange.setEnd(rangeOptions.endContainer, rangeOptions.endOffset)

          self._successSubmitSource(title, url)
          self.isOpenModal = false
        },
        onCloseCallback: () => {
          self.isOpenModal = false
        }
      })
    }

  }

  _successSubmitSource(title = '', url = '') {
    if (!url.trim()) {
      this.selectionUtil.restore();
      this.unlink();
      event.preventDefault();
      this.closeActions();
    }

    if (!this.validateURL(url)) {
      this.notifier.show({
        message: 'Pasted link is not valid.',
        style: 'error',
      });

      return;
    }

    url = this.prepareLink(url);

    // // const selectedText = self.savedSelectionRange.extractContents()
    this.selectionUtil.restore();
    this.insertLink(url, title);

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.selectionUtil.collapseToEnd();
    this.inlineToolbar.close();
  }

  render() {
    this.nodes.button = document.createElement('button');
    this.nodes.button.type = 'button';

    this.nodes.button.innerHTML = this.ICONS.link;
    // this.nodes.button.innerHTML = this.ICONS.unlink;
    this.nodes.button.classList.add(this.api.styles.inlineToolButton);

    return this.nodes.button;
  }

  renderActions() {
    this.nodes.wrapper = this._make('div', '', {
      hidden: true,
      style: "display: flex;flex-direction: row;"
    })

    this.nodes.input = this._make('input', [
      this.CSS.input,
      this.CSS.inputShowed
    ], {
      style: 'min-width: 180px;'
    });

    this.nodes.input.placeholder = this.api.i18n.t('Add a link');

    this.nodes.input.addEventListener('keydown', (event) => {
      if (event.keyCode === this.ENTER_KEY) {
        this.enterPressed(event);
      }
    });

    this.nodes.wrapper.appendChild(this.nodes.input)

    // Related resources
    if (this.config.linkSourceUrl) {
      this.nodes.resourcesBtn = this._make('span', '', {
        style: `
          border: 1px solid rgba(201,201,204,.48);
          border-right: none;
          border-bottom: none;
          padding: 5px 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          white-space:nowrap;
        `
      })
      this.nodes.resourcesBtn.textContent = '编辑'
      const self = this
      this.nodes.resourcesBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const rg = self.selectionUtil.savedSelectionRange

        let str = rg.toString()
        if (rg && str) {
          self.selectionUtil.restore();
          const anchorTag = self.selection.findParentTag('A')
          self.isOpenModal = true
          let rangeOptions = {
            startContainer: rg.startContainer,
            endContainer: rg.endContainer,
            startOffset: rg.startOffset,
            endOffset: rg.endOffset,
            contents: rg.cloneContents()
          }
          if (anchorTag) {
            let changeStart = false
            let changeEnd = false
            if (rg.startContainer.parentNode && rg.startContainer.parentNode.tagName == 'A') {
              changeStart = true
              self.selectionUtil.savedSelectionRange.setStart(rg.startContainer.parentNode, 0)
            }

            if (rg.endContainer.parentNode && rg.endContainer.parentNode.tagName == 'A') {
              changeEnd = true
              self.selectionUtil.savedSelectionRange.setEnd(rg.endContainer.parentNode, 1)
            }

            if (changeStart != changeEnd) {
              if (changeStart) {
                self.selectionUtil.savedSelectionRange.setEnd(rangeOptions.endContainer, rangeOptions.endOffset)
              }
              if (changeEnd) {
                self.selectionUtil.savedSelectionRange.setStart(rangeOptions.startContainer, rangeOptions.startOffset)
              }
            }

            rangeOptions = {
              startContainer: rg.startContainer,
              endContainer: rg.endContainer,
              startOffset: rg.startOffset,
              endOffset: rg.endOffset,
              contents: rg.cloneContents()
            }

            str = rg.toString() // reget selected string
            self.linkModalExp.open(rangeOptions, str, anchorTag.getAttribute('href') || '')
          } else {
            self.modalCacheTitle = str
            self.selectionUtil.removeFakeBackground();
            self.linkModalExp.open(rangeOptions, str, '')
          }
        }
      })
      this.nodes.wrapper.appendChild(this.nodes.resourcesBtn)
    }

    return this.nodes.wrapper;
  }

  surround(range) {
    if (!range) return

    /**
     * Save selection before change focus to the input
     */
    if (!this.inputOpened) {


      /** Create blue background instead of selection */
      this.selectionUtil.setFakeBackground();
      this.selectionUtil.save();

      //   this.selection.save();
    } else {
      this.selectionUtil.restore();
      this.selectionUtil.removeFakeBackground();
    }

    const parentAnchor = this.selection.findParentTag('A');

    /**
     * Unlink icon pressed
     */
    if (parentAnchor) {
      this.selection.expandToTag(parentAnchor);
      this.unlink();
      this.closeActions();
      this.checkState();
      this.toolbar.close();

      return;
    }

    this.toggleActions();
  }

  checkState(selection) {
    const anchorTag = this.selection.findParentTag('A');

    if (anchorTag) {
      this.nodes.button.classList.add(this.CSS.buttonUnlink);
      this.nodes.button.classList.add(this.CSS.buttonActive);
      this.openActions();

      /**
       * Fill input value with link href
       */
      const hrefAttr = anchorTag.getAttribute('href');

      this.nodes.input.value = hrefAttr !== 'null' ? hrefAttr : '';

      this.selectionUtil.save();
    } else {
      this.nodes.button.classList.remove(this.CSS.buttonUnlink);
      this.nodes.button.classList.remove(this.CSS.buttonActive);
    }

    return !!anchorTag;
  }

  clear() {
    this.closeActions();
  }

  toggleActions() {
    if (!this.inputOpened) {
      this.openActions(true);
    } else {
      this.closeActions(false);
    }
  }

  get shortcut() {
    return 'CMD+K';
  }


  openActions(needFocus = false) {
    // this.nodes.input.classList.add(this.CSS.inputShowed);
    this.nodes.wrapper.hidden = false
    this.inputOpened = true;
    if (needFocus) {
      this.nodes.input.focus();
    }
  }

  closeActions() {
    if (this.selectionUtil.isFakeBackgroundEnabled) {
      // if actions is broken by other selection We need to save new selection
      const currentSelection = new SelectionUtils();

      currentSelection.save();

      this.selectionUtil.restore();
      this.selectionUtil.removeFakeBackground();

      // and recover new selection after removing fake background
      currentSelection.restore();
    }

    // this.nodes.input.classList.remove(this.CSS.inputShowed);
    this.nodes.input.value = '';
    this.nodes.wrapper.hidden = true;
    this.inputOpened = false;
  }

  enterPressed(event) {
    let value = this.nodes.input.value || '';

    if (!value.trim()) {
      this.selectionUtil.restore();
      this.unlink();
      event.preventDefault();
      this.closeActions();
    }

    if (!this.validateURL(value)) {
      this.notifier.show({
        message: 'Pasted link is not valid.',
        style: 'error',
      });

      return;
    }

    value = this.prepareLink(value);

    this.selectionUtil.restore();
    this.selectionUtil.removeFakeBackground();

    this.insertLink(value);

    /**
     * Preventing events that will be able to happen
     */
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.selectionUtil.collapseToEnd();
    this.inlineToolbar.close();
  }

  validateURL(str) {
    /**
     * Don't allow spaces
     */
    return !/\s/.test(str);
  }

  prepareLink(link) {
    link = link.trim();
    link = this.addProtocol(link);

    return link;
  }

  addProtocol(link) {
    /**
     * If protocol already exists, do nothing
     */
    if (/^(https?:\/\/|\/)[^\/].*/.test(link)) {
      return link;
    }

    /**
     * We need to add missed HTTP protocol to the link, but skip 2 cases:
     *     1) Internal links like "/general"
     *     2) Anchors looks like "#results"
     *     3) Protocol-relative URLs like "//google.com"
     */
    const isInternal = /^\/[^/\s]/.test(link),
      isAnchor = link.substring(0, 1) === '#',
      isProtocolRelative = /^\/\/[^/\s]/.test(link);

    if (!isInternal && !isAnchor && !isProtocolRelative) {
      link = 'http://' + link;
    }

    return link;
  }

  insertLink(link, title = '') {
    if (!this.selectionUtil.savedSelectionRange) return
    /**
     * Edit all link, not selected part
     */

    const anchorTag = this.selection.findParentTag('A');
    if (title) {
      const selectedText = this.selectionUtil.savedSelectionRange.extractContents()
      if (anchorTag) {
        anchorTag.textContent = title
      } else {
        const fragment = document.createDocumentFragment()
        fragment.append(title)
        this.selectionUtil.savedSelectionRange.insertNode(fragment)
      }
    }
    this.selectionUtil.restore()

    if (anchorTag) {
      this.selection.expandToTag(anchorTag);
    }

    document.execCommand(this.commandLink, false, link);
  }

  /**
   * Removes <a> tag
   */
  unlink() {
    document.execCommand(this.commandUnlink);
  }


  get commandLink() {
    return 'createLink'
  }

  get commandUnlink() {
    return 'unlink'
  }

  /**
   * Enter key code
   */
  get ENTER_KEY() {
    return 13
  }

  /**
   * Styles
   */
  get CSS() {
    return {
      button: 'ce-inline-tool',
      buttonActive: 'ce-inline-tool--active',
      buttonModifier: 'ce-inline-tool--link',
      buttonUnlink: 'ce-inline-tool--unlink',
      input: 'ce-inline-tool-input',
      inputShowed: 'ce-inline-tool-input--showed',
    };
  }

  get ICONS() {
    return {
      link: `
        <svg xmlns="http://www.w3.org/2000/svg" width='14' height='10' viewBox="0 0 14 10">
          <path d="M6 0v2H5a3 3 0 000 6h1v2H5A5 5 0 115 0h1zm2 0h1a5 5 0 110 10H8V8h1a3 3 0 000-6H8V0zM5 4h4a1 1 0 110 2H5a1 1 0 110-2z"/>
        </svg>
      `,
      unlink: `
        <svg xmlns="http://www.w3.org/2000/svg" width='14' height='10' viewBox="0 0 15 11">
          <path d="M13.073 2.099l-1.448 1.448A3 3 0 009 2H8V0h1c1.68 0 3.166.828 4.073 2.099zM6.929 4l-.879.879L7.172 6H5a1 1 0 110-2h1.929zM6 0v2H5a3 3 0 100 6h1v2H5A5 5 0 115 0h1zm6.414 7l2.122 2.121-1.415 1.415L11 8.414l-2.121 2.122L7.464 9.12 9.586 7 7.464 4.879 8.88 3.464 11 5.586l2.121-2.122 1.415 1.415L12.414 7z"/>
        </svg>

      `
    }
  }

  _make(tag, classAry = '', attributes = {}) {
    let dom = document.createElement(tag)
    if (typeof classAry == 'string') {
      classAry = new Array(classAry)
    }
    dom.classList = classAry.join(' ')
    for (var attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        dom.setAttribute(attr, attributes[attr])
      }
    }
    return dom
  }

}
