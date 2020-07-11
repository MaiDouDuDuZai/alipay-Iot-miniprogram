Component({
  props: {
    alphabet: []
  },
  data: {
    current: -1
  },
  didMount: function didMount() {
    this._updateDataSet();
  },
  didUpdate: function didUpdate() {
    this._updateDataSet();
  },
  methods: {
    _updateDataSet: function _updateDataSet() {
      this.dataset = {};

      for (var key in this.props) {
        if (/data-/gi.test(key)) {
          this.dataset[key.replace(/data-/gi, '')] = this.props[key];
        }
      }
    },
    onItemTap: function onItemTap(ev) {
      var _this$props = this.props,
          onClick = _this$props.onClick,
          disabled = _this$props.disabled;

      if (onClick && !disabled) {
        onClick({
          data: ev.target.dataset,
          target: {
            dataset: this.dataset
          }
        });
      }
    },
    onTouchStart: function onTouchStart(ev) {
      var disabled = this.props.disabled;

      if (!disabled) {
        this.setData({
          current: ev.target.dataset.index
        });
      }
    },
    onTouchEnd: function onTouchEnd() {
      this.setData({
        current: -1
      });
    }
  }
});