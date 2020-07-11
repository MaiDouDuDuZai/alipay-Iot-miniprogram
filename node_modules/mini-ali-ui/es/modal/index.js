import fmtUnit from '../_util/fmtUnit';
Component({
  data: {
    _buttonsLayout: '',
    adviceClose: fmtUnit(26),
    normalClose: fmtUnit(18)
  },
  props: {
    className: '',
    topImageSize: 'md',
    showClose: false,
    closeType: '0',
    mask: true,
    buttonsLayout: 'horizontal',
    disableScroll: true
  },
  didMount: function didMount() {
    var _this$props = this.props,
        buttons = _this$props.buttons,
        buttonsLayout = _this$props.buttonsLayout; // button数目大于 2 个，则强制使用竖排结构

    if (buttons && buttons.length > 2) {
      this.setData({
        _buttonsLayout: 'vertical'
      });
    } else {
      this.setData({
        _buttonsLayout: buttonsLayout
      });
    }
  },
  methods: {
    // footer点击
    _onModalClick: function _onModalClick() {
      var onModalClick = this.props.onModalClick;

      if (onModalClick) {
        onModalClick();
      }
    },
    // buttons点击
    _onButtonClick: function _onButtonClick(e) {
      var onButtonClick = this.props.onButtonClick;

      if (onButtonClick) {
        onButtonClick(e);
      }
    },
    // 关闭按钮点击
    _onModalClose: function _onModalClose() {
      var onModalClose = this.props.onModalClose;

      if (onModalClose) {
        onModalClose();
      }
    }
  }
});