export default class SelectionUtils {
  constructor () {
    this.isFakeBackgroundEnabled = false
  }

  removeFakeBackground() {
    if (!this.isFakeBackgroundEnabled) return;

    this.isFakeBackgroundEnabled = false;
    document.execCommand('removeFormat');
  }

  setFakeBackground() {
    document.execCommand('backColor', false, '#a8d6ff')
    this.isFakeBackgroundEnabled = true;
  }

  collapseToEnd() {
    const sel = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(sel.focusNode);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  static get range() {
    const selection = window.getSelection();

    return selection && selection.rangeCount ? selection.getRangeAt(0) : null;
  }

  save() {
    this.savedSelectionRange = SelectionUtils.range;
  }

  restore() {
    if (!this.savedSelectionRange) return;

    const sel = window.getSelection();

    sel.removeAllRanges();
    sel.addRange(this.savedSelectionRange);
  }

  clearSaved() {
    this.savedSelectionRange = null
  }
}
