Component({
  props: {
    className: '',
    shape: 'circle',
    size: 'md',
    src: 'https://gw.alipayobjects.com/mdn/rms_349abe/afts/img/A*5VvARpvk39QAAAAAAAAAAABkARQnAQ',
    name: '',
    desc: ''
  },
  didMount: function didMount() {
    var _this$props = this.props,
        name = _this$props.name,
        desc = _this$props.desc;

    if (!name && desc) {
      console.error('Avatar: 不允许设置 desc 但不定义 name');
    }
  },
  methods: {
    // 图片加载失败
    _onError: function _onError(e) {
      var onError = this.props.onError;

      if (onError) {
        onError(e);
      }
    }
  }
});