Component({
  props: {
    title: '',
    subtitle: '',
    thumb: ''
  },
  didMount: function didMount() {
    var _this$props = this.props,
        _this$props$title = _this$props.title,
        title = _this$props$title === void 0 ? '' : _this$props$title,
        _this$props$subtitle = _this$props.subtitle,
        subtitle = _this$props$subtitle === void 0 ? '' : _this$props$subtitle;
    var thumbPlaceholder = title.slice(0, 1) + subtitle.slice(0, 1);
    this.setData({
      // thumbPlaceholder: thumbPlaceholder.slice(1),
      thumbPlaceholder: thumbPlaceholder
    });
  }
});