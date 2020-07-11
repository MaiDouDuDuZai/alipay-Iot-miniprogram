Component({
  props: {
    title: '',
    onCardClick: function onCardClick() {},
    info: ''
  },
  methods: {
    onCardClick: function onCardClick() {
      var _this$props = this.props,
          info = _this$props.info,
          onCardClick = _this$props.onCardClick;
      onCardClick({
        info: info
      });
    },
    onActionClick: function onActionClick() {
      var _this$props2 = this.props,
          info = _this$props2.info,
          onActionClick = _this$props2.onActionClick;

      if (onActionClick) {
        onActionClick({
          info: info
        });
      }
    },
    onExtraActionClick: function onExtraActionClick() {
      var _this$props3 = this.props,
          info = _this$props3.info,
          onExtraActionClick = _this$props3.onExtraActionClick;

      if (onExtraActionClick) {
        onExtraActionClick({
          info: info
        });
      }
    }
  }
});